"use client"

import { useState, useRef, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { CHECKBOX_LABEL_ROW } from "@/lib/rtl"
import { useTranslations } from "@/lib/i18n/use-translations"

interface Country {
  code: string
  name: string
}

interface CountrySelectionProps {
  countries: Country[]
  selectedCountries: string[]
  onCountriesChange: (countries: string[]) => void
}

export default function CountrySelection({ countries, selectedCountries, onCountriesChange }: CountrySelectionProps) {
  const { t } = useTranslations()
  const isMobile = useIsMobile()
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number>(0)

  const filteredCountries = countries.filter((country) => country.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const isAllSelected = selectedCountries.length === 0

  const handleCountryToggle = (countryCode: string) => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop
    }

    if (selectedCountries.length === 0) {
      onCountriesChange([countryCode])
    } else if (selectedCountries.includes(countryCode)) {
      const newSelection = selectedCountries.filter((code) => code !== countryCode)
      onCountriesChange(newSelection.length === 0 ? [] : newSelection)
    } else {
      onCountriesChange([...selectedCountries, countryCode])
    }
  }

  const handleAllToggle = (checked: boolean | string) => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop
    }

    if (checked) {
      onCountriesChange([])
    } else {
      onCountriesChange([])
    }
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
    return `${t("common.selectedCount")} (${selectedCountries.length})`
  }

  const CountryList = () => (
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder={t("common.search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`text-base text-start ps-4 h-8 border-grayscale-500 focus:border-grayscale-500 bg-grayscale-500 rounded-lg ${searchTerm ? "pe-10" : "pe-4"}`}
          autoComplete="off"
          autoFocus
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm("")}
            className="absolute end-0 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
          >
            <Image src="/icons/clear-search-icon.png" alt={t("common.clearSearch")} width={24} height={24} />
          </Button>
        )}
      </div>

      <div ref={scrollContainerRef} className="space-y-4 px-1 max-h-[300px] md:max-h-[240px] overflow-y-auto" data-testid="ad-form-list-countries">
        <div className={cn(CHECKBOX_LABEL_ROW, "mb-1")}>
          <Checkbox
            id="all-countries"
            checked={isAllSelected}
            onCheckedChange={handleAllToggle}
            className="shrink-0 data-[state=checked]:bg-black"
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
              checked={selectedCountries.includes(country.code)}
              onCheckedChange={() => handleCountryToggle(country.code)}
              disabled={false}
              className="shrink-0 data-[state=checked]:bg-black"
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
        <div className="relative">
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-[56px] max-h-none justify-start rounded-lg bg-transparent border-input hover:bg-transparent focus:border-black font-normal ps-4 pe-12 py-4 [&>svg]:hidden"
              onClick={() => setIsOpen(true)}
            >
              <span className="text-start text-base text-grayscale-600">{getDisplayText()}</span>
            </Button>
          </DrawerTrigger>
          <div className="absolute end-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Image
              src="/icons/chevron-down.png"
              alt={t("common.arrow")}
              width={24}
              height={24}
              className={cn("transition-transform", isOpen && "rotate-180")}
            />
          </div>
        </div>
        <DrawerContent side="bottom" className="h-fit">
          <div className="my-4">
            <h3 className="text-xl font-bold text-center">{t("common.countrySelection")}</h3>
            <div className="text-base text-center opacity-72 mt-2">{t("adForm.countrySelectionSubtitle")}</div>
          </div>
          <div className="p-4">
            <CountryList />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-[56px] max-h-none justify-start rounded-lg bg-transparent border-input hover:bg-transparent focus:border-black font-normal ps-4 pe-12 py-4 [&>svg]:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="text-start text-base text-grayscale-600">{getDisplayText()}</span>
          </Button>
        </PopoverTrigger>
        <div className="absolute end-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Image
            src="/icons/chevron-down.png"
            alt={t("common.arrow")}
            width={24}
            height={24}
            className={cn("transition-transform", isOpen && "rotate-180")}
          />
        </div>
      </div>
      <PopoverContent
        align="start"
        className="p-4 
                   w-[var(--radix-popover-trigger-width)] 
                   min-w-[var(--radix-popover-trigger-width)]"
      >
        <CountryList />
      </PopoverContent>
    </Popover>
  )
}
