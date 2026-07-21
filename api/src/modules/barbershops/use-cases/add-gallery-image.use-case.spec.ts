import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { AddGalleryImageUseCase } from "./add-gallery-image.use-case";
import { BarbershopNotFoundError } from "../errors/barbershop-errors";

describe("AddGalleryImageUseCase", () => {
  let repo: InMemoryBarbershopRepository;
  let useCase: AddGalleryImageUseCase;

  beforeEach(() => {
    repo = new InMemoryBarbershopRepository();
    useCase = new AddGalleryImageUseCase(repo);
  });

  it("should add a gallery image at the end", async () => {
    repo.barbershops.push({ id: "shop-1" } as any);
    repo.gallery.push({
      id: "img-1",
      barbershopId: "shop-1",
      imageUrl: "https://img.com/first.jpg",
      caption: null,
      sortOrder: 0,
      createdAt: new Date(),
    });
    repo.gallery.push({
      id: "img-2",
      barbershopId: "shop-1",
      imageUrl: "https://img.com/second.jpg",
      caption: null,
      sortOrder: 1,
      createdAt: new Date(),
    });

    const result = await useCase.execute("shop-1", "https://img.com/photo.jpg", "Corte degradê");

    expect(result.id).toBeTruthy();
    expect(result.imageUrl).toBe("https://img.com/photo.jpg");
    expect(result.caption).toBe("Corte degradê");
    expect(result.sortOrder).toBe(2);
    expect(repo.gallery).toHaveLength(3);
  });

  it("should start at 0 when gallery is empty", async () => {
    repo.barbershops.push({ id: "shop-1" } as any);

    const result = await useCase.execute("shop-1", "https://img.com/photo.jpg", null);

    expect(result.sortOrder).toBe(0);
  });

  it("should throw when barbershop does not exist", async () => {
    await expect(
      useCase.execute("invalid", "https://img.com/photo.jpg", null),
    ).rejects.toThrow(BarbershopNotFoundError);
  });
});
