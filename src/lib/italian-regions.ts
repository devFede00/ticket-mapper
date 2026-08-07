import { REGION_ALIASES } from "@/data/italian-regions"

import { CITY_TO_REGION } from "@/data/italian-cities";

function normalizeCity(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("it-IT")
    .trim();
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("it-IT")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ");
}

export function getRegionFromCity(
  city?: string,
): string | null {
  if (!city) {
    return null;
  }

  return CITY_TO_REGION[normalizeCity(city)] ?? null;
}

export function normalizeItalianRegion(
  value?: string,
): string | null {
  if (!value) {
    return null;
  }

  const normalized = normalizeText(value);

  return REGION_ALIASES[normalized] ?? null;
}