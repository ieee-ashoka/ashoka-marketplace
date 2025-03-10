"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { TablesInsert } from "@/types/database.types";
import { Avatar, Button, Card, CardBody, Input } from "@heroui/react";
import { User as UserIcon } from "lucide-react";
import PhoneInput from "@/components/ui/PhoneNumberInput"; // Import our custom component

export default function OnboardingPage() {
  const router = useRouter();

  // Use useMemo to ensure supabase client has stable reference
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<TablesInsert<"profiles">>({
    name: "",
    email: "",
    avatar: "",
    phn_no: "",
    user_id: "",
  });
  const [phoneError, setPhoneError] = useState("");

  // Track which fields need user input
  const [missingFields, setMissingFields] = useState({
    name: false,
    email: false,
    phn_no: true, // Phone is almost always missing from OAuth
  });

  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        setLoading(true);

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (existingProfile) {
          // Profile exists, redirect to home
          router.push("/");
          return;
        }

        // Get metadata from current user
        const metadata = user.user_metadata;
        console.log("User metadata:", metadata);

        // Check for missing fields and prepare data
        const newProfileData = {
          name: metadata.name || metadata.full_name || "",
          email: metadata.email || "",
          avatar: metadata.avatar_url || metadata.picture || "",
          phn_no: metadata.phone_number || metadata.phn_no || "",
          user_id: user.id,
        };

        console.log(newProfileData);

        // Track which fields are missing
        const newMissingFields = {
          name: !newProfileData.name,
          email: !newProfileData.email,
          phn_no: !newProfileData.phn_no,
        };

        setProfileData(newProfileData);
        setMissingFields(newMissingFields);

        // If no fields are missing, we could automatically create the profile
        const hasAllFields = !Object.values(newMissingFields).some(
          (value) => value
        );
        if (hasAllFields) {
          await createProfile(newProfileData);
        }
      } catch (err) {
        console.error("Error during profile check:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUserProfile();
  }, []); // Remove router and supabase from dependencies

  const createProfile = async (data: TablesInsert<"profiles">) => {
    try {
      setSubmitting(true);

      // Insert profile data
      const { error } = await supabase.from("profiles").insert([
        {
          ...data,
        },
      ]);

      if (error) {
        throw error;
      }

      // Redirect to homepage after successful profile creation
      router.push("/");
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
      setSubmitting(false);
    }
  };

  const validatePhone = (phone: string): boolean => {
    // More permissive validation for international numbers
    if (!phone) {
      setPhoneError("Phone number is required");
      return false;
    }

    // Minimum length validation (country code + at least 5 digits)
    if (phone.length < 6) {
      setPhoneError("Please enter a valid phone number");
      return false;
    }

    setPhoneError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    if (missingFields.phn_no && !validatePhone(profileData.phn_no || "")) {
      return;
    }

    if (missingFields.name && !profileData.name) {
      setError("Name is required");
      return;
    }

    if (missingFields.email && !profileData.email) {
      setError("Email is required");
      return;
    }

    await createProfile(profileData);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardBody className="p-6">
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-2xl font-bold text-center mb-1">
              Complete Your Profile
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {Object.values(missingFields).some((v) => v)
                ? "We need a few more details to complete your profile"
                : "Your profile is almost ready!"}
            </p>
          </div>

          {profileData.avatar && (
            <div className="flex justify-center mb-6">
              <Avatar
                isBordered
                color="primary"
                src={profileData.avatar}
                className="w-24 h-24 z-10 text-large"
                fallback={<UserIcon className="h-12 w-12 text-indigo-900" />}
                size="lg"
                imgProps={{
                  referrerPolicy: "no-referrer",
                }}
                // showFallback
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Only show name field if it's missing */}
            {missingFields.name && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={profileData.name || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  placeholder="Your name"
                  className="w-full"
                  variant="bordered"
                  required
                />
              </div>
            )}

            {/* Only show email field if it's missing */}
            {missingFields.email && (
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  placeholder="your.email@ashoka.edu.in"
                  className="w-full"
                  variant="bordered"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your Ashoka University email
                </p>
              </div>
            )}

            {/* Only show phone field if it's missing - now using our custom PhoneInput */}
            {missingFields.phn_no && (
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium mb-1"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  id="phone"
                  value={profileData.phn_no || ""}
                  onChange={(value) => {
                    setProfileData({ ...profileData, phn_no: value });
                    if (phoneError) validatePhone(value);
                  }}
                  error={phoneError}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  For buyers to contact you about listings
                </p>
              </div>
            )}

            {/* Show a message if no fields are missing */}
            {!Object.values(missingFields).some((v) => v) && (
              <div className="bg-green-100 dark:bg-green-900 p-4 rounded-md">
                <p className="text-green-700 dark:text-green-300 text-center">
                  All information is complete! Click below to continue.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              color="primary"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                "Complete Profile"
              )}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
