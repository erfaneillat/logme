import { Request, Response } from 'express';
import Settings from '../models/Settings';

export const getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        let settings = await Settings.findOne().populate('kitchen.allowedUserIds', 'name phone');
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Error fetching settings', error });
    }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const updates = req.body;
        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings(updates);
        } else {
            // Merge updates. For nested objects like 'kitchen', we need to be careful not to overwrite the whole object if we only send partial updates.
            // But usually sending the whole object is safer.
            // Or we can use $set in update or just assign fields.
            if (updates.kitchen) {
                if (updates.kitchen.isEnabled !== undefined) settings.kitchen.isEnabled = updates.kitchen.isEnabled;
                if (updates.kitchen.accessMode) settings.kitchen.accessMode = updates.kitchen.accessMode;
                if (updates.kitchen.allowedUserIds) settings.kitchen.allowedUserIds = updates.kitchen.allowedUserIds;
            }

            if (updates.aiChat) {
                if (updates.aiChat.provider) settings.aiChat.provider = updates.aiChat.provider;
                if (updates.aiChat.openaiModel) settings.aiChat.openaiModel = updates.aiChat.openaiModel;
                if (updates.aiChat.deepseekModel) settings.aiChat.deepseekModel = updates.aiChat.deepseekModel;
                if (updates.aiChat.enableFallback !== undefined) settings.aiChat.enableFallback = updates.aiChat.enableFallback;
            }
        }

        await settings.save();
        res.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Error updating settings', error });
    }
};
