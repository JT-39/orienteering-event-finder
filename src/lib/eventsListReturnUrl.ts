/** Shared sessionStorage key: the events list records its own URL here on
 * every render, and the event detail page's back button reads it. Avoids
 * relying on browser history length/referrer, which can't reliably tell an
 * in-app previous page from an external one. */
export const EVENTS_LIST_RETURN_KEY = "orienteering:lastEventsListUrl";
