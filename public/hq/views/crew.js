// The crew: who can use HQ. Each person has a personal access code, shown once when it is made.
import { html } from '../../src/lib/html.js';
import { icon } from '../../src/lib/icons.js';
import { EVENT } from '../../src/data/event.js';
import { ROLE_LABEL, ago } from '../model.js';
import { head, waiting } from './common.js';

const ROLE_HELP = {
  organizer: 'Everything in HQ, including the crew and the event switches.',
  judge: 'The submitted projects and their own scores.',
  crew: 'The check-in desk only: look up a pass and check its builder in.',
};

export default {
  title: () => 'Crew',
  roles: ['organizer'],
  render(state, params, ctx) {
    if (!state.event) return html`<section class="view">${head('Crew', 'Crew')}${waiting(state)}</section>`;
    const crew = state.event.crew ?? [];
    const revealed = state.ui.revealed;
    return html`<section class="view">
      ${head('Crew', 'Crew and judges', 'Everyone who can sign in to HQ. Each person gets a personal access code: send it to them privately. Codes are stored only in scrambled form, so a lost code is replaced, not looked up.')}
      ${revealed ? html`<div class="card accent code-card" role="status">
        <p class="eyebrow">Access code for ${revealed.name} · ${ROLE_LABEL[revealed.role]}</p>
        <p class="access-code mono" id="revealed-code">${revealed.code}</p>
        <p class="small-print">Shown only now. Send it to ${revealed.name} by direct message with the HQ address, ${EVENT.appUrl}hq/. Anyone with the code can sign in as them until you revoke it.</p>
        <div class="form-actions"><button type="button" class="btn primary small" data-action="copy" data-text="${revealed.code}">${icon('copy')} Copy code</button><button type="button" class="btn ghost small" data-action="hide-code">Done</button></div>
      </div>` : ''}
      <form class="card" data-form="add-staff" novalidate>
        <div class="card-head"><h2>Add someone</h2></div>
        <div class="grid cols-2">
          <div class="field"><label for="f-staff-name">Name</label><input class="input" id="f-staff-name" name="name" maxlength="60" autocomplete="off" placeholder="Keith Vaughan"></div>
          <div class="field"><label for="f-staff-role">Role</label><select id="f-staff-role" name="role">${Object.entries(ROLE_LABEL).map(([id, label]) => html`<option value="${id}" ${id === 'judge' ? 'selected' : ''}>${label}</option>`)}</select></div>
        </div>
        <ul class="small-print role-help">${Object.entries(ROLE_HELP).map(([id, text]) => html`<li><strong>${ROLE_LABEL[id]}:</strong> ${text}</li>`)}</ul>
        <div class="form-actions"><button class="btn primary" type="submit">${icon('key')} Create their code</button></div>
      </form>
      <div class="table-wrap"><table class="data">
        <thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Last seen</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>${crew.map((member) => html`<tr>
          <th scope="row" data-label="Name">${member.name}${member.id === state.staff.id ? html`<span class="cell-sub">You</span>` : ''}</th>
          <td data-label="Role">${ROLE_LABEL[member.role]}</td>
          <td data-label="Status">${member.revoked_at ? html`<span class="pill">Revoked</span>` : html`<span class="pill gold">Active</span>`}${member.sessions ? html`<span class="cell-sub">Signed in on ${member.sessions} ${member.sessions === 1 ? 'device' : 'devices'}</span>` : ''}</td>
          <td data-label="Last seen">${member.last_seen_at ? ago(member.last_seen_at, ctx.now()) : 'Never'}</td>
          <td data-label="Actions"><div class="row">
            <button type="button" class="btn small" data-action="new-code" data-id="${member.id}" data-name="${member.name}">${icon('key')} ${member.revoked_at ? 'Restore with a new code' : 'New code'}</button>
            ${member.revoked_at || member.id === state.staff.id ? '' : html`<button type="button" class="btn ghost small" data-action="revoke" data-id="${member.id}" data-name="${member.name}">Revoke</button>`}
          </div></td>
        </tr>`)}</tbody>
      </table></div>
    </section>`;
  },
  forms: {
    async 'add-staff'(form, event, ctx) {
      const data = new FormData(form);
      const name = String(data.get('name') ?? '').trim();
      if (name.length < 2) { form.querySelector('#f-staff-name').focus(); ctx.toast('Give their name, 2 to 60 characters.', { title: 'Crew' }); return; }
      const created = await ctx.run(() => ctx.api.addStaff(name, String(data.get('role'))), null);
      if (created) {
        ctx.update((state) => { state.ui.revealed = created; });
        scrollTo(0, 0);
      }
    },
  },
  actions: {
    async 'new-code'(button, event, ctx) {
      const self = button.dataset.id === ctx.state.staff.id;
      if (!confirm(`Give ${button.dataset.name} a new code? ${self ? 'Your other devices are signed out; this one stays signed in.' : 'Their old code stops working and their devices are signed out.'}`)) return;
      const renewed = await ctx.run(() => ctx.api.newCode(button.dataset.id), null);
      if (renewed) {
        ctx.update((state) => { state.ui.revealed = renewed; });
        scrollTo(0, 0);
      }
    },
    async revoke(button, event, ctx) {
      if (!confirm(`Revoke ${button.dataset.name}? Their code stops working and their devices are signed out. Their scores stay.`)) return;
      await ctx.run(() => ctx.api.revokeStaff(button.dataset.id), `${button.dataset.name} can no longer sign in.`);
    },
    'hide-code'(button, event, ctx) { ctx.update((state) => { state.ui.revealed = null; }); },
  },
};
