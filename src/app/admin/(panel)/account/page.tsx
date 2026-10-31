import { requireAdmin } from '@/lib/admin/auth';
import { PageBody, PageHeader } from '@/components/admin/Page';
import { PasswordForm } from '@/components/admin/PasswordForm';

export const metadata = { title: 'Account' };

export default async function AccountPage() {
  const me = await requireAdmin();
  return (
    <>
      <PageHeader eyebrow="Account" title="Your account" description={`Signed in as ${me.email} (${me.role}).`} />
      <PageBody>
        <PasswordForm />
      </PageBody>
    </>
  );
}
