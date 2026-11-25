import { ref, watch } from "vue";
import { timelineFetchBounds } from "@/utils/date";
import {
  areaChoice,
  areaMarkers,
  areasInView,
  feedsConfig,
  feedsLayer,
  loadCatalog,
  markerToSensorRow,
  rankForPrompt,
  setAreaChoice,
  setFeedsLayer,
} from "@/utils/map/feeds";
import { registerFeedStations } from "@/utils/sensorPins";

/** Share of the view at each edge that does not count for the prompt. */
const PROMPT_EDGE = 0.2;

/**
 * Government stations on the map, area by area and only by the visitor's choice (utils/map/feeds):
 * - farther out than FEEDS.minZoom there are none;
 * - closer in, over an area not asked about yet, `prompt` offers to show it;
 * - areas switched on are drawn as sensors of their own kind, reloaded with the map's date.
 *
 * @param {ReturnType<import("./useMap").useMap>} mapState
 * @param {{ mergeFeedRows: Function, dropFeedRows: Function, sensorsLoaded: import("vue").Ref<boolean> }} sensorsUI
 */
export function useFeeds(mapState, sensorsUI) {
  const prompt = ref(null);
  const skippedThisVisit = new Set();
  let lastMap = null;
  let shown = new Set();
  const cache = new Map();

  const enabled = () =>
    !!feedsConfig && feedsLayer.value !== false && mapState.currentProvider.value === "remote";

  function window() {
    const { start, end } = timelineFetchBounds(
      mapState.currentDate.value,
      mapState.timelineMode.value
    );
    const now = Math.floor(Date.now() / 1000);
    return [Number(start), Math.min(Number(end) || now, now)];
  }

  async function show(area) {
    const [from, to] = window();
    const key = `${area.id}:${from}:${to}`;
    try {
      if (!cache.has(key)) cache.set(key, areaMarkers(area.id, from, to));
      const markers = await cache.get(key);
      if (window()[0] !== from) return; // the date moved on while loading
      registerFeedStations(area.feed, markers);
      sensorsUI.mergeFeedRows(
        area.id,
        markers.map((m) => markerToSensorRow(m, area.id))
      );
      shown.add(area.id);
    } catch (e) {
      cache.delete(key);
      console.error(e);
    }
  }

  /** Called on every settled pan/zoom with the Leaflet map. */
  async function onView(map) {
    lastMap = map;
    if (!enabled()) {
      prompt.value = null;
      return;
    }
    if (map.getZoom() < feedsConfig.minZoom) {
      prompt.value = null;
      if (shown.size) {
        sensorsUI.dropFeedRows();
        shown = new Set();
      }
      return;
    }
    const visible = areasInView(await loadCatalog(), map.getBounds());
    for (const area of visible) {
      if (areaChoice(area.id) === "on" && !shown.has(area.id)) void show(area);
    }
    // ask only about an area with stations well inside the view, not just touching its edge
    const inner = map.getBounds().pad(-PROMPT_EDGE);
    const ask = rankForPrompt(
      areasInView(
        visible.filter((a) => areaChoice(a.id) === null && !skippedThisVisit.has(a.id)),
        inner
      ),
      inner
    )[0];
    prompt.value = ask || null;
  }

  function accept() {
    const area = prompt.value;
    if (!area) return;
    setAreaChoice(area.id, "on");
    setFeedsLayer(true);
    prompt.value = null;
    void show(area);
    if (lastMap) void onView(lastMap);
  }

  function decline() {
    const area = prompt.value;
    if (!area) return;
    setAreaChoice(area.id, "off");
    prompt.value = null;
    if (lastMap) void onView(lastMap);
  }

  /** Closed without an answer: ask again on the next visit. */
  function later() {
    if (prompt.value) skippedThisVisit.add(prompt.value.id);
    prompt.value = null;
  }

  // The footer toggle: off hides every government station at once, on brings the chosen areas back
  watch(feedsLayer, (on) => {
    if (on === false) {
      prompt.value = null;
      sensorsUI.dropFeedRows();
      shown = new Set();
    } else if (lastMap) {
      void onView(lastMap);
    }
  });

  // A reload of the sensor list (new date, provider) drops feed rows: draw the shown areas again.
  watch(
    () => sensorsUI.sensorsLoaded.value,
    (loaded) => {
      if (!loaded) return;
      shown = new Set();
      if (lastMap) void onView(lastMap);
    }
  );

  return { prompt, onView, accept, decline, later };
}
