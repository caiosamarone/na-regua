import { CloudinaryService } from "../../../shared/services/cloudinary.service";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "../models/upload.schema";
import { InvalidFileTypeError, FileTooLargeError } from "../errors/upload-errors";

export class UploadGalleryImageUseCase {
  constructor(private cloudinaryService: CloudinaryService) {}

  async execute(barbershopId: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      throw new InvalidFileTypeError();
    }

    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new FileTooLargeError();
    }

    const url = await this.cloudinaryService.uploadGalleryImage(barbershopId, fileBuffer, mimeType);

    return url;
  }
}
