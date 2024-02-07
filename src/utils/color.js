import chroma from "chroma-js";
import { states as statesDefault } from "../measurements/tools";

export default function generate(colors, range = [0, 500]) {
  return chroma.scale(colors).classes([...range, range[range.length - 1] + 1]);
}

export function getColor(scale, value) {
  return scale(Number(value)).hex();
}

export function getColorDarken(scale, value) {
  return scale(Number(value)).darken(1).hex();
}

export function getColorRGB(scale, value) {
  return scale(Number(value)).rgb();
}

export function getColorDarkenRGB(scale, value) {
  return scale(Number(value)).darken(1).rgb();
}

export function getState(scale, value, states = statesDefault) {
  if (scale) {
    const colors = scale.colors();
    const color = getColor(scale, value);
    const index = colors.findIndex((item) => item === color);
    if (states[index]) {
      return states[index];
    }
  }
  return states[states.length - 1];
}
