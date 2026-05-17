import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { StorageService, StoredFile } from './storage.interface';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly logger = new Logger(LocalStorageService.name);

  async store(file: Express.Multer.File): Promise<StoredFile> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const dest = path.join(UPLOAD_DIR, file.filename);
    await fs.rename(file.path, dest);
    return {
      filename: file.filename,
      url: `${BASE_URL}/uploads/${file.filename}`,
      size: file.size,
    };
  }

  async delete(filename: string): Promise<void> {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, filename));
    } catch (err) {
      this.logger.warn(`Could not delete file ${filename}: ${err}`);
    }
  }
}
