import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowUpRightFromSquare,
  faCheck,
  faCircleInfo,
  faCircleNodes,
  faCircleQuestion,
  faCircleRadiation,
  faCompass,
  faCopy,
  faDownload,
  faDroplet,
  faFaceDizzy,
  faFaceFrownOpen,
  faFaceMeh,
  faFaceSmile,
  faLocationDot,
  faSliders,
  faSoap,
  faSort,
  faStopwatch,
  faTemperatureHigh,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(
  faSort,
  faCircleQuestion,
  faCompass,
  faXmark,
  faCircleInfo,
  faFaceSmile,
  faFaceMeh,
  faFaceFrownOpen,
  faFaceDizzy,
  faDownload,
  faCopy,
  faStopwatch,
  faLocationDot,
  faArrowUpRightFromSquare,
  faSoap,
  faTemperatureHigh,
  faDroplet,
  faCircleNodes,
  faCircleRadiation,
  faSliders,
  faCopy,
  faCheck
);

export function useIcons(app) {
  app.component("font-awesome-icon", FontAwesomeIcon);
}
