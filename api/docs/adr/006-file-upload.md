# API ADR 006: File Upload (Cloudinary)

## Status

Accepted

## Context

Barbershops need to upload barber photos and a barbershop logo.

## Decision

### Upload Flow
1. Frontend sends file as `multipart/form-data` to the API
2. API receives the file, uploads to Cloudinary via their Node.js SDK
3. API saves the returned Cloudinary URL in the database
4. Only the URL is stored — not the raw file

### Models
- `Barbershop.logoUrl` — barbershop logo (nullable)
- `StaffMember.avatarUrl` — barber photo (nullable)

### Security
- File type validation: only image types (JPEG, PNG, WebP)
- Max file size: 5MB
- Validation happens before upload to Cloudinary

## Consequences
- API acts as a proxy; files don't go directly from client to Cloudinary
- Simpler security (API validates before upload)
- Higher bandwidth usage on the API server
- Cloudinary free tier covers MVP needs
