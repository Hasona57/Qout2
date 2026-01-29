import { config } from 'dotenv';
import * as MinIO from 'minio';
import { registerAs } from '@nestjs/config';

config();

export const minioConfig = registerAs('minio', () => ({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  publicEndPoint: process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'qote_admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'qote_password',
  bucket: process.env.MINIO_BUCKET_NAME || 'qote-storage',
}));

export const minioClient = new MinIO.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'qote_admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'qote_password',
});

export const MINIO_BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'qote-storage';

// Initialize bucket on startup
export async function initializeMinIO() {
  const bucketExists = await minioClient.bucketExists(MINIO_BUCKET_NAME);
  if (!bucketExists) {
    await minioClient.makeBucket(MINIO_BUCKET_NAME, 'us-east-1');
    console.log(`✅ MinIO bucket '${MINIO_BUCKET_NAME}' created`);
  } else {
    console.log(`✅ MinIO bucket '${MINIO_BUCKET_NAME}' exists`);
  }

  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${MINIO_BUCKET_NAME}/*`],
      },
    ],
  };

  await minioClient.setBucketPolicy(MINIO_BUCKET_NAME, JSON.stringify(policy));
  console.log(`✅ MinIO bucket '${MINIO_BUCKET_NAME}' policy set to public read`);
}









