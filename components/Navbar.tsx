"use client";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Input,
  Button,
} from "@heroui/react";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSwitcher from "./ThemeSwitcher";
import Image from "next/image";

export default function AppNavbar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Browse", href: "/browse" },
    { name: "Sell", href: "/sell" },
    { name: "Login", href: "/login" },
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
            startContent={<Search className="text-gray-400" size={18} />}
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
        <NavbarItem className="hidden md:flex">
          <Button
            as={Link}
            href="/signup"
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
            Sign Up
          </Button>
        </NavbarItem>
        <NavbarItem className="hidden md:flex">
          <ThemeSwitcher />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
