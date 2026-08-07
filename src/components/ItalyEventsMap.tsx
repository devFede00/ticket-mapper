"use client";

import ItalyMapData from "@svg-maps/italy";
import { ExternalLink, MapPinOff, Minus, Music, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CalendarDays } from "lucide-react";

import {
  normalizeItalianRegion,
} from "@/lib/italian-regions";

import type {
  EventsApiResponse,
  MappedTicketmasterEvent,
} from "@/types/ticketmaster-dto";

interface Filters {
  keyword: string;
  city: string;
  genreId: string;
  startDate: string;
  endDate: string;
}

interface ItalyEventsMapProps {
  filters: Filters;
}

interface SvgLocation {
  id: string;
  name: string;
  path: string;
}

interface SvgMap {
  label: string;
  viewBox: string;
  locations: SvgLocation[];
}

type MapSelection =
  | {
      type: "region";
      region: string;
    }
  | {
      type: "unresolved";
    }
  | null;

const italyMap = ItalyMapData as SvgMap;

function buildMapQuery(filters: Filters): string {
  const params = new URLSearchParams();

  if (filters.keyword.trim()) {
    params.set("keyword", filters.keyword.trim());
  }

  if (filters.city.trim()) {
    params.set("city", filters.city.trim());
  }

  if (filters.genreId.trim()) {
    params.set("genreId", filters.genreId.trim());
  }

  if (filters.startDate) {
    params.set("startDate", filters.startDate);
  }

  if (filters.endDate) {
    params.set("endDate", filters.endDate);
  }

  params.set("page", "0");
  params.set("size", "200");

  return params.toString();
}

