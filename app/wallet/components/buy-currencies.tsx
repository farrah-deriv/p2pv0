"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n/use-translations"
import { currency3dLogoMapper } from "@/lib/utils"
import { useAccountCurrencies } from "@/hooks/use-account-currencies"
import { Skeleton } from "@/components/ui/skeleton"

interface CurrencyCardProps {
  code: string
  name: string
  onClick: () => void
}

function CurrencyCard({ code, name, onClick }: CurrencyCardProps) {
  // Empty-state currency picker: 3D icons (mobile deposit/withdraw list parity).
  const logo = currency3dLogoMapper[code as keyof typeof currency3dLogoMapper]

  return (
    <Button type="button" variant="ghost" onClick={onClick} className="flex !flex-col !h-auto !items-center !gap-3 !p-4 !rounded-2xl !bg-black/[0.04] !transition-colors !cursor-pointer w-full !text-center">
      <div className="w-8 h-8 flex items-center justify-center w-full mb-2">
        {logo ? (
          <Image
            src={logo}
            alt={code}
            width={32}
            height={32}
            className="w-full h-full rounded-full object-contain"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-grayscale-400 flex items-center justify-center text-sm font-semibold text-slate-600">
            {code.slice(0, 2)}
          </div>
        )}
      </div>
      <span className="text-slate-1200 text-sm font-normal text-center">{name}</span>
    </Button>
  )
}

function CurrencyCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-grayscale-400">
      <Skeleton className="w-8 h-8 rounded-full bg-grayscale-500" />
      <Skeleton className="w-full h-4 bg-grayscale-500" />
    </div>
  )
}

export default function BuyCurrencies() {
  const { t } = useTranslations()
  const { accountCurrencies, isLoading } = useAccountCurrencies()
  const router = useRouter()

  const handleCardClick = () => router.push("/?operation=buy")

  if (isLoading) {
    return (
      <div className="w-full">
        <h2 className="text-slate-1200 text-xl font-bold mb-6">{t("wallet.buyCurrenciesTitle")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CurrencyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h2 className="text-slate-1200 text-xl font-bold mb-6">{t("wallet.buyCurrenciesTitle")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {accountCurrencies.map((currency) => (
          <CurrencyCard key={currency.code} code={currency.code} name={currency.name} onClick={handleCardClick} />
        ))}
      </div>
    </div>
  )
}
