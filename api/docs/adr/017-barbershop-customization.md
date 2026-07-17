# API ADR 017: Barbershop Page Customization

## Status

Accepted

## Context

Barbershops need to customize their public-facing page shown to customers before booking. This includes brand colors, social media links, and a gallery of work photos. The customization affects only the customer-facing landing page, not the admin dashboard.

## Decision

### Barbershop Entity — New Fields

Add to the existing `Barbershop` model:

| Campo            | Tipo    | Notas                              |
| ---------------- | ------- | ---------------------------------- |
| primaryColor     | String? | Hex color (ex: "#1a1a2e")         |
| secondaryColor   | String? | Hex color (ex: "#e94560")         |
| instagramUrl     | String? | Full URL                           |
| whatsappUrl      | String? | Full URL (wa.me or direct link)    |
| facebookUrl      | String? | Full URL                           |

- All fields nullable — barbershop uses defaults until configured
- Stored directly on `Barbershop` (no separate settings table for MVP)

### Gallery

New model `GalleryImage`:

```prisma
model GalleryImage {
  id            String   @id @default(cuid())
  barbershopId  String
  imageUrl      String
  caption       String?
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())

  barbershop Barbershop @relation(fields: [barbershopId], references: [id], onDelete: Cascade)
}
```

- Images uploaded via the existing Cloudinary workflow (reuse `/upload` module)
- `sortOrder` controls display order (frontend sends sorted array)
- Caption is optional text displayed below the image

### Endpoints

**Configuration (colors + social links)** — extended PATCH /profile:

```
PATCH /barbershops/:id/profile
Body: { primaryColor?, secondaryColor?, instagramUrl?, whatsappUrl?, facebookUrl? }
```

**Gallery CRUD:**

| Método | Rota                                         | Auth             | Descrição                    |
| ------ | -------------------------------------------- | ---------------- | ---------------------------- |
| GET    | `/barbershops/:id/gallery`                   | No               | Listar imagens (ordenadas)   |
| POST   | `/barbershops/:id/gallery`                   | BARBERSHOP_ADMIN | Adicionar imagem (URL + caption + sortOrder) |
| PUT    | `/barbershops/:id/gallery/reorder`           | BARBERSHOP_ADMIN | Substituir ordem (array de IDs) |
| DELETE | `/barbershops/:id/gallery/:imageId`          | BARBERSHOP_ADMIN | Remover imagem               |

**Upload** — new endpoint in Upload module:

```
POST /upload/gallery-image
```

### Public API Response

The existing `GET /barbershops/:id` (public) already returns the barbershop profile. It will now include:

```json
{
  "data": {
    "id": "...",
    "name": "Barbearia do João",
    "primaryColor": "#1a1a2e",
    "secondaryColor": "#e94560",
    "instagramUrl": "https://instagram.com/...",
    "whatsappUrl": "https://wa.me/...",
    "facebookUrl": "https://facebook.com/...",
    "gallery": [
      { "id": "...", "imageUrl": "...", "caption": "Corte degradê", "sortOrder": 0 }
    ],
    ...
  }
}
```

### Template

- Single fixed layout for MVP (no template selection)
- Future: can be extended with `templateId` enum (1-3) for different layouts

## Consequences

- Minimal schema changes — 5 new fields on `Barbershop` + 1 new table
- Public profile endpoint grows with gallery array — cache-friendly (no pagination needed for MVP scale)
- Gallery images are managed independently from the profile update
- Upload module gets one new endpoint, reusing existing validation and Cloudinary logic
