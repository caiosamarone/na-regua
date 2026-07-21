import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { DeleteGalleryImageUseCase } from "./delete-gallery-image.use-case";
import { GalleryImageNotFoundError } from "../errors/barbershop-errors";

describe("DeleteGalleryImageUseCase", () => {
  let repo: InMemoryBarbershopRepository;
  let useCase: DeleteGalleryImageUseCase;
  let cloudinary: { deleteImage: jest.Mock };

  beforeEach(() => {
    repo = new InMemoryBarbershopRepository();
    cloudinary = { deleteImage: jest.fn() };
    useCase = new DeleteGalleryImageUseCase(repo, cloudinary as any);
  });

  it("should delete from Cloudinary and remove from database", async () => {
    repo.gallery.push({
      id: "img-1",
      barbershopId: "shop-1",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v123/gallery/photo.jpg",
      caption: null,
      sortOrder: 0,
      createdAt: new Date(),
    });

    await useCase.execute("img-1");

    expect(cloudinary.deleteImage).toHaveBeenCalledWith(
      "https://res.cloudinary.com/demo/image/upload/v123/gallery/photo.jpg",
    );
    expect(repo.gallery).toHaveLength(0);
  });

  it("should recalculate sortOrder after deletion", async () => {
    repo.gallery.push(
      { id: "img-1", barbershopId: "shop-1", imageUrl: "https://img.com/a.jpg", caption: null, sortOrder: 0, createdAt: new Date() },
      { id: "img-2", barbershopId: "shop-1", imageUrl: "https://img.com/b.jpg", caption: null, sortOrder: 1, createdAt: new Date() },
      { id: "img-3", barbershopId: "shop-1", imageUrl: "https://img.com/c.jpg", caption: null, sortOrder: 2, createdAt: new Date() },
    );

    await useCase.execute("img-2");

    const remaining = repo.gallery.sort((a, b) => a.sortOrder - b.sortOrder);
    expect(remaining).toHaveLength(2);
    expect(remaining[0].id).toBe("img-1");
    expect(remaining[0].sortOrder).toBe(0);
    expect(remaining[1].id).toBe("img-3");
    expect(remaining[1].sortOrder).toBe(1);
  });

  it("should throw when image does not exist", async () => {
    await expect(useCase.execute("invalid")).rejects.toThrow(GalleryImageNotFoundError);
    expect(cloudinary.deleteImage).not.toHaveBeenCalled();
  });
});
