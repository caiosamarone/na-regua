import { UploadBarbershopLogoUseCase } from "./upload-barbershop-logo.use-case";

class MockCloudinaryService {
  async uploadBarbershopLogo(_barbershopId: string, _fileBuffer: Buffer, _mimeType: string) {
    return "https://res.cloudinary.com/test/logo.png";
  }
}

class MockUploadRepository {
  savedLogos: { barbershopId: string; url: string }[] = [];
  barbershops: { id: string }[] = [];

  async findBarbershopById(barbershopId: string) {
    return this.barbershops.find((b) => b.id === barbershopId) ?? null;
  }

  async saveBarbershopLogo(barbershopId: string, url: string) {
    this.savedLogos.push({ barbershopId, url });
  }

  reset() {
    this.savedLogos = [];
    this.barbershops = [];
  }
}

describe("UploadBarbershopLogoUseCase", () => {
  let repo: MockUploadRepository;
  let cloudinary: MockCloudinaryService;
  let useCase: UploadBarbershopLogoUseCase;

  const validBuffer = Buffer.alloc(1024);
  const validMime = "image/png";

  beforeEach(() => {
    repo = new MockUploadRepository();
    cloudinary = new MockCloudinaryService();
    useCase = new UploadBarbershopLogoUseCase(repo as any, cloudinary as any);
  });

  afterEach(() => {
    repo.reset();
  });

  it("should upload and save logo", async () => {
    repo.barbershops.push({ id: "shop-1" });

    const url = await useCase.execute("shop-1", validBuffer, validMime);

    expect(url).toBe("https://res.cloudinary.com/test/logo.png");
    expect(repo.savedLogos).toHaveLength(1);
    expect(repo.savedLogos[0].barbershopId).toBe("shop-1");
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

  it("should throw BarbershopNotFoundError when barbershop does not exist", async () => {
    await expect(
      useCase.execute("non-existent", validBuffer, validMime),
    ).rejects.toThrow("Barbearia não encontrada");
  });
});
