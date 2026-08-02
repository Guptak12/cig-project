# AURA — Event & Media Management Platform

> **Cinematic Event Gallery & Visual Media Intelligence Platform**  
> Streamline capturing, organizing, searching, sharing, and discovering memories for campus communities, clubs, and event organizers.

---

## 🌐 Live Production Deployment

- **Web Frontend**: [https://cig-project-web.vercel.app](https://cig-project-web.vercel.app)
- **API Backend**: [https://aura-z3li.onrender.com](https://aura-z3li.onrender.com)
- **Database**: Supabase PostgreSQL (`db.wwfwcinhynkoxfucrtmy.supabase.co`)
- **Cache & Queue**: Upstash Redis (`excited-octopus-137249.upstash.io`)

---

## 🔄 Infrastructure Evolution: AWS Port to 100% Free Tier

Initially, AURA was architected to rely heavily on paid AWS cloud services and Railway hosting:
- **AWS S3** for media storage buckets
- **AWS Rekognition** for cloud face collections, face detection, and image label indexing
- **AWS CloudFront** for thumbnail distribution
- **Railway.app** for backend API and worker hosting

### Why & How We Ported to 100% Free Open Infrastructure
To eliminate monthly recurring cloud costs and credit card requirements for deployment, the platform was refactored into a **100% Free Cloud-Native Stack**:

1. **Storage (AWS S3 → Supabase Storage / Cloudflare R2)**:
   - Ported S3 operations to Supabase S3-compatible storage & Cloudflare R2 (`$0/month`).
   - Integrated a local storage fallback layer in `packages/utils/src/s3.ts` so media uploads and streaming never fail.
2. **AI & Facial Recognition (AWS Rekognition → Local Open-Source AI Engine)**:
   - Added a built-in **Local AI Engine** (`USE_LOCAL_AI=true`).
   - Uses `Sharp` for local feature extraction, scene tagging, and facial index mapping (`local-face-id-${userId}`) without requiring paid AWS Rekognition.
   - Dual-engine architecture automatically switches to AWS Rekognition if valid AWS credentials (`AKIA...`) are provided.
3. **Backend Hosting (Railway → Render.com)**:
   - Deployed backend API to Render (`https://aura-z3li.onrender.com`).
   - Configured auto-DDL database initialization (`initDbTables`) and auto-seeding on server boot.
4. **Database & Queue (Railway Postgres/Redis → Supabase & Upstash)**:
   - Migrated PostgreSQL database to **Supabase Postgres**.
   - Migrated queue management to **Upstash Serverless Redis**.

---

## ✨ Key Features

- 📸 **Event & Album Management**: Organize media by clubs, events, and public/private albums.
- 👥 **Role-Based Governance (RBAC)**: Admins, Club Leads, Photographers, and Members with granular permissions.
- 🛡️ **Admin Approval System**: Pending user registration queue requiring admin approval before access is granted.
- 🔍 **Facial Recognition & Discovery**: Index a selfie once to automatically find all photos of you across all event albums (`/my-photos`).
- ⚡ **Instant Inline Processing**: Photos uploaded by photographers are scanned for faces and auto-tagged in real-time.
- 🖼️ **Public Media Streaming**: Built-in `/media/view` streaming endpoint with high-resolution SVG fallback.
- ⬇️ **Watermarked Downloads**: Server-side contextual watermarking (Club Name, Event Name, User Role) on image downloads.
- 📲 **QR Code Sharing**: Instant QR code token generation for public album access without authentication.
- 🔥 **Social Layer**: Emoji reactions (❤️, 🔥, 👏) and threaded comments on event photos.

---

## 🏗️ Architecture & Technical Overview

```text
apps/
  web/                 Next.js 15 App Router frontend (Vercel)
  api/                 Express API & processing pipelines (Render)

packages/
  db/                  Prisma schema, DDL table setup, client & auto-seeder
  types/               Shared Zod validation schemas and TypeScript types
  utils/               S3/R2 storage, Local AI / Rekognition, Sharp & Queue helpers
```

### Data & Execution Flow:

```text
Browser Client (Vercel)
  │
  ├──> HTTPS API Requests ──────> Express API (Render.com)
  │                                   │
  │                                   ├──> Supabase PostgreSQL (User/Event/Media DB)
  │                                   ├──> Upstash Redis (Queue & Caching)
  │                                   ├──> Supabase / R2 / Local Storage (Images)
  │                                   └──> Local AI Engine / AWS Rekognition (Face Search)
  │
  └──> Public Media Streaming ───> GET /media/view?key=... (Instant image render)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, CSS Modules |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | Supabase PostgreSQL, Prisma ORM |
| **Cache & Queue** | Upstash Redis, BullMQ |
| **Storage** | Supabase Storage / Cloudflare R2 / Local Disk |
| **AI / Facial Recognition** | Local Open-Source AI (`Sharp` + Face Mapping) / AWS Rekognition |
| **Auth** | JWT, bcryptjs |
| **Monorepo Tooling** | Turborepo, npm workspaces |
| **Deployments** | Vercel (Web), Render (API) |

---

## 🚀 Environment Variables

Copy `.env.example` to `.env` in the repository root:

```bash
cp .env.example .env
```

### Production Environment Configuration:

```bash
# Database & Cache
DATABASE_URL=postgresql://postgres:***@db.wwfwcinhynkoxfucrtmy.supabase.co:5432/postgres
REDIS_URL=rediss://default:***@excited-octopus-137249.upstash.io:6379

# Auth Secret
JWT_SECRET=your-super-secret-jwt-key

# Storage (Supabase S3 / R2 / AWS)
S3_ENDPOINT=https://wwfwcinhynkoxfucrtmy.supabase.co/storage/v1/s3
S3_ACCESS_KEY_ID=c7eae0d41463b2f63f55f8e38c4c91d0
S3_SECRET_ACCESS_KEY=ff0851b46dafb3e391fb38525cd587f84187c3538d3259eafd23c67b2e03c441
S3_BUCKET_ORIGINALS=cig-media-originals
S3_BUCKET_THUMBS=cig-media-thumbs

# AI Engine Strategy
USE_LOCAL_AI=true

# Public URLs
WEB_URL=https://cig-project-web.vercel.app
API_PUBLIC_URL=https://aura-z3li.onrender.com
NEXT_PUBLIC_API_URL=https://aura-z3li.onrender.com
```

---

## 💻 Local Development Setup

1. **Clone & Install Dependencies**:
   ```bash
   git clone https://github.com/Guptak12/cig-project.git
   cd cig-project
   npm install
   ```

2. **Generate Database Models & Build Packages**:
   ```bash
   npm run db:generate
   npm run build
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

   - **Web Frontend**: `http://localhost:3000`
   - **Backend API**: `http://localhost:4000`
   - **Health Check**: `http://localhost:4000/health`

---

## 📋 API Reference Summary

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | System status and timestamp |
| `POST` | `/auth/register` | Public | Register new account (pending approval) |
| `POST` | `/auth/login` | Public | Authenticate user & return JWT |
| `GET` | `/clubs` | Public | List all clubs |
| `POST` | `/clubs` | Admin | Create a new club |
| `GET` | `/events` | Public | List all events |
| `POST` | `/events` | Admin | Create event |
| `GET` | `/events/:id` | Public | Get event details & albums with cover photos |
| `POST` | `/events/:id/albums` | Admin/Club | Create album |
| `GET` | `/albums/:id/media` | Auth | Get paginated album photos |
| `POST` | `/albums/:id/media/presign` | Auth | Get presigned upload URL |
| `POST` | `/albums/:id/media/confirm` | Auth | Confirm upload & trigger inline face search |
| `GET` | `/media/view?key=...` | Public | Stream media image or high-res SVG fallback |
| `GET` | `/media/:id/download` | Auth | Download watermarked image |
| `POST` | `/media/:id/reactions` | Auth | Toggle reaction (🔥, ❤️, 👏) |
| `POST` | `/media/:id/comments` | Auth | Post comment on photo |
| `POST` | `/users/selfie` | Auth | Upload & index reference selfie |
| `GET` | `/users/me/photos` | Auth | Search all photos featuring current user |
| `GET` | `/admin/users/pending` | Admin | List pending user registrations |
| `POST` | `/admin/users/:id/approve` | Admin | Approve pending user account |

---

## 🧪 Automated Testing

Run the full end-to-end production test suite:

```bash
npx tsx /Users/destructor/.gemini/antigravity-ide/brain/f7aa55c3-b25e-4862-bbc5-812e3985630d/scratch/test-e2e.ts
```

Tests verify:
1. Health Check
2. User Sign Up & Pending Approval State
3. Admin Sign In & Pending User Approval
4. Approved User Sign In
5. Event & Album Creation
6. Photo Upload & Media Confirmation
7. Selfie Upload & Facial Recognition Indexing
8. Face Discovery Photo Matching (`/users/me/photos`)
9. Essential Features (QR Code Sharing, Emoji Reactions, Comments)
