export interface StoredFile {
  filename: string;
  url: string;
  size: number;
}

export abstract class StorageService {
  abstract store(file: Express.Multer.File): Promise<StoredFile>;
  abstract delete(filename: string): Promise<void>;
}
