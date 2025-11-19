"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Check if splash has been shown in this session
        const splashShown = sessionStorage.getItem("splashShown");

        if (splashShown) {
            setShowSplash(false);
            return;
        }

        // Hide splash after 2 seconds
        const timer = setTimeout(() => {
            setShowSplash(false);
            sessionStorage.setItem("splashShown", "true");
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    if (!showSplash) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex flex-col items-center gap-4"
                >
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Image
                            src="/images/marketplace-logo.png"
                            alt="Ashoka Marketplace"
                            width={150}
                            height={150}
                            className="rounded-3xl shadow-2xl"
                            priority
                        />
                    </motion.div>
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-3xl font-bold text-white"
                    >
                        Ashoka Marketplace
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex gap-1"
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: 0
                            }}
                            className="w-2 h-2 bg-white rounded-full"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: 0.2
                            }}
                            className="w-2 h-2 bg-white rounded-full"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: 0.4
                            }}
                            className="w-2 h-2 bg-white rounded-full"
                        />
                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
