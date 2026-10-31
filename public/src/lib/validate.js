// Form validation. Each validator returns { field: message } for the fields that need attention.

export const isEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export function isWebUrl(value = '') {
  if (/\s/.test(value.trim())) return false;
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}

const text = (value) => String(value ?? '').trim();

function length(errors, field, value, { min = 0, max = Infinity, label }) {
  const size = text(value).length;
  if (min && size === 0) errors[field] = `Enter ${label}.`;
  else if (size < min) errors[field] = `Use at least ${min} characters for ${label}.`;
  else if (size > max) errors[field] = `Keep ${label} under ${max} characters.`;
}

export function validateWaitlist(data) {
  const errors = {};
  length(errors, 'name', data.name, { min: 2, max: 60, label: 'your name' });
  if (!isEmail(data.email)) errors.email = 'Enter an email address like name@example.com.';
  if (!data.role) errors.role = 'Choose the role that fits you best.';
  if (!data.consent) errors.consent = 'Tick the box to confirm how your entry is kept.';
  return errors;
}

export function validateProfile(profile) {
  const errors = {};
  length(errors, 'name', profile.name, { min: 2, max: 60, label: 'your name' });
  if (!profile.role) errors.role = 'Choose your main role.';
  if ((profile.skills?.length ?? 0) < 3) errors.skills = 'Add at least three skills, separated by commas.';
  else if (profile.skills.some((skill) => skill.length > 40)) errors.skills = 'Keep each skill under 40 characters.';
  if (!profile.tracks?.length) errors.tracks = 'Choose at least one track.';
  if (!profile.lookingFor) errors.lookingFor = 'Choose what you are looking for.';
  if (text(profile.bio).length > 280) errors.bio = 'Keep your bio under 280 characters.';
  if (text(profile.github) && !isWebUrl(profile.github)) errors.github = 'Enter a full link, starting with https://.';
  else if (text(profile.github).length > 200) errors.github = 'Keep the link under 200 characters.';
  return errors;
}

export const REGISTRATION_STEPS = ['Account', 'Builder profile', 'Event details', 'Agreements', 'Review'];

export function validateRegistrationStep(step, data, profile) {
  const errors = {};
  if (step === 0) {
    length(errors, 'name', data.name, { min: 2, max: 60, label: 'your full name' });
    if (!isEmail(data.email)) errors.email = 'Enter an email address like name@example.com.';
    if (text(data.phone) && !/^[+\d][\d\s-]{6,19}$/.test(text(data.phone))) errors.phone = 'Enter a phone number with digits, spaces or dashes only.';
  }
  if (step === 1) Object.assign(errors, validateProfile(profile));
  if (step === 2) {
    if (!data.format) errors.format = 'Choose the format you can attend.';
    if (!data.experience) errors.experience = 'Choose your hackathon experience.';
    if (text(data.dietary).length > 200) errors.dietary = 'Keep dietary needs under 200 characters.';
    if (text(data.access).length > 200) errors.access = 'Keep access needs under 200 characters.';
  }
  if (step === 3) {
    if (!data.conduct) errors.conduct = 'Agree to the code of conduct to continue.';
    if (!data.media) errors.media = 'Choose whether you agree to appear in event media.';
    if (!data.data) errors.data = 'Confirm how your details are kept.';
  }
  return errors;
}

export const SUBMISSION_CHECKS = [
  { id: 'window', label: 'We built this during the event window, and disclosed any code we brought.' },
  { id: 'repo', label: 'Our repository is open to the judges.' },
  { id: 'demo', label: 'We can demo it live in three minutes.' },
  { id: 'rules', label: 'We agree to the rules and the code of conduct.' },
];

export function validateSubmission(data, { final = false } = {}) {
  const errors = {};
  length(errors, 'name', data.name, { min: 2, max: 60, label: 'a project name' });
  if (!final) return errors;
  length(errors, 'tagline', data.tagline, { min: 10, max: 120, label: 'a one-line tagline' });
  if (!data.track) errors.track = 'Choose your track.';
  length(errors, 'description', data.description, { min: 50, max: 2000, label: 'a description' });
  if (!isWebUrl(data.repo)) errors.repo = 'Enter your repository link, starting with https://.';
  if (text(data.video) && !isWebUrl(data.video)) errors.video = 'Enter the full video link, starting with https://.';
  if (text(data.live) && !isWebUrl(data.live)) errors.live = 'Enter the full demo link, starting with https://.';
  for (const field of ['repo', 'video', 'live']) if (!errors[field] && text(data[field]).length > 300) errors[field] = 'Keep links under 300 characters.';
  if (data.stack?.some((item) => item.length > 40)) errors.stack = 'Keep each item under 40 characters.';
  const missing = SUBMISSION_CHECKS.filter((check) => !data.checks?.includes(check.id));
  if (missing.length) errors.checks = 'Confirm every statement before you submit.';
  return errors;
}

export const splitList = (value = '') => [...new Set(String(value).split(',').map((item) => item.trim()).filter(Boolean))].slice(0, 12);
