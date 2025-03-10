export interface CountryData {
  name: string;
  code: string;
  dial_code: string;
  flag: string;
}

export const countryData: CountryData[] = [
  {
    name: "Afghanistan",
    code: "AF",
    dial_code: "+93",
    flag: "🇦🇫",
  },
  {
    name: "India",
    code: "IN",
    dial_code: "+91",
    flag: "🇮🇳",
  },
  {
    name: "United States",
    code: "US",
    dial_code: "+1",
    flag: "🇺🇸",
  },
  {
    name: "United Kingdom",
    code: "GB",
    dial_code: "+44",
    flag: "🇬🇧",
  },
  {
    name: "Australia",
    code: "AU",
    dial_code: "+61",
    flag: "🇦🇺",
  },
  {
    name: "Canada",
    code: "CA",
    dial_code: "+1",
    flag: "🇨🇦",
  },
  {
    name: "China",
    code: "CN",
    dial_code: "+86",
    flag: "🇨🇳",
  },
  {
    name: "Germany",
    code: "DE",
    dial_code: "+49",
    flag: "🇩🇪",
  },
  {
    name: "Japan",
    code: "JP",
    dial_code: "+81",
    flag: "🇯🇵",
  },
  {
    name: "Singapore",
    code: "SG",
    dial_code: "+65",
    flag: "🇸🇬",
  },
  {
    name: "United Arab Emirates",
    code: "AE",
    dial_code: "+971",
    flag: "🇦🇪",
  },
  {
    name: "France",
    code: "FR",
    dial_code: "+33",
    flag: "🇫🇷",
  },
  {
    name: "Spain",
    code: "ES",
    dial_code: "+34",
    flag: "🇪🇸",
  },
  {
    name: "Italy",
    code: "IT",
    dial_code: "+39",
    flag: "🇮🇹",
  },
  {
    name: "Brazil",
    code: "BR",
    dial_code: "+55",
    flag: "🇧🇷",
  },
  // Add more countries as needed
];

// Set India as default for Ashoka University
export const defaultCountry =
  countryData.find((country) => country.code === "IN") || countryData[0];
