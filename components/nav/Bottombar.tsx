"use client";
import React, { useEffect, useState } from "react";
import {
    Home,
    Search,
    PlusCircle,
    Heart,
    User as UserIcon,
    LogIn,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";

const BottomBar = () => {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [mounted, setMounted] = useState(false);
    const { claims } = useAuth();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY < lastScrollY || currentScrollY < 370) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY) {
                setIsVisible(false);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const pages = claims
        ? [
            { name: "Home", href: "/", icon: Home },
            { name: "Browse", href: "/browse", icon: Search },
            { name: "Sell", href: "/sell", icon: PlusCircle },
            { name: "Wishlist", href: "/wishlist", icon: Heart },
            { name: "Profile", href: "/profile", icon: UserIcon },
        ]
        : [
            { name: "Home", href: "/", icon: Home },
            { name: "Browse", href: "/browse", icon: Search },
            { name: "Login", href: "/login", icon: LogIn },
        ];

    // Get the icon color based on active status and theme
    const getIconColor = (isActive: boolean) => {
        if (!mounted) return "gray";

        if (isActive) {
            // Use text color for active icons (will adapt to theme automatically)
            return "#4f39f6";
        } else {
            // Use a muted color for inactive icons
            return "gray";
        }
    };

    if (!mounted) return null;

    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    id="bottom-nav"
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        duration: 0.3,
                    }}
                    className="fixed bottom-0 z-40 w-full border-t border-gray-700 bg-background py-2 md:hidden"
                >
                    <div className="flex w-full flex-row items-center justify-around bg-transparent">
                        {pages.map((page, index) => (
                            <Link
                                key={index}
                                href={page.href}
                                className="z-50 flex items-center"
                            >
                                <page.icon
                                    width="30"
                                    height="30"
                                    stroke={getIconColor(pathname === page.href)}
                                />
                            </Link>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BottomBar;