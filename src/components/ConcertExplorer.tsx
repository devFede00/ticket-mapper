"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  EventsApiResponse,
  TicketmasterEvent,
  TicketmasterPage,
} from "@/types/ticketmaster-dto";

import ItalyEventsMap from "./ItalyEventsMap";

import EventCard from "./EventCard";
import ThemeToggle from "./ThemeToggle";
import SearchAutocomplete from "./SearchSuggestions";

interface Filters {
  keyword: string;
  city: string;
  startDate: string;
  endDate: string;
}

const INITIAL_FILTERS: Filters = {
  keyword: "",
  city: "",
  startDate: "",
  endDate: "",
};

type ViewMode = "list" | "map";

function buildQueryString(
  filters: Filters,
  page: number,
): string {
  const params = new URLSearchParams();

  if (filters.keyword.trim()) {
    params.set("keyword", filters.keyword.trim());
  }

  if (filters.city.trim()) {
    params.set("city", filters.city.trim());
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

export default function ConcertExplorer() {
  const [formFilters, setFormFilters] =
    useState<Filters>(INITIAL_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState<Filters>(INITIAL_FILTERS);

  const [events, setEvents] = useState<
    TicketmasterEvent[]
  >([]);

  const [pagination, setPagination] =
    useState<TicketmasterPage | null>(null);

  const [viewMode, setViewMode] =
    useState<ViewMode>("list");

  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null,
  );

 const loadEvents = useCallback(
  async (filters: Filters, page: number) => {
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

        throw new Error(
          `Errore HTTP ${response.status}: ${errorBody}`,
        );
      }

      const data =
        (await response.json()) as EventsApiResponse;

      console.log("Risposta completa:", data);
      console.log(
        "Numero eventi ricevuti:",
        data.events.length,
      );
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
            regione:
              venue?.state?.name ?? "Non disponibile",
            codiceRegione:
              venue?.state?.stateCode ??
              "Non disponibile",
          };
        }),
      );

      console.groupEnd();

      setEvents(data.events);
      setPagination(data.pagination);
    } catch (requestError) {
      console.error(
        "[ConcertExplorer] Errore caricamento:",
        requestError,
      );

      setEvents([]);
      setPagination(null);
      setError(
        "Non è stato possibile caricare gli eventi.",
      );
    } finally {
      setLoading(false);
    }
  },
  [],
);

  useEffect(() => {
    void loadEvents(appliedFilters, currentPage);
  }, [appliedFilters, currentPage, loadEvents]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCurrentPage(0);
    setAppliedFilters(formFilters);
  }

  function handleReset() {
    setFormFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setCurrentPage(0);
  }

  function goToPage(page: number) {
    if (
      page < 0 ||
      (pagination && page >= pagination.totalPages)
    ) {
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
    pagination !== null &&
    currentPage + 1 < pagination.totalPages;





  return (
    <>
      <header className="site-header">
        <div className="site-header__content">
          <div>
            <span className="site-header__eyebrow">
              Live music finder
            </span>

            <h1>Concerti Italia</h1>

            <p>
              Cerca concerti, artisti e spettacoli
              musicali disponibili in Italia.
            </p>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main className="page-container">
        <section
          className="search-panel"
          aria-labelledby="search-title"
        >
          <h2 id="search-title" className="sr-only">
            Cerca concerti
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="main-search">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="21"
                height="21"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <path
                  d="m20 20-4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>

              <SearchAutocomplete
                value={formFilters.keyword}
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

              <button
                className="main-search__submit"
                type="submit"
              >
                Cerca
              </button> 
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
                <span>Dal</span>

                <input
                  type="date"
                  value={formFilters.startDate}
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
                  min={formFilters.startDate || undefined}
                  onChange={(event) =>
                    setFormFilters((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
              </label>

              <button
                className="secondary-button"
                type="button"
                onClick={handleReset}
              >
                Azzera filtri
              </button>
            </div>
          </form>
        </section>

        <section
          className="results-section"
          aria-labelledby="results-title"
        >
          <div className="results-header">
            <div>
              <span className="results-header__label">
                Risultati
              </span>

              <h2 id="results-title">
                Eventi disponibili
              </h2>
            </div>

            <div className="results-header__actions">
              {pagination && viewMode === "list" && (
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
                        viewMode === "list"
                          ? "view-switcher__button view-switcher__button--active"
                          : "view-switcher__button"
                      }
                      onClick={() => setViewMode("list")}
                      aria-pressed={viewMode === "list"}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                      >
                        <path
                          d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>

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
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                      >
                        <path
                          d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />

                        <path
                          d="M9 3v15M15 6v15"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>

                      Mappa
                    </button>
                  </div>
              </div>
            </div>
          {viewMode === "list" && (
              <>
              {!loading && !error && events.length > 0 && (
                  <>
                    <div className="event-grid">
                      {events.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                        />
                      ))}
                    </div>

                    <nav
                      className="pagination"
                      aria-label="Paginazione eventi"
                    >
                      <button
                        type="button"
                        disabled={!hasPreviousPage}
                        onClick={() =>
                          goToPage(currentPage - 1)
                        }
                      >
                        Precedente
                      </button>

                      <span>
                        Pagina {currentPage + 1}
                        {pagination
                          ? ` di ${pagination.totalPages}`
                          : ""}
                      </span>

                      <button
                        type="button"
                        disabled={!hasNextPage}
                        onClick={() =>
                          goToPage(currentPage + 1)
                        }
                      >
                        Successiva
                      </button>
                    </nav>
                  </>
                )}
                {loading && (
            <div
              className="status-message"
              role="status"
            >
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
                onClick={() =>
                  void loadEvents(
                    appliedFilters,
                    currentPage,
                  )
                }
              >
                Riprova
              </button>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
              <div className="status-message">
                Nessun concerto trovato con i filtri
                selezionati.
              </div>
            )}

              </>
            )}

            {viewMode === "map" && (
              <ItalyEventsMap filters={appliedFilters} />
            )}

        </section>
      </main>
    </>
  );
}