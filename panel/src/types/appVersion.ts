export type Platform = 'ios' | 'android';

export interface AppVersion {
    _id: string;
    platform: Platform;
    version: string;
    buildNumber: number;
    minVersion: string;
    minBuildNumber: number;
    isForceUpdate: boolean;
    isOptionalUpdate: boolean;
    updateTitle?: string;
    updateMessage?: string;
    storeUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAppVersionRequest {
    platform: Platform;
    version: string;
    buildNumber: number;
    minVersion: string;
    minBuildNumber: number;
    isForceUpdate: boolean;
    isOptionalUpdate: boolean;
    updateTitle?: string;
    updateMessage?: string;
    storeUrl?: string;
    isActive: boolean;
}

export interface UpdateAppVersionRequest extends Partial<CreateAppVersionRequest> {}
