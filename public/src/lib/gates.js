// Which steps are open. Once the app has heard from the event service, the organizers' switches
// decide (state.eventSettings); before that, the event dates do: check-in on either day, final
// submissions on the last day. Preview mode opens everything on this device for demonstration.
import { FORMATS, GATES } from '../data/event.js';
import { isEventDay, isFinalDay } from './time.js';

export const formatOf = (state) => FORMATS[state.format] ?? FORMATS.A;
/** Official registration, as the organizers have set it. Preview mode never changes this. */
export const officialRegistrationOpen = (state) => state.eventSettings?.registrationOpen ?? GATES.registration.open;
export const registrationOpen = (state) => officialRegistrationOpen(state) || state.preview;
export const checkInOpen = (state, now) => state.preview || (state.eventSettings ? state.eventSettings.checkInOpen : isEventDay(now, formatOf(state)));
export const submissionsOpen = (state, now) => state.preview || (state.eventSettings ? state.eventSettings.submissionsOpen : isFinalDay(now, formatOf(state)));
