// Which steps are open. Preview mode opens everything on this device for demonstration.
import { FORMATS, GATES } from '../data/event.js';
import { isEventDay } from './time.js';

export const formatOf = (state) => FORMATS[state.format] ?? FORMATS.A;
export const registrationOpen = (state) => GATES.registration.open || state.preview;
export const checkInOpen = (state, now) => state.preview || isEventDay(now, formatOf(state));
export const submissionsOpen = (state, now) => state.preview || isEventDay(now, formatOf(state));
