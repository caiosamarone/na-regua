import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  async uploadBarbershopLogo(
    barbershopId: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${fileBuffer.toString("base64")}`,
      {
        folder: `na-regua/barbershops/${barbershopId}`,
        public_id: "logo",
        overwrite: true,
      },
    );
    return result.secure_url;
  }

  async uploadGalleryImage(
    barbershopId: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${fileBuffer.toString("base64")}`,
      {
        folder: `na-regua/barbershops/${barbershopId}/gallery`,
        overwrite: false,
      },
    );
    return result.secure_url;
  }

  async deleteImage(imageUrl: string): Promise<void> {
    const url = new URL(imageUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");
    if (uploadIndex === -1) return;

    let publicIdSegments = segments.slice(uploadIndex + 1);

    if (publicIdSegments.length > 0 && /^v\d+$/.test(publicIdSegments[0])) {
      publicIdSegments = publicIdSegments.slice(1);
    }

    const last = publicIdSegments[publicIdSegments.length - 1];
    const dotIndex = last.lastIndexOf(".");
    if (dotIndex > 0) {
      publicIdSegments[publicIdSegments.length - 1] = last.substring(0, dotIndex);
    }

    const publicId = publicIdSegments.join("/");
    await cloudinary.uploader.destroy(publicId);
  }

  async uploadStaffAvatar(
    staffId: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${fileBuffer.toString("base64")}`,
      {
        folder: `na-regua/staff/${staffId}`,
        public_id: "avatar",
        overwrite: true,
      },
    );
    return result.secure_url;
  }
}
