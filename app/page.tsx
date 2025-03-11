import Navigation from "@/components/navigation"
import Link from "next/link"

export default function BuySellPage() {
  return (
    <>
      <Navigation />
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Buy/Sell Page</h1>
        <p className="mb-6">This is where users can browse and create buy/sell advertisements</p>
        <div className="flex justify-center gap-4">
          <Link href="/profile" className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
            View Profile
          </Link>
        </div>
      </div>
    </>
  )
}

