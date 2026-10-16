import { adminText } from '../../../lib/locale';
import { panelContext } from '../../../lib/panel-data';
import { PanelShell } from '../../panel-shell';
import { TeamControls } from './team-controls';

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const [params, t] = await Promise.all([searchParams, adminText()]);
  const context = await panelContext(params.store);
  const { data: members, error } = await context.client.from('store_members').select('user_id,role')
    .eq('store_id', context.selected.id).order('created_at');
  if (error) throw error;
  const isOwner = members?.some((member) => member.user_id === context.userId && member.role === 'owner') ?? false;
  const invites = isOwner ? await context.client.from('store_invitations').select('id,email,role,expires_at,accepted_at')
    .eq('store_id', context.selected.id).is('accepted_at', null).order('created_at', { ascending: false }).limit(30) : { data: [], error: null };
  if (invites.error) throw invites.error;
  const labels = { title: t('customersPanel.team'), back: t('customersPanel.back'), invite: t('customersPanel.invite'),
    email: t('customersPanel.email'), role: t('customersPanel.role'), owner: t('customersPanel.owner'),
    staff: t('customersPanel.staff'), send: t('customersPanel.send'), link: t('customersPanel.link'),
    pending: t('customersPanel.pendingInvites'), members: t('customersPanel.members'),
    remove: t('customersPanel.remove'), removeConfirm: t('customersPanel.removeConfirm'),
    leave: t('customersPanel.leave'), leaveConfirm: t('customersPanel.leaveConfirm'),
    saved: t('customersPanel.saved'), error: t('customersPanel.error') };
  return <PanelShell context={context} active="customers"><main className="space-y-5 p-4 md:p-8">
    <a className="inline-flex min-h-11 items-center" href={`/customers?store=${context.selected.id}`}>{labels.back}</a>
    <h1 className="text-3xl font-bold">{labels.title}</h1>
    <TeamControls storeId={context.selected.id} selfId={context.userId} isOwner={isOwner}
      members={members ?? []} invitations={invites.data ?? []} labels={labels} />
  </main></PanelShell>;
}
