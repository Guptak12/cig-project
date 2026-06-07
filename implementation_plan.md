# Event & Media Management Platform — Architecture & Implementation Plan

> Skills applied: `brainstorming` · `senior-fullstack` · `concise-planning`

---

## 1. Understanding Summary (Brainstorming Lock)

| # | Item |
|---|------|
| 1 | **What** — A centralized web platform for clubs/societies to upload, organize, and interact with event photos and videos |
| 2 | **Why** — Media is scattered across personal drives; no single source of truth for event archives |
| 3 | **Who** — Three actor types: **Admin/Organizer** (creates events, manages albums), **Photographer** (uploads media), **Member** (discovers, downloads, reacts) |
| 4 | **Key constraints** — Must use AWS S3 for storage; facial recognition for personalized photo discovery; watermarking on download; public/private access control |
| 5 | **Non-goals** — Real-time video streaming, live event broadcast, advanced video editing |
| 6 | **Evaluation weight** — UI/UX (15%), Backend APIs (15%), Auth/Access (10%), Cloud (15%) → design and cloud integration are the top priorities |

### Assumptions (Explicit)

| # | Assumption |
|---|-----------|
| A1 | Target scale: ~50 concurrent users per event, up to 10K images per event — medium scale |
| A2 | Facial recognition uses AWS Rekognition — not a custom ML model |
| A3 | Video support is secondary; primary focus is images (JPEG/PNG/WEBP) |
| A4 | Watermarking is applied server-side at download time, not baked into stored originals |
| A5 | Auth uses JWT with role-based access (Admin, Photographer, Member) |
| A6 | PostgreSQL is the primary database; Redis for session/cache layer |
| A7 | Deployment target: single VPS (Docker Compose) for demo; architecture is cloud-ready |

---

## 2. Design Decision Log

| Decision | Alternatives Considered | Chosen | Reason |
|----------|------------------------|--------|--------|
| Frontend | React SPA, Vite | **Next.js 14 (App Router)** | SSR for SEO, built-in image optimization, API routes |
| API style | GraphQL, tRPC | **REST (Express + TypeScript)** | Simpler to evaluate, easy Swagger docs |
| Database | MongoDB, Supabase | **PostgreSQL + Prisma** | Strong relations, type-safe ORM |
| Media storage | GCP, Cloudinary | **AWS S3 + CloudFront** | Meets PS requirement, CDN built-in |
| Facial recognition | DeepFace, custom ML | **AWS Rekognition** | Managed, no infra overhead, S3-native |
| Watermarking | Canvas API (client) | **Sharp (server-side)** | Cannot be bypassed, dynamic, consistent |
| Monorepo | Polyrepo | **Turborepo** | Shared types, single CI, easier local dev |
| Auth | Passport.js, Auth0 | **NextAuth.js + JWT** | Native Next.js, extensible, free |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   Next.js 14 (App Router)  ·  Vanilla CSS                       │
│   Infinite scroll · QR share · PWA shell · Optimistic UI        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                        API LAYER                                │
│   Express.js + TypeScript  ·  REST  ·  Zod validation           │
│   Swagger/OpenAPI docs  ·  Rate limiting  ·  CORS               │
└────┬────────────┬────────────┬────────────┬──────────────────────┘
     │            │            │            │
  [Auth]      [Events]     [Media]     [AI Facade]
  Service     Service      Service    (Rekognition)
     │            │            │            │
