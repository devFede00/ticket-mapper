/* =========================================================
 * TIPI CONDIVISI
 * Utilizzati sia dagli eventi sia dai suggerimenti
 * ======================================================= */

export interface TicketmasterImage {
  url: string;
  width: number;
  height: number;
  ratio?: string;
}

export interface TicketmasterVenue {
  id?: string;
  name?: string;

  city?: {
    name?: string;
  };

  state?: {
    name?: string;
    stateCode?: string;
  };

  postalCode?: string;

  country?: {
    name?: string;
    countryCode?: string;
  };

  location?: {
    latitude?: string;
    longitude?: string;
  };
}

export interface TicketmasterClassification {
  primary?: boolean;

  segment?: {
    id?: string;
    name?: string;
  };

  genre?: {
    id?: string;
    name?: string;
  };

  subGenre?: {
    id?: string;
    name?: string;
  };
}

/* =========================================================
 * EVENTI MOSTRATI DAL SITO
 * Endpoint: /discovery/v2/events
 * ======================================================= */

export interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  images?: TicketmasterImage[];
  classifications?: TicketmasterClassification[];

  dates: {
    start: {
      localDate: string;
      localTime?: string;
      dateTime?: string;
    };

    status?: {
      code?: string;
    };
  };

  _embedded?: {
    venues?: TicketmasterVenue[];
  };
}

export interface TicketmasterPage {
  size: number;
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface TicketmasterEventsResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };

  page?: TicketmasterPage;
}

/**
 * Risposta normalizzata restituita dalla tua API interna
 * ai componenti React.
 */
export interface EventsApiResponse {
  events: TicketmasterEvent[];
  pagination: TicketmasterPage | null;
}

/* =========================================================
 * SUGGERIMENTI DELLA BARRA DI RICERCA
 * Endpoint: /discovery/v2/suggest
 * ======================================================= */

export interface TicketmasterAttraction {
  id: string;
  name: string;
  url?: string;
  images?: TicketmasterImage[];
  classifications?: TicketmasterClassification[];
}

/**
 * Nell'endpoint /suggest un evento può includere anche
 * le attraction associate.
 *
 * TicketmasterEvent rimane invariato per la parte principale
 * del sito.
 */
export interface TicketmasterSuggestEvent
  extends TicketmasterEvent {
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: TicketmasterAttraction[];
  };
}

export interface TicketmasterSuggestResponse {
  _embedded?: {
    attractions?: TicketmasterAttraction[];
    events?: TicketmasterSuggestEvent[];
    venues?: TicketmasterVenue[];
  };
}
 * CLASSIFICAZIONI E GENERI
 * Endpoint: /discovery/v2/classifications
 * ======================================================= */

export interface TicketmasterGenre {
  id?: string;
  name?: string;

  _embedded?: {
    subgenres?: Array<{
      id?: string;
      name?: string;
    }>;
  };
}

export interface TicketmasterClassificationNode {
  segment?: {
    id?: string;
    name?: string;

    _embedded?: {
      genres?: TicketmasterGenre[];
    };
  };
}

export interface TicketmasterClassificationsResponse {
  _embedded?: {
    classifications?: TicketmasterClassificationNode[];
  };
}

/**
 * Formato normalizzato restituito al frontend.
 */
export interface GenreOption {
  id: string;
  name: string;
}

export interface GenresApiResponse {
  genres: GenreOption[];
}
