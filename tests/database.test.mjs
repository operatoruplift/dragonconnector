import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { profilePayload, registrationPayload, submissionPayload } from '../public/src/lib/backend.js';

const directory = new URL('../supabase/migrations/', import.meta.url);
const sql = readdirSync(directory).filter((file) => file.endsWith('.sql')).sort().map((file) => readFileSync(new URL(file, directory), 'utf8')).join('\n');
const client = readFileSync(new URL('../public/src/lib/backend.js', import.meta.url), 'utf8');

function columns(table) {
  const block = sql.match(new RegExp(`create table public\\.${table} \\(([\\s\\S]*?)\\n\\);`));
  assert.ok(block, `table ${table} exists`);
  const names = block[1].split('\n').map((line) => line.trim().match(/^([a-z_]+) /)?.[1]).filter((name) => name && name !== 'check');
  for (const [, name] of sql.matchAll(new RegExp(`alter table public\\.${table} add column ([a-z_]+)`, 'g'))) names.push(name);
  return names;
}

function parameters(name) {
  const header = sql.match(new RegExp(`function public\\.${name}\\(([^)]*)\\)`));
  assert.ok(header, `function ${name} exists`);
  return header[1].split(',').map((part) => part.trim().split(/\s+/)[0]).filter(Boolean);
}

test('every table has row-level security, and every function pins its search path', () => {
  const tables = [...sql.matchAll(/create table public\.(\w+)/g)].map(([, table]) => table);
  assert.ok(tables.length >= 14);
  for (const table of tables) assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`), table);
  const functions = [...sql.matchAll(/create (?:or replace )?function ([\w.]+)\(([\s\S]*?)\$\$/g)];
  assert.ok(functions.length >= 15);
  for (const [, name, header] of functions) assert.match(header, /set search_path = ''/, name);
});

test('signed-out visitors can only join the waitlist and read the public settings and announcements', () => {
  const grants = [...sql.matchAll(/^grant [^;]+;/gm)].map(([grant]) => grant).filter((grant) => /\banon\b/.test(grant));
  assert.deepEqual(grants, ['grant execute on function public.join_waitlist(text, text, text, text) to anon, authenticated;']);
  const policies = [...sql.matchAll(/create policy "[^"]+" on public\.(\w+) for (\w+) to anon/g)].map(([, table, action]) => `${table}:${action}`);
  assert.deepEqual(policies.sort(), ['announcements:select', 'event_settings:select']);
});

test('the app only uses tables, columns, functions and arguments the migrations create', () => {
  const constants = Object.fromEntries([...client.matchAll(/const ([A-Z_]+_COLUMNS) = '([^']+)'/g)].map(([, name, list]) => [name, list]));
  const selects = [...client.matchAll(/from\('(\w+)'\)\.select\((?:'([^']+)'|([A-Z_]+))\)/g)];
  assert.ok(selects.length >= 15);
  for (const [, table, literal, constant] of selects) {
    for (const column of (literal ?? constants[constant]).split(',').map((part) => part.trim())) {
      const embedded = column.match(/^(\w+)\((\w+)\)$/);
      if (embedded) assert.ok(columns(embedded[1]).includes(embedded[2]), `${embedded[1]}.${embedded[2]}`);
      else assert.ok(columns(table).includes(column), `${table}.${column}`);
    }
  }
  for (const [, table, chain] of client.matchAll(/from\('(\w+)'\)((?:(?!from\()[^;\n])*)/g)) {
    for (const [, column] of chain.matchAll(/\.(?:eq|neq|in|order)\('(\w+)'/g)) assert.ok(columns(table).includes(column), `${table}.${column} (filter)`);
  }

  const calls = [...client.matchAll(/(?:rpc|call)\('(\w+)'(?:, \{([^}]*)\})?\)/g)];
  assert.ok(calls.length >= 10);
  for (const [, name, args] of calls) {
    const keys = (args ?? '').split(',').map((part) => part.trim().split(':')[0].trim()).filter(Boolean);
    assert.deepEqual(keys.sort(), parameters(name).sort(), name);
  }

  const state = {
    profile: { name: 'An Nguyen', role: 'design', skills: ['Figma'], tracks: ['mobile'], lookingFor: 'team', languages: [], formats: [], bio: '', github: '' },
    registration: { status: 'pre-registered', data: { name: 'An', email: 'an@example.com', format: 'A', experience: 'some', conduct: true, media: 'no' } },
    submission: { status: 'draft', data: { name: 'Lantern' } },
    passCode: 'DC-7KQ4-M2XP',
    team: null,
  };
  const writes = { profiles: profilePayload(state.profile, 'u'), registrations: registrationPayload(state, 'u'), submissions: submissionPayload(state, 'u') };
  for (const [table, payload] of Object.entries(writes)) for (const column of Object.keys(payload)) assert.ok(columns(table).includes(column), `${table}.${column} (write)`);
  for (const column of ['id', 'conversation_id', 'body']) assert.ok(columns('messages').includes(column), `messages.${column} (write)`);

  const live = sql.match(/alter publication supabase_realtime add table ([^;]+);/)[1];
  for (const [, table] of client.matchAll(/table: '(\w+)'/g)) assert.match(live, new RegExp(`public\\.${table}\\b`), `${table} sends live updates`);
});
