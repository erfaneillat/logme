"use client";

import { useEffect } from "react";

export default function ServiceWorkerManager() {
    useEffect(() => {
        // Check if running in the custom Flutter WebView
        const isFlutterWebView = typeof navigator !== 'undefined' &&
            navigator.userAgent.includes('Loqme Flutter WebView');

        if (isFlutterWebView) {
            // Unregister service workers to prevent caching issues in the native app wrapper
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function (registrations) {
                    for (let registration of registrations) {
                        registration.unregister();
                        console.log("Service Worker unregistered for Flutter WebView");
                    }
                });
            }
        }
    }, []);

    return null;
}
