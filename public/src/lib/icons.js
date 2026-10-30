// A small stroke icon set (24 × 24, currentColor). Decorative unless a label is given.
import { esc, raw } from './html.js';

const PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M10 20v-6h4v6',
  quest: 'M5 21V4m0 0h11l-2 4 2 4H5',
  team: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c.6-3.4 3-5 6-5s5.4 1.6 6 5m1-9a3 3 0 1 0-1.2-5.8M18 15c1.8.5 3 2 3.4 4.5',
  inbox: 'M4 5h16v11H9l-5 4V5Z',
  more: 'M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  ticket: 'M4 7.5V5h16v2.5a2.5 2.5 0 0 0 0 5V15H4v-2.5a2.5 2.5 0 0 0 0-5ZM4 15v4h16v-4',
  pen: 'M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4',
  scan: 'M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10',
  upload: 'M12 16V4m0 0-5 5m5-5 5 5M4 16v4h16v-4',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15ZM4 20.5A2.5 2.5 0 0 0 6.5 23H20',
  doc: 'M6 3h8l4 4v14H6V3Zm8 0v4h4M9 12h6M9 16h6',
  handshake: 'M3 12l4-4 4 2 3-2 3 2 4 4-4 4-3-2-2 2-3-2-3 2-3-6ZM10 10l-2 2',
  calendar: 'M4 6h16v14H4V6Zm0 4h16M8 3v4M16 3v4',
  check: 'M4 12.5 9 17.5 20 6.5',
  checklist: 'M9 6h11M9 12h11M9 18h11M3.5 6l1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2',
  map: 'M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4Zm0 0v13.5m6-11v13.5',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H4v1.5A3.5 3.5 0 0 0 7.5 11M16 6h4v1.5a3.5 3.5 0 0 1-3.5 3.5M12 13v4m-4 3h8',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5-2.2-.8.4-2.3-2-1.2-1.8 1.5-2.4-.9L12 4h-2.4l-.4 2.3-2 1.1-2.2-.8-1.2 2 1.8 1.6-.1 2.2-1.8 1.6 1.2 2 2.2-.8 2 1.1.4 2.3H12l.4-2.3 2.4-.9 1.8 1.5 2-1.2-.4-2.3L20 12Z',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 3.5Z',
  send: 'M4 12 20 4l-6 16-3-7-7-1Zm7 1 9-9',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  back: 'M19 12H5m6-6-6 6 6 6',
  lock: 'M6 11h12v9H6v-9Zm2 0V8a4 4 0 0 1 8 0v3',
  bolt: 'M13 3 5 14h6l-1 7 8-11h-6l1-7Z',
  download: 'M12 4v12m0 0-5-5m5 5 5-5M4 20h16',
  external: 'M14 5h5v5M19 5l-8 8M10 5H5v14h14v-5',
  bookmark: 'M6 4h12v16l-6-4-6 4V4Z',
  trash: 'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5',
  guide: 'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
};

export function icon(name, label) {
  const path = PATHS[name] ?? PATHS.star;
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true" focusable="false"';
  return raw(`<svg class="icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${a11y}><path d="${path}"/></svg>`);
}

export const ICON_NAMES = Object.keys(PATHS);
