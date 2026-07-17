import { CloudinaryService } from "../../../shared/services/cloudinary.service";
import { UploadRepository } from "../gateways/upload.repository";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "../models/upload.schema";
import {
  InvalidFileTypeError,
  FileTooLargeError,
  StaffMemberNotFoundError,
} from "../errors/upload-errors";
import { AppError } from "../../../shared/errors/app-error";

export class UploadStaffAvatarUseCase {
  constructor(
    private uploadRepository: UploadRepository,
    private cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    barbershopId: string,
    staffId: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      throw new InvalidFileTypeError();
    }

    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new FileTooLargeError();
    }

    const staff = await this.uploadRepository.findStaffById(staffId);
    if (!staff || staff.barbershopId !== barbershopId || !staff.barbershopId) {
      throw new StaffMemberNotFoundError();
    }

    const url = await this.cloudinaryService.uploadStaffAvatar(staffId, fileBuffer, mimeType);
    await this.uploadRepository.saveStaffAvatar(barbershopId, staffId, url);

    return url;
  }
}
