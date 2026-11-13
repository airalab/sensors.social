// schema.org JSON-LD for search engines. Built from data the pages already show, so the
// markup never claims more than the page does.
import { toValue } from "vue";
import { useHead } from "@vueuse/head";

import { settings } from "@config";
import { returnPolicy, shippingZones } from "@config/shopTerms";

export const SITE_URL = settings?.SITE_URL || "https://sensors.social";

// Absolute address with the trailing slash GitHub Pages serves pages under.
export function pageUrl(path) {
  const withSlash = path.endsWith("/") ? path : `${path}/`;
  return SITE_URL + withSlash;
}

export function absoluteUrl(src) {
  if (!src) return undefined;
  if (/^https?:\/\//.test(src)) return src;
  return SITE_URL + (src.startsWith("/") ? src : `/${src}`);
}

export const organization = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "sensors.social",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/app-icon-512.png`,
  sameAs: ["https://x.com/SensorsSocial", "https://github.com/airalab/sensors.social"],
};

export const website = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "sensors.social",
  url: `${SITE_URL}/`,
  publisher: { "@id": organization["@id"] },
};

// "€210" → "210"
export function priceValue(price) {
  return String(price)
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");
}

// Puts one schema.org JSON-LD block into <head>; prerender keeps it in the static HTML.
// `source` is a node, an array of nodes, a ref or a getter; null renders nothing.
export function useStructuredData(source) {
  useHead({
    script: () => {
      const data = toValue(source);
      if (!data) return [];
      const graph = Array.isArray(data) ? data : [data];
      // "</" inside a string would close the script tag early.
      const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(
        /</g,
        "\\u003c"
      );
      return [{ type: "application/ld+json", key: "structured-data", innerHTML: json }];
    },
  });
}

// Offer for an Altruist sold on cyberpunks.shop: price, stock, delivery rates and the
// EU/EEA return window, all from the shop's own terms.
export function shopOffer(product) {
  return {
    "@type": "Offer",
    price: priceValue(product.price),
    priceCurrency: "EUR",
    url: product.shop,
    availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    shippingDetails: shippingZones.map((zone) => ({
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: zone.price, currency: "EUR" },
      shippingDestination: zone.countries.map((country) => ({
        "@type": "DefinedRegion",
        addressCountry: country,
      })),
    })),
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: returnPolicy.countries,
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: returnPolicy.days,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    },
  };
}
