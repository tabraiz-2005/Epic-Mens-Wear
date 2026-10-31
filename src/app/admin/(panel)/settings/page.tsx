import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PageBody, PageHeader } from '@/components/admin/Page';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { DEFAULT_SETTINGS, type StoreSettings } from '@/lib/commerce/types';

export const metadata = { title: 'Store settings' };

export default async function SettingsPage() {
  const { data } = await getSupabaseAdmin().from('store_settings').select('*').eq('id', 1).maybeSingle();
  const settings = { ...DEFAULT_SETTINGS, ...(data ?? {}) } as StoreSettings;
  return (
    <>
      <PageHeader eyebrow="Store" title="Settings" description="Changes appear on the live store as soon as you save." />
      <PageBody className="pt-0">
        <SettingsForm initial={settings} />
      </PageBody>
    </>
  );
}
