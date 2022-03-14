import chroma from "chroma-js";

export default function generate(colors, range = [0, 500]) {
  return chroma.scale(colors).domain(range);
}

export function getColor(scale, value) {
  return scale(value).hex();
}

export function getColorDarken(scale, value) {
  return scale(value).darken(1).hex();
}

export function getColorRGB(scale, value) {
  return scale(value).rgb();
}

export function getColorDarkenRGB(scale, value) {
  return scale(value).darken(1).rgb();
}

export function getGradient(scale, value = 8) {
  return scale.colors(value).toString();
}
