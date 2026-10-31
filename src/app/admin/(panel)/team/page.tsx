import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import { env } from '@/lib/env';
import { PageBody, PageHeader } from '@/components/admin/Page';
import { TeamManager } from '@/components/admin/TeamManager';

export const metadata = { title: 'Team' };

export default async function TeamPage() {
  const me = await requireAdmin();
  const { data } = await getSupabaseAdmin().from('admin_users').select('user_id, email, role, created_at').order('created_at');
  return (
    <>
      <PageHeader eyebrow="Store" title="Team" description="Give staff their own login instead of sharing yours." />
      <PageBody>
        <TeamManager owners={env.adminEmails} members={data ?? []} canManage={me.role === 'owner'} meId={me.id} />
      </PageBody>
    </>
  );
}
