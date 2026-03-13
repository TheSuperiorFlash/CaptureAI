import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-md space-y-6 px-6">
                <Skeleton className="mx-auto h-8 w-48" />
                <Skeleton className="mx-auto h-4 w-64" />
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="mx-auto h-10 w-36 rounded-xl" />
            </div>
        </div>
    )
}
