"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkUserLoggedIn, signInWithOAuth } from "./helpers";

export default function Login() {
  const router = useRouter();
  const nextUrl = "/onboarding";

  useEffect(() => {
    const checkUserAndLogin = async () => {
      // Check if user is already logged in
      const isLoggedIn = await checkUserLoggedIn();

      if (isLoggedIn) {
        // User is already logged in, redirect to homepage
        router.push("/");
      } else {
        // User is not logged in, initiate login automatically
        handleLogin();
      }
    };

    checkUserAndLogin();
  }, [router]);

  const handleLogin = async () => {
    const url = `${location.origin}/auth/callback?next=${nextUrl}`;
    console.log("Redirect URL:", url);
    await signInWithOAuth("google", url);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-10 md:p-0 md:w-1/2 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Redirecting to Login...</h1>
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-blue-600 animate-spin"></div>
        <p>Connecting to Google Sign-In</p>
      </div>
      <p className="text-sm text-gray-500 mt-6">
        If you&apos;re not automatically redirected, please check your pop-up
        blocker.
      </p>
    </div>
  );
}
