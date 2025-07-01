"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface CurrencySelectionBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  currencies: string[]
  selectedCurrency: string
  onSelectCurrency: (currency: string) => void
}

export function CurrencySelectionBottomSheet({
  isOpen,
  onClose,
  title,
  currencies,
  selectedCurrency,
  onSelectCurrency,
}: CurrencySelectionBottomSheetProps) {
  const handleCurrencySelect = (currency: string) => {
    onSelectCurrency(currency)
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-lg">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left text-lg font-semibold">{title}</SheetTitle>
        </SheetHeader>
        <div className="space-y-0">
          {currencies.map((currency) => (
            <button
              key={currency}
              onClick={() => handleCurrencySelect(currency)}
              className={`w-full text-left px-4 py-4 text-base transition-colors ${
                selectedCurrency === currency ? "bg-black text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              {currency}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
