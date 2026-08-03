import type { GenreOption, TicketmasterClassificationsResponse, TicketmasterEventsResponse, TicketmasterGenre, TicketmasterSuggestResponse } from "@/types/ticketmaster-dto";
import { CITY_TO_REGION } from "@/data/italian-cities";

const TICKETMASTER_BASE_URL =
  "https://app.ticketmaster.com/discovery/v2";

const apiKey = process.env.TICKETMASTER_API_KEY;

//Interfaccia per contenere i parametri di ricerca disponibili
export interface EventSearchFilters {
  keyword?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  genreId?: string;
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

  if (filters.genreId?.trim()) {
    url.searchParams.set("genreId", filters.genreId.trim());
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

//CHIAMATA API che richiama i primi 5 elementi che rispettano la parola chiave inserita in ricerca
export async function fetchSuggestions(
  keyword: string,
  signal?: AbortSignal,
): Promise<TicketmasterSuggestResponse> {
  const normalizedKeyword = keyword.trim();

  if (normalizedKeyword.length < 2) {
    return {};
  }
   const url = new URL(`${TICKETMASTER_BASE_URL}/suggest.json`);

  if (!apiKey) {
    throw new Error(
      "Variabile TICKETMASTER_API_KEY non configurata",
    );
  }

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
  
export async function getMusicGenres(): Promise<GenreOption[]> {
const apiKey = process.env.TICKETMASTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Variabile TICKETMASTER_API_KEY non configurata",
    );
  }
 const url = new URL(
    `${TICKETMASTER_BASE_URL}/classifications.json`,
  );

  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("locale", "*");
  url.searchParams.set("size", "200");
  url.searchParams.set("sort", "name,asc");

  const response = await fetch(url, {
    next: {
      revalidate: 86400,
    },
  });

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(
      `Ticketmaster classifications error ${response.status}: ${responseBody}`,
    );
  }

  const data =
    (await response.json()) as TicketmasterClassificationsResponse;

  const musicClassification =
    data._embedded?.classifications?.find(
      ({ segment }) =>
        segment?.name?.trim().toLowerCase() === "music",
    );

  const genres =
    musicClassification?.segment?._embedded?.genres ?? [];

  return genres
    .filter(
      (genre): genre is TicketmasterGenre & {
        id: string;
        name: string;
      } => Boolean(genre.id && genre.name),
    )
    .map(({ id, name }) => ({
      id,
      name,
    }))
    .sort((first, second) =>
      first.name.localeCompare(second.name, "it", {
        sensitivity: "base",
      }),
    );
}