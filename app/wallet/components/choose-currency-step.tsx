"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n/use-translations"

interface Currency {
  code: string
  name: string
  logo: string
}

interface ChooseCurrencyStepProps {
  title: string
  description: string
  currencies: Currency[]
  onClose: () => void
  onCurrencySelect: (currencyCode: string) => void
}

export default function ChooseCurrencyStep({
  title,
  description,
  currencies,
  onClose,
  onCurrencySelect,
}: ChooseCurrencyStepProps) {
  const { t } = useTranslations()
  return (
    <div className="absolute inset-0 flex flex-col h-full pt-4 md:pt-[20px] pr-0 pl-4 pb-0">
      <div className="flex justify-between items-center mb-10 md:max-w-[608px] md:mx-auto md:w-full">
        <div className="md:w-8 md:h-8"></div>
        <Button variant="ghost" size="sm" className="px-0 pr-4 md:pr-0" onClick={onClose} aria-label={t("common.close")}>
          <Image src="/icons/close-circle-secondary.png" alt={t("common.close")} width={32} height={32} />
        </Button>
      </div>
      <div className="md:max-w-[608px] md:mx-auto md:w-full flex-1 flex flex-col min-h-0">
        <div className="px-2 flex-shrink-0">
          <h1 className="text-slate-1200 text-xl md:text-[32px] font-extrabold mb-2 md:mb-[10px]">{title}</h1>
          <p className="text-grayscale-600 text-base font-normal mb-6">{description}</p>
        </div>
        <div className="pl-2 pr-0 flex-1 min-h-0">
          <div className="space-y-0 h-full overflow-y-auto">
            {currencies.map((currency, index) => (
              <div key={currency.code}>
                <div
                  className="flex items-center justify-between h-[72px] cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onCurrencySelect(currency.code)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-6 rounded-full overflow-hidden flex-shrink-0">
                      {currency.logo && (
                        <Image
                          src={currency.logo || "/placeholder.svg"}
                          alt={currency.name}
                          width={24}
                          height={24}
                          className="object-cover"
                        />
                      )}
                    </div>
                    <span className="text-slate-1200 text-base font-normal">{currency.name}</span>
                  </div>
                </div>
                {index < currencies.length - 1 && <div className="h-px bg-grayscale-200 ms-11"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
