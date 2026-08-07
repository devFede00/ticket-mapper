# Fonti del progetto

## Stato attuale

- Progetto Next.js inizializzato.
- App Router attivo.
- TypeScript ed ESLint configurati.
- Nessun database.
- Nessun sistema di autenticazione.
- Nessuna API esterna ancora integrata.

## Fonti ufficiali

### Next.js

- Documentazione App Router:
  https://nextjs.org/docs/app
- Installazione:
  https://nextjs.org/docs/app/getting-started/installation
- create-next-app:
  https://nextjs.org/docs/app/api-reference/cli/create-next-app

### Ticketmaster

- Developer Portal:
  https://developer.ticketmaster.com/
- Discovery API:
  https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
- API Explorer:
  https://developer.ticketmaster.com/api-explorer/v2/

### Github geojson-italy

- Confini regionali: geojson-italy, derivato dai dati ISTAT
- https://github.com/guglielmo/geojson-italy,
  licenza CC BY 4.0.

## Decisioni tecniche

- Framework: Next.js.
- Linguaggio: TypeScript.
- Routing: App Router.
- Persistenza: nessuna.
- Autenticazione utenti: nessuna.
- Fonte eventi: Ticketmaster Discovery API.
- API key: solo server-side.
- Cache: temporanea tramite Next.js/CDN.
