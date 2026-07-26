// The logo file has a Hebrew name. React emits a `Link: rel=preload` *header*
// for images it renders, and header values can't carry non-Latin-1 characters —
// so the URL is percent-encoded everywhere it's used.
export const DEFAULT_LOGO_URL = encodeURI("/לוגו חתוך בן מלך.png");
