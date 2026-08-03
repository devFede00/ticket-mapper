import { fetchSuggestions } from "@/lib/ticketmaster-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const keyword = searchParams.get("keyword")?.trim();

    if (!keyword || keyword.length < 2) {
      return Response.json({
        _embedded: {
          attractions: [],
          events: [],
          venues: [],
        },
      });
    }

    const data = await fetchSuggestions(keyword);

    return Response.json(data);
  } catch (error) {
    console.error(
      "[API suggestions] Errore caricamento:",
      error,
    );

    return Response.json(
      {
        error: "Impossibile recuperare i suggerimenti",
      },
      {
        status: 502,
      },
    );
  }
}