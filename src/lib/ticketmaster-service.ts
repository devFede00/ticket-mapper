import type { TicketmasterEventsResponse } from "@/types/ticketmaster";
import { CITY_TO_REGION } from "@/data/italian-cities";

const TICKETMASTER_BASE_URL =
  "https://app.ticketmaster.com/discovery/v2";

export interface EventSearchFilters {
  keyword?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

function convertDateToTicketmasterDateTime(
  date: string,
  endOfDay = false,
): string {
  return endOfDay
    ? `${date}T23:59:59Z`
    : `${date}T00:00:00Z`;
}

function getTodayDateInItaly(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Impossibile determinare la data corrente italiana");
  }

  return `${year}-${month}-${day}`;
}

//CHIAMATA API che restituisce i primi massimi 200 risultati che rispettano i filtri inviati in fase di ricerca
export async function getItalianMusicEvents(
  filters: EventSearchFilters = {},
): Promise<TicketmasterEventsResponse> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  

  if (!apiKey) {
    throw new Error(
      "Variabile TICKETMASTER_API_KEY non configurata",
    );
  }

  const url = new URL(`${TICKETMASTER_BASE_URL}/events.json`);

  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("countryCode", "IT");
  url.searchParams.set("classificationName", "music");
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("size", String(filters.size ?? 12));
  url.searchParams.set("page", String(filters.page ?? 0));

  if (filters.keyword?.trim()) {
    url.searchParams.set("keyword", filters.keyword.trim());
  }

  if (filters.city?.trim()) {
    url.searchParams.set("city", filters.city.trim());
  }

  const effectiveStartDate = filters.startDate ?? getTodayDateInItaly();
  url.searchParams.set("startDateTime",convertDateToTicketmasterDateTime(effectiveStartDate));
  

  if (filters.endDate) {
    url.searchParams.set(
      "endDateTime",
      convertDateToTicketmasterDateTime(
        filters.endDate,
        true,
      ),
    );
  }

  const response = await fetch(url, {
    next: {
      revalidate: 1800,
    },
  });

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(
      `Ticketmaster API error ${response.status}: ${responseBody}`,
    );
  }

  const data =
  (await response.json()) as TicketmasterEventsResponse;

console.log(
  "[Ticketmaster] Risposta completa:",
  data,
);

console.log(
  "[Ticketmaster] Primo evento:",
  data._embedded?.events?.[0],
);

console.log(
  "[Ticketmaster] Prima venue:",
  data._embedded?.events?.[0]
    ?._embedded?.venues?.[0],
);

console.log(
  "[Ticketmaster] Regione prima venue:",
  data._embedded?.events?.[0]
    ?._embedded?.venues?.[0]?.state,
);

return data;
}