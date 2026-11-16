// Delivery and return terms of cyberpunks.shop, where the Altruist "Buy" buttons lead.
// Used only for search-engine markup on the /altruist/<model>/ pages.
// Mirrors https://cyberpunks.shop/en/delivery and
// https://cyberpunks.shop/en/terms-and-conditions (section 7) as of 13 Nov 2026 —
// update together with the shop.

// Cheapest service per delivery zone: price in EUR and the shop's door-to-door delivery
// time in days for that same service. Express-only zones list the express service.
export const shippingZones = [
  { days: [1, 3], price: 0, countries: ["CY"] },
  { days: [4, 10], price: 0, countries: ["BE", "FR", "DE", "GR", "IT", "LU", "MC", "NL"] },
  {
    days: [7, 13],
    price: 4.99,
    countries: ["AT", "BG", "CZ", "DK", "FI", "HU", "IE", "PL", "PT", "RO", "SK", "ES", "SE"],
  },
  { days: [9, 12], price: 9.99, countries: ["EE", "LV", "LT", "SI"] },
  { days: [8, 11], price: 19.99, countries: ["HR", "MT"] },
  { days: [8, 16], price: 14.99, countries: ["AL", "BA", "MD", "ME", "RS"] },
  { days: [16, 18], price: 24.99, countries: ["GE"] },
  { days: [2, 3], price: 14.99, countries: ["GB"] },
  { days: [3, 5], price: 19.99, countries: ["LI", "NO", "CH"] },
  { days: [3, 5], price: 24.99, countries: ["HK", "ID", "JP", "PH", "SG", "TW", "TH", "VN"] },
  { days: [5, 9], price: 24.99, countries: ["IL", "MY", "KR"] },
  { days: [10, 20], price: 24.99, countries: ["AM", "AZ"] },
  { days: [14, 24], price: 34.99, countries: ["KZ", "KG", "UZ"] },
  { days: [8, 10], price: 9.99, countries: ["CA"] },
  { days: [8, 10], price: 14.99, countries: ["US"] },
  { days: [9, 14], price: 24.99, countries: ["MA", "TN"] },
  { days: [6, 8], price: 34.99, countries: ["ZA"] },
  { days: [11, 13], price: 29.99, countries: ["AU"] },
  { days: [8, 10], price: 34.99, countries: ["NZ"] },
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
