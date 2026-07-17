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
