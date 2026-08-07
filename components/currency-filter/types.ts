export interface Currency {
  code: string
  name: string
}

export interface CurrencyFilterProps {
  currencies: Currency[]
  selectedCurrency: string
  onCurrencySelect: (currencyCode: string) => void
  title?: string
  placeholder?: string
  disabled?: boolean
  triggerClassName?: string
  triggerTestId?: string
  onOpen?: () => void
}
