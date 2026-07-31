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

## Decisioni tecniche

- Framework: Next.js.
- Linguaggio: TypeScript.
- Routing: App Router.
- Persistenza: nessuna.
- Autenticazione utenti: nessuna.
- Fonte eventi: Ticketmaster Discovery API.
- API key: solo server-side.
- Cache: temporanea tramite Next.js/CDN.

## Prossimi passi

1. Registrare un account Ticketmaster Developer.
2. Ottenere una Consumer Key.
3. Configurare `.env.local`.
4. Creare il client server-side Ticketmaster.
5. Creare `GET /api/events`.
6. Mostrare una prima lista di concerti italiani.
7. Aggiungere filtri.
8. Integrare la mappa.
