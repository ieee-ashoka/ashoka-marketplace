"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, X, User } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar, Spinner } from "@heroui/react";

interface UserSearchResult {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar: string | null;
    is_onboarded: boolean;
    rank: number;
}

export function Search() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<UserSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setIsSearchExpanded(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!searchQuery.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        setIsOpen(true);

        try {
            const supabase = createClient();
            const { data, error } = await supabase.rpc("search_profiles", {
                search_query: searchQuery
            });

            if (error) {
                console.error("Search error:", error);
                return;
            }

            setResults(data || []);
        } catch (error) {
            console.error("Failed to search users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        } else if (e.key === "Escape") {
            handleClear();
        }
    };

    const handleClear = () => {
        setSearchQuery("");
        setResults([]);
        setIsOpen(false);
    };

    const expandSearch = () => {
        setIsSearchExpanded(true);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 400);
    };

    return (
        <div ref={searchContainerRef} className="relative flex-1 flex justify-end">
            {/* Container for better positioning */}
            <div className="relative w-full h-10">
                {/* Expandable background */}
                <motion.div
                    initial={false}
                    animate={{
                        width: isSearchExpanded ? "100%" : "40px",
                    }}
                    transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
                    className={cn(
                        "absolute right-0 top-0 bg-default-100 rounded-full h-10 flex items-center",
                        isSearchExpanded ? "pr-2 pl-4" : "",
                        !isSearchExpanded && "cursor-pointer hover:bg-default-200"
                    )}
                    onClick={!isSearchExpanded ? expandSearch : undefined}
                >
                    {/* Always visible search icon */}
                    <div className={cn(
                        "flex items-center justify-center",
                        isSearchExpanded ? "absolute right-0 h-10 w-10" : "h-10 w-10"
                    )}>
                        <SearchIcon className="h-5 w-5 text-default-500" />
                    </div>

                    {/* Input field */}
                    <AnimatePresence>
                        {isSearchExpanded && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="w-full mr-10"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search users..."
                                    className="bg-transparent border-none outline-none w-full text-sm"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Clear button */}
                    <AnimatePresence>
                        {isSearchExpanded && searchQuery && (
                            <motion.button
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                onClick={handleClear}
                                className="p-1 rounded-full hover:bg-default-300 transition-colors absolute right-11"
                            >
                                <X className="h-4 w-4 text-default-500" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Search results dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 5, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
                        className="absolute right-0 top-full mt-2 rounded-xl border border-divider bg-background shadow-lg z-50 overflow-hidden w-64"
                    >
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Spinner size="md" color="primary" />
                            </div>
                        ) : results.length > 0 ? (
                            <div className="max-h-96 overflow-y-auto">
                                {results.map((user, index) => (
                                    <Link
                                        key={user.id}
                                        href={`/profile/${user.username}`}
                                        onClick={() => {
                                            setIsOpen(false);
                                            setIsSearchExpanded(false);
                                        }}
                                        className="block w-full"
                                    >
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                transition: {
                                                    delay: index * 0.05,
                                                    duration: 0.3
                                                }
                                            }}
                                            className="flex items-center gap-3 px-5 py-3 hover:bg-default-100 transition-colors"
                                        >
                                            <Avatar
                                                size="sm"
                                                src={user.avatar || undefined}
                                                name={`${user.first_name} ${user.last_name}`}
                                                showFallback
                                                getInitials={(name) =>
                                                    name
                                                        ?.split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                }
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">@{user.username}</span>
                                                <span className="text-xs text-default-500">
                                                    {user.first_name} {user.last_name}
                                                </span>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        ) : searchQuery && !isLoading ? (
                            <div className="px-4 py-8 text-center text-default-500">
                                <User className="mx-auto h-10 w-10 mb-3 opacity-50" />
                                <p>No users found</p>
                            </div>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Search;