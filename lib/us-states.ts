/**
 * 50 states + DC, value = postal code, label = display name.
 * Used by FindRD; keep alphabetical.
 */

export interface USState {
  value: string;
  label: string;
}

export const US_STATES: USState[] = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

/**
 * Maps common IANA US timezones to a best-guess state postal code so we can
 * pre-select something plausible. Timezone-to-state is many-to-many; treat
 * this purely as a default the user can change.
 */
export const TIMEZONE_TO_STATE: Record<string, string> = {
  "America/New_York": "NY",
  "America/Detroit": "MI",
  "America/Indiana/Indianapolis": "IN",
  "America/Kentucky/Louisville": "KY",
  "America/Chicago": "IL",
  "America/Denver": "CO",
  "America/Boise": "ID",
  "America/Phoenix": "AZ",
  "America/Los_Angeles": "CA",
  "America/Anchorage": "AK",
  "America/Juneau": "AK",
  "America/Sitka": "AK",
  "America/Yakutat": "AK",
  "America/Nome": "AK",
  "America/Adak": "AK",
  "Pacific/Honolulu": "HI",
};
