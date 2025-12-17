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
