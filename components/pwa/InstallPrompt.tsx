"use client";

import { useState, useEffect, useRef } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Image
} from "@heroui/react";
import { Download, Smartphone, Zap, Bell } from "lucide-react";

/** More complete typing for the install prompt event */
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
    platforms?: string[];
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        // Detect installed (standalone / iOS)
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
            // iOS legacy
            // @ts-expect-error - iOS standalone property not in standard types
            (navigator && navigator.standalone === true);
        if (isStandalone) {
            setIsInstalled(true);
            return;
        }

        // Respect previous dismissal
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const daysSinceDismissed = Math.floor((Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceDismissed < 7) {
                return;
            }
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent default mini-infobar
            try { e.preventDefault(); } catch { }
            // Stash event
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show after a short delay (allow UI to settle)
            timerRef.current = window.setTimeout(() => {
                setShowPrompt(true);
            }, 5000);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            // Cleanup listeners and timer
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
            window.removeEventListener("appinstalled", handleAppInstalled);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        try {
            // Show native prompt
            await deferredPrompt.prompt();

            // Wait for user choice
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === "accepted") {
                console.log("User accepted the install prompt");
            } else {
                console.log("User dismissed the install prompt");
                // Respect this dismissal
                localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
            }
        } catch (err) {
            console.error("Error showing install prompt:", err);
        } finally {
            // Clear stored prompt and hide custom UI
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
    };

    // Don't show if already installed
    if (isInstalled) return null;

    // If there's no beforeinstallprompt (iOS Safari), show iOS-specific help
    const isiOSNoPrompt = !deferredPrompt && /iphone|ipad|ipod/i.test(navigator.userAgent) && !isInstalled;

    return (
        <Modal
            isOpen={showPrompt || isiOSNoPrompt}
            onClose={handleDismiss}
            placement="center"
            backdrop="blur"
            classNames={{
                backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1 items-center pt-6">
                    <div className="relative mb-2">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <Image
                                src="/icons/icon-192x192.png"
                                alt="Ashoka Marketplace"
                                width={64}
                                height={64}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold">Ashoka Marketplace</h2>
                    <p className="text-sm text-foreground-500 font-normal">
                        {isiOSNoPrompt ? "Add to your home screen" : "Install our app for the best experience"}
                    </p>
                </ModalHeader>
                <ModalBody className="px-6 py-4">
                    <div className="space-y-4">
                        {/* Features */}
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Lightning Fast</h3>
                                <p className="text-xs text-foreground-500">Instant loading and smooth performance</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Works Offline</h3>
                                <p className="text-xs text-foreground-500">Browse listings even without internet</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Stay Updated</h3>
                                <p className="text-xs text-foreground-500">Get notified about new listings and messages</p>
                            </div>
                        </div>

                        {/* iOS fallback explanation */}
                        {isiOSNoPrompt && (
                            <div className="mt-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <p className="text-xs text-center text-foreground-700">
                                    Tap the <strong>Share</strong> button <span className="inline-block align-middle">📤</span> in Safari, then select <strong>&quot;Add to Home Screen&quot;</strong>
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 p-3 bg-default-100 rounded-lg">
                        <p className="text-xs text-center text-foreground-600">
                            <span className="font-semibold">Free</span> • No account required
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter className="flex-col gap-2 pb-6">
                    {/* If the browser supports the prompt, show the button; otherwise show a dismissible help UI */}
                    {deferredPrompt ? (
                        <>
                            <Button
                                color="primary"
                                size="lg"
                                onPress={handleInstallClick}
                                className="w-full font-semibold"
                                startContent={<Download className="h-5 w-5" />}
                            >
                                Get App
                            </Button>
                            <Button
                                variant="light"
                                size="sm"
                                onPress={handleDismiss}
                                className="w-full text-foreground-500"
                            >
                                Not Now
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="light"
                            size="sm"
                            onPress={handleDismiss}
                            className="w-full text-foreground-500"
                        >
                            Close
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
