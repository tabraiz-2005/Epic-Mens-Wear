'use server';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { assertAdmin, fail, type ActionResult } from '@/lib/admin/auth';
import { BUCKET } from '@/lib/admin/health';

const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

async function ensureBucket() {
  const admin = getSupabaseAdmin();
  const { data } = await admin.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10 * 1024 * 1024, allowedMimeTypes: TYPES });
  if (error && !/exists/i.test(error.message)) throw error;
}

/** Returns a one-time signed URL the browser uploads to directly (bypasses Vercel's body limit). */
export async function createUploadTarget(
  folder: 'products' | 'categories' | 'collections' | 'site',
  fileName: string,
  contentType: string
): Promise<ActionResult<{ path: string; signedUrl: string; publicUrl: string }>> {
  try {
    await assertAdmin();
    if (!TYPES.includes(contentType)) return { ok: false, error: 'Use a JPG, PNG, WebP, AVIF or GIF image.' };
    await ensureBucket();
    const ext = contentType.split('/')[1].replace('jpeg', 'jpg');
    const base = fileName.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'image';
    const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${base}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw error ?? new Error('Could not prepare the upload.');
    const publicUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    return { ok: true, data: { path, signedUrl: data.signedUrl, publicUrl } };
  } catch (e) {
    return fail(e);
  }
}
