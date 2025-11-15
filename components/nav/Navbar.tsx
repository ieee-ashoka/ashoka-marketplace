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
  Kbd,
} from "@heroui/react";
import { Search, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatedThemeToggler } from "@/components/ui/theme-switcher";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { JwtClaims } from "@/types/supabase";

export default function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<JwtClaims | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data,
        } = await supabase.auth.getClaims();
        setUser(data?.claims as JwtClaims | null);
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          const { data } = await supabase.auth.getClaims();
          setUser(data?.claims as JwtClaims | null);
        } catch (error) {
          console.error("Error fetching user claims:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Dynamic menu items - adjust based on auth status
  const menuItems = [
    { name: "Browse", href: "/browse" },
    { name: "Sell", href: "/sell" },
    // Remove Login from menu items and handle separately
  ];
  const loggedInMenuItems = [
    { name: "My Profile", href: "/profile" },
    { name: "My Listings", href: "/listings" },
    { name: "Settings", href: "/settings" },
    { name: "Logout", href: "/logout" },
  ];

  return (
    <Navbar maxWidth="xl" isBlurred className="hidden md:flex backdrop-blur-[24px]">
      <NavbarContent>
        <NavbarBrand>
          <Link href="/" className="flex items-center">
            <p className="font-bold text-indigo-400 text-xl">
              Ashoka Marketplace
            </p>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden md:flex gap-4" justify="center">
        <NavbarItem className="w-full max-w-xl">
          <form onSubmit={handleSearch} className="w-full">
            <Input
              classNames={{
                base: "w-full h-10",
                mainWrapper: "h-full",
                input: "text-small",
                inputWrapper: "h-full rounded-full px-2",
              }}
              style={{ "fontWeight": "600" }}
              placeholder="Search items... (Press Enter)"
              size="sm"
              value={searchQuery}
              onValueChange={handleSearchChange}
              startContent={<Search className="text-gray-400 dark:text-gray-300" size={18} style={{ 'paddingLeft': '4px' }} />}
              endContent={
                mounted && searchQuery && (
                  <Kbd keys={["enter"]} className="hidden sm:inline-flex">
                    Enter
                  </Kbd>
                )
              }
              type="search"
            />
          </form>
        </NavbarItem>
        {menuItems.map((item) => (
          <NavbarItem key={item.name} isActive={pathname === item.href}>
            <Link
              href={item.href}
              className={`dark:text-gray-300 text-gray-600 hover:text-indigo-600 ${pathname === item.href ? "text-indigo-600" : ""
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
              <DropdownMenu aria-label="User menu" className="text-gray-600 dark:text-gray-300">
                {loggedInMenuItems.map((item) => (
                  <DropdownItem
                    key={item.name.toLowerCase().replace(/\s+/g, '')}
                    as={Link}
                    href={item.href}
                    className={item.name === "Logout" ? "text-danger" : ""}
                    color={item.name === "Logout" ? "danger" : "default"}
                  >
                    {item.name === "Logout" ? "Sign Out" : item.name}
                  </DropdownItem>
                ))}
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
              className="bg-indigo-500 text-white hover:bg-indigo-600"
              style={{ 'fontWeight': 'bold' }}
              startContent={
                <Image
                  src="/images/google.png"
                  alt="Sign Up"
                  width={20}
                  height={20}
                  style={{ 'filter': 'brightness(0) invert(1)' }}
                />
              }
            >
              Get Started
            </Button>
          </NavbarItem>
        )}
        <NavbarItem className="hidden md:flex">
          <AnimatedThemeToggler className="text-gray-600 dark:text-gray-300 hover:text-indigo-600" />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
