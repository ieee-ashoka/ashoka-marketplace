"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"

type Props = {
    className?: string
}

export const AnimatedThemeToggler = ({ className }: Props) => {
    const { setTheme, resolvedTheme } = useTheme()
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [mounted, setMounted] = useState(false)

    // Ensure component is mounted before showing theme-dependent content
    useEffect(() => {
        setMounted(true)
    }, [])

    // Determine if current theme is dark
    const isDark = resolvedTheme === "dark"

    const toggleTheme = useCallback(async () => {
        if (!buttonRef.current) return

        const newTheme = isDark ? "light" : "dark"

        // Check if View Transitions API is supported
        if (!document.startViewTransition) {
            setTheme(newTheme)
            return
        }

        await document.startViewTransition(() => {
            flushSync(() => {
                setTheme(newTheme)
            })
        }).ready

        const { top, left, width, height } =
            buttonRef.current.getBoundingClientRect()
        const x = left + width / 2
        const y = top + height / 2
        const maxRadius = Math.hypot(
            Math.max(left, window.innerWidth - left),
            Math.max(top, window.innerHeight - top)
        )

        document.documentElement.animate(
            {
                clipPath: [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${maxRadius}px at ${x}px ${y}px)`,
                ],
            },
            {
                duration: 700,
                easing: "ease-in-out",
                pseudoElement: "::view-transition-new(root)",
            }
        )
    }, [isDark, setTheme])

    // Don't render theme-dependent content until the component is mounted and theme is resolved
    if (!mounted || !resolvedTheme) {
        return (
            <button
                className={cn(className)}
                aria-label="Toggle theme"
                disabled
            >
                <Sun size={20} />
            </button>
        )
    }

    return (
        <button
            ref={buttonRef}
            onClick={toggleTheme}
            className={cn(className)}
            aria-label="Toggle theme"
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    )
}
