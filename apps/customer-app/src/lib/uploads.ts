/**
 * Prescription upload.
 *
 * Two hops on purpose: the app asks the API for a short-lived signed URL, then
 * PUTs the bytes straight to Supabase Storage. The service-role key never leaves
 * the server and the file never passes through the API process.
 *
 * In demo mode `prescriptionUploadUrl` hands back an empty `upload_url`, so this
 * skips the PUT and returns the placeholder — the checkout flow stays walkable
 * without a backend.
 */
import { data } from './data';

export interface PickedFile {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

/** `image/jpeg` → `jpg`. Falls back to `jpg` for anything unrecognised. */
function extensionFor(mimeType: string | null | undefined, uri: string): string {
  const fromUri = uri.split('?')[0].split('.').pop();
  if (fromUri && fromUri.length <= 4 && !fromUri.includes('/')) return fromUri.toLowerCase();
  if (mimeType?.includes('png')) return 'png';
  if (mimeType?.includes('pdf')) return 'pdf';
  if (mimeType?.includes('heic')) return 'heic';
  return 'jpg';
}

/**
 * Uploads a picked image and resolves to the URL to store on the order.
 * Throws with a message safe to surface in a toast.
 */
export async function uploadPrescription(file: PickedFile): Promise<string> {
  const contentType = file.mimeType ?? 'image/jpeg';
  const name =
    file.fileName?.trim() || `prescription-${Date.now()}.${extensionFor(contentType, file.uri)}`;

  const { upload_url, public_url } = await data.prescriptionUploadUrl(name, contentType);

  // Demo mode: no storage bucket to write to.
  if (!upload_url) return public_url;

  const localRead = await fetch(file.uri);
  if (!localRead.ok) throw new Error('Could not read that file from your device.');
  const blob = await localRead.blob();

  const put = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!put.ok) throw new Error('The upload failed. Check your connection and try again.');

  return public_url;
}
