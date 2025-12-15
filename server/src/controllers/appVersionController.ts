import { Request, Response } from 'express';
import AppVersion, { IAppVersion } from '../models/AppVersion';
import errorLogger from '../services/errorLoggerService';

/**
 * Check if app update is required
 * @route GET /api/app-version/check
 * @access Public
 */
export const checkAppVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { platform, version, buildNumber } = req.query;

    if (!platform || !buildNumber) {
      res.status(400).json({
        success: false,
        message: 'Platform and build number are required'
      });
      return;
    }

    const currentBuildNumber = parseInt(buildNumber as string);

    if (isNaN(currentBuildNumber)) {
      res.status(400).json({
        success: false,
        message: 'Build number must be a valid number'
      });
      return;
    }

    // Get active version configuration for the platform
    const versionConfig = await AppVersion.findOne({
      platform: platform as string,
      isActive: true
    });

    if (!versionConfig) {
      res.status(200).json({
        success: true,
        data: {
          isForceUpdate: false,
          isOptionalUpdate: false,
        }
      });
      return;
    }

    // Check if force update is required
    const isForceUpdate = versionConfig.isForceUpdate &&
      currentBuildNumber < versionConfig.minBuildNumber;

    // Check if optional update is available
    const isOptionalUpdate = versionConfig.isOptionalUpdate &&
      currentBuildNumber < versionConfig.buildNumber &&
      !isForceUpdate;

    console.log('[AppVersion] Check:', {
      platform,
      currentBuildNumber,
      minBuildNumber: versionConfig.minBuildNumber,
      latestBuildNumber: versionConfig.buildNumber,
      configForce: versionConfig.isForceUpdate,
      configOptional: versionConfig.isOptionalUpdate,
      resultForce: isForceUpdate,
      resultOptional: isOptionalUpdate
    });

    res.status(200).json({
      success: true,
      data: {
        isForceUpdate,
        isOptionalUpdate,
        updateTitle: versionConfig.updateTitle,
        updateMessage: versionConfig.updateMessage,
        storeUrl: versionConfig.storeUrl,
        latestVersion: versionConfig.version,
        latestBuildNumber: versionConfig.buildNumber,
        minVersion: versionConfig.minVersion,
        minBuildNumber: versionConfig.minBuildNumber,
      }
    });
  } catch (error) {
    errorLogger.error('Error checking app version:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking app version'
    });
  }
};

/**
 * Get all app versions (admin only)
 * @route GET /api/app-version
 * @access Private/Admin
 */
export const getAllAppVersions = async (req: Request, res: Response): Promise<void> => {
  try {
    const versions = await AppVersion.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: versions
    });
  } catch (error) {
    errorLogger.error('Error getting app versions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving app versions'
    });
  }
};

/**
 * Get app version by ID (admin only)
 * @route GET /api/app-version/:id
 * @access Private/Admin
 */
export const getAppVersionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const version = await AppVersion.findById(id);

    if (!version) {
      res.status(404).json({
        success: false,
        message: 'App version not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: version
    });
  } catch (error) {
    errorLogger.error('Error getting app version:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving app version'
    });
  }
};

/**
 * Create a new app version (admin only)
 * @route POST /api/app-version
 * @access Private/Admin
 */
export const createAppVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      platform,
      version,
      buildNumber,
      minVersion,
      minBuildNumber,
      isForceUpdate,
      isOptionalUpdate,
      updateTitle,
      updateMessage,
      storeUrl,
      isActive
    } = req.body;

    // Validate required fields
    if (!platform || !version || !buildNumber || !minVersion || !minBuildNumber) {
      res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
      return;
    }

    // If setting as active, deactivate other active versions for this platform
    if (isActive) {
      await AppVersion.updateMany(
        { platform, isActive: true },
        { isActive: false }
      );
    }

    const newVersion = await AppVersion.create({
      platform,
      version,
      buildNumber,
      minVersion,
      minBuildNumber,
      isForceUpdate: isForceUpdate ?? false,
      isOptionalUpdate: isOptionalUpdate ?? false,
      updateTitle,
      updateMessage,
      storeUrl,
      isActive: isActive ?? true
    });

    res.status(201).json({
      success: true,
      data: newVersion
    });
  } catch (error: any) {
    errorLogger.error('Error creating app version:', error);

    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'An active version configuration already exists for this platform'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error creating app version'
    });
  }
};

/**
 * Update an app version (admin only)
 * @route PUT /api/app-version/:id
 * @access Private/Admin
 */
export const updateAppVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      platform,
      version,
      buildNumber,
      minVersion,
      minBuildNumber,
      isForceUpdate,
      isOptionalUpdate,
      updateTitle,
      updateMessage,
      storeUrl,
      isActive
    } = req.body;

    const existingVersion = await AppVersion.findById(id);

    if (!existingVersion) {
      res.status(404).json({
        success: false,
        message: 'App version not found'
      });
      return;
    }

    // If setting as active, deactivate other active versions for this platform
    if (isActive && !existingVersion.isActive) {
      await AppVersion.updateMany(
        {
          platform: platform || existingVersion.platform,
          isActive: true,
          _id: { $ne: id }
        },
        { isActive: false }
      );
    }

    const updatedVersion = await AppVersion.findByIdAndUpdate(
      id,
      {
        platform: platform ?? existingVersion.platform,
        version: version ?? existingVersion.version,
        buildNumber: buildNumber ?? existingVersion.buildNumber,
        minVersion: minVersion ?? existingVersion.minVersion,
        minBuildNumber: minBuildNumber ?? existingVersion.minBuildNumber,
        isForceUpdate: isForceUpdate ?? existingVersion.isForceUpdate,
        isOptionalUpdate: isOptionalUpdate ?? existingVersion.isOptionalUpdate,
        updateTitle: updateTitle ?? existingVersion.updateTitle,
        updateMessage: updateMessage ?? existingVersion.updateMessage,
        storeUrl: storeUrl ?? existingVersion.storeUrl,
        isActive: isActive ?? existingVersion.isActive,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedVersion
    });
  } catch (error: any) {
    errorLogger.error('Error updating app version:', error);

    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'An active version configuration already exists for this platform'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error updating app version'
    });
  }
};

/**
 * Delete an app version (admin only)
 * @route DELETE /api/app-version/:id
 * @access Private/Admin
 */
export const deleteAppVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const version = await AppVersion.findByIdAndDelete(id);

    if (!version) {
      res.status(404).json({
        success: false,
        message: 'App version not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'App version deleted successfully'
    });
  } catch (error) {
    errorLogger.error('Error deleting app version:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting app version'
    });
  }
};

/**
 * Toggle app version active status (admin only)
 * @route PATCH /api/app-version/:id/toggle-active
 * @access Private/Admin
 */
export const toggleAppVersionActive = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const version = await AppVersion.findById(id);

    if (!version) {
      res.status(404).json({
        success: false,
        message: 'App version not found'
      });
      return;
    }

    // If activating, deactivate other active versions for this platform
    if (!version.isActive) {
      await AppVersion.updateMany(
        {
          platform: version.platform,
          isActive: true,
          _id: { $ne: id }
        },
        { isActive: false }
      );
    }

    version.isActive = !version.isActive;
    await version.save();

    res.status(200).json({
      success: true,
      data: version
    });
  } catch (error: any) {
    errorLogger.error('Error toggling app version active status:', error);

    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'An active version configuration already exists for this platform'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error toggling app version active status'
    });
  }
};
