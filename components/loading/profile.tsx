import React, { JSX } from 'react'
import { Card, CardBody, Skeleton } from '@heroui/react'

export default function ProfileSkeleton(): JSX.Element {
    return (
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
            <div className="flex flex-col gap-4 sm:gap-6">
                <Card className="w-full">
                    <CardBody className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
                        <Skeleton className="rounded-full w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mx-auto sm:mx-0" />
                        <div className="flex flex-col flex-grow gap-3 sm:gap-4">
                            <Skeleton className="h-6 sm:h-8 w-32 sm:w-48 rounded-lg mx-auto sm:mx-0" />
                            <Skeleton className="h-3 sm:h-4 w-full rounded-lg" />
                            <div className="flex gap-3 sm:gap-4 justify-center sm:justify-start">
                                <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 rounded-lg" />
                                <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 rounded-lg" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Skeleton className="h-10 sm:h-12 w-full rounded-lg" />

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-40 sm:h-64 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    )
}
