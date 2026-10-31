'use client';

import { createUploadTarget } from '@/app/admin/_actions/uploads';

/** Downscale large photos to max 2000px WebP in the browser before upload. */
async function compress(file: File): Promise<Blob> {
  if (file.type === 'image/gif' || file.size < 400 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.86));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export async function uploadImage(file: File, folder: 'products' | 'categories' | 'collections' | 'site'): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
  if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} is larger than 25 MB.`);
  const blob = await compress(file);
  const type = blob.type || file.type;
  const target = await createUploadTarget(folder, file.name, type);
  if (!target.ok) throw new Error(target.error);
  const { signedUrl, publicUrl } = target.data!;
  // Upload straight to Supabase Storage with the one-time signed URL — no keys in the browser.
  const body = new FormData();
  body.append('cacheControl', '31536000');
  body.append('', new File([blob], file.name, { type }));
  const res = await fetch(signedUrl, { method: 'PUT', body, headers: { 'x-upsert': 'false' } });
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const j = await res.json();
      msg = j.message || j.error || msg;
    } catch {
      /* not JSON */
    }
    throw new Error(`Upload failed: ${msg}`);
  }
  return publicUrl;
}
