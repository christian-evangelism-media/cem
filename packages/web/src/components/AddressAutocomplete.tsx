import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Input, Loading } from 'asterui'

interface MapboxFeature {
  id: string
  place_name: string
  text: string
  address?: string
  context?: Array<{ id: string; text: string; short_code?: string }>
  center: [number, number]
}

interface ParsedAddress {
  streetAddress: string
  streetAddress2?: string
  city: string
  province?: string
  postalCode?: string
  country: string
  countryCode: string
}

interface AddressAutocompleteProps {
  onSelect: (address: ParsedAddress) => void
  defaultValue?: string
  placeholder?: string
  className?: string
}

export default function AddressAutocomplete({
  onSelect,
  defaultValue = '',
  placeholder,
  className = '',
}: AddressAutocompleteProps) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    // Debounce API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true)

      try {
        const token = import.meta.env.VITE_MAPBOX_TOKEN
        if (!token) {
          console.error('Mapbox token not found. Please add VITE_MAPBOX_TOKEN to your .env file')
          setIsLoading(false)
          return
        }

        // Use current language for results
        const language = i18n.language.split('-')[0]

        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
            `access_token=${token}&` +
            `types=address&` +
            `language=${language}&` +
            `limit=5`
        )

        const data = await response.json()
        setSuggestions(data.features || [])
        setShowDropdown(true)
      } catch (error) {
        console.error('Mapbox geocoding error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query, i18n.language])

  const parseAddress = (feature: MapboxFeature): ParsedAddress => {
    const context = feature.context || []

    // Extract components from Mapbox response
    const address: ParsedAddress = {
      streetAddress: feature.address
        ? `${feature.address} ${feature.text}`
        : feature.place_name.split(',')[0],
      city: context.find((c) => c.id.startsWith('place'))?.text || '',
      province: context.find((c) => c.id.startsWith('region'))?.text || '',
      postalCode: context.find((c) => c.id.startsWith('postcode'))?.text || '',
      country: context.find((c) => c.id.startsWith('country'))?.text || '',
      countryCode:
        context.find((c) => c.id.startsWith('country'))?.short_code?.toUpperCase() || '',
    }

    return address
  }

  const handleSelect = (feature: MapboxFeature) => {
    const address = parseAddress(feature)
    setQuery(feature.place_name)
    setSuggestions([])
    setShowDropdown(false)
    onSelect(address)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        type="text"
        className={`w-full ${className}`}
        placeholder={placeholder || t('address.searchPlaceholder') || 'Start typing your address...'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
      />

      {isLoading && (
        <div className="absolute end-3 top-1/2 -translate-y-1/2">
          <Loading size="sm" type="spinner" />
        </div>
      )}

      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((feature) => (
            <li key={feature.id}>
              <button
                type="button"
                className="w-full text-start px-4 py-2 hover:bg-base-200 cursor-pointer transition-colors"
                onClick={() => handleSelect(feature)}
              >
                <div className="font-medium">{feature.place_name}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
