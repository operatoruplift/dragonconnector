import { html } from '../lib/html.js';
import { icon } from '../lib/icons.js';
import { BADGES, LEVELS, MAX_XP, PHASES, QUESTS, earnedBadges, levelFor, xpOf } from '../lib/game.js';
import { head } from './common.js';

export default {
  title: () => 'Quests & tasks',
  render(state) {
    const xp = xpOf(state);
    const level = levelFor(xp);
    const earned = earnedBadges(state);
    const tasks = state.tasks;
    return html`<section class="view">
      ${head('Quests & tasks', 'Your quest log', 'Every action that earns XP, grouped by stage, plus a to-do list of your own.')}
      <div class="card accent">
        <div class="card-head"><div class="stack" style="gap:4px"><p class="eyebrow">Level ${level.number} · ${level.name}</p><h2>${xp} of ${MAX_XP} XP</h2></div><span class="small-print">${level.next ? `${level.next.min - xp} XP to ${level.next.name}` : 'Top level'}</span></div>
        <div class="meter" role="progressbar" aria-label="Total XP" aria-valuemin="0" aria-valuemax="${MAX_XP}" aria-valuenow="${xp}"><span style="width:${Math.round((xp / MAX_XP) * 100)}%"></span></div>
        <div class="chips" aria-label="Levels">${LEVELS.map((item, index) => html`<span class="chip${index <= level.index ? ' gold' : ''}">${index + 1}. ${item.name} · ${item.min}</span>`)}</div>
      </div>

      ${PHASES.map((phase) => {
        const list = QUESTS.filter((quest) => quest.phase === phase);
        const done = list.filter((quest) => state.quests[quest.id]).length;
        return html`<section class="stack" aria-labelledby="phase-${phase.replace(/\W+/g, '-')}">
          <div class="card-head"><h2 id="phase-${phase.replace(/\W+/g, '-')}">${phase}</h2><span class="small-print">${done} of ${list.length}</span></div>
          <ul class="quest-list">${list.map((quest) => {
            const complete = Boolean(state.quests[quest.id]);
            return html`<li class="quest${complete ? ' done' : ''}"><span class="box">${complete ? icon('check') : ''}</span>
              <span><a class="quest-title" href="#/${quest.route}">${quest.title}</a>${quest.hint && !complete ? html`<span class="hint">${quest.hint}</span>` : ''}<span class="sr-only">${complete ? ', done' : ', not done'}</span></span>
              <span class="xp">${complete ? 'Done' : `+${quest.xp} XP`}</span></li>`;
          })}</ul>
        </section>`;
      })}

      <section class="card" aria-labelledby="tasks-title">
        <div class="card-head"><h2 id="tasks-title">My tasks</h2><span class="small-print">${tasks.filter((task) => task.done).length} of ${tasks.length} done</span></div>
        <form data-form="add-task" class="row" novalidate><label class="sr-only" for="f-task">New task</label><input class="input" id="f-task" name="text" maxlength="120" placeholder="For example: set up Anchor on my laptop" style="flex:1;min-width:180px"><button class="btn" type="submit">${icon('plus')} Add</button></form>
        ${tasks.length ? html`<div>${tasks.map((task) => html`<div class="task${task.done ? ' done' : ''}"><input type="checkbox" id="task-${task.id}" data-action="toggle-task" data-id="${task.id}" ${task.done ? 'checked' : ''}><label for="task-${task.id}"><span>${task.text}</span></label><button type="button" class="btn ghost small" data-action="delete-task" data-id="${task.id}" aria-label="Delete task: ${task.text}">${icon('trash')}</button></div>`)}</div>` : html`<p class="muted">Add your own to-dos for the build. Completing one earns the "Complete a task of your own" quest.</p>`}
      </section>

      <section class="stack" aria-labelledby="badge-title">
        <h2 id="badge-title">Badges</h2>
        <div class="badges">${BADGES.map((badge) => {
          const has = earned.includes(badge);
          return html`<div class="badge${has ? ' earned' : ''}">${icon(has ? 'star' : 'lock')}<strong>${badge.title}</strong><small>${badge.detail}</small><span class="sr-only">${has ? 'Earned' : 'Not earned yet'}</span></div>`;
        })}</div>
      </section>
    </section>`;
  },
  forms: {
    'add-task'(form, event, ctx) {
      const text = String(new FormData(form).get('text') ?? '').trim();
      if (!text) { form.querySelector('#f-task').focus(); return; }
      ctx.store.update((draft) => { draft.tasks.push({ id: String(ctx.now()), text, done: false }); });
      requestAnimationFrame(() => document.getElementById('f-task')?.focus());
    },
  },
  actions: {
    'toggle-task'(input, event, ctx) {
      ctx.store.update((draft) => { const task = draft.tasks.find((item) => item.id === input.dataset.id); if (task) task.done = !task.done; });
    },
    'delete-task'(button, event, ctx) {
      ctx.store.update((draft) => { draft.tasks = draft.tasks.filter((item) => item.id !== button.dataset.id); });
    },
  },
};
