const REGION_ALIASES: Record<string, string> = {
  abruzzo: "Abruzzo",
  apulia: "Puglia",
  puglia: "Puglia",
  basilicata: "Basilicata",
  calabria: "Calabria",
  campania: "Campania",

  "emilia-romagna": "Emilia-Romagna",
  "emilia romagna": "Emilia-Romagna",

  "friuli-venezia giulia": "Friuli-Venezia Giulia",
  "friuli venezia giulia": "Friuli-Venezia Giulia",

  lazio: "Lazio",
  liguria: "Liguria",

  lombardia: "Lombardia",
  lombardy: "Lombardia",

  marche: "Marche",
  "the marches": "Marche",

  molise: "Molise",

  piemonte: "Piemonte",
  piedmont: "Piemonte",

  sardegna: "Sardegna",
  sardinia: "Sardegna",

  sicilia: "Sicilia",
  sicily: "Sicilia",

  toscana: "Toscana",
  tuscany: "Toscana",

  "trentino-alto adige": "Trentino-Alto Adige",
  "trentino alto adige": "Trentino-Alto Adige",
  "trentino-south tyrol": "Trentino-Alto Adige",
  "trentino south tyrol": "Trentino-Alto Adige",

  umbria: "Umbria",

  "valle d'aosta": "Valle d'Aosta",
  "valle d’aosta": "Valle d'Aosta",
  "aosta valley": "Valle d'Aosta",

  veneto: "Veneto",
};

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