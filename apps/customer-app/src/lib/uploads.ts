/**
 * Prescription upload.
 *
 * Direct upload to R2 storage using the modern File API for Expo.
 * The file is uploaded directly to the server which then stores it in R2.
 *
 * In demo mode `prescriptionUploadUrl` hands back an empty `upload_url`, so this
 * skips the upload and returns the placeholder — the checkout flow stays walkable
 * without a backend.
 */
import { data } from './data';
import { supabase } from './supabase';
import { File } from 'expo-file-system';

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

  const { upload_info, public_url } = await data.prescriptionUploadUrl(name, contentType);

  // Demo mode: no storage bucket to write to.
  if (!upload_info) return public_url;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Please sign in again before uploading your prescription.');
  }

  // Create FormData and append the blob directly with the filename
  const formData = new FormData();
  formData.append('file', new File(file.uri), name);
  formData.append('fileName', name);
  formData.append('mimeType', contentType);

  // Build full endpoint URL
  const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
  const uploadEndpoint = upload_info.endpoint.startsWith('http')
    ? upload_info.endpoint
    : `${BASE_URL}${upload_info.endpoint}`;

  // Upload directly to the server endpoint
  const uploadResponse = await fetch(uploadEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-upload-type': 'prescription',
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Upload failed: ${errorText}`);
  }

  const uploadResult = await uploadResponse.json();
  return uploadResult.url || public_url;
}
