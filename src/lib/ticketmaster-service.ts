import type { TicketmasterEventsResponse, TicketmasterSuggestResponse } from "@/types/ticketmaster-dto";

const TICKETMASTER_BASE_URL =
  "https://app.ticketmaster.com/discovery/v2";

//Interfaccia per contenere i parametri di ricerca disponibili
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

  if (filters.startDate) {
    url.searchParams.set(
      "startDateTime",
      convertDateToTicketmasterDateTime(filters.startDate),
    );
  }

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

  console.debug("[Ticketmaster] Risposta completa:",data);

  console.debug("[Ticketmaster] Primo evento:",data._embedded?.events?.[0]);

return data;
}

//CHIAMATA API che richiama i primi 5 elementi che rispettano la parola chiave inserita in ricerca
export async function fetchSuggestions(
  keyword: string,
  signal?: AbortSignal,
): Promise<TicketmasterSuggestResponse> {
  const normalizedKeyword = keyword.trim();

  if (normalizedKeyword.length < 2) {
    return {};
  }

  const apiKey = process.env.TICKETMASTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Variabile TICKETMASTER_API_KEY non configurata",
    );
  }

  const url = new URL(`${TICKETMASTER_BASE_URL}/suggest.json`);

  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("countryCode", "IT");
  url.searchParams.set("locale", "*");
  url.searchParams.set("resource", "attractions,events,venues");
  url.searchParams.set("keyword", normalizedKeyword);
  url.searchParams.set("size", "5");

  const response = await fetch(url,{ signal });

  if (!response.ok) {
    throw new Error(
      `Ticketmaster suggest error: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as TicketmasterSuggestResponse;
}




