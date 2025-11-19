"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { User as UserIcon } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/theme-switcher";
import { useAuth } from "@/app/context/AuthContext";

const Topbar = () => {
    const [mounted, setMounted] = useState(false);
    const { claims, isLoading: authLoading } = useAuth();
    
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-divider bg-background bg-opacity-90 backdrop-blur-sm md:hidden">
            <div className="flex h-14 items-center px-4">
                {/* Left: Logo (fixed width) */}
                <div className="flex-shrink-0">
                    <Link href="/" className="flex items-center">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex items-center"
                        >
                            <Image
                                src="/images/marketplace-logo.png"
                                alt="Ashoka Marketplace"
                                width={70}
                                height={70}
                                className="rounded-lg"
                            />
                        </motion.div>
                    </Link>
                </div>

                {/* Middle: Theme Toggle (flexible width) */}
                <div className="flex flex-1 justify-end mx-3 md:mx-4">
                    <AnimatedThemeToggler className="text-gray-600 dark:text-gray-300 hover:text-indigo-600" size={25} />
                </div>

                {/* Right: Avatar (fixed width) */}
                {!authLoading && claims && (
                    <div className="flex-shrink-0">
                        <Dropdown placement="bottom-end">
                            <DropdownTrigger>
                                <Avatar
                                    isBordered
                                    as="button"
                                    className="transition-transform hover:scale-105"
                                    color="primary"
                                    size="sm"
                                    src={
                                        claims.user_metadata?.avatar_url ||
                                        claims.user_metadata?.picture ||
                                        ""
                                    }
                                    imgProps={{
                                        referrerPolicy: "no-referrer",
                                    }}
                                    fallback={<UserIcon className="h-5 w-5 text-indigo-600" />}
                                />
                            </DropdownTrigger>
                            <DropdownMenu aria-label="User menu" className="text-gray-600 dark:text-gray-300">
                                <DropdownItem
                                    key="myprofile"
                                    as={Link}
                                    href="/profile"
                                >
                                    My Profile
                                </DropdownItem>
                                <DropdownItem
                                    key="mylistings"
                                    as={Link}
                                    href="/listings"
                                >
                                    My Listings
                                </DropdownItem>
                                <DropdownItem
                                    key="settings"
                                    as={Link}
                                    href="/settings"
                                >
                                    Settings
                                </DropdownItem>
                                <DropdownItem
                                    key="logout"
                                    as={Link}
                                    href="/logout"
                                    className="text-danger"
                                    color="danger"
                                >
                                    Sign Out
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Topbar;