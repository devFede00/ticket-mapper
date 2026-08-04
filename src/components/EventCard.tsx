import { MapPin } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="group gap-0 py-0 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-video overflow-hidden bg-muted">
        {eventImage ? (
          <Image
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
            src={eventImage.url}
            alt=""
            fill
            sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            Nessuna immagine
          </div>
        )}

        {genre && (
          <Badge className="absolute top-3 left-3 border-0 bg-black/75 text-white backdrop-blur-sm">
            {genre}
          </Badge>
        )}
      </div>

      <CardHeader className="pt-5">
        <div className="flex justify-between gap-3 text-xs font-semibold text-primary">
          <span>
            {formatEventDate(
              event.dates.start.localDate,
            )}
          </span>

          {eventTime && <span>Ore {eventTime}</span>}
        </div>

        <CardTitle className="mt-2 text-xl">
          <h2>{event.name}</h2>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
          <MapPin
            className="mt-0.5 shrink-0"
            aria-hidden="true"
            size={18}
            strokeWidth={1.8}
          />

          <span>
            {venue?.name ?? "Luogo non disponibile"}

            {venue?.city?.name
              ? `, ${venue.city.name}`
              : ""}
          </span>
      </CardContent>

      <CardFooter className="mt-auto border-0 bg-transparent p-4 pt-2">
        <Button asChild variant="outline" className="w-full">
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Dettagli evento
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
