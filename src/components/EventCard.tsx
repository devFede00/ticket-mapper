import { CalendarDays, Clock, MapPin, Music } from "lucide-react";
import Image from "next/image";

import type {
  TicketmasterEvent,
  TicketmasterImage,
} from "@/types/ticketmaster-dto";

interface EventCardProps {
  event: TicketmasterEvent;
}

function selectEventImage(
  event: TicketmasterEvent,
): TicketmasterImage | null {
  const images = event.images ?? [];

  const preferredImage =
    images
      .filter((image) => image.ratio === "16_9")
      .sort((a, b) => b.width - a.width)[0] ??
    images.sort((a, b) => b.width - a.width)[0];

  return preferredImage ?? null;
}

function formatEventDate(date: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatEventTime(time?: string): string | null {
  if (!time) {
    return null;
  }

  return time.slice(0, 5);
}

export default function EventCard({
  event,
}: EventCardProps) {
  const venue = event._embedded?.venues?.[0];
  const eventImage = selectEventImage(event);
  const eventTime = formatEventTime(
    event.dates.start.localTime,
  );

  const genre =
    event.classifications?.find(
      (classification) => classification.primary,
    )?.genre?.name ??
    event.classifications?.[0]?.genre?.name;

  return (
    <article className="event-card">
      <div className="event-card__image-wrapper">
        {eventImage ? (
          <Image
            className="event-card__image"
            src={eventImage.url}
            alt=""
            fill
            sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
          />
        ) : (
          <div className="event-card__placeholder">
            Nessuna immagine
          </div>
        )}

        {genre && (
          <span className="event-card__genre">
            <Music aria-hidden="true" size={14} strokeWidth={2} />
            {genre}
          </span>
        )}
      </div>

      <div className="event-card__content">
        <div className="event-card__metadata">

          <span className="event-card__date">
            <CalendarDays
              aria-hidden="true"
              size={14}
              strokeWidth={2}
            />

            {formatEventDate(event.dates.start.localDate)}
          </span>

           <span className="event-card__time">
            <Clock
              aria-hidden="true"
              size={14}
              strokeWidth={2}
            />
            Ore {eventTime}
            </span>
        </div>

        <h2 className="event-card__title">
          {event.name}
        </h2>

        <div className="event-card__venue">
          <MapPin
            aria-hidden="true"
            size={18}
            strokeWidth={1.8}
          />

          {venue?.name ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${venue.name}${venue.city?.name ? `, ${venue.city.name}` : ""}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Apri ${venue.name} su Google Maps`}
              className="event-card__venue-link"
            >
              {venue.name}
              {venue.city?.name ? `, ${venue.city.name}` : ""}
            </a>
          ) : (
            <span>Luogo non disponibile</span>
          )}
        </div>

        <a
          className="event-card__link"
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Dettagli evento
        </a>
      </div>
    </article>
  );
}
