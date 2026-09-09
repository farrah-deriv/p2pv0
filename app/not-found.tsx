import Link from "next/link"

export const dynamic = "force-static"

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-1200">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The requested resource was not found.
      </p>
      <Link href="/" className="text-sm font-medium text-primary underline">
        Back to markets
      </Link>
    </div>
  )
}
