'use client';

import React, { useEffect, useState } from 'react';
import { apiService, AppVersionCheck } from '../services/apiService';
import { UpdateDialog } from './UpdateDialog';

interface VersionCheckWrapperProps {
    children: React.ReactNode;
}

// Extend Window interface to include FlutterBridge
declare global {
    interface Window {
        FlutterBridge?: {
            isFlutterWebView: boolean;
            version: string;
            buildNumber: string;
            platform: string;
            [key: string]: any;
        };
    }
}

export const VersionCheckWrapper: React.FC<VersionCheckWrapperProps> = ({ children }) => {
    const [versionCheck, setVersionCheck] = useState<AppVersionCheck | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        // Avoid re-checking too often if needed, but for now check on mount
        if (hasChecked) return;

        const checkVersion = async () => {
            try {
                // 1. Check if running inside Flutter WebView
                if (typeof window !== 'undefined' && window.FlutterBridge?.isFlutterWebView) {
                    const { version, buildNumber, platform } = window.FlutterBridge;

                    console.log('[VersionCheck] Detected Flutter WebView:', { version, buildNumber, platform });

                    if (version && buildNumber) {
                        const buildNum = parseInt(buildNumber, 10);
                        if (!isNaN(buildNum)) {
                            const result = await apiService.checkAppVersion(platform || 'android', buildNum);

                            console.log('[VersionCheck] API Result:', result);

                            if (result.isForceUpdate || result.isOptionalUpdate) {
                                console.log('[VersionCheck] Showing dialog. Force:', result.isForceUpdate, 'Optional:', result.isOptionalUpdate);
                                setVersionCheck(result);
                                setShowDialog(true);
                            }
                        }
                    }
                }
                // If NOT in Flutter WebView, we do NOTHING (as requested: "show this just in webview of flutter not on web")
            } catch (error) {
                console.error('Failed to check app version:', error);
            } finally {
                setHasChecked(true);
            }
        };

        // If FlutterBridge is not immediately available, wait a bit or use an interval?
        // The injection happens after page load, so we might need to poll or listen for an event.
        // However, usually injected objects are available quickly. 
        // A robust way creates a poller or relies on re-renders if the bridge injects later (which it does, onPageFinished).
        // But since this is a React component mounting, and injection happens "onPageFinished", it might be a race condition.
        // The "onPageFinished" in Flutter happens *after* the page is loaded.

        // Better strategy: Poll for FlutterBridge for a few seconds.
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds
        const intervalId = setInterval(() => {
            if (window.FlutterBridge) {
                clearInterval(intervalId);
                checkVersion();
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(intervalId);
                    // Assume not in Flutter or bridge failed
                    setHasChecked(true);
                }
            }
        }, 100);

        return () => clearInterval(intervalId);
    }, [hasChecked]);

    const handleClose = () => {
        setShowDialog(false);
    };

    return (
        <>
            {children}
            {showDialog && versionCheck && (
                <UpdateDialog
                    versionCheck={versionCheck}
                    onClose={!versionCheck.isForceUpdate ? handleClose : undefined}
                />
            )}
        </>
    );
};
