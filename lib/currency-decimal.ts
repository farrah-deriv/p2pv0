export type CurrencyDecimalConstraints = {
  minimum: number
  maximum: number
}

export type CurrencyWithDecimal = {
  code: string
  decimal?: CurrencyDecimalConstraints
}

export function getDecimalPlaces(value: string): number {
  const decimalPart = value.split(".")[1]
  return decimalPart ? decimalPart.length : 0
}

export function getDecimalConstraints(
  currency: string,
  accountCurrencies: CurrencyWithDecimal[] | null | undefined,
): CurrencyDecimalConstraints | null {
  if (!currency || !accountCurrencies || accountCurrencies.length === 0) return null
  const currencyData = accountCurrencies.find((c) => c.code === currency)
  return currencyData?.decimal || null
}
