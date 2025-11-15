"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user has already dismissed the prompt
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const daysSinceDismissed = Math.floor(
                (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Show again after 7 days
            if (daysSinceDismissed < 7) {
                return;
            }
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();

            // Stash the event so it can be triggered later
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show the install prompt after a delay (3 seconds)
            setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Detect if app was installed
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            console.log("User accepted the install prompt");
        } else {
            console.log("User dismissed the install prompt");
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
    };

    // Don't show if already installed or no prompt available
    if (isInstalled || !showPrompt || !deferredPrompt) {
        return null;
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
                >
                    <Card className="shadow-2xl border border-divider">
                        <CardBody className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                                    <Download className="h-6 w-6 text-primary" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold text-foreground mb-1">
                                        Install Ashoka Marketplace
                                    </h3>
                                    <p className="text-sm text-foreground-500 mb-3">
                                        Install our app for a faster experience with offline access and notifications.
                                    </p>

                                    <div className="flex gap-2">
                                        <Button
                                            color="primary"
                                            size="sm"
                                            onPress={handleInstallClick}
                                            className="flex-1"
                                        >
                                            Install
                                        </Button>
                                        <Button
                                            variant="light"
                                            size="sm"
                                            onPress={handleDismiss}
                                            isIconOnly
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
