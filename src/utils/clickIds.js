// Google Ads click identifiers and UTM tags that must follow a visitor from a landing page
// to cyberpunks.shop, where the purchase is measured. sensors.social carries no Google tags,
// so the shop link is the only way the click reaches the conversion.
//
// The function is self-contained on purpose: vite.config.js inlines its source into the
// prerendered landing pages, which load without the app bundle.
export function withClickIds(href, search) {
  var params = new URLSearchParams(search || "");
  var url = new URL(href);
  params.forEach(function (value, key) {
    if (key === "gclid" || key === "gbraid" || key === "wbraid" || key.indexOf("utm_") === 0) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}
