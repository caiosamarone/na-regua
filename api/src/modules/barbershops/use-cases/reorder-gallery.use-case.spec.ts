import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { ReorderGalleryUseCase } from "./reorder-gallery.use-case";
import { BarbershopNotFoundError } from "../errors/barbershop-errors";

describe("ReorderGalleryUseCase", () => {
  let repo: InMemoryBarbershopRepository;
  let useCase: ReorderGalleryUseCase;

  beforeEach(() => {
    repo = new InMemoryBarbershopRepository();
    useCase = new ReorderGalleryUseCase(repo);
  });

  it("should reorder gallery images", async () => {
    repo.barbershops.push({ id: "shop-1" } as any);
    repo.gallery.push(
      { id: "img-1", barbershopId: "shop-1", sortOrder: 0 } as any,
      { id: "img-2", barbershopId: "shop-1", sortOrder: 1 } as any,
      { id: "img-3", barbershopId: "shop-1", sortOrder: 2 } as any,
    );

    await useCase.execute("shop-1", ["img-3", "img-1", "img-2"]);

    const gallery = await repo.findGallery("shop-1");
    expect(gallery[0].id).toBe("img-3");
    expect(gallery[1].id).toBe("img-1");
    expect(gallery[2].id).toBe("img-2");
  });

  it("should throw when barbershop does not exist", async () => {
    await expect(
      useCase.execute("invalid", []),
    ).rejects.toThrow(BarbershopNotFoundError);
  });
});
