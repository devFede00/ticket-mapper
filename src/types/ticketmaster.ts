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

export interface EventsApiResponse {
  events: TicketmasterEvent[];
  pagination: TicketmasterPage | null;
}