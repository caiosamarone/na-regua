import { UploadStaffAvatarUseCase } from "./upload-staff-avatar.use-case";

class MockCloudinaryService {
  async uploadStaffAvatar(_staffId: string, _fileBuffer: Buffer, _mimeType: string) {
    return "https://res.cloudinary.com/test/avatar.jpg";
  }
}

class MockUploadRepository {
  savedAvatars: { staffId: string; url: string }[] = [];
  staffMembers: { id: string; barbershopId: string }[] = [];

  async findStaffById(staffId: string) {
    return this.staffMembers.find((s) => s.id === staffId) ?? null;
  }

  async saveStaffAvatar(barbershopId: string, staffId: string, url: string) {
    this.savedAvatars.push({ staffId, url });
  }

  reset() {
    this.savedAvatars = [];
    this.staffMembers = [];
  }
}

describe("UploadStaffAvatarUseCase", () => {
  let repo: MockUploadRepository;
  let cloudinary: MockCloudinaryService;
  let useCase: UploadStaffAvatarUseCase;

  const validBuffer = Buffer.alloc(1024);
  const validMime = "image/jpeg";

  beforeEach(() => {
    repo = new MockUploadRepository();
    cloudinary = new MockCloudinaryService();
    useCase = new UploadStaffAvatarUseCase(repo as any, cloudinary as any);
  });

  afterEach(() => {
    repo.reset();
  });

  it("should upload and save avatar", async () => {
    repo.staffMembers.push({ id: "stf-1", barbershopId: "shop-1" });

    const url = await useCase.execute("shop-1", "stf-1", validBuffer, validMime);

    expect(url).toBe("https://res.cloudinary.com/test/avatar.jpg");
    expect(repo.savedAvatars).toHaveLength(1);
    expect(repo.savedAvatars[0].staffId).toBe("stf-1");
  });

  it("should throw InvalidFileTypeError for unsupported mime types", async () => {
    await expect(
      useCase.execute("shop-1", "stf-1", validBuffer, "image/gif"),
    ).rejects.toThrow("Tipo de arquivo não permitido");
  });

  it("should throw FileTooLargeError when file exceeds 5MB", async () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024);

    await expect(
      useCase.execute("shop-1", "stf-1", bigBuffer, validMime),
    ).rejects.toThrow("Arquivo muito grande");
  });

  it("should throw StaffMemberNotFoundError when staff does not exist", async () => {
    await expect(
      useCase.execute("shop-1", "non-existent", validBuffer, validMime),
    ).rejects.toThrow("Profissional não encontrado");
  });

  it("should throw StaffMemberNotFoundError when staff belongs to another barbershop", async () => {
    repo.staffMembers.push({ id: "stf-1", barbershopId: "other-shop" });

    await expect(
      useCase.execute("shop-1", "stf-1", validBuffer, validMime),
    ).rejects.toThrow("Profissional não encontrado");
  });
});
