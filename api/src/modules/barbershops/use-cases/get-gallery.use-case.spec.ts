import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { GetGalleryUseCase } from "./get-gallery.use-case";

describe("GetGalleryUseCase", () => {
  let repo: InMemoryBarbershopRepository;
  let useCase: GetGalleryUseCase;

  beforeEach(() => {
    repo = new InMemoryBarbershopRepository();
    useCase = new GetGalleryUseCase(repo);
  });

  it("should return gallery images sorted by sortOrder", async () => {
    repo.gallery.push(
      { id: "img-1", barbershopId: "shop-1", imageUrl: "https://img.com/b.jpg", caption: null, sortOrder: 1, createdAt: new Date() },
      { id: "img-2", barbershopId: "shop-1", imageUrl: "https://img.com/a.jpg", caption: "First", sortOrder: 0, createdAt: new Date() },
    );

    const result = await useCase.execute("shop-1");

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("img-2");
    expect(result[0].sortOrder).toBe(0);
    expect(result[1].id).toBe("img-1");
    expect(result[1].sortOrder).toBe(1);
  });

  it("should return empty array when barbershop has no gallery", async () => {
    const result = await useCase.execute("shop-1");
    expect(result).toEqual([]);
  });
});
