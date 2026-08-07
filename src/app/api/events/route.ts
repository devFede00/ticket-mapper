import { getItalianMusicEvents } from "@/lib/ticketmaster-service";
import { resolveEventRegion } from "@/lib/event-region";

function parseSize(value: string | null): number {
  if (!value) {
    return 12;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 12;
  }

  return Math.min(parsed, 200);
}

function parsePage(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const data = await getItalianMusicEvents({
      keyword: searchParams.get("keyword") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      genreId: searchParams.get("genreId") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      page: parsePage(searchParams.get("page")),
      size: parseSize(searchParams.get("size")),
    });

    const events = (data._embedded?.events ?? []).map(
      (event) => {
        const resolution = resolveEventRegion(event);

        return {
          ...event,
          resolvedRegion: resolution.region,
          regionResolutionSource: resolution.source,
        };
      },
    );

return Response.json({
  events,
  pagination: data.page ?? null,
});
  } catch (error) {
    console.error("Errore caricamento eventi:", error);

    return Response.json(
      {
        error: "Impossibile recuperare gli eventi",
      },
      {
        status: 502,
      },
    );
  }
}