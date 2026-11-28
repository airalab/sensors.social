// An ad click (gclid, gbraid, wbraid, utm_*) usually lands on one page — an article — and the
// visitor reaches cyberpunks.shop a few pages later. The app keeps the landing query in memory,
// nothing is stored in the browser, and adds it to any link to the shop at the moment it is used.
import { withClickIds } from "@/utils/clickIds";

const landingSearch = window.location.search;
const SHOP = /(^|\.)cyberpunks\.shop$/;

function decorate(event) {
  const a = event.target.closest && event.target.closest("a[href]");
  if (!a || !SHOP.test(a.hostname)) return;
  a.href = withClickIds(a.href, landingSearch);
}

export function carryClickIdsToShop() {
  if (!landingSearch) return;
  // pointerdown and keydown come before the browser follows the link: left, middle and
  // right click, and Enter on a focused link
  document.addEventListener("pointerdown", decorate, true);
  document.addEventListener("keydown", (e) => e.key === "Enter" && decorate(e), true);
}
