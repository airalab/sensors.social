// Delivery and return terms of cyberpunks.shop, where the Altruist "Buy" buttons lead.
// Used only for search-engine markup on the /altruist/<model>/ pages.
// Mirrors https://cyberpunks.shop/en/delivery and
// https://cyberpunks.shop/en/terms-and-conditions (section 7) as of 13 Nov 2026 —
// update together with the shop.

// Cheapest service per delivery zone, EUR. Express-only zones list the express price.
export const shippingZones = [
  { price: 0, countries: ["CY"] },
  { price: 0, countries: ["BE", "FR", "DE", "GR", "IT", "LU", "MC", "NL"] },
  {
    price: 4.99,
    countries: ["AT", "BG", "CZ", "DK", "FI", "HU", "IE", "PL", "PT", "RO", "SK", "ES", "SE"],
  },
  { price: 9.99, countries: ["EE", "LV", "LT", "SI"] },
  { price: 19.99, countries: ["HR", "MT"] },
  { price: 14.99, countries: ["AL", "BA", "MD", "ME", "RS"] },
  { price: 24.99, countries: ["GE"] },
  { price: 14.99, countries: ["GB"] },
  { price: 19.99, countries: ["LI", "NO", "CH"] },
  { price: 24.99, countries: ["HK", "ID", "JP", "PH", "SG", "TW", "TH", "VN"] },
  { price: 24.99, countries: ["IL", "MY", "KR"] },
  { price: 24.99, countries: ["AM", "AZ"] },
  { price: 34.99, countries: ["KZ", "KG", "UZ"] },
  { price: 9.99, countries: ["CA"] },
  { price: 14.99, countries: ["US"] },
  { price: 24.99, countries: ["MA", "TN"] },
  { price: 34.99, countries: ["ZA"] },
  { price: 29.99, countries: ["AU"] },
  { price: 34.99, countries: ["NZ"] },
];

// Right of withdrawal for EU/EEA consumers: 14 days, returned by post at the buyer's cost.
export const returnPolicy = {
  days: 14,
  countries: [
    "AT",
    "BE",
    "BG",
    "HR",
    "CY",
    "CZ",
    "DK",
    "EE",
    "FI",
    "FR",
    "DE",
    "GR",
    "HU",
    "IE",
    "IT",
    "LV",
    "LT",
    "LU",
    "MT",
    "NL",
    "PL",
    "PT",
    "RO",
    "SK",
    "SI",
    "ES",
    "SE",
    "IS",
    "LI",
    "NO",
  ],
};
