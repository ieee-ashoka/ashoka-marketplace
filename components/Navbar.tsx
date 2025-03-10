"use client";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Input,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
} from "@heroui/react";
import { Search, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSwitcher from "./ThemeSwitcher";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export default function AppNavbar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Set up auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Dynamic menu items - adjust based on auth status
  const menuItems = [
    { name: "Browse", href: "/browse" },
    { name: "Sell", href: "/sell" },
    // Remove Login from menu items and handle separately
  ];

  return (
    <Navbar maxWidth="xl" isBlurred className="hidden md:flex">
      <NavbarContent>
        <NavbarBrand>
          <Link href="/" className="flex items-center">
            <p className="font-bold text-indigo-600 text-xl">
              Ashoka Marketplace
            </p>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden md:flex gap-4" justify="center">
        <NavbarItem>
          <Input
            classNames={{
              base: "max-w-full sm:max-w-[15rem] h-10",
              mainWrapper: "h-full",
              input: "text-small",
              inputWrapper: "h-full rounded-full px-2",
            }}
            placeholder="Search items..."
            size="sm"
            startContent={<Search className="text-gray-400 dark:text-gray-300" size={18} />}
            type="search"
          />
        </NavbarItem>
        {menuItems.map((item) => (
          <NavbarItem key={item.name} isActive={pathname === item.href}>
            <Link
              href={item.href}
              className={`dark:text-gray-300 text-gray-600 hover:text-indigo-600 ${
                pathname === item.href ? "text-indigo-600" : ""
              }`}
            >
              {item.name}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end">
        {loading ? (
          <NavbarItem>
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-indigo-600 animate-spin"></div>
          </NavbarItem>
        ) : user ? (
          <>
            {/* User is logged in - show profile dropdown */}
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  color="primary"
                  size="sm"
                  src={
                    user.user_metadata?.avatar_url ||
                    user.user_metadata?.picture ||
                    ""
                  }
                  imgProps={{
                    referrerPolicy: "no-referrer",
                  }}
                  fallback={<UserIcon className="h-5 w-5 text-indigo-600" />}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="User menu">
                <DropdownItem key="profile" className="text-gray-700 dark:" as={Link} href="/profile">
                  My Profile
                </DropdownItem>
                <DropdownItem key="my-listings" as={Link} href="/my-listings">
                  My Listings
                </DropdownItem>
                <DropdownItem key="settings" as={Link} href="/settings">
                  Settings
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  className="text-danger"
                  color="danger"
                  as={Link}
                  href="/logout"
                >
                  Sign Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </>
        ) : (
          // User is not logged in - show login button
          <NavbarItem className="hidden md:flex">
            <Button
              as={Link}
              href="/login"
              color="primary"
              variant="flat"
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              startContent={
                <Image
                  src="/images/google.png"
                  alt="Sign Up"
                  width={20}
                  height={20}
                />
              }
            >
              Get Started
            </Button>
          </NavbarItem>
        )}
        <NavbarItem className="hidden md:flex">
          <ThemeSwitcher />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
