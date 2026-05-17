import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
// file-type v16 is CJS-compatible
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fileType = require('file-type');

// Maps declared MIME types → allowed actual magic-byte MIME types.
// A declared MIME is the key; value is the set of magic-byte MIMEs that are acceptable.
const MIME_WHITELIST: Record<string, Set<string>> = {
  'image/jpeg':   new Set(['image/jpeg']),
  'image/png':    new Set(['image/png']),
  'image/gif':    new Set(['image/gif']),
  'image/webp':   new Set(['image/webp']),
  'image/svg+xml': new Set(['application/xml', 'text/xml', 'image/svg+xml']), // SVG is XML
  'application/pdf': new Set(['application/pdf']),
  'application/zip': new Set(['application/zip']),
  'application/x-zip-compressed': new Set(['application/zip']),
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': new Set(['application/zip']),   // xlsx = zip
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': new Set(['application/zip']), // docx = zip
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': new Set(['application/zip']), // pptx = zip
  'application/msword': new Set(['application/x-cfb']),
  'application/vnd.ms-excel': new Set(['application/x-cfb']),
  'application/vnd.ms-powerpoint': new Set(['application/x-cfb']),
  // Text files: file-type returns undefined for plain text — treated as safe
  'text/plain': new Set(['__text__']),
  'text/csv': new Set(['__text__']),
  'text/markdown': new Set(['__text__']),
  'application/json': new Set(['__text__']),
};

export async function validateMagicBytes(file: Express.Multer.File): Promise<void> {
  // Read first 4100 bytes (enough for magic number detection)
  let buf: Buffer;
  try {
    const fd = await fs.open(file.path, 'r');
    buf = Buffer.alloc(4100);
    const { bytesRead } = await fd.read(buf, 0, 4100, 0);
    await fd.close();
    buf = buf.slice(0, bytesRead);
  } catch {
    throw new BadRequestException('Could not read uploaded file');
  }

  const detected = await fileType.fromBuffer(buf);
  const declaredMime = file.mimetype;
  const allowedSet = MIME_WHITELIST[declaredMime];

  if (!allowedSet) {
    throw new BadRequestException(`File type "${declaredMime}" is not permitted`);
  }

  if (!detected) {
    // file-type returns undefined for text/plain, CSV, JSON, SVG — these are safe
    if (!allowedSet.has('__text__') && declaredMime !== 'image/svg+xml') {
      throw new BadRequestException(
        `Could not verify file type for "${declaredMime}" — upload rejected`,
      );
    }
    return; // text file, allow
  }

  if (!allowedSet.has(detected.mime)) {
    throw new BadRequestException(
      `File content (${detected.mime}) does not match declared type (${declaredMime})`,
    );
  }
}
