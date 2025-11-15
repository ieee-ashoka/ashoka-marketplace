"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@heroui/react";
import { signOut } from "./helpers";

export default function Logout() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        const result = await signOut();

        if (!result.success) {
          setError(result.error || "Failed to sign out");
        } else {
          // Successful logout
          setTimeout(() => {
            router.push("/");
          }, 2000); // Small delay to show the success message
        }
      } catch (error) {
        console.error("Error during logout:", error);
        setError("An unexpected error occurred during logout");
      } finally {
        setIsLoading(false);
      }
    };

    handleLogout();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-5xl font-bold">Signing Out</h1>
        {isLoading ? (
          <div className="mt-6 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-xl">Logging you out...</p>
          </div>
        ) : error ? (
          <div className="mt-6">
            <p className="text-xl text-red-600">Error: {error}</p>
            <Link
              href="/"
              className="mt-6 px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Return to Home
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-xl text-green-600">
              You have been successfully logged out.
            </p>
            <p className="mt-2 text-lg text-gray-600">
              Thank you for using Ashoka Marketplace.
            </p>
            <Button as={Link} href="/" color="primary" className="mt-6">
              Return to Home
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
