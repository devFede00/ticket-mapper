"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  TicketmasterAttraction,
  TicketmasterSuggestEvent,
  TicketmasterSuggestResponse,
  TicketmasterVenue,
} from "@/types/ticketmaster-dto";

interface SearchAutocompleteProps {
  value: string;
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
  onAttractionSelect,
  onEventSelect,
  onVenueSelect,
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] =
    useState<TicketmasterSuggestResponse>({});

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
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
        setIsOpen(true);
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
        setIsOpen(false);
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
  }, [value]);

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
    setIsOpen(false);
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
    <div className="relative h-14 w-full min-w-0">
      <Input
        className="h-14 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
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
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            closeSuggestions();
          }
        }}
      />

      {normalizedValue.length >= 2 && loading && (
        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
          Ricerca...
        </span>
      )}

      {showSuggestions && !loading && (
        <div
          id="search-suggestions"
          className="absolute top-[calc(100%+10px)] left-0 z-50 max-h-105 w-[min(620px,calc(100vw-48px))] overflow-y-auto rounded-xl border bg-popover p-2.5 text-popover-foreground shadow-xl max-sm:-left-12 max-sm:max-h-90 max-sm:w-[calc(100vw-54px)]"
        >
          {attractions.length > 0 && (
            <section className="grid gap-1">
              <h3 className="px-2.5 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">Artisti</h3>

              {attractions.map((attraction) => (
                <Button
                  className="h-auto min-h-11 w-full justify-start whitespace-normal px-2.5 py-2 text-left"
                  variant="ghost"
                  key={attraction.id}
                  type="button"
                  onClick={() =>
                    handleAttractionSelect(attraction)
                  }
                >
                  {attraction.name}
                </Button>
              ))}
            </section>
          )}

          {events.length > 0 && (
            <section className="mt-3 grid gap-1 border-t pt-3">
              <h3 className="px-2.5 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">Eventi</h3>

              {events.map((event) => (
                <Button
                  className="h-auto min-h-11 w-full justify-start whitespace-normal px-2.5 py-2 text-left"
                  variant="ghost"
                  key={event.id}
                  type="button"
                  onClick={() =>
                    handleEventSelect(event)
                  }
                >
                  {event.name}
                </Button>
              ))}
            </section>
          )}

          {venues.length > 0 && (
            <section className="mt-3 grid gap-1 border-t pt-3">
              <h3 className="px-2.5 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">Luoghi</h3>

              {venues.map((venue) => (
                <Button
                  className="h-auto min-h-11 w-full justify-start whitespace-normal px-2.5 py-2 text-left"
                  variant="ghost"
                  key={venue.id ?? venue.name}
                  type="button"
                  onClick={() =>
                    handleVenueSelect(venue)
                  }
                >
                  <span>
                    <strong className="block">
                    {venue.name ??
                      "Luogo non disponibile"}
                    </strong>

                  {venue.city?.name && (
                    <span className="block text-xs text-muted-foreground">{venue.city.name}</span>
                  )}
                  </span>
                </Button>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
