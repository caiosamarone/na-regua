import { CloudinaryService } from "../../../shared/services/cloudinary.service";
import { UploadRepository } from "../gateways/upload.repository";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "../models/upload.schema";
import { InvalidFileTypeError, FileTooLargeError, BarbershopNotFoundError } from "../errors/upload-errors";

export class UploadBarbershopLogoUseCase {
  constructor(
    private uploadRepository: UploadRepository,
    private cloudinaryService: CloudinaryService,
  ) {}

  async execute(barbershopId: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      throw new InvalidFileTypeError();
    }

    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new FileTooLargeError();
    }

    const barbershop = await this.uploadRepository.findBarbershopById(barbershopId);
    if (!barbershop) throw new BarbershopNotFoundError();

    const url = await this.cloudinaryService.uploadBarbershopLogo(barbershopId, fileBuffer, mimeType);
    await this.uploadRepository.saveBarbershopLogo(barbershopId, url);

    return url;
  }
}
