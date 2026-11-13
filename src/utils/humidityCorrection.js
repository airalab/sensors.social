// Humidity correction for low-cost optical PM sensors — an estimate shown next to the raw
// readings, never instead of them. Same formula and constants as scripts/calibration.py in
// the sensors.social agent toolkit, so a number on the map matches a number in a post.
//
// κ-Köhler hygroscopic growth (Petters & Kreidenweis 2007) as applied to low-cost sensors by
// Crilley et al. 2018, Atmos. Meas. Tech. 11:709–720:
//     PM_dry = PM_raw / (1 + κ · aw / (1 − aw)),  aw = RH / 100
// κ depends on what the particles are; the PM10/PM2.5 ratio is the in-situ proxy:
// coarse-dominated (dust, sea spray) grows little, fine-dominated (smoke, traffic) a lot.

export const KAPPA_DUST = 0.03;
export const KAPPA_MIXED = 0.3;
export const KAPPA_FINE = 0.5;

// Above this the formula diverges (growth → ∞ as RH → 100%): leave a gap rather than guess.
export const SATURATION_RH = 95;
// The correction is offered only for periods with humid air, where optical sensors read high.
// 75%: around here the salts in particles dissolve (sea salt ~75%, ammonium sulfate ~80%) and
// particles take up water fast; below it the growth is small, while the formula with κ = 0.5
// would already divide readings noticeably.
export const HUMID_RH = 75;

export function pickKappa(pm10, pm25) {
  if (!(pm25 > 0.5) || !(pm10 >= 0)) return KAPPA_FINE;
  const ratio = pm10 / pm25;
  if (ratio > 2.5) return KAPPA_DUST;
  if (ratio < 1.5) return KAPPA_FINE;
  return KAPPA_MIXED;
}

/** Corrected PM, or null when RH is missing or near saturation. */
export function correctForHumidity(pm, rh, kappa) {
  if (!Number.isFinite(pm) || !Number.isFinite(rh)) return null;
  if (rh >= SATURATION_RH) return null;
  if (rh <= 0) return pm;
  const aw = rh / 100;
  return pm / (1 + (kappa * aw) / (1 - aw));
}
