"use client";

import ItalyMapData from "@svg-maps/italy";
import { ExternalLink, X } from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  EventsApiResponse,
  TicketmasterEvent,
} from "@/types/ticketmaster-dto";

import {
  normalizeItalianRegion,getRegionFromCity} from "@/lib/italian-regions";

interface Filters {
  keyword: string;
  city: string;
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

const italyMap = ItalyMapData as SvgMap;

function buildMapQuery(filters: Filters): string {
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

  params.set("page", "0");
  params.set("size", "200");

  return params.toString();
}

function getEventRegion(
  event: TicketmasterEvent,
): string | null {
  const venue = event._embedded?.venues?.[0];

  const directRegion = normalizeItalianRegion(
    venue?.state?.name ?? venue?.state?.stateCode,
  );

  if (directRegion) {
    return directRegion;
  }

  return getRegionFromCity(
    venue?.city?.name,
  );
}

function formatCompactDate(date: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export default function ItalyEventsMap({
  filters,
}: ItalyEventsMapProps) {
  const [events, setEvents] = useState<TicketmasterEvent[]>([]);

  const [selectedRegion, setSelectedRegion] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadMapEvents() {
      setLoading(true);
      setError(null);

      try {
        const query = buildMapQuery(filters);

        const response = await fetch(
          `/api/events?${query}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Errore HTTP ${response.status}`,
          );
        }

        const data =
          (await response.json()) as EventsApiResponse;

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

  const eventsByRegion = useMemo(() => {
    const grouped = new Map<string,TicketmasterEvent[]>();

    for (const event of events) {
      const region = getEventRegion(event);

      if (!region) {
        continue;
      }

      const regionEvents = grouped.get(region) ?? [];

      regionEvents.push(event);
      grouped.set(region, regionEvents);
    }

    return grouped;
  }, [events]);

  const selectedRegionEvents = selectedRegion !== null ? eventsByRegion.get(selectedRegion) ?? [] : [];

  function handleRegionClick(regionName: string) {
    const normalizedRegion =
      normalizeItalianRegion(regionName);

    if (!normalizedRegion) {
      return;
    }

    setSelectedRegion(normalizedRegion);
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

          <h2 id="map-title">
            Eventi per regione
          </h2>
        </div>

        <p>
          Seleziona una regione per visualizzare gli
          eventi disponibili.
        </p>
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
                normalizedRegion === selectedRegion;

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

                      handleRegionClick(
                        location.name,
                      );
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
              {selectedRegion === null ? (
                <>
                  <h3>Seleziona una regione</h3>

                  <p>
                    Seleziona una regione dalla mappa oppure
                    dall&apos;elenco seguente.
                  </p>

                  <ul className="region-summary">
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
                              setSelectedRegion(region)
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
                      <span>Regione selezionata</span>
                      <h3>{selectedRegion}</h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedRegion(null)
                      }
                      aria-label="Deseleziona regione"
                    >
                      <X
                        aria-hidden="true"
                        size={20}
                        strokeWidth={2}
                      />
                    </button>
                  </div>

                  <p className="region-panel__count">
                    {selectedRegionEvents.length}{" "}
                    {selectedRegionEvents.length === 1
                      ? "evento disponibile"
                      : "eventi disponibili"}
                  </p>

                  {selectedRegionEvents.length === 0 ? (
                    <div className="region-panel__empty">
                      Nessun evento disponibile in{" "}
                      {selectedRegion}.
                    </div>
                  ) : (
                    <ul className="region-event-list">
                      {selectedRegionEvents.map((event) => {
                        const venue =
                          event._embedded?.venues?.[0];

                        return (
                          <li
                            key={event.id}
                            className="region-event-list__item"
                          >
                            <div className="region-event-list__content">
                              <time
                                dateTime={
                                  event.dates.start.localDate
                                }
                              >
                                {formatCompactDate(
                                  event.dates.start.localDate,
                                )}
                              </time>

                              <h4>{event.name}</h4>

                              <p>
                                {venue?.name ??
                                  "Luogo non disponibile"}

                                {venue?.city?.name
                                  ? `, ${venue.city.name}`
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
        La mappa considera al massimo i primi 200
        risultati corrispondenti ai filtri selezionati.
      </p>
    </section>
  );
}