# Ticket Mapper

Applicazione web per cercare e visualizzare concerti ed eventi musicali disponibili in Italia tramite la Ticketmaster Discovery API.

Il progetto è stato realizzato per approfondire Next.js, React e TypeScript. Non utilizza database, autenticazione o profili utente.

## Funzionalità

- ricerca per artista o evento con suggerimenti automatici;
- filtri per città, genere e intervallo di date;
- risultati paginati in modalità griglia o lista;
- mappa interattiva con eventi raggruppati per regione;
- collegamenti a Ticketmaster e Google Maps;
- visualizzazione in Light/Dark mode selezionabile;
- pagina di manutenzione attivabile tramite configurazione.

La regione viene ricavata dalle coordinate dell'evento, dai dati della venue o da un mapping locale città-regione. Gli eventi non associabili vengono indicati separatamente.

## Tecnologie

- Next.js 16 e React 19;
- TypeScript;
- Ticketmaster Discovery API;
- `@svg-maps/italy` e Turf;
- Lucide React;
- CSS e Tailwind CSS 4.

## Note

- La vista mappa considera fino a 200 eventi.
- Date, orari e disponibilità dipendono dai dati forniti da Ticketmaster e devono essere verificati prima dell'acquisto.

Progetto didattico indipendente, non affiliato ufficialmente con Ticketmaster.
