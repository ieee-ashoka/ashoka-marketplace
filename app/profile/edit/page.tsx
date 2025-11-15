"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Input,
    Button,
    Avatar,
    Spinner
} from "@heroui/react";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types/database.types";
import PhoneInput from "@/components/ui/PhoneNumberInput";
import { fetchProfile, updatePhoneNumber } from "../helpers";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function EditProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);


    useEffect(() => {
        async function loadProfile() {
            try {
                setIsLoading(true);
                const data = await fetchProfile();

                if (!data) {
                    router.push("/login");
                    return;
                }

                setProfile(data);
                setPhoneNumber(data?.phn_no || "");
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError("Failed to load profile data");
            } finally {
                setIsLoading(false);
            }
        }

        loadProfile();
    }, [router]);

    const handleSubmit = async () => {

        if (!profile) return;

        try {
            setIsSaving(true);
            setError(null);

            const result = await updatePhoneNumber(phoneNumber);

            if (!result.success) {
                setError(result.message);
                return;
            }

            setSuccess(true);

            // Redirect back to profile page after short delay
            setTimeout(() => {
                router.push("/profile");
            }, 1500);

        } catch (err) {
            console.error("Error updating profile:", err);
            setError("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size="lg" color="primary" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    We couldn&apos;t find your profile information.
                </p>
                <Button as={Link} href="/profile" color="primary">
                    Return to Profile
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8 max-w-2xl">
            <Button
                as={Link}
                href="/profile"
                variant="light"
                className="mb-6"
                startContent={<ArrowLeft size={16} />}
            >
                Back to Profile
            </Button>

            <Card className="p-4">
                <CardHeader className="pb-0">
                    <div className="mt-5 flex flex-col items-center sm:flex-row sm:items-start gap-4 w-full">
                        <div className="relative">
                            <Avatar
                                src={profile.avatar || "https://i.pravatar.cc/300"}
                                name={profile.name || "User"}
                                className="w-24 h-24 text-large"
                                size="lg"
                                color="primary"
                                isBordered
                                showFallback
                                imgProps={{
                                    referrerPolicy: "no-referrer"
                                }}
                            />
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-2xl font-bold">{profile.name || "Ashoka User"}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {profile.email}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardBody>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <Input
                                value={profile.email || ""}
                                type="email"
                                isDisabled
                                readOnly
                                description="Email address cannot be changed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <Input
                                value={profile.name || ""}
                                isDisabled
                                readOnly
                                description="Name cannot be changed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Phone Number</label>
                            <PhoneInput
                                value={phoneNumber}
                                onChange={setPhoneNumber}
                                id="phone-number"
                            />
                            <p className="text-xs text-gray-500 mt-1">Only your phone number can be edited</p>
                        </div>

                        {error && (
                            <div className="p-3 bg-danger-50 border border-danger text-danger rounded-medium">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-success-50 border border-success text-success rounded-medium">
                                Profile updated successfully!
                            </div>
                        )}
                    </div>
                </CardBody>

                <CardFooter>
                    <div className="flex justify-end gap-3 w-full">
                        <Button
                            as={Link}
                            href="/profile"
                            variant="flat"
                            color="danger"
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            isLoading={isSaving}
                            variant="flat"
                            onPress={handleSubmit}
                            startContent={!isSaving && <Save size={16} />}
                        >
                            Save Changes
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}