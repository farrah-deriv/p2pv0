import Navigation from "@/components/navigation"
import WalletBalance from "./components/wallet-balance"

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-background px-4 md:px-4">
      <Navigation title="Wallet" isBackBtnVisible={false} isVisible={true} />
      <div className="container mx-auto px-4 py-6">
        <WalletBalance />
      </div>
    </div>
  )
}
