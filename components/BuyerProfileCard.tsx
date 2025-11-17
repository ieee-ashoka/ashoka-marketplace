import { Card, CardBody, Avatar, Button } from "@heroui/react";
import { format } from "date-fns";
import Link from "next/link";
import React from "react";

type BuyerProfileCardProps = {
  buyer: {
    avatar: string | null;
    name: string | null;
    created_at: string | null;
    user_id: string | null;
  };
  onSell: () => void;
};

export default function BuyerProfileCard({
  buyer,
  onSell,
}: BuyerProfileCardProps) {
    return (
        <Card className="mb-6">
            <CardBody>
                <div className="flex items-center p-4">
                    <Avatar
                        src={buyer?.avatar || "https://i.pravatar.cc/300"}
                        name={buyer?.name?.charAt(0).toUpperCase() || "U"}
                        size="md"
                        className="mr-4"
                    />
                    <div>
                        <h3 className="font-medium">
                            {buyer?.name || "Ashoka User"}
                        </h3>
                        {buyer?.created_at && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Member since {format(new Date(buyer?.created_at), 'MMM yyyy')}
                            </p>
                        )}
                    </div>
                </div>
                <div className="p-4 flex justify-between text-sm">
                    <Button
                        as={Link}
                        href={`/profile/${buyer?.user_id}`}
                        variant="flat"
                        color="secondary"
                        className="w-full mr-2"
                    >
                        View Profile
                    </Button>
                    <Button
                        onPress={() => { onSell(); }}
                        variant="flat"
                        color="success"
                        className="w-full"
                    >
                        Sell
                    </Button>
                </div>
            </CardBody>
        </Card>
    )
}