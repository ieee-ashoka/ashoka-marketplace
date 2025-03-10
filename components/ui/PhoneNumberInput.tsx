"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Input, Autocomplete, AutocompleteItem } from "@heroui/react";
import { countryData, defaultCountry } from "@/utils/countryData";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
  required?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  error,
  id = "phone",
  required = false,
}: PhoneInputProps) {
  // Reference to track if change is internal vs external
  const isInternalChange = useRef(false);

  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [phoneNumber, setPhoneNumber] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Format the countries for the autocomplete component
  const formattedCountries = useMemo(() => {
    return countryData.map((country) => ({
      label: `${country.flag} ${country.name} (${country.dial_code})`,
      value: country.code,
      ...country,
    }));
  }, []);

  // Handle external value changes
  useEffect(() => {
    if (!value) {
      setPhoneNumber("");
      return;
    }

    // Find matching country code
    for (const country of countryData) {
      if (value.startsWith(country.dial_code)) {
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.dial_code.length).trim());
        return;
      }
    }

    // No country code found, use as-is
    setPhoneNumber(value);
  }, [value]);

  // Handle country selection
  const handleCountryChange = (countryCode: string) => {
    const country =
      countryData.find((c) => c.code === countryCode) || defaultCountry;
    setSelectedCountry(country);

    // Focus the input after country selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);

    // Notify parent about the change
    isInternalChange.current = true;
    onChange(`${country.dial_code}${phoneNumber}`.replace(/\s/g, ""));
  };

  // Handle phone number input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits and spaces
    const cleaned = e.target.value.replace(/[^\d\s]/g, "");
    setPhoneNumber(cleaned);

    // Notify parent about the change
    isInternalChange.current = true;
    onChange(`${selectedCountry.dial_code}${cleaned}`.replace(/\s/g, ""));
  };

  return (
    <div>
      <div className="grid grid-cols-12 gap-2">
        {/* Country Code Autocomplete */}
        <div className="col-span-5 sm:col-span-4">
          <Autocomplete
            defaultItems={formattedCountries}
            label=""
            placeholder="Country"
            defaultSelectedKey={selectedCountry.code}
            onSelectionChange={(key) => handleCountryChange(key as string)}
            className="w-full"
            isClearable={false}
          >
            {(item) => (
              <AutocompleteItem
                key={item.code}
                textValue={item.name + " " + item.dial_code}
              >
                <div className="flex items-center">
                  <span className="text-lg mr-2">{item.flag}</span>
                  <div className="flex flex-col">
                    <span className="text-xs truncate">{item.name}</span>
                    <span className="text-tiny text-default-400">
                      {item.dial_code}
                    </span>
                  </div>
                </div>
              </AutocompleteItem>
            )}
          </Autocomplete>
        </div>

        {/* Phone Number Input */}
        <div className="col-span-7 sm:col-span-8">
          <Input
            id={id}
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="Phone number"
            className="w-full"
            variant="bordered"
            required={required}
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
