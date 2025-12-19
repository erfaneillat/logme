import { Request, Response } from 'express';
import KitchenCategory from '../models/KitchenCategory';
import SavedKitchenItem from '../models/SavedKitchenItem';
import Settings from '../models/Settings';
import { googleImageService } from '../services/googleImageService';

interface AuthRequest extends Request {
    user?: any;
}

export const getKitchenStatus = async (req: AuthRequest, res: Response) => {
    try {
        const settings = await Settings.findOne();
        const response = {
            isEnabled: true,
            hasAccess: true
        };

        if (settings && settings.kitchen) {
            response.isEnabled = settings.kitchen.isEnabled;

            if (response.isEnabled && settings.kitchen.accessMode === 'selected') {
                const userId = req.user?.userId;
                const isAllowed = settings.kitchen.allowedUserIds.some((id: any) => id.toString() === userId);
                response.hasAccess = isAllowed;
            }
        }

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ message: 'Error checking kitchen status', error });
    }
};

export const getAllCategories = async (req: AuthRequest, res: Response) => {
    try {
        // Check Global Settings
        const settings = await Settings.findOne();
        if (settings && settings.kitchen) {
            if (!settings.kitchen.isEnabled) {
                return res.status(403).json({ message: 'Kitchen feature is currently disabled' });
            }

            if (settings.kitchen.accessMode === 'selected') {
                const userId = req.user?.userId;
                const isAllowed = settings.kitchen.allowedUserIds.some((id: any) => id.toString() === userId);
                if (!isAllowed) {
                    return res.status(403).json({ message: 'You do not have access to the Kitchen feature' });
                }
            }
        }

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
                imagePrompt: item.image_prompt, // Store raw prompt
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

// Save a kitchen item to user's saved list
export const saveKitchenItem = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { kitchenItemId, name, calories, protein, carbs, fat, image, prepTime, difficulty, ingredients, instructions } = req.body;

        if (!kitchenItemId || !name) {
            return res.status(400).json({ message: 'Kitchen item ID and name are required' });
        }

        // Check if already saved
        const existing = await SavedKitchenItem.findOne({ userId, kitchenItemId });
        if (existing) {
            return res.status(200).json({ message: 'Already saved', saved: true, item: existing });
        }

        const savedItem = new SavedKitchenItem({
            userId,
            kitchenItemId,
            name,
            calories: calories || 0,
            protein: protein || 0,
            carbs: carbs || 0,
            fat: fat || 0,
            image: image || '🍽️',
            prepTime: prepTime || '15 min',
            difficulty: difficulty || 'medium',
            ingredients: ingredients || [],
            instructions: instructions || ''
        });

        await savedItem.save();
        return res.status(201).json({ message: 'Item saved successfully', saved: true, item: savedItem });
    } catch (error: any) {
        // Handle duplicate key error gracefully
        if (error.code === 11000) {
            return res.status(200).json({ message: 'Already saved', saved: true });
        }
        console.error('Save kitchen item error:', error);
        return res.status(500).json({ message: 'Error saving kitchen item', error });
    }
};

// Remove a kitchen item from user's saved list
export const unsaveKitchenItem = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { kitchenItemId } = req.params;

        if (!kitchenItemId) {
            return res.status(400).json({ message: 'Kitchen item ID is required' });
        }

        const result = await SavedKitchenItem.findOneAndDelete({ userId, kitchenItemId });

        if (!result) {
            return res.status(404).json({ message: 'Saved item not found', saved: false });
        }

        return res.status(200).json({ message: 'Item removed from saved', saved: false });
    } catch (error) {
        console.error('Unsave kitchen item error:', error);
        return res.status(500).json({ message: 'Error removing saved item', error });
    }
};

// Get all saved kitchen items for a user
export const getSavedKitchenItems = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const savedItems = await SavedKitchenItem.find({ userId }).sort({ savedAt: -1 });

        return res.status(200).json({
            success: true,
            items: savedItems,
            count: savedItems.length
        });
    } catch (error) {
        console.error('Get saved kitchen items error:', error);
        return res.status(500).json({ message: 'Error fetching saved items', error });
    }
};

// Check if specific items are saved (for batch checking)
export const checkSavedStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { itemIds } = req.body;

        if (!itemIds || !Array.isArray(itemIds)) {
            return res.status(400).json({ message: 'Item IDs array is required' });
        }

        const savedItems = await SavedKitchenItem.find({
            userId,
            kitchenItemId: { $in: itemIds }
        }).select('kitchenItemId');

        const savedIds = savedItems.map(item => item.kitchenItemId);

        return res.status(200).json({
            success: true,
            savedIds
        });
    } catch (error) {
        console.error('Check saved status error:', error);
        return res.status(500).json({ message: 'Error checking saved status', error });
    }
};

/**
 * Generate image for a single item in a subcategory
 * This is called multiple times from the frontend (one per item) to avoid timeout
 */
export const generateImageForItem = async (req: Request, res: Response) => {
    try {
        const { categoryId, subcategoryIndex, itemIndex } = req.body;

        if (!categoryId || subcategoryIndex === undefined || itemIndex === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Category ID, subcategory index, and item index are required'
            });
        }

        const category = await KitchenCategory.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const subcategory = category.subCategories[subcategoryIndex];
        if (!subcategory) {
            return res.status(404).json({ success: false, message: 'Subcategory not found' });
        }

        const item = subcategory.items[itemIndex];
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Check if item has a prompt
        if (!item.imagePrompt || item.imagePrompt.trim().length === 0) {
            return res.status(200).json({
                success: false,
                itemName: item.name,
                skipped: true,
                message: 'No image prompt defined'
            });
        }

        // Check if already has image
        if (item.image && item.image.startsWith('http')) {
            return res.status(200).json({
                success: true,
                itemName: item.name,
                skipped: true,
                imageUrl: item.image,
                message: 'Already has image'
            });
        }

        console.log(`Generating image for: ${item.name}`);

        // Generate image using Google AI
        const result = await googleImageService.generateImage(item.imagePrompt);

        if (result.success && result.imageUrl) {
            // Update the item's image URL
            subcategory.items[itemIndex]!.image = result.imageUrl;
            await category.save();

            return res.status(200).json({
                success: true,
                itemName: item.name,
                imageUrl: result.imageUrl,
                message: 'Image generated successfully'
            });
        } else {
            return res.status(200).json({
                success: false,
                itemName: item.name,
                error: result.error || 'Generation failed'
            });
        }

    } catch (error) {
        console.error('Generate image error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error generating image',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
