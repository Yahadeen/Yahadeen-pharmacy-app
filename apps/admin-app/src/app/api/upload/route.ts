import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type');
    let fileBuffer: Buffer;
    let fileName: string;
    let mimeType: string;

    // Handle both FormData and JSON (base64) uploads
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      // @ts-ignore - FormData.get() is available in runtime but TypeScript types are incomplete
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }, { status: 400 });
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
      }

      fileName = file.name;
      mimeType = file.type;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else if (contentType?.includes('application/json')) {
      // Handle base64 upload from React Native
      const body = await request.json();
      const { file: base64File, fileName: providedFileName, mimeType: providedMimeType } = body;

      if (!base64File) {
        return NextResponse.json({ error: 'No file data provided' }, { status: 400 });
      }

      fileName = providedFileName || `support-${Date.now()}.jpg`;
      mimeType = providedMimeType || 'image/jpeg';

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(mimeType)) {
        return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }, { status: 400 });
      }

      // Handle data URL prefix if present
      let cleanBase64 = base64File;
      if (base64File.includes(',')) {
        cleanBase64 = base64File.split(',')[1];
      }

      // Convert base64 to buffer
      fileBuffer = Buffer.from(cleanBase64, 'base64');

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (fileBuffer.length > maxSize) {
        return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
      }
      
      console.log('Base64 upload details:', {
        fileName,
        mimeType,
        bufferSize: fileBuffer.length,
        base64Length: cleanBase64.length
      });
    } else {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Get R2 credentials from environment - support both old and new variable names
    const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || process.env.CLOUDFLARE_R2_API_URL;
    const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'pharmago';
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_DEV_URL;

    if (!r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey || !r2Bucket || !r2PublicUrl) {
      console.error('R2 storage not configured. Missing:', {
        r2Endpoint: !!r2Endpoint,
        r2AccessKeyId: !!r2AccessKeyId,
        r2SecretAccessKey: !!r2SecretAccessKey,
        r2Bucket: !!r2Bucket,
        r2PublicUrl: !!r2PublicUrl,
      });
      return NextResponse.json({ error: 'R2 storage not configured' }, { status: 500 });
    }

    // Initialize S3 client for R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    });

    // Generate unique filename for support attachments
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `support/${crypto.randomUUID()}.${fileExtension}`;

    // Upload to R2 using AWS SDK
    const command = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    // Return the public URL
    const publicUrl = `${r2PublicUrl}/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      id: uniqueFileName,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
