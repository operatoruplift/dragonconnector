import test from 'node:test';
import assert from 'node:assert/strict';
import { REGISTRATION_STEPS, SUBMISSION_CHECKS, isEmail, isWebUrl, splitList, validateProfile, validateRegistrationStep, validateSubmission, validateWaitlist } from '../public/src/lib/validate.js';
import { html, raw } from '../public/src/lib/html.js';

const profile = { name: 'An Nguyen', role: 'design', skills: ['Figma', 'UX', 'Pitching'], tracks: ['mobile'], lookingFor: 'team', bio: '', github: '' };

test('email and link checks accept real values and reject the rest', () => {
  for (const value of ['an@example.com', ' an.nguyen+dc@mail.vn ']) assert.ok(isEmail(value), value);
  for (const value of ['', 'an@', 'an@example', 'an example@x.com']) assert.ok(!isEmail(value), value);
  for (const value of ['https://github.com/team/app', 'http://demo.example.vn']) assert.ok(isWebUrl(value), value);
  for (const value of ['', 'github.com/team', 'javascript:alert(1)', 'ftp://example.com', 'https://localhost']) assert.ok(!isWebUrl(value), value);
  assert.deepEqual(splitList(' Rust, Figma,,Rust , Pitching '), ['Rust', 'Figma', 'Pitching']);
});

test('the waitlist needs a name, an email, a role and consent', () => {
  assert.deepEqual(Object.keys(validateWaitlist({})).sort(), ['consent', 'email', 'name', 'role']);
  assert.deepEqual(validateWaitlist({ name: 'An', email: 'an@example.com', role: 'design', consent: true }), {});
});

test('profiles and each registration step validate their own fields', () => {
  assert.deepEqual(validateProfile(profile), {});
  assert.deepEqual(Object.keys(validateProfile({ ...profile, skills: ['Figma'], github: 'github.com/an' })).sort(), ['github', 'skills']);
  assert.equal(REGISTRATION_STEPS.length, 5);
  assert.deepEqual(Object.keys(validateRegistrationStep(0, { name: 'An', email: 'nope', phone: 'call me' }, profile)).sort(), ['email', 'phone']);
  assert.deepEqual(validateRegistrationStep(0, { name: 'An Nguyen', email: 'an@example.com', phone: '+84 905 123 456' }, profile), {});
  assert.deepEqual(validateRegistrationStep(1, {}, profile), {});
  assert.deepEqual(Object.keys(validateRegistrationStep(2, {}, profile)).sort(), ['experience', 'format']);
  assert.deepEqual(Object.keys(validateRegistrationStep(3, { media: 'no' }, profile)).sort(), ['conduct', 'data']);
  assert.deepEqual(validateRegistrationStep(4, {}, profile), {});
});

test('a draft only needs a name; a final submission needs everything, with web links only', () => {
  assert.deepEqual(validateSubmission({ name: 'Bridge' }), {});
  const final = {
    name: 'Bridge', tagline: 'Pay friends from your phone in one tap', track: 'mobile',
    description: 'A mobile wallet companion that turns a QR code into a confirmed payment in under five seconds.',
    repo: 'https://github.com/team/bridge', video: '', live: '', checks: SUBMISSION_CHECKS.map((check) => check.id),
  };
  assert.deepEqual(validateSubmission(final, { final: true }), {});
  assert.deepEqual(Object.keys(validateSubmission({ ...final, repo: 'javascript:alert(1)', video: 'not a link', checks: [] }, { final: true })).sort(), ['checks', 'repo', 'video']);
});

test('the html template escapes everything people type', () => {
  const name = '<img src=x onerror="alert(1)">';
  const out = String(html`<p title="${name}">${name}</p>`);
  assert.equal(out, '<p title="&lt;img src=x onerror=&quot;alert(1)&quot;&gt;">&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>');
  assert.equal(String(html`<ul>${['a', '<b>'].map((item) => html`<li>${item}</li>`)}</ul>`), '<ul><li>a</li><li>&lt;b&gt;</li></ul>', 'nested markup is not escaped twice');
  assert.equal(String(html`${raw('<svg></svg>')}${null}${false}${undefined}${0}`), '<svg></svg>0');
});
