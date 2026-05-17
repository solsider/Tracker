import {
  Controller, Post, Get, Delete, Param, ParseIntPipe,
  UseGuards, UseInterceptors, UploadedFile, UploadedFiles,
  Request, Res, StreamableFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';

const multerStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'tmp'),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const multerOptions = {
  storage: multerStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
};

const multiOptions = {
  storage: multerStorage,
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
};

@Controller('projects/:projectId/issues/:number/attachments')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', multerOptions))
  upload(
    @Param('projectId') projectId: string,
    @Param('number', ParseIntPipe) number: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.uploadsService.uploadToIssue(projectId, number, file, req.user.id);
  }

  @Post('multi')
  @UseInterceptors(FilesInterceptor('files', 10, multiOptions))
  uploadMany(
    @Param('projectId') projectId: string,
    @Param('number', ParseIntPipe) number: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ) {
    return this.uploadsService.uploadManyToIssue(projectId, number, files, req.user.id);
  }

  @Get()
  list(
    @Param('projectId') projectId: string,
    @Param('number', ParseIntPipe) number: number,
    @Request() req: any,
  ) {
    return this.uploadsService.listForIssue(projectId, number, req.user.id);
  }
}

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentController {
  constructor(private uploadsService: UploadsService) {}

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.uploadsService.delete(id, req.user.id);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    const att = await this.uploadsService.findOne(id, req.user.id);
    const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
    const filePath = join(uploadDir, att.filename);
    const stream = createReadStream(filePath);

    res.set({
      'Content-Type': att.mimetype,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(att.originalName)}`,
      'Content-Length': att.size,
    });

    return new StreamableFile(stream);
  }
}
