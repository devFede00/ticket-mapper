"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

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

import { ExternalLink, Grid3X3, Info, List, Map, Search } from "lucide-react";

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <header className="bg-neutral-950 text-white">
        <div className="mx-auto flex min-h-65 w-[min(1220px,calc(100%-40px))] items-start justify-between gap-8 py-14 pb-18 max-sm:min-h-57.5 max-sm:w-[min(100%-24px,1220px)] max-sm:pt-9">
          <div>
            <span className="mb-2.5 block text-xs font-bold tracking-[0.12em] text-indigo-200 uppercase">
              Live music finder
            </span>

            <h1 className="text-[clamp(2.4rem,7vw,5rem)] leading-[0.95] font-bold tracking-[-0.055em] max-sm:text-[2.8rem]">
              Concerti Italia
            </h1>

            <p className="mt-6 max-w-155 text-base leading-7 text-neutral-300">
              Cerca concerti, artisti e spettacoli musicali disponibili in
              Italia.
            </p>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto -mt-8.5 w-[min(1220px,calc(100%-40px))] pb-20 max-sm:-mt-7 max-sm:w-[min(100%-24px,1220px)]">
        <section
          className="relative z-2 rounded-3xl border bg-card p-6 shadow-xl max-sm:rounded-2xl max-sm:p-4"
          aria-labelledby="search-title"
        >
          <h2 id="search-title" className="sr-only">
            Cerca concerti
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="relative grid min-h-14.5 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border bg-muted px-4 text-muted-foreground max-sm:px-3">
              <Search aria-hidden="true" size={21} strokeWidth={1.8} />

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

              <Button
                className="h-11 px-6 max-sm:col-span-full max-sm:-mx-3 max-sm:-mb-px max-sm:h-12 max-sm:rounded-t-none"
                type="submit"
              >
                Cerca
              </Button>
            </div>

            <div className="mt-5 grid grid-cols-[minmax(180px,1.5fr)_repeat(3,minmax(150px,1fr))] items-end gap-3.5 max-lg:grid-cols-2 max-sm:grid-cols-1">
              <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
                <span>Città</span>

                <Input
                  className="h-11"
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

              <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
                <span>Genere</span>

                <Select
                  value={formFilters.genreId || "all"}
                  disabled={genresLoading || genresError}
                  onValueChange={(value) =>
                    setFormFilters((current) => ({
                      ...current,
                      genreId: value === "all" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue
                      placeholder={
                        genresLoading
                          ? "Caricamento generi..."
                          : genresError
                            ? "Generi non disponibili"
                            : "Tutti i generi"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i generi</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre.id} value={genre.id}>
                        {genre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
                <span>Dal</span>

                <Input
                  className="h-11"
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

              <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
                <span>Al</span>

                <Input
                  className="h-11"
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

            <div className="mt-5 flex justify-end gap-3 max-sm:flex-col-reverse">
              <Button
                variant="outline"
                className="h-11 px-5"
                type="button"
                onClick={handleReset}
              >
                Azzera filtri
              </Button>

              <Button className="h-11 min-w-40 px-6" type="submit">
                Applica filtri
              </Button>
            </div>

          </form>
        </section>

          <Alert
            className="mt-5 border-primary/20 bg-primary/5 text-muted-foreground"
            aria-label="Nota sui risultati"
          >
            <Info aria-hidden="true" size={19} strokeWidth={2} />

            <AlertDescription>
              Le informazioni mostrate potrebbero differire da quelle pubblicate sulle
              pagine ufficiali degli eventi. Verifica sempre date, orari e disponibilità
              prima dell’acquisto.
            </AlertDescription>
          </Alert>

        <section className="pt-8" aria-labelledby="results-title">
          <div className="mb-6 flex items-end justify-between gap-5 max-sm:flex-col max-sm:items-start">
            <div>
              <span className="mb-2 block text-xs font-bold tracking-[0.12em] text-primary uppercase">Risultati</span>

              <h2 id="results-title" className="text-[clamp(1.7rem,3vw,2.4rem)] font-bold tracking-tight">Eventi disponibili</h2>
            </div>

            <div className="flex items-center gap-4 max-sm:w-full max-sm:flex-col max-sm:items-stretch">
              {pagination && viewMode !== "map" && (
                <span className="text-sm text-muted-foreground">
                  {pagination.totalElements} eventi
                </span>
              )}
              <div
                className="inline-flex rounded-xl border bg-card p-1 max-sm:w-full"
                aria-label="Modalità visualizzazione"
              >
                <Button
                  type="button"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  className={
                    "h-9 flex-1 px-3"
                  }
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                >
                  <Grid3X3 aria-hidden="true" size={18} strokeWidth={2} />
                  Griglia
                </Button>

                <Button
                  type="button"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  className={
                    "h-9 flex-1 px-3"
                  }
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                >
                  <List aria-hidden="true" size={18} strokeWidth={2} />
                  Lista
                </Button>

                <Button
                  type="button"
                  variant={viewMode === "map" ? "default" : "ghost"}
                  className={
                    "h-9 flex-1 px-3"
                  }
                  onClick={() => setViewMode("map")}
                  aria-pressed={viewMode === "map"}
                >
                  <Map aria-hidden="true" size={18} strokeWidth={1.8} />
                  Mappa
                </Button>
              </div>
            </div>
          </div>
          {viewMode !== "map" && (
            <>
              {!loading && !error && events.length > 0 && (
                <>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-3 gap-5.5 max-lg:grid-cols-2 max-sm:grid-cols-1">
                      {events.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                      <Table className="min-w-220">
                        <TableHeader className="bg-muted">
                          <TableRow>
                            <TableHead scope="col">Evento</TableHead>
                            <TableHead scope="col">Categoria</TableHead>
                            <TableHead scope="col">Luogo</TableHead>
                            <TableHead scope="col">Data e ora</TableHead>
                            <TableHead scope="col">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {events.map((event) => {
                            const venue = event._embedded?.venues?.[0];
                            const eventTime = formatEventTime(
                              event.dates.start.localTime,
                            );

                            return (
                              <TableRow key={event.id}>
                                <TableCell className="max-w-72 whitespace-normal">
                                  <strong>{event.name}</strong>
                                </TableCell>
                                <TableCell>{getEventGenre(event)}</TableCell>
                                <TableCell className="max-w-64 whitespace-normal text-muted-foreground">
                                  <span>
                                    {venue?.name ?? "Luogo non disponibile"}
                                    {venue?.city?.name
                                      ? `, ${venue.city.name}`
                                      : ""}
                                  </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
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
                                </TableCell>
                                <TableCell>
                                  <Button asChild variant="outline" size="sm">
                                    <a
                                      href={event.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`Apri i dettagli di ${event.name}`}
                                    >
                                      Dettagli
                                      <ExternalLink aria-hidden="true" />
                                    </a>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <nav className="mt-9 flex items-center justify-center gap-5 max-sm:gap-2" aria-label="Paginazione eventi">
                    <Button
                      variant="outline"
                      type="button"
                      disabled={!hasPreviousPage}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      Precedente
                    </Button>

                    <span className="text-sm text-muted-foreground">
                      Pagina {currentPage + 1}
                      {pagination ? ` di ${pagination.totalPages}` : ""}
                    </span>

                    <Button
                      variant="outline"
                      type="button"
                      disabled={!hasNextPage}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      Successiva
                    </Button>
                  </nav>
                </>
              )}
              {loading && (
                <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground" role="status">
                  Caricamento concerti...
                </div>
              )}

              {!loading && error && (
                <Alert variant="destructive" className="p-6" role="alert">
                  <p>{error}</p>

                  <Button
                    variant="destructive"
                    className="mt-3"
                    type="button"
                    onClick={() => void loadEvents(appliedFilters, currentPage)}
                  >
                    Riprova
                  </Button>
                </Alert>
              )}

              {!loading && !error && events.length === 0 && (
                <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
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
