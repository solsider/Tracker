import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { StorageService, StoredFile } from './storage.interface';

// S3 SDK is loaded dynamically so the app works without @aws-sdk installed.
// Set STORAGE_DRIVER=s3 and install @aws-sdk/client-s3 to enable.
let S3Client: any;
let PutObjectCommand: any;
let DeleteObjectCommand: any;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ({ S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3'));
} catch {
  // not installed — S3StorageService will throw on first use
}

const S3_BUCKET = process.env.S3_BUCKET ?? '';
const S3_REGION = process.env.S3_REGION ?? 'us-east-1';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY_ID ?? '';
const S3_SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY ?? '';
const S3_ENDPOINT = process.env.S3_ENDPOINT; // optional: MinIO / R2 / custom
const CDN_BASE_URL = process.env.CDN_BASE_URL; // optional: CloudFront / custom CDN

@Injectable()
export class S3StorageService extends StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private client: any;

  constructor() {
    super();
    if (!S3Client) {
      throw new Error('@aws-sdk/client-s3 is not installed. Run: npm i @aws-sdk/client-s3');
    }
    this.client = new S3Client({
      region: S3_REGION,
      credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
      ...(S3_ENDPOINT ? { endpoint: S3_ENDPOINT, forcePathStyle: true } : {}),
    });
  }

  async store(file: Express.Multer.File): Promise<StoredFile> {
    const body = await fs.readFile(file.path);

    await this.client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: file.filename,
        Body: body,
        ContentType: file.mimetype,
        ContentLength: file.size,
      }),
    );

    // Clean up temp file after upload
    fs.unlink(file.path).catch(() => undefined);

    const url = CDN_BASE_URL
      ? `${CDN_BASE_URL}/${file.filename}`
      : `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${file.filename}`;

    this.logger.log(`Uploaded ${file.filename} to s3://${S3_BUCKET}`);

    return { filename: file.filename, url, size: file.size };
  }

  async delete(filename: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: filename }),
      );
    } catch (err) {
      this.logger.warn(`Could not delete s3://${S3_BUCKET}/${filename}: ${err}`);
    }
  }
}
