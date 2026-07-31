# Concerti Italia

Applicazione web didattica per cercare e visualizzare i concerti disponibili in Italia tramite Ticketmaster.

Il progetto è stato realizzato per approfondire React, TypeScript e Next.js, senza database, autenticazione o gestione degli utenti.

## Funzionalità

- ricerca per artista o nome dell’evento;
- filtro per città e intervallo di date;
- paginazione dei risultati;
- visualizzazione a lista;
- mappa interattiva delle regioni italiane;
- raggruppamento degli eventi per regione;
- modalità chiara e scura;
- collegamento alla pagina Ticketmaster dell’evento.

Poiché Ticketmaster non valorizza sempre la regione delle venue italiane, l’associazione geografica viene ricavata dalla città dell’evento tramite un mapping locale città-regione.

## Tecnologie

- Next.js con App Router;
- React;
- TypeScript;
- Ticketmaster Discovery API;
- `@svg-maps/italy`;
- CSS;
- Vercel per il deploy.

## Avvio locale

Installa le dipendenze:

```bash
npm install
```

Crea un file `.env.local` nella cartella principale:

```env
TICKETMASTER_API_KEY=la_tua_chiave
```

Avvia il progetto:

```bash
npm run dev
```

Apri:

```text
http://localhost:3000
```

## Variabili d’ambiente

| Variabile              | Descrizione                                     |
| ---------------------- | ----------------------------------------------- |
| `TICKETMASTER_API_KEY` | Chiave privata della Ticketmaster Discovery API |

La chiave non deve essere inserita nel codice client né pubblicata nella repository.

## Risorse utilizzate

- [Documentazione Next.js App Router](https://nextjs.org/docs/app) — struttura dell’applicazione, componenti server e Route Handler.
- [Documentazione React](https://react.dev/) — componenti, stato e Hook.
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — tipizzazione, interfacce, generics e inferenza dei tipi.
- [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) — recupero di eventi, venue, date e immagini.
- [`@svg-maps/italy`](https://www.npmjs.com/package/@svg-maps/italy) — geometria SVG delle regioni italiane, distribuita con licenza CC BY 4.0.
- [Documentazione Vercel per Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs) — pubblicazione dell’applicazione e gestione delle variabili d’ambiente.

## Note

Il progetto è destinato allo studio e non è affiliato ufficialmente con Ticketmaster.
