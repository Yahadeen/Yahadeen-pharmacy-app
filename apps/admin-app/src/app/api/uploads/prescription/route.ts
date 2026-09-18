import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file_name, content_type } = body;

    if (!file_name || !content_type) {
      return NextResponse.json(
        { error: 'file_name and content_type are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(content_type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, GIF, and PDF are allowed.' },
        { status: 400 }
      );
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

    // Generate unique filename for prescription uploads
    const fileExtension = file_name.split('.').pop() || 'jpg';
    const uniqueFileName = `prescriptions/${crypto.randomUUID()}.${fileExtension}`;
    const publicUrl = `${r2PublicUrl}/${uniqueFileName}`;

    // Return upload information for the client
    // The client will upload directly to /api/upload with the file
    return NextResponse.json({
      upload_url: '', // Not using presigned URLs, will use direct upload
      public_url: publicUrl,
      upload_info: {
        endpoint: '/api/upload',
        folder: 'prescriptions',
        expected_filename: uniqueFileName,
      }
    });
  } catch (error: any) {
    console.error('Error in prescription upload:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
