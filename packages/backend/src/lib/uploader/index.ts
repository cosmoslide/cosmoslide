import { S3Storage } from '../storage/s3-storage';

// Initialize S3 storage with environment configuration
const storage = new S3Storage({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  bucket: process.env.S3_BUCKET || '',
  region: 'auto',
  endpoint: process.env.S3_ENDPOINT || undefined,
  publicUrl: process.env.S3_PUBLIC_URL || undefined,
});

export default storage;
