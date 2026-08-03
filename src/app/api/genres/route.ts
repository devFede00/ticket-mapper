import { getItalianMusicEvents, getMusicGenres } from "@/lib/ticketmaster-service";


export async function GET() {
  try {
    const genres = await getMusicGenres();

    return Response.json({ genres });
  } catch (error) {
    console.error("Errore caricamento generi:", error);

    return Response.json(
      {
        error: "Impossibile recuperare i generi",
      },
      {
        status: 502,
      },
    );
  }
}