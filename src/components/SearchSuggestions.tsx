"use client";

import { useEffect, useState } from "react";

import type {
  TicketmasterAttraction,
  TicketmasterSuggestEvent,
  TicketmasterSuggestResponse,
  TicketmasterVenue,
} from "@/types/ticketmaster-dto";

interface SearchAutocompleteProps {
  value: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;

  onAttractionSelect: (
    attraction: TicketmasterAttraction,
  ) => void;

  onEventSelect: (
    event: TicketmasterSuggestEvent,
  ) => void;

  onVenueSelect: (
    venue: TicketmasterVenue,
  ) => void;
}

export default function SearchAutocomplete({
  value,
  onChange,
  isOpen,
  onOpenChange,
  onAttractionSelect,
  onEventSelect,
  onVenueSelect,
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] =
    useState<TicketmasterSuggestResponse>({});

  const [loading, setLoading] = useState(false);
  const [suggestionsValue, setSuggestionsValue] = useState("");

  useEffect(() => {
    const normalizedValue = value.trim();

    if (normalizedValue.length < 2) {
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          keyword: normalizedValue,
        });

        const response = await fetch(
          `/api/suggestions?${params.toString()}`,
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
          (await response.json()) as TicketmasterSuggestResponse;

        setSuggestions(data);
        setSuggestionsValue(normalizedValue);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Errore caricamento suggerimenti:",
          error,
        );

        setSuggestions({});
        onOpenChange(false);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [value, onOpenChange]);

  const attractions =
    suggestions._embedded?.attractions ?? [];

  const events =
    suggestions._embedded?.events ?? [];

  const venues =
    suggestions._embedded?.venues ?? [];

  const normalizedValue = value.trim();
  const showSuggestions =
    normalizedValue.length >= 2 &&
    suggestionsValue === normalizedValue &&
    isOpen;

  function closeSuggestions() {
    setSuggestions({});
    setSuggestionsValue("");
    onOpenChange(false);
  }

  function handleAttractionSelect(
    attraction: TicketmasterAttraction,
  ) {
    onChange(attraction.name);
    closeSuggestions();
    onAttractionSelect(attraction);
  }

  function handleEventSelect(
    event: TicketmasterSuggestEvent,
  ) {
    onChange(event.name);
    closeSuggestions();
    onEventSelect(event);
  }

  function handleVenueSelect(
    venue: TicketmasterVenue,
  ) {
    onChange(venue.name ?? "");
    closeSuggestions();
    onVenueSelect(venue);
  }

  return (
    <div
      className="search-autocomplete"
      onBlur={(event) => {
        const nextElement = event.relatedTarget;

        if (
          !(nextElement instanceof Node) ||
          !event.currentTarget.contains(nextElement)
        ) {
          closeSuggestions();
        }
      }}
    >
      <input
        type="search"
        value={value}
        placeholder="Cerca artista, evento o luogo"
        autoComplete="off"
        aria-label="Cerca concerti"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-controls="search-suggestions"
        onChange={(event) => {
          onChange(event.target.value);
          onOpenChange(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            closeSuggestions();
          }
        }}
      />

      {normalizedValue.length >= 2 && loading && (
        <span className="search-autocomplete__loading">
          Ricerca...
        </span>
      )}

      {showSuggestions && !loading && (
        <div
          id="search-suggestions"
          className="search-autocomplete__results"
        >
          {attractions.length > 0 && (
            <section>
              <h3>Artisti</h3>

              {attractions.map((attraction) => (
                <button
                  key={attraction.id}
                  type="button"
                  onClick={() =>
                    handleAttractionSelect(attraction)
                  }
                >
                  {attraction.name}
                </button>
              ))}
            </section>
          )}

          {events.length > 0 && (
            <section>
              <h3>Eventi</h3>

              {events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() =>
                    handleEventSelect(event)
                  }
                >
                  {event.name}
                </button>
              ))}
            </section>
          )}

          {venues.length > 0 && (
            <section>
              <h3>Luoghi</h3>

              {venues.map((venue) => (
                <button
                  key={venue.id ?? venue.name}
                  type="button"
                  onClick={() =>
                    handleVenueSelect(venue)
                  }
                >
                  <strong>
                    {venue.name ??
                      "Luogo non disponibile"}
                  </strong>

                  {venue.city?.name && (
                    <span>{venue.city.name}</span>
                  )}
                </button>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
