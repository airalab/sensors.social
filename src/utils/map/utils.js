import axios from "axios";

export function getCityByPos(lat, lon, language = "en") {
  return axios
    .get(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=${language}`
    )
    .then((r) => {
      if (r.data.address) {
        if (r.data.address.city) {
          return r.data.address.city;
        } else if (r.data.address.town) {
          return r.data.address.town;
        } else if (r.data.address.state) {
          return r.data.address.state;
        }
      }
      return "";
    })
    .catch(() => {
      return "";
    });
}
export function getAddressByPos(lat, lon, language = "en") {
  return axios
    .get(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=${language}`
    )
    .then((r) => {
      if (r.data.address) {
        const addr = {
          country: r.data.address.country || "",
          address: [],
        };
        if (r.data.address.city) {
          addr.address.push(r.data.address.city);
        } else if (r.data.address.town) {
          addr.address.push(r.data.address.town);
        }
        if (r.data.address.road) {
          addr.address.push(r.data.address.road);
        }
        if (r.data.address.house_number) {
          addr.address.push(r.data.address.house_number);
        }
        return addr;
      }
      return false;
    })
    .catch(() => {
      return false;
    });
}
