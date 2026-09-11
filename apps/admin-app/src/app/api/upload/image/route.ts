import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/server/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'product', 'category', 'avatar'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['product', 'category', 'avatar'].includes(type)) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
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

    // Get R2 credentials from environment
    const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    if (!r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey || !r2Bucket || !r2PublicUrl) {
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

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const folder = type === 'avatar' ? `avatars/${auth.userId}` : type;
    const fileName = `${folder}/${crypto.randomUUID()}.${fileExtension}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2 using AWS SDK
    const command = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Return the public URL
    const publicUrl = `${r2PublicUrl}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      id: fileName,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
