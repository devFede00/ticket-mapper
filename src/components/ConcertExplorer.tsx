"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  EventsApiResponse,
  GenreOption,
  GenresApiResponse,
  TicketmasterEvent,
  TicketmasterPage,
} from "@/types/ticketmaster-dto";

import ItalyEventsMap from "./ItalyEventsMap";

import EventCard from "./EventCard";
import ThemeToggle from "./ThemeToggle";
import SearchAutocomplete from "./SearchSuggestions";

import { ExternalLink, Grid3X3, Info, LibraryBig, List, Map, Search } from "lucide-react";
interface Filters {
  keyword: string;
  city: string;
  genreId: string;
  startDate: string;
  endDate: string;
}

const INITIAL_FILTERS: Filters = {
  keyword: "",
  city: "",
  genreId: "",
  startDate: "",
  endDate: "",
};

type ViewMode = "grid" | "list" | "map";

function formatEventDate(date: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatEventTime(time?: string): string | null {
  return time ? time.slice(0, 5) : null;
}

function getEventGenre(event: TicketmasterEvent): string {
  return (
    event.classifications?.find((classification) => classification.primary)
      ?.genre?.name ??
    event.classifications?.[0]?.genre?.name ??
    "Non disponibile"
  );
}

function buildQueryString(filters: Filters, page: number): string {
  const params = new URLSearchParams();

  if (filters.keyword.trim()) {
    params.set("keyword", filters.keyword.trim());
  }

  if (filters.city.trim()) {
    params.set("city", filters.city.trim());
  }

  if (filters.genreId) {
    params.set("genreId", filters.genreId);
  }

  if (filters.startDate) {
    params.set("startDate", filters.startDate);
  }

  if (filters.endDate) {
    params.set("endDate", filters.endDate);
  }

  params.set("page", String(page));

  return params.toString();
}

function getItalianDateOffset(offsetDays = 0, now = new Date()): string {
  const italianDate = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Europe/Rome",
    }),
  );

  italianDate.setDate(italianDate.getDate() + offsetDays);

  const year = italianDate.getFullYear();
  const month = String(italianDate.getMonth() + 1).padStart(2, "0");
  const day = String(italianDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function ConcertExplorer() {
  const [formFilters, setFormFilters] = useState<Filters>(INITIAL_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState<Filters>(INITIAL_FILTERS);

  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const [events, setEvents] = useState<TicketmasterEvent[]>([]);

  const [pagination, setPagination] = useState<TicketmasterPage | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = getItalianDateOffset(0);
  const tomorrow = getItalianDateOffset(1);

  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [genresLoading, setGenresLoading] = useState(false);
  const [genresError, setGenresError] = useState(false);

  const loadEvents = useCallback(async (filters: Filters, page: number) => {
    setLoading(true);
    setError(null);

    try {
      const query = buildQueryString(filters, page);
      const requestUrl = `/api/events?${query}`;

      console.groupCollapsed(
        `[ConcertExplorer] Richiesta eventi - pagina ${page}`,
      );

      console.log("URL:", requestUrl);
      console.log("Filtri:", filters);

      const response = await fetch(requestUrl);

      console.log("HTTP status:", response.status);
      console.log("HTTP ok:", response.ok);

      if (!response.ok) {
        const errorBody = await response.text();

        console.error("Risposta errore:", errorBody);
        console.groupEnd();

        throw new Error(`Errore HTTP ${response.status}: ${errorBody}`);
      }

      const data = (await response.json()) as EventsApiResponse;

      console.log("Risposta completa:", data);
      console.log("Numero eventi ricevuti:", data.events.length);
      console.log("Paginazione:", data.pagination);

      console.table(
        data.events.map((event) => {
          const venue = event._embedded?.venues?.[0];

          return {
            id: event.id,
            evento: event.name,
            data: event.dates.start.localDate,
            venue: venue?.name ?? "Non disponibile",
            città: venue?.city?.name ?? "Non disponibile",
            regione: venue?.state?.name ?? "Non disponibile",
            codiceRegione: venue?.state?.stateCode ?? "Non disponibile",
          };
        }),
      );

      console.groupEnd();

      setEvents(data.events);
      setPagination(data.pagination);
    } catch (requestError) {
      console.error("[ConcertExplorer] Errore caricamento:", requestError);

      setEvents([]);
      setPagination(null);
      setError("Non è stato possibile caricare gli eventi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadEvents(appliedFilters, currentPage);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [appliedFilters, currentPage, loadEvents]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadGenres() {
      setGenresLoading(true);
      setGenresError(false);

      try {
        const response = await fetch("/api/genres", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Errore caricamento generi: ${response.status}`,
          );
        }

        const data =
          (await response.json()) as GenresApiResponse;

        setGenres(data.genres);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "[ConcertExplorer] Errore generi:",
          requestError,
        );

        setGenres([]);
        setGenresError(true);
      } finally {
        if (!controller.signal.aborted) {
          setGenresLoading(false);
        }
      }
    }

    void loadGenres();

    return () => {
      controller.abort();
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuggestionsOpen(false);
    setCurrentPage(0);
    setAppliedFilters(formFilters);
  }

  function handleReset() {
    setFormFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setCurrentPage(0);
  }

  function goToPage(page: number) {
    if (page < 0 || (pagination && page >= pagination.totalPages)) {
      return;
    }

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const hasPreviousPage = currentPage > 0;

  const hasNextPage =
    pagination !== null && currentPage + 1 < pagination.totalPages;





  return (
    <>
      <header className="site-header">
        <div className="site-header__content">
          <div>
            <span className="site-header__eyebrow">Live music finder</span>

          <div className="site-header__title">

            <h1>Ticket Mapper</h1>

            <span className="site-header__logo" aria-hidden="true" />

          </div>
            <p>
              Cerca concerti, artisti e spettacoli musicali disponibili in
              Italia.
            </p>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main className="page-container">
        <section className="search-panel" aria-labelledby="search-title">
          <h2 id="search-title" className="sr-only">
            Cerca concerti
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="main-search">
              <Search aria-hidden="true" size={21} strokeWidth={1.8} />

              <SearchAutocomplete
                value={formFilters.keyword}
                isOpen={suggestionsOpen}
                onOpenChange={setSuggestionsOpen}
                              onChange={(value) => {
                  setFormFilters((current) => ({
                    ...current,
                    keyword: value,
                  }));
                }}
                onAttractionSelect={(attraction) => {
                  const nextFilters = {
                    ...formFilters,
                    keyword: attraction.name,
                  };

                  setFormFilters(nextFilters);
                  setAppliedFilters(nextFilters);
                  setCurrentPage(0);
                }}
                onEventSelect={(event) => {
                  window.open(
                    event.url,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
                onVenueSelect={(venue) => {
                  const nextFilters = {
                    ...formFilters,
                    keyword: "",
                    city: venue.city?.name ?? venue.name ?? "",
                  };

                  setFormFilters(nextFilters);
                  setAppliedFilters(nextFilters);
                  setCurrentPage(0);
                }}
              />

            </div>

            <div className="filters">
              <label>
                <span>Città</span>

                <input
                  type="text"
                  value={formFilters.city}
                  onChange={(event) =>
                    setFormFilters((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  placeholder="Es. Milano"
                />
              </label>

              <label>
                <span>Genere</span>

                <select
                  value={formFilters.genreId}
                  disabled={genresLoading || genresError}
                  onChange={(event) =>
                    setFormFilters((current) => ({
                      ...current,
                      genreId: event.target.value,
                    }))
                  }
                >
                  <option value="">
                    {genresLoading
                      ? "Caricamento generi..."
                      : genresError
                        ? "Generi non disponibili"
                        : "Tutti i generi"}
                  </option>

                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Dal</span>

                <input
                  type="date"
                  value={formFilters.startDate}
                  min={today}
                  onChange={(event) =>
                    setFormFilters((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Al</span>

                <input
                  type="date"
                  value={formFilters.endDate}
                  min={tomorrow}
                  onChange={(event) =>
                    setFormFilters((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="filter-actions">
              <p className="ticket-sources">
                <LibraryBig aria-hidden="true" size={19} strokeWidth={2} />
                Dati sui biglietti forniti da{" "}
                <a
                  href="https://www.ticketmaster.it"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ticketmaster
                  <ExternalLink aria-hidden="true" size={13} strokeWidth={2} />
                </a>
              </p>

              <div className="filter-actions__buttons">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={handleReset}
                >
                  Azzera filtri
                </button>

                <button className="primary-button" type="submit">
                  Applica filtri
                </button>
              </div>
            </div>

          </form>
        </section>

          <aside className="results-disclaimer" aria-label="Nota sui risultati">
            <Info aria-hidden="true" size={19} strokeWidth={2} />
                  
            <p>
              Le informazioni mostrate potrebbero differire da quelle pubblicate sulle
              pagine ufficiali degli eventi. Verifica sempre date, orari e disponibilità
              prima dell’acquisto.
            </p>
          </aside>

        <section className="results-section" aria-labelledby="results-title">
          <div className="results-header">
            <div>
              <span className="results-header__label">Risultati</span>

              <h2 id="results-title">Eventi disponibili</h2>
            </div>

            <div className="results-header__actions">
              {pagination && viewMode !== "map" && (
                <span className="results-count">
                  {pagination.totalElements} eventi
                </span>
              )}
              <div
                className="view-switcher"
                aria-label="Modalità visualizzazione"
              >
                <button
                  type="button"
                  className={
                    viewMode === "grid"
                      ? "view-switcher__button view-switcher__button--active"
                      : "view-switcher__button"
                  }
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                >
                  <Grid3X3 aria-hidden="true" size={18} strokeWidth={2} />
                  Griglia
                </button>

                <button
                  type="button"
                  className={
                    viewMode === "list"
                      ? "view-switcher__button view-switcher__button--active"
                      : "view-switcher__button"
                  }
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                >
                  <List aria-hidden="true" size={18} strokeWidth={2} />
                  Lista
                </button>

                <button
                  type="button"
                  className={
                    viewMode === "map"
                      ? "view-switcher__button view-switcher__button--active"
                      : "view-switcher__button"
                  }
                  onClick={() => setViewMode("map")}
                  aria-pressed={viewMode === "map"}
                >
                  <Map aria-hidden="true" size={18} strokeWidth={1.8} />
                  Mappa
                </button>
              </div>
            </div>
          </div>
          {viewMode !== "map" && (
            <>
              {!loading && !error && events.length > 0 && (
                <>
                  {viewMode === "grid" ? (
                    <div className="event-grid">
                      {events.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  ) : (
                    <div className="event-table-wrapper">
                      <table className="event-table">
                        <thead>
                          <tr>
                            <th scope="col">Evento</th>
                            <th scope="col">Categoria</th>
                            <th scope="col">Luogo</th>
                            <th scope="col">Data e ora</th>
                            <th scope="col">Azioni</th>
                          </tr>
                        </thead>

                        <tbody>
                          {events.map((event) => {
                            const venue = event._embedded?.venues?.[0];
                            const eventTime = formatEventTime(
                              event.dates.start.localTime,
                            );

                            return (
                              <tr key={event.id}>
                                <td>
                                  <strong>{event.name}</strong>
                                </td>
                                <td>{getEventGenre(event)}</td>
                                <td>
                                  <span className="event-table__venue">
                                    {venue?.name ?? "Luogo non disponibile"}
                                    {venue?.city?.name
                                      ? `, ${venue.city.name}`
                                      : ""}
                                  </span>
                                </td>
                                <td>
                                  <time
                                    dateTime={`${event.dates.start.localDate}${
                                      eventTime ? `T${eventTime}` : ""
                                    }`}
                                  >
                                    {formatEventDate(
                                      event.dates.start.localDate,
                                    )}
                                    {eventTime ? `, ore ${eventTime}` : ""}
                                  </time>
                                </td>
                                <td>
                                  <a
                                    className="event-table__link"
                                    href={event.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Apri i dettagli di ${event.name}`}
                                  >
                                    Dettagli
                                    <ExternalLink
                                      aria-hidden="true"
                                      size={16}
                                    />
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <nav className="pagination" aria-label="Paginazione eventi">
                    <button
                      type="button"
                      disabled={!hasPreviousPage}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      Precedente
                    </button>

                    <span>
                      Pagina {currentPage + 1}
                      {pagination ? ` di ${pagination.totalPages}` : ""}
                    </span>

                    <button
                      type="button"
                      disabled={!hasNextPage}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      Successiva
                    </button>
                  </nav>
                </>
              )}
              {loading && (
                <div className="status-message" role="status">
                  Caricamento concerti...
                </div>
              )}

              {!loading && error && (
                <div
                  className="status-message status-message--error"
                  role="alert"
                >
                  <p>{error}</p>

                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      setError(null);
                      void loadEvents(appliedFilters, currentPage);
                    }}
                  >
                    Riprova
                  </button>
                </div>
              )}

              {!loading && !error && events.length === 0 && (
                <div className="status-message">
                  Nessun concerto trovato con i filtri selezionati.
                </div>
              )}
            </>
          )}

          {viewMode === "map" && <ItalyEventsMap filters={appliedFilters} />}
        </section>
      </main>
    </>
  );
}
