import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface S3StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region?: string;
  endpoint?: string;
  publicUrl?: string;
}

export class S3Storage {
  private client: S3Client;
  private bucket: string;
  private publicUrl?: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;

    const clientConfig: any = {
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // Force path-style URLs for Cloudflare R2 compatibility
      forcePathStyle: true,
    };

    // Only set endpoint if it's a valid non-empty string
    if (config.endpoint && config.endpoint.trim() !== '') {
      clientConfig.endpoint = config.endpoint;
      // For Cloudflare R2, use 'auto' as a dummy region when endpoint is set
      clientConfig.region = 'auto';
    } else {
      // Use the provided region or default
      clientConfig.region = 'auto';
    }

    this.client = new S3Client(clientConfig);
  }

  /**
   * Upload a file to S3
   */
  async put(key: string, content: Buffer | string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: content,
    });

    await this.client.send(command);
  }

  /**
   * Delete a file from S3
   */
  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * Check if a file exists in S3
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get the URL for a file
   * Returns public URL if configured, otherwise generates a presigned URL
   */
  async getUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // If public URL is configured, return it
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }

    // Otherwise, generate a presigned URL
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      return await getSignedUrl(this.client, command, {
        expiresIn,
        // Cloudflare R2 requires signingRegion to be set
        signableHeaders: new Set(['host']),
      });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw error;
    }
  }

  /**
   * List files with a given prefix
   */
  async list(
    prefix: string = '',
  ): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });

    const response = await this.client.send(command);

    return (
      response.Contents?.map((item) => ({
        key: item.Key || '',
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
      })) || []
    );
  }

  /**
   * Get file as buffer
   */
  async get(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }
}