┌────▼────────────▼────────────▼────────────▼──────────┐
│              DATA LAYER                               │
│  PostgreSQL (Prisma ORM)  ·  Redis (cache/sessions)  │
└───────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     CLOUD LAYER (AWS)                           │
│  S3 (originals)  ·  CloudFront (CDN)  ·  Rekognition (AI)       │
│  S3 Signed URLs (private access)                                │
└─────────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
cig-project/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── api/          # Express.js REST API
├── packages/
│   ├── types/        # Shared TypeScript types & Zod schemas
│   ├── db/           # Prisma client + migrations
│   └── utils/        # Shared helpers (watermark, s3, rekognition)
├── docker-compose.yml
├── turbo.json
└── .env.example
```

---

## 4. Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  role      Role     @default(MEMBER)
  selfieKey String?  // S3 key of reference selfie
  faceId    String?  // AWS Rekognition face ID
  createdAt DateTime @default(now())
  reactions Reaction[]
  comments  Comment[]
}

model Club {
  id     String  @id @default(cuid())
  name   String
  events Event[]
}

model Event {
  id          String   @id @default(cuid())
  name        String
  description String?
  date        DateTime
  clubId      String
  club        Club     @relation(fields: [clubId], references: [id])
  isPublic    Boolean  @default(true)
  albums      Album[]
  createdAt   DateTime @default(now())
}

model Album {
  id       String        @id @default(cuid())
  name     String
  eventId  String
  event    Event         @relation(fields: [eventId], references: [id])
  isPublic Boolean       @default(true)
  qrToken  String?       // QR share token (UUID)
  media    Media[]
  members  AlbumMember[]
}

model Media {
  id         String     @id @default(cuid())
  albumId    String
  album      Album      @relation(fields: [albumId], references: [id])
  s3Key      String     // original in S3
  thumbKey   String?    // thumbnail key
  mimeType   String
  tags       String[]   // AI-generated labels
  faceIds    String[]   // Rekognition face IDs found in image
  caption    String?    // AI-generated caption (bonus)
  uploadedBy String
  createdAt  DateTime   @default(now())
  reactions  Reaction[]
  comments   Comment[]
}

model AlbumMember {
  userId  String
  albumId String
  user    User   @relation(fields: [userId], references: [id])
  album   Album  @relation(fields: [albumId], references: [id])
  @@id([userId, albumId])
}

model Reaction {
  id      String @id @default(cuid())
  mediaId String
  userId  String
  type    String // "like" | "love" | "fire"
  media   Media  @relation(fields: [mediaId], references: [id])
  user    User   @relation(fields: [userId], references: [id])
  @@unique([mediaId, userId])
}

model Comment {
  id        String   @id @default(cuid())
  mediaId   String
  userId    String
  body      String
  createdAt DateTime @default(now())
  media     Media    @relation(fields: [mediaId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}

enum Role { ADMIN PHOTOGRAPHER MEMBER }
```

---

## 5. API Surface (REST)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register user |
| POST | `/auth/login` | Public | JWT login |
| GET | `/events` | Public | List events (sort by name) |
| POST | `/events` | Admin | Create event |
| GET | `/events/:id` | Public/Auth | Event detail |
| POST | `/events/:id/albums` | Admin/Photographer | Create album |
| GET | `/albums/:id/media` | Auth | Paginated media (cursor-based) |
| POST | `/albums/:id/media/presign` | Photographer | Get S3 presigned upload URL |
| POST | `/albums/:id/media/confirm` | Photographer | Confirm upload, trigger jobs |
| GET | `/albums/:id/qr` | Auth | Get QR share link |
| GET | `/media/:id/download` | Auth | Download with server-side watermark |
| POST | `/users/selfie` | Auth | Upload selfie → Rekognition indexing |
| GET | `/users/me/photos` | Auth | Photos matching user's face |
| POST | `/media/:id/reactions` | Auth | Toggle reaction |
| POST | `/media/:id/comments` | Auth | Add comment |

---

## 6. Key Module Designs

### 6a. Access Control (RBAC)

```
ADMIN        → full CRUD on events, albums, users, media
PHOTOGRAPHER → upload media, view assigned albums
MEMBER       → view public content, react, comment, download, facial recognition
```

- Private albums: access via `AlbumMember` join only
- Signed S3 URLs expire in 15 min (private media never exposed directly)

### 6b. Facial Recognition Flow

```
1. Member uploads selfie → POST /users/selfie
2. API stores selfie in S3 (private bucket)
3. API calls Rekognition.indexFaces() → stores faceId on User
4. On media upload confirm:
   a. Rekognition.searchFacesByImage() on each photo
   b. Matched faceIds stored in Media.faceIds[]
5. Member visits "My Photos":
   SELECT * FROM Media WHERE faceIds @> ARRAY[user.faceId]
```

### 6c. Watermarking on Download

```typescript
// packages/utils/watermark.ts (Sharp)
export async function applyWatermark(
  imageBuffer: Buffer,
  opts: { clubName: string; eventName: string; userRole: Role }
): Promise<Buffer> {
  const text = `${opts.clubName} · ${opts.eventName} · ${opts.userRole}`;
  const svgOverlay = buildSvgWatermark(text); // bottom-right, semi-transparent
  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svgOverlay), gravity: 'southeast' }])
    .jpeg({ quality: 90 })
    .toBuffer();
}
```

### 6d. Upload Flow (Presigned URL Pattern)

```
Client → POST /albums/:id/media/presign
       ← { uploadUrl (S3 presigned PUT), s3Key }
Client → PUT uploadUrl  (direct to S3, skips API bandwidth)
Client → POST /albums/:id/media/confirm { s3Key }
API    → saves Media record + enqueues Bull jobs:
           • thumbnail (Sharp resize)
           • AI tagging (Rekognition.detectLabels)
           • face search (Rekognition.searchFacesByImage)
```

