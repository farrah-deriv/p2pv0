"use client"

import { useState, useRef, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { StandaloneChevronDownRegularIcon, StandaloneChevronUpRegularIcon, StandaloneSearchRegularIcon, StandaloneXmarkRegularIcon } from "@deriv/quill-icons/Standalone"
import { cn } from "@/lib/utils"
import { CHECKBOX_LABEL_ROW } from "@/lib/rtl"
import { useTranslations } from "@/lib/i18n/use-translations"

interface Country {
  code: string
  name: string
}

interface CountrySelectionProps {
  countries: Country[]
  selectedCountries: string[] | null
  onCountriesChange: (countries: string[] | null) => void
  isLoading?: boolean
}

export default function CountrySelection({ countries, selectedCountries, onCountriesChange }: CountrySelectionProps) {
  const { t } = useTranslations()
  const isMobile = useIsMobile()
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number>(0)

  const filteredCountries = countries.filter((country) => country.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const [allMode, setAllMode] = useState(selectedCountries === null)
  const isAllSelected = allMode

  // Sync allMode when the parent loads countries from outside (e.g. edit mode async fetch).
  useEffect(() => {
    if (selectedCountries === null) {
      setAllMode(true)
    } else if (selectedCountries.length > 0) {
      setAllMode(false)
    }
  }, [selectedCountries])

  const handleCountryToggle = (countryCode: string) => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop
    }

    if (allMode) {
      setAllMode(false)
      onCountriesChange(countries.map((c) => c.code).filter((c) => c !== countryCode))
    } else if (selectedCountries !== null && selectedCountries.includes(countryCode)) {
      onCountriesChange(selectedCountries.filter((code) => code !== countryCode))
    } else {
      const current = selectedCountries ?? []
      const newSelection = [...current, countryCode]
      if (newSelection.length === countries.length) {
        setAllMode(true)
        onCountriesChange(null)
      } else {
        onCountriesChange(newSelection)
      }
    }
  }

  const handleAllToggle = (checked: boolean | string) => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop
    }

    const next = !!checked
    setAllMode(next)
    onCountriesChange(next ? null : [])
  }

  useEffect(() => {
    if (scrollContainerRef.current && scrollPositionRef.current > 0) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current
    }
  }, [selectedCountries])

  const getDisplayText = () => {
    if (isAllSelected) {
      return t("common.allCountries")
    }
    return `${t("common.selectedCount")} (${selectedCountries?.length ?? 0})`
  }

  const countryList = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg bg-black/[0.04] px-3 h-10">
        <StandaloneSearchRegularIcon iconSize="xs" className="shrink-0 text-neutral-400" aria-hidden />
        <input
          type="text"
          placeholder={t("common.search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoComplete="off"
          autoFocus
          className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"
        />
        {searchTerm && (
          <Button
            variant="icon-muted"
            onClick={() => setSearchTerm("")}
            aria-label={t("common.clearSearch")}
            className="!bg-transparent hover:!bg-black/[0.06] !w-6 !h-6 !min-w-0 shrink-0"
          >
            <StandaloneXmarkRegularIcon iconSize="xs" aria-hidden />
          </Button>
        )}
      </div>

      <div ref={scrollContainerRef} className="space-y-4 px-1 max-h-[300px] md:max-h-[240px] overflow-y-auto" data-testid="ad-form-list-countries">
        <div className={cn(CHECKBOX_LABEL_ROW, "mb-1")}>
          <Checkbox
            id="all-countries"
            checked={isAllSelected}
            onCheckedChange={handleAllToggle}
            className="shrink-0 "
          />
          <label htmlFor="all-countries" className="flex-1 min-w-0 text-sm cursor-pointer text-start">
            {t("common.allCountries")}
          </label>
        </div>

        <div className="h-px bg-black/[0.08] my-7" />

        {filteredCountries.map((country) => (
          <div key={country.code} className={cn(CHECKBOX_LABEL_ROW, "py-1")}>
            <Checkbox
              id={country.code}
              checked={isAllSelected || (selectedCountries !== null && selectedCountries.includes(country.code))}
              onCheckedChange={() => handleCountryToggle(country.code)}
              disabled={false}
              className="shrink-0 "
              data-testid={`ad-form-checkbox-country-${country.code}`}
            />
            <label htmlFor={country.code} className="flex-1 min-w-0 text-sm cursor-pointer text-start">
              {country.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className="!w-full !h-14 !max-h-none !rounded-lg !border !border-solid !border-neutral-200 !bg-white !px-4 !font-normal hover:!bg-white focus:!ring-1 focus:!ring-black [&>span]:!w-full"
            onClick={() => setIsOpen(true)}
          >
            <span className="flex w-full flex-row items-center justify-between">
              <span className="flex-1 min-w-0 truncate text-start text-base text-grayscale-600">{getDisplayText()}</span>
              <StandaloneChevronDownRegularIcon iconSize="xs" fill="currentColor" className="ms-1.5 shrink-0" />
            </span>
          </Button>
        </DrawerTrigger>
        <DrawerContent side="bottom" className="h-fit">
          <div className="my-4">
            <h3 className="text-xl font-bold text-center">{t("common.countrySelection")}</h3>
            <div className="text-base text-center opacity-72 mt-2">{t("adForm.countrySelectionSubtitle")}</div>
          </div>
          <div className="p-4">
            {countryList}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="!w-full !h-14 !max-h-none !rounded-lg !border !border-solid !border-neutral-200 !bg-white !px-4 !font-normal hover:!bg-white focus:!ring-1 focus:!ring-black [&>span]:!w-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex w-full flex-row items-center justify-between">
            <span className="flex-1 min-w-0 truncate text-start text-base text-grayscale-600">{getDisplayText()}</span>
            {isOpen ? (
              <StandaloneChevronUpRegularIcon iconSize="xs" fill="currentColor" className="ms-1.5 shrink-0" />
            ) : (
              <StandaloneChevronDownRegularIcon iconSize="xs" fill="currentColor" className="ms-1.5 shrink-0" />
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-4 
                   w-[var(--radix-popover-trigger-width)] 
                   min-w-[var(--radix-popover-trigger-width)]"
      >
        {countryList}
      </PopoverContent>
    </Popover>
  )
}
