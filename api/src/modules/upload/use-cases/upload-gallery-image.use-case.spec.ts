import { UploadGalleryImageUseCase } from "./upload-gallery-image.use-case";

class MockCloudinaryService {
  async uploadGalleryImage(_barbershopId: string, _fileBuffer: Buffer, _mimeType: string) {
    return "https://res.cloudinary.com/test/gallery.jpg";
  }
}

describe("UploadGalleryImageUseCase", () => {
  let cloudinary: MockCloudinaryService;
  let useCase: UploadGalleryImageUseCase;

  const validBuffer = Buffer.alloc(1024);
  const validMime = "image/png";

  beforeEach(() => {
    cloudinary = new MockCloudinaryService();
    useCase = new UploadGalleryImageUseCase(cloudinary as any);
  });

  it("should upload gallery image", async () => {
    const url = await useCase.execute("shop-1", validBuffer, validMime);

    expect(url).toBe("https://res.cloudinary.com/test/gallery.jpg");
  });

  it("should throw InvalidFileTypeError for unsupported mime types", async () => {
    await expect(
      useCase.execute("shop-1", validBuffer, "image/gif"),
    ).rejects.toThrow("Tipo de arquivo não permitido");
  });

  it("should throw FileTooLargeError when file exceeds 5MB", async () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024);

    await expect(
      useCase.execute("shop-1", bigBuffer, validMime),
    ).rejects.toThrow("Arquivo muito grande");
  });
});
