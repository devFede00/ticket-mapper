# Fonti del progetto

Riferimenti tecnici e fonti utilizzati per lo sviluppo di Ticket Mapper.

## Documentazione

### Next.js, React e TypeScript

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Documentazione React](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### Ticketmaster

- [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)
- [Discovery API v2](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)
- [API Explorer](https://developer.ticketmaster.com/api-explorer/v2/)

Il progetto utilizza gli endpoint Ticketmaster per recuperare eventi musicali italiani, suggerimenti di ricerca e generi. La chiave API rimane sul server.

## Cartografia

- [`@svg-maps/italy`](https://www.npmjs.com/package/@svg-maps/italy) — tracciati SVG delle regioni italiane.
- [`geojson-italy`](https://github.com/guglielmo/geojson-italy) — confini regionali derivati da dati ISTAT.
- [ISTAT — confini amministrativi](https://www.istat.it/notizia/confini-delle-unita-amministrative-a-fini-statistici/) — fonte istituzionale dei confini territoriali.
- [Turf `booleanPointInPolygon`](https://turfjs.org/docs/api/booleanPointInPolygon) — associazione delle coordinate alle regioni.

## Interfaccia e servizi

- [Lucide](https://lucide.dev/) — icone dell'interfaccia.
- [React Icons](https://react-icons.github.io/react-icons/) — raccolte di icone React.
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) — collegamenti alle venue.
- [Vercel per Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs) — riferimento per il deploy.

## Decisioni tecniche

- framework: Next.js con App Router;
- linguaggio: TypeScript;
- fonte eventi: Ticketmaster Discovery API;
- API key: solo server-side;
- cache eventi: 30 minuti;
- cache generi: 24 ore;
- persistenza e autenticazione: non presenti;
- regione degli eventi: coordinate, dati della venue o mapping città-regione.

I dati e i marchi appartengono ai rispettivi proprietari. Prima di una pubblicazione commerciale è necessario verificare le condizioni d'uso e le licenze aggiornate delle singole fonti.
