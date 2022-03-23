import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import Queue from "js-queue";
import generate, {
  getColor,
  getColorRGB,
  getColorDarken,
  getColorDarkenRGB,
} from "../../utils/color";
import measurement from "../../utils/measurement";
import sensors from "../../sensors";

const queue = new Queue();
let scale;
let markers;
let handlerClickMarker;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export function init(map, type, cb) {
  handlerClickMarker = cb;
  const scaleParams = measurement(type);
  scale = generate(scaleParams.colors, scaleParams.range);
  markers = new L.MarkerClusterGroup({
    showCoverageOnHover: false,
    // zoomToBoundsOnClick: false,
    maxClusterRadius: 120,
    iconCreateFunction: iconCreate,
  });
  map.addLayer(markers);
}

function iconCreate(cluster) {
  const markers = cluster.getAllChildMarkers();
  const childCount = cluster.getChildCount();
  let sum = 0;
  markers.forEach((marker) => {
    sum += Number(marker.options.data.value);
  });
  if (childCount > 0) {
    sum = sum / childCount;
  }
  const color = getColorRGB(scale, sum);
  const colorBorder = getColorDarkenRGB(scale, sum);
  const isDark = scale(sum).luminance() < 0.4;

  return new L.DivIcon({
    html:
      "<div style='font-weight: bold;color:" +
      (isDark ? "#eee" : "#333") +
      ";background-color: rgba(" +
      color +
      ", 0.7);border-color: rgba(" +
      colorBorder +
      ", 1);border-width: 2px;border-style: solid;border-radius: 18px;'><span>" +
      childCount +
      "</span></div>",
    className: "marker-cluster",
    iconSize: new L.Point(40, 40),
  });
}

function findMarker(sensor_id) {
  return new Promise((resolve) => {
    markers.eachLayer((m) => {
      if (m.options.data.sensor_id === sensor_id) {
        resolve(m);
      }
    });
    resolve(false);
  });
}

function createIconBrand(sensor_id, colorRgb) {
  return L.divIcon({
    html: `<img src="${sensors[sensor_id].icon}" alt="" style="border: 3px solid rgba(${colorRgb}, 0.7);width: 40px; height: 40px; border-radius: 50%;">`,
    iconSize: [40, 40],
    className: "marker-icon",
  });
}

function createIconArrow(dir, speed, color) {
  return L.divIcon({
    className: "",
    html: `<div class="icon-arrow-container" style="transform: rotate(${
      dir + 90
    }deg);">
      <div class="icon-arrow" style="border-color: ${color} ${color} transparent transparent;">
        <div style="background-color: ${color};"></div>
      </div>
      <div class="label-arrow"">${speed} m/s</div>
    </div>`,
    iconSize: new L.Point(40, 40),
  });
}

function createMarkerBrand(coord, data, colors) {
  return L.marker(new L.LatLng(coord[0], coord[1]), {
    icon: createIconBrand(data.sensor_id, colors.rgb),
    data: data,
    typeMarker: "brand",
  });
}

function createMarkerArrow(coord, data, colors) {
  return L.marker(new L.LatLng(coord[0], coord[1]), {
    icon: createIconArrow(data.data.windang, data.data.windspeed, colors.basic),
    data: data,
    typeMarker: "arrow",
  });
}

function createMarkerCircle(coord, data, colors) {
  return L.circleMarker(new L.LatLng(coord[0], coord[1]), {
    radius: 15,
    fillColor: colors.basic,
    color: colors.border,
    weight: 2,
    // opacity: 0.7,
    fillOpacity: 0.7,
    data: data,
    typeMarker: "circle",
  });
}

function createMarker(point, colors) {
  const coord = point.geo.split(",");
  let marker;
  if (sensors[point.sensor_id]) {
    marker = createMarkerBrand(coord, point, colors);
  } else if (point.data.windang) {
    marker = createMarkerArrow(coord, point, colors);
  } else {
    marker = createMarkerCircle(coord, point, colors);
  }
  return marker;
}

function updateMarker(marker, point, colors) {
  if (marker.options.typeMarker === "brand") {
    marker.setIcon(createIconBrand(point.sensor_id, colors.rgb));
  } else if (
    marker.options.typeMarker === "arrow" &&
    Object.prototype.hasOwnProperty.call(point.data, "windang")
  ) {
    marker.setIcon(
      createIconArrow(point.data.windang, point.data.windspeed, colors.basic)
    );
  } else {
    marker.setStyle({
      fillColor: colors.basic,
      color: colors.border,
    });
  }
}

export async function addPoint(point) {
  queue.add(makeRequest.bind(queue, point));
  async function makeRequest(point) {
    if (point.model === 1) {
      console.log(point);
    } else if (point.model === 2) {
      await addMarker(point);
    } else if (point.model === 3) {
      await addMarker(point);
    }
    this.next();
  }
}

async function addMarker(point) {
  const colors = {
    basic: "#a1a1a1",
    border: "#999",
    rgb: [161, 161, 161],
  };
  if (!point.isEmpty) {
    colors.basic = getColor(scale, point.value);
    colors.border = getColorDarken(scale, point.value);
    colors.rgb = getColorRGB(scale, point.value);
  }
  const marker = await findMarker(point.sensor_id);
  if (marker) {
    updateMarker(marker, point, colors);
  } else {
    const marker = createMarker(point, colors);
    marker.on("click", (event) => {
      handlerClickMarker(event.target.options.data);
    });
    markers.addLayer(marker);
  }
}

export function clear() {
  markers.clearLayers();
}
