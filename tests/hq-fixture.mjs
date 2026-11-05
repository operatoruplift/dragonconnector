// A small event as hq_event and hq_projects return it, for HQ's tests. Names are made up; one
// builder's fields carry markup to prove HQ never renders what people type as HTML.
export const HOSTILE = '<img src=x onerror=alert(1)>';
const at = (iso) => new Date(iso).toISOString();

export function sampleEvent({ hostile = false } = {}) {
  const odd = (text) => (hostile ? `${text} ${HOSTILE}` : text);
  return {
    staff: { id: 's-org', name: 'Matt Sim', role: 'organizer' },
    now: at('2026-11-05T10:00:00+07:00'),
    settings: { registration_open: false, check_in_open: false, submissions_open: false, judging_open: true, updated_at: at('2026-11-04T09:00:00+07:00'), check_in_code: 'DRAGON 2026' },
    waitlist: [
      { id: 3, name: odd('Dung Pham'), email: 'dung@example.com', role: 'product', track: 'ai', user_id: null, created_at: at('2026-11-05T08:00:00+07:00') },
      { id: 2, name: 'An Nguyen', email: 'an@example.com', role: 'design', track: 'mobile', user_id: 'u-an', created_at: at('2026-11-01T08:00:00+07:00') },
    ],
    registrations: [
      { user_id: 'u-an', name: odd('An Nguyen'), email: 'an@example.com', phone: '+84 905 123 456', experience: 'some', dietary: odd('Vegetarian'), access_needs: null, media_consent: false, status: 'registered', pass_code: 'DC-AAAA-1111', created_at: at('2026-11-02T08:00:00+07:00'), updated_at: at('2026-11-02T08:00:00+07:00') },
      { user_id: 'u-binh', name: 'Binh Tran', email: 'binh@example.com', phone: null, experience: 'first', dietary: null, access_needs: 'Step-free access', media_consent: true, status: 'registered', pass_code: 'DC-BBBB-2222', created_at: at('2026-11-03T08:00:00+07:00'), updated_at: at('2026-11-03T08:00:00+07:00') },
      { user_id: 'u-chi', name: 'Chi Le', email: 'chi@example.com', phone: null, experience: 'many', dietary: null, access_needs: null, media_consent: true, status: 'pre-registered', pass_code: 'DC-CCCC-3333', created_at: at('2026-11-04T08:00:00+07:00'), updated_at: at('2026-11-04T08:00:00+07:00') },
    ],
    profiles: [
      { id: 'u-an', name: 'An Nguyen', role: 'design', skills: [odd('Figma'), 'UX research', 'Prototyping'], tracks: ['mobile'], looking_for: 'members', languages: ['Vietnamese', 'English'], bio: odd('I design apps.'), github: 'https://github.com/an', discoverable: true, created_at: at('2026-11-01T08:00:00+07:00') },
      { id: 'u-binh', name: 'Binh Tran', role: 'mobile', skills: ['Kotlin', 'React Native', 'Rust'], tracks: ['mobile', 'ai'], looking_for: 'team', languages: ['Vietnamese'], bio: '', github: null, discoverable: true, created_at: at('2026-11-03T08:00:00+07:00') },
      { id: 'u-chi', name: 'Chi Le', role: 'ai', skills: ['Python', 'PyTorch', 'LLMs'], tracks: ['ai'], looking_for: 'team', languages: ['English'], bio: '', github: null, discoverable: false, created_at: at('2026-11-04T08:00:00+07:00') },
    ],
    check_ins: [{ user_id: 'u-binh', checked_in_at: at('2026-12-12T08:40:00+07:00') }],
    teams: [{ id: 't-1', name: odd('Lantern'), track: 'mobile', open_roles: ['ai'], owner_id: 'u-an', created_at: at('2026-11-03T09:00:00+07:00'), members: [{ user_id: 'u-an', status: 'joined' }, { user_id: 'u-binh', status: 'joined' }, { user_id: 'u-chi', status: 'invited' }] }],
    submissions: [
      { id: 'u-an', team_id: 't-1', name: odd('Lantern'), tagline: odd('Night markets, mapped'), track: 'mobile', description: odd('A map of night markets.'), stack: ['React Native', odd('Solana Pay')], integration: odd('Pays stalls with Solana Pay.'), repo_url: 'https://github.com/lantern/app', video_url: 'https://youtu.be/x', live_url: null, status: 'submitted', submitted_at: at('2026-12-13T16:10:00+07:00'), updated_at: at('2026-12-13T16:10:00+07:00') },
      { id: 'u-chi', team_id: null, name: 'Tide', tagline: 'Flood alerts', track: 'ai', description: 'Alerts for floods.', stack: ['Python'], integration: null, repo_url: 'https://github.com/chi/tide', video_url: null, live_url: null, status: 'submitted', submitted_at: at('2026-12-13T16:20:00+07:00'), updated_at: at('2026-12-13T16:20:00+07:00') },
      { id: 'u-binh', team_id: null, name: 'Draft idea', tagline: null, track: null, description: null, stack: [], integration: null, repo_url: null, video_url: null, live_url: null, status: 'draft', submitted_at: null, updated_at: at('2026-12-12T12:00:00+07:00') },
    ],
    scores: [
      { submission_id: 'u-an', judge_id: 's-keith', prototype: 20, ux: 18, technical: 22, pitch: 19, notes: odd('Strong demo'), conflict: false, updated_at: at('2026-12-13T17:00:00+07:00') },
      { submission_id: 'u-an', judge_id: 's-vinh', prototype: 22, ux: 20, technical: 21, pitch: 20, notes: null, conflict: false, updated_at: at('2026-12-13T17:05:00+07:00') },
      { submission_id: 'u-chi', judge_id: 's-keith', prototype: null, ux: null, technical: null, pitch: null, notes: null, conflict: true, updated_at: at('2026-12-13T17:10:00+07:00') },
      { submission_id: 'u-chi', judge_id: 's-vinh', prototype: 21, ux: 20, technical: 21, pitch: 20, notes: null, conflict: false, updated_at: at('2026-12-13T17:12:00+07:00') },
    ],
    crew: [
      { id: 's-org', name: 'Matt Sim', role: 'organizer', created_at: at('2026-11-05T09:00:00+07:00'), revoked_at: null, sessions: 1, last_seen_at: at('2026-11-05T09:59:00+07:00') },
      { id: 's-keith', name: odd('Keith Vaughan'), role: 'judge', created_at: at('2026-11-05T09:10:00+07:00'), revoked_at: null, sessions: 1, last_seen_at: at('2026-12-13T17:10:00+07:00') },
      { id: 's-vinh', name: 'VC Vinh', role: 'judge', created_at: at('2026-11-05T09:11:00+07:00'), revoked_at: null, sessions: 2, last_seen_at: at('2026-12-13T17:12:00+07:00') },
      { id: 's-door', name: 'Door volunteer', role: 'crew', created_at: at('2026-11-05T09:12:00+07:00'), revoked_at: at('2026-11-05T09:30:00+07:00'), sessions: 0, last_seen_at: null },
    ],
    inquiries: [{ id: 1, company: odd('Acme'), name: 'Lan Vo', email: 'lan@acme.example', tier: 'track', message: odd('We would like to sponsor a track.'), lang: 'en', page: '/sponsors/', status: 'new', notes: null, created_at: at('2026-11-04T10:00:00+07:00'), updated_at: at('2026-11-04T10:00:00+07:00') }],
    announcements: [
      { id: 5, body: odd('Judging starts soon.'), published_at: at('2026-12-31T09:00:00+07:00') },
      { id: 3, body: 'Registration is not open yet. Join the waitlist in the app to hear first when it opens: your details carry over to registration.', published_at: at('2026-10-30T09:02:00+07:00') },
    ],
    threads: [
      { id: 'c-1', builder_id: 'u-binh', created_at: at('2026-11-04T09:00:00+07:00'), messages: [{ id: 'm1', from_organizers: false, body: odd('Is there parking at the venue?'), created_at: at('2026-11-04T09:00:00+07:00') }] },
      { id: 'c-2', builder_id: 'u-an', created_at: at('2026-11-03T09:00:00+07:00'), messages: [{ id: 'm2', from_organizers: false, body: 'Can we bring a monitor?', created_at: at('2026-11-03T09:00:00+07:00') }, { id: 'm3', from_organizers: true, body: 'Yes, one per team.', created_at: at('2026-11-03T10:00:00+07:00') }] },
    ],
  };
}

export function sampleProjects({ open = true, hostile = false } = {}) {
  const event = sampleEvent({ hostile });
  return {
    staff: { id: 's-keith', name: 'Keith Vaughan', role: 'judge' },
    judging_open: open,
    projects: event.submissions.filter((item) => item.status === 'submitted').map((item) => ({
      ...item, team: item.team_id ? event.teams[0].name : null, members: item.team_id ? ['An Nguyen', 'Binh Tran'] : ['Chi Le'],
      score: event.scores.find((score) => score.submission_id === item.id && score.judge_id === 's-keith') ?? null,
    })),
  };
}
