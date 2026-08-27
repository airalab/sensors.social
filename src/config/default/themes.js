const attrs = {
  attribution:
    '&copy; <a rel="nofollow" href="https://osm.org/copyright">OpenStreetMap</a> contributors',
};

/*
  CARTO raster basemaps are watermarked ("API KEY REQUIRED") unless the tile
  request carries a key. A key is free (5M tile requests per month) and needs no
  CARTO account: https://carto.com/basemaps/apikey
  Put it in .env as VITE_CARTO_API_KEY to drop the watermark; without it the
  tiles still load, just watermarked.
*/
const CARTO_KEY = (import.meta.env?.VITE_CARTO_API_KEY || "").trim();
const cartoUrl = (style) =>
  `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png` +
  (CARTO_KEY ? `?key=${encodeURIComponent(CARTO_KEY)}` : "");

/*
  Public basemap themes registry.
  Each key can be referenced from settings.MAP.theme.{light,dark}.
  Users can also define their own custom themes in config.
*/
const THEMES = {
  // Classic OpenStreetMap style (default community tiles)
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: { ...attrs, subdomains: "abc" },
  },

  // CARTO light basemap (clean light background, good for overlays)
  "carto-light": {
    url: cartoUrl("light_all"),
    options: {
      ...attrs,
      subdomains: "abcd",
      attribution:
        attrs.attribution + ' | &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },

  // CARTO dark basemap (dark background, useful for dashboards/night mode)
  "carto-dark": {
    url: cartoUrl("dark_all"),
    options: {
      ...attrs,
      subdomains: "abcd",
      attribution:
        attrs.attribution + ' | &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },

  // OpenTopoMap (topographic map with terrain shading, contour lines, hiking trails)
  opentopomap: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    options: {
      subdomains: "abc",
      attribution:
        'Map data: OSM & SRTM | Style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    },
  },

  // Esri World Imagery (satellite imagery basemap)
  "esri-imagery": {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, & others",
    },
  },

  // Esri World Topographic Map — detailed topographic basemap
  // showing relief, land use, and reference information.
  "esri-topo": {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    options: (noWrap) => ({
      ...attrs,
      noWrap,
      attribution: "Tiles &copy; Esri — Esri, USGS, NOAA, & others",
    }),
  },

  // CyclOSM — an OpenStreetMap-based basemap optimized for cyclists.
  // Highlights cycle paths, bike lanes, and bicycle-related infrastructure.
  cyclosm: {
    url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    options: (noWrap) => ({ ...attrs, subdomains: "abc", noWrap }),
  },
};

export default THEMES;
