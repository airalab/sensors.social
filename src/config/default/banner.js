/**
 * Banner in the strip above the map. It replaces the blog ticker while it is on;
 * with no banner (or outside the dates, or after a visitor closes it) the ticker shows.
 *
 * Keep it for rare moments — a launch, a sale, an outage notice — and set `until`.
 *
 * @property {string} id      - change it for every new banner, so visitors who closed
 *                              an old one still see the new one
 * @property {string} from    - ISO date/time the banner starts (inclusive), optional
 * @property {string} until   - ISO date/time the banner ends (exclusive), optional
 * @property {object} text    - { en, ru } one short line
 * @property {object} cta     - { en, ru } link label, optional
 * @property {string} link    - URL or site path ("/blog/…"), optional
 *
 * Example:
 * export default {
 *   id: "altruist-dual-launch",
 *   from: "2026-11-17",
 *   until: "2026-11-24",
 *   text: { en: "Altruist Dual is out", ru: "Вышел Altruist Dual" },
 *   cta: { en: "See it", ru: "Посмотреть" },
 *   link: "/altruist/dual/",
 * };
 */
export default null;
