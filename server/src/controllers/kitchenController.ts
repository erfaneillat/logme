import { Request, Response } from 'express';
import KitchenCategory from '../models/KitchenCategory';

export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await KitchenCategory.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        return res.status(200).json(categories);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching kitchen categories', error });
    }
};

export const getAdminCategories = async (req: Request, res: Response) => {
    try {
        // Admin sees all, even inactive ones
        const categories = await KitchenCategory.find().sort({ order: 1, createdAt: -1 });
        return res.status(200).json(categories);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching categories for admin', error });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { title, subCategories, order, isActive } = req.body;

        // Validate request body
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const newCategory = new KitchenCategory({
            title,
            subCategories: subCategories || [],
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true
        });

        await newCategory.save();
        return res.status(201).json(newCategory);
    } catch (error) {
        return res.status(500).json({ message: 'Error creating kitchen category', error });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, subCategories, order, isActive } = req.body;

        const updatedCategory = await KitchenCategory.findByIdAndUpdate(
            id,
            {
                title,
                subCategories,
                order,
                isActive
            },
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        return res.status(200).json(updatedCategory);
    } catch (error) {
        return res.status(500).json({ message: 'Error updating kitchen category', error });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedCategory = await KitchenCategory.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        return res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting kitchen category', error });
    }
};

export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await KitchenCategory.findById(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        return res.status(200).json(category);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching category', error });
    }
};

export const uploadKitchenImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const baseUrl = process.env.NODE_ENV === 'development'
            ? `http://${req.hostname}:${process.env.PORT || 9002}`
            : 'https://loqmeapp.ir';

        const imageUrl = `${baseUrl}/api/kitchen/images/${req.file.filename}`;

        return res.status(200).json({
            success: true,
            url: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error uploading image', error });
    }
};

export const importKitchenItems = async (req: Request, res: Response) => {
    try {
        const { categoryId, items } = req.body;

        if (!categoryId || !items || !Array.isArray(items)) {
            return res.status(400).json({ message: 'Category ID and items array are required' });
        }

        const mainCategory = await KitchenCategory.findById(categoryId);
        if (!mainCategory) {
            return res.status(404).json({ message: 'Main category not found' });
        }

        let addedCount = 0;

        for (const item of items) {
            const subCategoryName = item.category || 'General';

            // Find or create subcategory
            let subCategory = mainCategory.subCategories.find(sub => sub.title === subCategoryName);
            if (!subCategory) {
                // Determine difficulty enum
                // Map Persian difficulty to English enum
                mainCategory.subCategories.push({
                    title: subCategoryName,
                    items: []
                });
                subCategory = mainCategory.subCategories[mainCategory.subCategories.length - 1];
            }

            if (!subCategory) continue; // Safety check

            // Map Persian difficulty to English enum for the item
            let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
            if (item.difficulty === 'آسان') difficulty = 'easy';
            if (item.difficulty === 'سخت') difficulty = 'hard';

            // Create item object
            const newItem = {
                name: item.name,
                calories: item.nutritional_info?.calories || 0,
                protein: item.nutritional_info?.protein || 0,
                carbs: item.nutritional_info?.carbs || 0,
                fat: item.nutritional_info?.fat || 0,
                image: item.image_prompt || '🍲', // Use prompt as image placeholder or default emoji
                prepTime: item.prep_time || '15 min',
                difficulty: difficulty,
                ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
                instructions: item.instructions || ''
            };

            subCategory.items.push(newItem);
            addedCount++;
        }

        await mainCategory.save();
        return res.status(200).json({ message: `Successfully imported ${addedCount} items`, category: mainCategory });

    } catch (error) {
        console.error('Import error:', error);
        return res.status(500).json({ message: 'Error importing items', error });
    }
};