---

## 7. Frontend Module Map (Next.js App Router)

```
apps/web/app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── events/
│   │   ├── page.tsx                    # Event list, search + sort by name
│   │   └── [id]/albums/[albumId]/page.tsx  # Infinite scroll gallery
│   ├── my-photos/page.tsx              # Facial recognition results
│   └── upload/page.tsx                 # Drag-and-drop uploader
└── layout.tsx
```

**Key UI Components:**
- `<InfiniteGallery>` — cursor-based fetch, Intersection Observer API
- `<MediaCard>` — hover reactions, comment drawer, download button
- `<UploadDropzone>` — presigned URL, progress bar
- `<FaceSetup>` — selfie upload + webcam capture
- `<QRShareModal>` — QR rendered via `qrcode` npm lib

---

## 8. Cloud Integration (AWS)

| Service | Purpose |
|---------|---------|
| S3 (2 buckets) | `media-originals` (private) · `media-thumbs` (public CDN) |
| CloudFront | CDN for thumbnails and public covers |
| Rekognition | Face indexing + search, label detection |
| SES (optional) | Album share email notifications |

---

## 9. Bonus Features — Priority Order

| Priority | Feature | Effort |
|----------|---------|--------|
| 🔥 High | Infinite scrolling gallery | Low |
| 🔥 High | QR-based album sharing | Low |
| 🟡 Med | PWA offline shell (next-pwa) | Medium |
| 🟡 Med | AI captions (GPT-4V / Gemini Vision) | Medium |
| 🟢 Low | Analytics dashboard | High |
| 🟢 Low | Duplicate detection (perceptual hash) | High |

---

## 10. Implementation Plan (Concise Checklist)

### Approach
Build a Turborepo monorepo with a Next.js 14 frontend + Express API backend, backed by PostgreSQL (Prisma), Redis, and AWS S3/Rekognition. Ship core features (auth → events → upload → gallery → AI → watermark) in order, then stack bonus features.

### Scope

**In:**
- Monorepo scaffold, shared types, Prisma schema + migrations
- Auth (NextAuth, JWT, RBAC: Admin / Photographer / Member)
- Event + Album CRUD with public/private access control
- S3 presigned upload + Bull job queue (thumbnail + tags + face search)
- Infinite scroll gallery with reactions + comments
- Facial recognition (Rekognition index + search + "My Photos")
- Server-side watermarking on download (Sharp)
- QR album sharing
- Docker Compose (web, api, postgres, redis)
- README + architecture diagram + DB schema

**Out:**
- Real-time WebSockets
- Video transcoding
- Mobile native app
- Custom ML training

### Action Items

```
[ ] 1. Scaffold Turborepo monorepo — apps/web (Next.js 14), apps/api (Express TS), packages/types, packages/db, packages/utils
[ ] 2. Define & migrate Prisma schema — User, Club, Event, Album, Media, AlbumMember, Reaction, Comment
[ ] 3. Implement Auth — NextAuth.js credentials provider, JWT, RBAC middleware (Admin/Photographer/Member)
[ ] 4. Build Event & Album CRUD — REST endpoints, sort-by-name, public/private toggle, Zod validation
[ ] 5. Implement S3 presigned upload flow — /presign → direct PUT to S3 → /confirm → enqueue Bull jobs
[ ] 6. Build Bull job workers — thumbnail generation (Sharp), AI label tagging (Rekognition.detectLabels)
[ ] 7. Build Infinite Scroll Gallery — cursor-based GET /albums/:id/media, Intersection Observer, MediaCard
[ ] 8. Implement Reactions & Comments — optimistic UI on frontend, API endpoints, unique reaction constraint
[ ] 9. Implement Facial Recognition — selfie → indexFaces(), confirm → searchFacesByImage(), My Photos page
[ ] 10. Implement Watermarking — Sharp composite on GET /media/:id/download with club/event/role metadata
[ ] 11. Add QR Share — UUID token on Album, /albums/share/:token public route, QR modal component
[ ] 12. Docker Compose — services: web, api, postgres, redis; .env.example; health checks
[ ] 13. Document — README (setup + deploy), architecture diagram, DB ERD (prisma-erd-generator)
[ ] 14. End-to-end validation — upload → tag → facial match → download with watermark → QR share
```

### Open Questions

1. **Team & timeline** — How many devs, how many days? Determines bonus feature scope.
2. **Club registration** — Fixed club list seeded by admin, or self-service club creation?
3. **Video support** — Full upload required or stub acceptable for demo?

---

*Generated using `brainstorming` + `senior-fullstack` + `concise-planning` skills*
