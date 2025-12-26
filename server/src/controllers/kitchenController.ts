import { Request, Response } from 'express';
import KitchenCategory from '../models/KitchenCategory';
import SavedKitchenItem from '../models/SavedKitchenItem';
import KitchenItemClick from '../models/KitchenItemClick';
import Settings from '../models/Settings';
import { googleImageService } from '../services/googleImageService';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

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
        const { title, title_fa, subCategories, order, isActive } = req.body;

        // Validate request body
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const newCategory = new KitchenCategory({
            title,
            title_fa: title_fa || '',
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
        const { title, title_fa, subCategories, order, isActive } = req.body;

        const updatedCategory = await KitchenCategory.findByIdAndUpdate(
            id,
            {
                title,
                title_fa,
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

        // Note: We no longer skip items with existing images
        // The frontend decides whether to regenerate, the server just processes the request

        console.log(`Generating image for: ${item.name}`);

        // Generate image using Google AI
        const result = await googleImageService.generateImage(item.imagePrompt);

        if (result.success && result.imageUrl) {
            // Build full URL from relative path
            // The service returns a path like /api/kitchen/images/filename.png
            const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
            const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
            const fullImageUrl = result.imageUrl.startsWith('http')
                ? result.imageUrl
                : `${protocol}://${host}${result.imageUrl}`;

            // Update the item's image URL
            subcategory.items[itemIndex]!.image = fullImageUrl;
            await category.save();

            console.log(`Image saved with URL: ${fullImageUrl}`);

            return res.status(200).json({
                success: true,
                itemName: item.name,
                imageUrl: fullImageUrl,
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

/**
 * Compress all images in a category from PNG to optimized WebP
 */
export const compressImagesForCategory = async (req: Request, res: Response) => {
    try {
        const { categoryId } = req.body;

        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Category ID is required'
            });
        }

        const category = await KitchenCategory.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Determine uploads directory
        const uploadsDir = path.join(__dirname, '../../uploads/kitchen');

        let processed = 0;
        let skipped = 0;
        let errors = 0;
        let totalOriginalSize = 0;
        let totalCompressedSize = 0;

        for (const subcategory of category.subCategories) {
            for (let i = 0; i < subcategory.items.length; i++) {
                const item = subcategory.items[i];
                if (!item || !item.image) continue;

                // Check if it's a PNG image URL
                if (!item.image.includes('/api/kitchen/images/') || !item.image.endsWith('.png')) {
                    skipped++;
                    continue;
                }

                // Extract filename
                const filename = item.image.split('/').pop();
                if (!filename) continue;

                const inputPath = path.join(uploadsDir, filename);
                const outputFilename = filename.replace('.png', '.webp');
                const outputPath = path.join(uploadsDir, outputFilename);

                // Check if source file exists
                if (!fs.existsSync(inputPath)) {
                    skipped++;
                    continue;
                }

                try {
                    // Read and compress
                    const inputBuffer = await fs.promises.readFile(inputPath);
                    const compressedBuffer = await sharp(inputBuffer)
                        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                        .webp({ quality: 80 })
                        .toBuffer();

                    await fs.promises.writeFile(outputPath, compressedBuffer);

                    // Update URL in database
                    const newUrl = item.image.replace('.png', '.webp');
                    subcategory.items[i]!.image = newUrl;

                    // Delete old file
                    await fs.promises.unlink(inputPath);

                    totalOriginalSize += inputBuffer.length;
                    totalCompressedSize += compressedBuffer.length;
                    processed++;

                    console.log(`Compressed: ${item.name} (${(inputBuffer.length / 1024).toFixed(0)}KB → ${(compressedBuffer.length / 1024).toFixed(0)}KB)`);
                } catch (err) {
                    console.error(`Error compressing ${item.name}:`, err);
                    errors++;
                }
            }
        }

        // Save category if anything was processed
        if (processed > 0) {
            await category.save();
        }

        const savedMB = ((totalOriginalSize - totalCompressedSize) / 1024 / 1024).toFixed(2);
        const savingsPercent = totalOriginalSize > 0
            ? ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(0)
            : '0';

        return res.status(200).json({
            success: true,
            message: `Compressed ${processed} images, skipped ${skipped}, errors ${errors}`,
            processed,
            skipped,
            errors,
            savedMB: parseFloat(savedMB),
            savingsPercent: parseInt(savingsPercent)
        });

    } catch (error) {
        console.error('Compress images error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error compressing images',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// =====================
// Analytics Functions
// =====================

/**
 * Record a click on a kitchen item
 */
export const recordKitchenItemClick = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { kitchenItemId, kitchenItemName, categoryId, categoryTitle, subCategoryTitle } = req.body;

        if (!kitchenItemId || !kitchenItemName || !categoryId || !categoryTitle || !subCategoryTitle) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: kitchenItemId, kitchenItemName, categoryId, categoryTitle, subCategoryTitle'
            });
        }

        const clickRecord = new KitchenItemClick({
            kitchenItemId,
            kitchenItemName,
            categoryId,
            categoryTitle,
            subCategoryTitle,
            userId: userId || null
        });

        await clickRecord.save();

        return res.status(201).json({
            success: true,
            message: 'Click recorded successfully'
        });
    } catch (error) {
        console.error('Record kitchen item click error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error recording click',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get analytics summary for kitchen items (admin only)
 */
export const getKitchenAnalytics = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, categoryId, limit = 50 } = req.query;

        // Build match query
        const matchQuery: any = {};

        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate as string);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate as string);
        }

        if (categoryId) {
            matchQuery.categoryId = categoryId;
        }

        // Get top clicked items
        const topItems = await KitchenItemClick.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$kitchenItemId',
                    name: { $first: '$kitchenItemName' },
                    categoryId: { $first: '$categoryId' },
                    categoryTitle: { $first: '$categoryTitle' },
                    subCategoryTitle: { $first: '$subCategoryTitle' },
                    clickCount: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$userId' },
                    lastClicked: { $max: '$createdAt' }
                }
            },
            {
                $addFields: {
                    uniqueUserCount: { $size: { $filter: { input: '$uniqueUsers', as: 'u', cond: { $ne: ['$$u', null] } } } }
                }
            },
            { $project: { uniqueUsers: 0 } },
            { $sort: { clickCount: -1 } },
            { $limit: parseInt(limit as string) || 50 }
        ]);

        // Get category-wise summary
        const categorySummary = await KitchenItemClick.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$categoryId',
                    categoryTitle: { $first: '$categoryTitle' },
                    totalClicks: { $sum: 1 },
                    uniqueItems: { $addToSet: '$kitchenItemId' }
                }
            },
            {
                $addFields: {
                    uniqueItemCount: { $size: '$uniqueItems' }
                }
            },
            { $project: { uniqueItems: 0 } },
            { $sort: { totalClicks: -1 } }
        ]);

        // Get overall stats
        const totalClicks = await KitchenItemClick.countDocuments(matchQuery);
        const uniqueItemsClicked = await KitchenItemClick.distinct('kitchenItemId', matchQuery);
        const uniqueUsersClicked = await KitchenItemClick.distinct('userId', matchQuery);

        // Get clicks over time (daily for last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const clicksOverTime = await KitchenItemClick.aggregate([
            {
                $match: {
                    ...matchQuery,
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalClicks,
                    uniqueItemsClicked: uniqueItemsClicked.length,
                    uniqueUsersClicked: uniqueUsersClicked.filter(u => u).length
                },
                topItems,
                categorySummary,
                clicksOverTime
            }
        });
    } catch (error) {
        console.error('Get kitchen analytics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching analytics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get click history for a specific item (admin only)
 */
export const getItemClickHistory = async (req: Request, res: Response) => {
    try {
        const { itemId } = req.params;
        const { limit = 100 } = req.query;

        if (!itemId) {
            return res.status(400).json({ success: false, message: 'Item ID is required' });
        }

        const clicks = await KitchenItemClick.find({ kitchenItemId: itemId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string) || 100);

        const totalClicks = await KitchenItemClick.countDocuments({ kitchenItemId: itemId });

        return res.status(200).json({
            success: true,
            data: {
                itemId,
                totalClicks,
                recentClicks: clicks
            }
        });
    } catch (error) {
        console.error('Get item click history error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching item click history',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


/**
 * Update a category with content from a JSON array (preserving images and merging languages)
 * NEW: Does NOT replace existing items - only updates matching items and adds new ones
 */
export const updateCategoryWithJson = async (req: Request, res: Response) => {
    try {
        const { categoryId, items, language = 'en' } = req.body;

        if (!categoryId || !items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: 'Category ID and items array are required'
            });
        }

        const category = await KitchenCategory.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // 1. Build a map of ALL existing items by imagePrompt
        // Also track which subcategory they belong to
        const existingItemsMap = new Map<string, {
            item: any,
            subCatIndex: number,
            itemIndex: number,
            subTitle: string,
            subTitleFa?: string | undefined
        }>();

        category.subCategories.forEach((sub, subIdx) => {
            sub.items.forEach((item, itemIdx) => {
                if (item.imagePrompt) {
                    const key = item.imagePrompt.trim().toLowerCase();
                    existingItemsMap.set(key, {
                        item: item,
                        subCatIndex: subIdx,
                        itemIndex: itemIdx,
                        subTitle: sub.title,
                        subTitleFa: sub.title_fa
                    });
                }
            });
        });

        console.log(`[updateCategoryWithJson] Language: ${language}, Found ${existingItemsMap.size} existing items`);

        // Track which items we've processed (to avoid duplicates if needed)
        const processedPrompts = new Set<string>();

        let updatedCount = 0;
        let addedCount = 0;

        // 2. Process each item from JSON
        for (const jsonItem of items) {
            const key = jsonItem.image_prompt ? jsonItem.image_prompt.trim().toLowerCase() : null;
            if (!key) {
                console.warn('Skipping item without image_prompt:', jsonItem.name);
                continue;
            }

            // Map Difficulty
            let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
            if (jsonItem.difficulty === 'آسان' || jsonItem.difficulty === 'Easy' || jsonItem.difficulty === 'easy') difficulty = 'easy';
            if (jsonItem.difficulty === 'سخت' || jsonItem.difficulty === 'Hard' || jsonItem.difficulty === 'hard') difficulty = 'hard';

            const existing = existingItemsMap.get(key);

            if (existing) {
                // UPDATE existing item - only update the target language fields
                const subCat = category.subCategories[existing.subCatIndex];
                if (!subCat || !subCat.items[existing.itemIndex]) {
                    console.warn('Item not found at expected index, skipping:', key);
                    continue;
                }
                const dbItem = subCat.items[existing.itemIndex] as any;

                if (language === 'en') {
                    dbItem.name = jsonItem.name;
                    dbItem.instructions = jsonItem.instructions || '';
                    dbItem.ingredients = Array.isArray(jsonItem.ingredients) ? jsonItem.ingredients : [];
                    // Preserve Farsi fields - they stay unchanged
                } else if (language === 'fa') {
                    dbItem.name_fa = jsonItem.name;
                    dbItem.instructions_fa = jsonItem.instructions || '';
                    dbItem.ingredients_fa = Array.isArray(jsonItem.ingredients) ? jsonItem.ingredients : [];
                    // Preserve English fields - they stay unchanged
                }

                // Update common fields if they seem valid
                if (jsonItem.nutritional_info?.calories) dbItem.calories = jsonItem.nutritional_info.calories;
                if (jsonItem.nutritional_info?.protein) dbItem.protein = jsonItem.nutritional_info.protein;
                if (jsonItem.nutritional_info?.carbs) dbItem.carbs = jsonItem.nutritional_info.carbs;
                if (jsonItem.nutritional_info?.fat) dbItem.fat = jsonItem.nutritional_info.fat;
                if (jsonItem.prep_time) dbItem.prepTime = jsonItem.prep_time;
                dbItem.difficulty = difficulty;

                // Update subcategory title if applicable
                if (language === 'en' && jsonItem.category) {
                    (subCat as any).title = jsonItem.category;
                } else if (language === 'fa' && jsonItem.category) {
                    (subCat as any).title_fa = jsonItem.category;
                }

                updatedCount++;
                processedPrompts.add(key);

            } else {
                // ADD new item - find or create subcategory
                const subCatName = jsonItem.category || 'General';

                // Find existing subcategory or create one
                let targetSubCat = category.subCategories.find(s =>
                    (language === 'en' && s.title === subCatName) ||
                    (language === 'fa' && s.title_fa === subCatName)
                ) as any;

                if (!targetSubCat) {
                    // Create new subcategory
                    const newSubCat: any = {
                        title: language === 'en' ? subCatName : subCatName, // Use as fallback
                        items: []
                    };
                    if (language === 'fa') {
                        newSubCat.title_fa = subCatName;
                    }
                    category.subCategories.push(newSubCat);
                    targetSubCat = category.subCategories[category.subCategories.length - 1];
                }

                // Create new item
                const newItem: any = {
                    imagePrompt: jsonItem.image_prompt,
                    image: '🍲', // Placeholder
                    calories: jsonItem.nutritional_info?.calories || 0,
                    protein: jsonItem.nutritional_info?.protein || 0,
                    carbs: jsonItem.nutritional_info?.carbs || 0,
                    fat: jsonItem.nutritional_info?.fat || 0,
                    prepTime: jsonItem.prep_time || '15 min',
                    difficulty: difficulty,
                    isFree: false
                };

                if (language === 'en') {
                    newItem.name = jsonItem.name;
                    newItem.instructions = jsonItem.instructions || '';
                    newItem.ingredients = Array.isArray(jsonItem.ingredients) ? jsonItem.ingredients : [];
                } else if (language === 'fa') {
                    newItem.name = jsonItem.name; // Fallback for required field
                    newItem.name_fa = jsonItem.name;
                    newItem.instructions_fa = jsonItem.instructions || '';
                    newItem.ingredients_fa = Array.isArray(jsonItem.ingredients) ? jsonItem.ingredients : [];
                }

                targetSubCat.items.push(newItem);
                addedCount++;
                processedPrompts.add(key);
            }
        }

        await category.save();

        console.log(`[updateCategoryWithJson] Updated: ${updatedCount}, Added: ${addedCount}`);

        return res.status(200).json({
            success: true,
            message: `Updated category (${language}). Updated ${updatedCount} items, Added ${addedCount} new items.`,
            category,
            updatedCount,
            addedCount,
            processedCount: updatedCount + addedCount
        });

    } catch (error) {
        console.error('Update category with JSON error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Helper function to detect if a string contains Persian/Arabic characters
 */
const containsPersian = (text: string): boolean => {
    if (!text) return false;
    // Persian Unicode range: \u0600-\u06FF (Arabic block, includes Persian)
    // Also check for Persian-specific characters: \u0750-\u077F
    const persianRegex = /[\u0600-\u06FF\u0750-\u077F]/;
    return persianRegex.test(text);
};

/**
 * Get language stats for a category (how many items have EN vs FA data)
 */
export const getCategoryLanguageStats = async (req: Request, res: Response) => {
    try {
        const { categoryId } = req.params;

        const category = await KitchenCategory.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        let totalItems = 0;
        let itemsWithEnglish = 0;
        let itemsWithFarsi = 0;
        let itemsWithBoth = 0;

        category.subCategories.forEach(sub => {
            sub.items.forEach(item => {
                totalItems++;

                // Check if name field contains Persian (might be legacy data stored as fallback)
                const nameIsPersian = containsPersian(item.name);

                // Item has English if:
                // 1. It has a name field that doesn't contain Persian characters, OR
                // 2. It has name_fa AND name is different from name_fa (meaning name is English)
                const hasEnglish = item.name && !nameIsPersian && item.name !== item.name_fa;

                // Item has Farsi if:
                // 1. It has name_fa field, OR
                // 2. The name field contains Persian characters (legacy fallback data)
                const hasFarsi = !!item.name_fa || nameIsPersian;

                if (hasEnglish && hasFarsi) {
                    itemsWithBoth++;
                } else if (hasEnglish) {
                    itemsWithEnglish++;
                } else if (hasFarsi) {
                    itemsWithFarsi++;
                }
            });
        });

        return res.status(200).json({
            success: true,
            stats: {
                totalItems,
                itemsWithEnglish: itemsWithEnglish + itemsWithBoth,
                itemsWithFarsi: itemsWithFarsi + itemsWithBoth,
                itemsWithBoth,
                englishOnly: itemsWithEnglish,
                farsiOnly: itemsWithFarsi,
                hasEnglishData: (itemsWithEnglish + itemsWithBoth) > 0,
                hasFarsiData: (itemsWithFarsi + itemsWithBoth) > 0
            }
        });

    } catch (error) {
        console.error('Get category language stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting language stats',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