function formatCompactDate(date: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function getEventGenre(
  event: MappedTicketmasterEvent,
): string {
  return (
    event.classifications?.find(
      (classification) => classification.primary,
    )?.genre?.name ??
    event.classifications?.[0]?.genre?.name ??
    "Genere non disponibile"
  );
}

export default function ItalyEventsMap({
  filters,
}: ItalyEventsMapProps) {
  const [events, setEvents] = useState<MappedTicketmasterEvent[]>([]);

  const [selection, setSelection] =
    useState<MapSelection>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMapEvents() {
      setLoading(true);
      setError(null);
      setSelection(null);

      try {
        const query = buildMapQuery(filters);

        const response = await fetch(`/api/events?${query}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Errore HTTP ${response.status}`);
        }

        const data =
          (await response.json()) as EventsApiResponse;

        //log di controllo estrazione dati:
        const eventsByResolutionSource = Object.groupBy(
          data.events,
          (event) => event.regionResolutionSource,
        );

        for (const [
          source,
          sourceEvents,
        ] of Object.entries(eventsByResolutionSource)) {
          console.groupCollapsed(
            `[Mappa] ${source}: ${sourceEvents?.length ?? 0} eventi`,
          );

          console.table(
            sourceEvents?.map((event) => {
              const venue = event._embedded?.venues?.[0];
              const location =
                venue?.location ?? event.place?.location;

              return {
                evento: event.name,
                regione: event.resolvedRegion ?? "Non determinata",
                venue:
                  venue?.name ??
                  event.place?.name ??
                  "Non disponibile",
                città:
                  venue?.city?.name ??
                  event.place?.city?.name ??
                  "Non disponibile",
                latitudine:
                  location?.latitude ?? "Non disponibile",
                longitudine:
                  location?.longitude ?? "Non disponibile",
                metodo: event.regionResolutionSource,
              };
            }),
          );

          console.groupEnd();
        }
        //---------------------------------

        setEvents(data.events);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        console.error(requestError);

        setEvents([]);
        setError(
          "Non è stato possibile caricare la mappa degli eventi.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadMapEvents();

    return () => {
      controller.abort();
    };
  }, [filters]);

  const { eventsByRegion, unresolvedEvents } = useMemo(() => {
    const grouped = new Map<
      string,
      MappedTicketmasterEvent[]
    >();

    const unresolved: MappedTicketmasterEvent[] = [];

    for (const event of events) {
      const region = event.resolvedRegion;

      if (!region) {
        unresolved.push(event);
        continue;
      }

      const regionEvents = grouped.get(region) ?? [];

      regionEvents.push(event);
      grouped.set(region, regionEvents);
    }

    return {
      eventsByRegion: grouped,
      unresolvedEvents: unresolved,
    };
  }, [events]);

  const selectedEvents = useMemo(() => {
    if (!selection) {
      return [];
    }

    if (selection.type === "unresolved") {
      return unresolvedEvents;
    }

    return eventsByRegion.get(selection.region) ?? [];
  }, [eventsByRegion, selection, unresolvedEvents]);

  const mappedEventsCount =
    events.length - unresolvedEvents.length;

  function handleRegionClick(regionName: string) {
    const normalizedRegion =
      normalizeItalianRegion(regionName);

    if (!normalizedRegion) {
      return;
    }

    setSelection({
      type: "region",
      region: normalizedRegion,
    });
  }

  function handleUnresolvedClick() {
    setSelection({
      type: "unresolved",
    });
  }

  if (loading) {
    return (
      <div className="status-message" role="status">
        Caricamento mappa...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="status-message status-message--error"
        role="alert"
      >
        {error}
      </div>
    );
  }

  return (
    <section
      className="map-section"
      aria-labelledby="map-title"
    >
      <div className="map-section__header">
        <div>
          <span className="results-header__label">
            Distribuzione geografica
          </span>

          <h2 id="map-title">Eventi per regione</h2>
        </div>
      </div>

      <div className="map-layout">
        <div className="italy-map-wrapper">
          <svg
            className="italy-map"
            viewBox={italyMap.viewBox}
            role="img"
            aria-label="Mappa interattiva delle regioni italiane"
          >
            {italyMap.locations.map((location) => {
              const normalizedRegion =
                normalizeItalianRegion(location.name);

              const eventCount = normalizedRegion
                ? eventsByRegion.get(normalizedRegion)
                    ?.length ?? 0
                : 0;

              const isSelected =
                selection?.type === "region" &&
                normalizedRegion === selection.region;

              return (
                <path
                  key={location.id}
                  d={location.path}
                  className={[
                    "italy-map__region",
                    eventCount > 0
                      ? "italy-map__region--has-events"
                      : "",
                    isSelected
                      ? "italy-map__region--selected"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  role="button"
                  tabIndex={0}
                  aria-label={`${location.name}: ${eventCount} eventi`}
                  onClick={() =>
                    handleRegionClick(location.name)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      handleRegionClick(location.name);
                    }
                  }}
                >
                  <title>
                    {location.name}: {eventCount} eventi
                  </title>
                </path>
              );
            })}
          </svg>
        </div>

        <aside
          className="region-panel"
          aria-live="polite"
        >
          {selection === null ? (
            <>
              <h3>Seleziona una regione</h3>

              <p>
                Seleziona una regione dalla mappa oppure
                dall&apos;elenco seguente.
              </p>

              <ul className="region-summary">

                {unresolvedEvents.length > 0 && (
                  <li>
                    <button
                      type="button"
                      onClick={handleUnresolvedClick}
                    >
                      <span>
                        <MapPinOff
                          aria-hidden="true"
                          size={16}
                          strokeWidth={1.8}
                        />{" "}
                        Località non determinate
                      </span>

                      <strong>
                        {unresolvedEvents.length}
                      </strong>
                    </button>
                  </li>
                )}
                {[...eventsByRegion.entries()]
                  .sort((first, second) =>
                    first[0].localeCompare(
                      second[0],
                      "it",
                    ),
                  )
                  .map(([region, regionEvents]) => (
                    <li key={region}>
                      <button
                        type="button"
                        onClick={() =>
                          setSelection({
                            type: "region",
                            region,
                          })
                        }
                      >
                        <span>{region}</span>

                        <strong>
                          {regionEvents.length}
                        </strong>
                      </button>
                    </li>
                  ))}
              </ul>
            </>
          ) : (
            <>
              <div className="region-panel__title">
                <div>
                  <span>
                    {selection.type === "region"
                      ? "Regione selezionata"
                      : "Copertura geografica"}
                  </span>

                  <h3>
                    {selection.type === "region"
                      ? selection.region
                      : "Località non determinate"}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelection(null)}
                  aria-label="Chiudi selezione"
                >
                  <X
                    aria-hidden="true"
                    size={20}
                    strokeWidth={2}
                  />
                </button>
              </div>

              {selection.type === "unresolved" && (
                <p>
                  Questi eventi sono stati recuperati
                  correttamente, ma i dati disponibili non
                  permettono ancora di associarli a una
                  regione.
                </p>
              )}

              <p className="region-panel__count">
                {selectedEvents.length}{" "}
                {selectedEvents.length === 1
                  ? "evento disponibile"
                  : "eventi disponibili"}
              </p>

              {selectedEvents.length === 0 ? (
                <div className="region-panel__empty">
                  {selection.type === "region"
                    ? `Nessun evento disponibile in ${selection.region}.`
                    : "Non ci sono eventi con località non determinata."}
                </div>
              ) : (
                <ul className="region-event-list">
                  {selectedEvents.map((event) => {
                    const venue =
                      event._embedded?.venues?.[0];

                    return (
                      <li
                        key={event.id}
                        className="region-event-list__item"
                      >
                        <div className="region-event-list__content">
                          <div className="region-event-list__metadata">
                            <CalendarDays aria-hidden="true" size={19} strokeWidth={2} />
                            <time dateTime={event.dates.start.localDate}>
                              {formatCompactDate(
                                event.dates.start.localDate,
                              )}
                            </time>

                            <span
                              className="region-event-list__separator"
                              aria-hidden="true"
                            >
                              <Minus aria-hidden="true" size={19} strokeWidth={2} />
                            </span>

                            <Music aria-hidden="true" size={19} strokeWidth={2} />

                            <span className="region-event-list__genre">
                              {getEventGenre(event)}
                            </span>
                          </div>

                          <h4>{event.name}</h4>

                          <p>
                            {venue?.name ??
                              "Luogo non disponibile"}

                            {venue?.city?.name
                              ? `, ${venue.city.name}`
                              : ""}

                            {selection.type ===
                              "unresolved" &&
                            venue?.state?.name
                              ? ` — ${venue.state.name}`
                              : ""}
                          </p>

                        </div>

                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Apri dettagli di ${event.name}`}
                        >
                          <ExternalLink
                            aria-hidden="true"
                            size={18}
                            strokeWidth={1.8}
                          />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </aside>
      </div>

      <p className="map-coverage-note">
        {events.length}{" "}
        {events.length === 1
          ? "evento analizzato"
          : "eventi analizzati"}
        : {mappedEventsCount}{" "}
        {mappedEventsCount === 1
          ? "associato"
          : "associati"}{" "}
        a una regione
        {unresolvedEvents.length > 0
          ? `, ${unresolvedEvents.length} con località non determinata`
          : ""}
        . La mappa considera al massimo i primi 200
        risultati corrispondenti ai filtri selezionati.
      </p>
    </section>
  );
}