import { Skeleton } from "@heroui/react";

export default function CategoriesSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[...Array(6)].map((_, index) => (
                <div
                    key={index}
                    className="bg-default-100 rounded-xl p-6 flex flex-col items-center justify-center"
                >
                    <Skeleton className="rounded-lg mb-3">
                        <div className="h-10 w-10 rounded-lg bg-default-200"></div>
                    </Skeleton>
                    <Skeleton className="rounded-lg">
                        <div className="h-5 w-20 rounded-lg bg-default-200"></div>
                    </Skeleton>
                </div>
            ))}
        </div>
    );
}
