export default function Loading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <output className="h-8 w-8 animate-spin rounded-full border-2 border-[--color-border] border-t-[--color-accent]" aria-label="Loading" />
        </div>
    )
}
