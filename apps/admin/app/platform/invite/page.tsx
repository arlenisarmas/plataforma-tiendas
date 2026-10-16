import { adminLocale, adminText } from '../../../lib/locale';
import { pendingInvitations, platformStores } from '../../../lib/platform-data';
import { countryCodes } from '../../../lib/store-setup';
import { revokeInvitation } from '../actions';
import { Panel } from '../parts';
import { PlatformShell, relativeLabel } from '../platform-shell';
import { InviteForm } from './invite-form';
import { ResendButton } from './resend-button';

const labelKeys = ['what', 'own', 'ownHelp', 'help', 'helpHelp', 'name', 'email', 'maxStores', 'createNow', 'storeName',
  'country', 'store', 'role', 'roleStaff', 'roleOwner', 'alsoCreate', 'send', 'sendCreate', 'mailPreview', 'mailHeading',
  'mailBody', 'mailButton', 'mailFoot', 'sent', 'link', 'error', 'storeError'] as const;

export default async function InvitePage() {
  const [t, locale] = await Promise.all([adminText(), adminLocale()]);
  return <PlatformShell active="invite">{async (viewer) => {
    const [stores, pending] = await Promise.all([platformStores(viewer.client), pendingInvitations(viewer.client)]);
    const names = new Intl.DisplayNames([locale], { type: 'region' });
    const countries = countryCodes.map((code) => ({ code, name: names.of(code) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
    const labels = Object.fromEntries(labelKeys.map((key) => [key, t.raw(`platform.invite.${key}`) as string])) as Record<(typeof labelKeys)[number], string>;
    const storeNames = new Map(stores.map((store) => [store.id, store.name]));
    return <main className="flex flex-col gap-6 px-4 py-7 md:px-8">
      <h1 className="m-0 text-3xl">{t('platform.invite.title')}</h1>
      <InviteForm labels={labels} stores={stores.filter((store) => store.status !== 'suspended').map(({ id, name }) => ({ id, name }))} countries={countries} />
      <Panel title={`${t('platform.invite.pending')} · ${pending.length}`}>
        {pending.length === 0 ? <p className="m-0 px-5 py-4 text-[#a3a9b8]">{t('platform.invite.noPending')}</p>
          : <ul className="m-0 list-none p-0">{pending.map((invitation) => <li key={invitation.id}
              className="flex flex-wrap items-center gap-4 border-b border-[#1f2330] px-5 py-3.5 last:border-0">
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-[15px]">{invitation.full_name ? `${invitation.full_name} · ` : ''}{invitation.email}</strong>
                <span className="text-sm text-[#a3a9b8]">
                  {invitation.store_id ? t('platform.invite.forStore', { store: storeNames.get(invitation.store_id) ?? '—' }) : ''}
                  {invitation.store_id && invitation.can_create_stores ? ' · ' : ''}
                  {invitation.can_create_stores ? t('platform.invite.canCreateN', { count: invitation.max_stores }) : ''}
                  {' · '}{t('platform.invite.expires', { when: relativeLabel(invitation.expires_at, locale) })}</span>
              </span>
              <ResendButton id={invitation.id} email={invitation.email} name={invitation.full_name}
                label={t('platform.invite.resend')} linkLabel={t('platform.invite.link')} />
              <form action={revokeInvitation}><input type="hidden" name="id" value={invitation.id} />
                <button type="submit" className="min-h-10 rounded-lg px-3 text-sm text-[#ff9aa5] underline">{t('platform.invite.revoke')}</button></form>
            </li>)}</ul>}
      </Panel>
    </main>;
  }}</PlatformShell>;
}
