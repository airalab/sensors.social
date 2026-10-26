/**
 * Decodes fires vector tiles off the main thread: a world view is ~70k points, and
 * decoding them on the page froze it for ~0.5 s.
 * Message in: { id, url, tile }; out: { id, fires } or { id, error }.
 */

import { fetchFireTile } from "./decode";

self.onmessage = async ({ data: { id, url, tile } }) => {
  try {
    const fires = await fetchFireTile(url, tile);
    self.postMessage({ id, fires }, [
      fires.lat.buffer,
      fires.lng.buffer,
      fires.frp.buffer,
      fires.time.buffer,
    ]);
  } catch (e) {
    self.postMessage({ id, error: String(e) });
  }
};
