# CIG Platform — Event & Media Management

Centralized event and media management platform for clubs and societies.

## Features

- 📁 Event-wise album organization
- 🔒 Public/private access control with RBAC
- 📸 AI-powered image tagging (AWS Rekognition)
- 🧑‍🤳 Facial recognition — find your photos automatically
- 💧 Server-side watermarking on download
- ♾️ Infinite scroll gallery
- 🔗 QR-based album sharing
- ☁️ AWS S3 + CloudFront for media storage

---

## Architecture

```
apps/
  web/     → Next.js 14 frontend (SSR + infinite scroll)
  api/     → Express.js REST API (TypeScript)
packages/
  types/   → Shared Zod schemas + TypeScript types
  db/      → Prisma client + PostgreSQL schema
  utils/   → S3, Rekognition, Sharp, BullMQ utilities
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full architecture diagram and design decisions.

---

## Quick Start (Local Dev)

### Prerequisites
- Node.js ≥ 20
- Docker + Docker Compose
- AWS account (S3 + Rekognition)

### 1. Clone & install

```bash
git clone <repo>
cd cig-project
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in your AWS keys, JWT secret, etc.
```

### 3. Start infrastructure (Postgres + Redis)

```bash
docker compose up postgres redis -d
```

### 4. Run migrations

```bash
cd packages/db && npx prisma migrate dev
```

### 5. Create Rekognition face collection

```bash
aws rekognition create-collection --collection-id cig-faces --region us-east-1
```

### 6. Start development servers

```bash
npm run dev   # starts api (port 4000) + web (port 3000) in parallel
```

---

## Deployment (Docker Compose)

```bash
cp .env.example .env
# Fill in production values

docker compose up -d
```

Services: `web` (3000), `api` (4000), `worker`, `postgres`, `redis`

---

## Database Schema

See [packages/db/prisma/schema.prisma](./packages/db/prisma/schema.prisma) for the full schema.

**Models:** User, Club, Event, Album, Media, AlbumMember, Reaction, Comment

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register user |
| POST | `/auth/login` | Public | Login → JWT |
| GET | `/events` | Public | List events (sorted by name) |
| POST | `/events` | Admin | Create event |
| GET | `/albums/:id/media` | Auth | Paginated media |
| POST | `/albums/:id/media/presign` | Photographer | Get S3 upload URL |
| POST | `/albums/:id/media/confirm` | Photographer | Confirm upload |
| GET | `/albums/:id/qr` | Auth | QR share token |
| GET | `/media/:id/download` | Auth | Download with watermark |
| POST | `/users/selfie` | Auth | Upload selfie for face recognition |
| GET | `/users/me/photos` | Auth | My photos (facial recognition) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Vanilla CSS |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Cache / Queue | Redis, BullMQ |
| Storage | AWS S3 (2 buckets), CloudFront CDN |
| AI | AWS Rekognition (faces + labels) |
| Image Processing | Sharp |
| Auth | JWT (bcryptjs) |
| Containerization | Docker, Docker Compose |
| Monorepo | Turborepo |

---

## Team

Built for the Event & Media Management Platform problem statement.
