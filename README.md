# AURA- Event & Media Management Platform

Event media management for clubs, societies, and campus communities.

CIG Platform is a full-stack gallery system for collecting, organizing, searching, sharing, and downloading event media. It combines event-wise albums, role-based workflows, AWS-backed storage, Rekognition-powered image intelligence, QR sharing, and a background processing pipeline for thumbnails, labels, and face discovery.

- Demo Video: [Watch Here](https://drive.google.com/file/d/1Duai3ra-tE-iZclKRwnv3fHKdLbY-Ac8/view?usp=sharing)
 
Production deployment:
- Web: `https://cig-project-web.vercel.app`
- API: `https://cig-project-production.up.railway.app`

## What It Does

- Organizes media by clubs, events, and albums.
- Supports admin, club, photographer, and member roles.
- Uploads originals directly to S3 through presigned URLs.
- Generates thumbnails in a background worker.
- Tags images with AWS Rekognition labels.
- Indexes user selfies and discovers matching event photos.
- Serves gallery media through CloudFront or signed S3 URLs.
- Adds server-side watermarks on download.
- Supports public/private albums and QR-based album sharing.
- Tracks reactions and comments for uploaded media.
- Includes admin approval and media-processing diagnostics.

## Product Flow

1. An admin or club account creates an event and album.
2. A photographer or member uploads images to the album.
3. The API creates S3 presigned upload URLs and confirms media records.
4. A BullMQ worker processes confirmed media:
   - fetch original from S3
   - generate thumbnail
   - upload thumbnail to S3
   - detect labels with Rekognition
   - search indexed faces in the image
   - persist `thumbKey`, `tags`, and `faceIds`
5. A member uploads a reference selfie on Face Discovery.
6. Rekognition indexes the selfie in the face collection.
7. The member sees album photos whose `faceIds` match their indexed face.

## Architecture

```text
apps/
  web/                 Next.js frontend
  api/                 Express API and BullMQ worker

packages/
  db/                  Prisma schema, client, seed scripts
  types/               Shared Zod schemas and TypeScript types
  utils/               S3, Rekognition, image, and queue utilities
```

Runtime services:

```text
Browser
  -> Vercel Web
  -> Railway API
  -> PostgreSQL
  -> Redis / BullMQ
  -> AWS S3
  -> AWS Rekognition
  -> CloudFront

Railway Worker
  -> Redis queue
  -> PostgreSQL
  -> S3 originals / thumbs
  -> Rekognition
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript, CSS |
| Backend | Express, TypeScript |
| Database | PostgreSQL, Prisma |
| Queue | Redis, BullMQ |
| Storage | AWS S3 originals bucket, AWS S3 thumbs bucket |
| CDN | AWS CloudFront |
| AI | AWS Rekognition labels and face collections |
| Image processing | Sharp |
| Auth | JWT, bcryptjs |
| Monorepo | npm workspaces, Turborepo |
| Deployment | Vercel, Railway, Docker Compose |

## Repository Scripts

Run from the repository root unless noted.

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run seed:db
npm run db:generate
npm run db:migrate
npm run db:studio
```

API workspace scripts:

```bash
npm run dev --workspace=@cig/api
npm run start --workspace=@cig/api
npm run start:worker --workspace=@cig/api
npm run typecheck --workspace=@cig/api
```

Web workspace scripts:

```bash
npm run dev --workspace=@cig/web
npm run build --workspace=@cig/web
npm run typecheck --workspace=@cig/web
```

## Environment Variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

Core backend variables:

```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<strong-secret>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<aws-secret-access-key>
S3_BUCKET_ORIGINALS=cig-media-originals
S3_BUCKET_THUMBS=cig-media-thumbs
REKOGNITION_COLLECTION_ID=cig-faces
CDN_URL=https://<cloudfront-distribution>.cloudfront.net
WEB_URL=http://localhost:3000
PORT=4000
```

Frontend variables:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_CDN_URL=http://localhost:4000/mock-s3-view
```

For production, `NEXT_PUBLIC_API_URL` must be the Railway API URL and `NEXT_PUBLIC_CDN_URL` must be the CloudFront distribution URL.

## Local Development

Prerequisites:

- Node.js 20 or newer
- npm 10 or newer
- Docker and Docker Compose
- AWS account with S3 and Rekognition access

Install dependencies:

```bash
npm install
```

Start local infrastructure:

```bash
docker compose up postgres redis -d
```

Generate Prisma client and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

Create the Rekognition face collection if it does not already exist:

```bash
aws rekognition create-collection \
  --collection-id cig-faces \
  --region us-east-1
```

Start development:

```bash
npm run dev
```

Default local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

## Docker Compose

Docker Compose runs the full stack locally or on a VM:

```bash
cp .env.example .env
docker compose up -d
```

Services:

- `web`: Next.js app on port `3000`
- `api`: Express API on port `4000`
- `worker`: BullMQ media processor
- `postgres`: PostgreSQL
- `redis`: Redis queue backend

The worker command is:

```bash
node dist/worker.js
```

## 100% Free Cloud Deployment (Zero AWS Account Required)

You can run the entire platform at **$0/month** using free tiers across top cloud providers:

| Layer | Provider | Free Allowance | Configuration |
| --- | --- | --- | --- |
| **Media Storage** | **Cloudflare R2** | 10 GB storage, $0 egress fees | Set `S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com` |
| **Database** | **Neon.tech** | 500 MB PostgreSQL | Set `DATABASE_URL=postgresql://...` |
| **Queue / Cache** | **Upstash Redis** | 10,000 commands/day | Set `REDIS_URL=rediss://...` |
| **API Backend** | **Render.com** | Free Web Service | Start command: `npx tsx apps/api/src/index.ts` |
| **Background Worker** | **Render.com** | Free Background Worker | Start command: `npx tsx apps/api/src/worker.ts` |
| **Frontend Web** | **Vercel** | Free Hobby tier | `NEXT_PUBLIC_API_URL=<render-api-url>` |
| **AI / Faces** | **Local AI Engine** | 100% Free local execution | Set `USE_LOCAL_AI=true` |

### Setting Up Cloudflare R2 Storage (Replacing S3)

1. Create a free account at [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **R2** -> **Create bucket** and create two buckets:
   - `cig-media-originals`
   - `cig-media-thumbs`
3. Go to **R2** -> **Manage R2 API Tokens** -> **Create API Token** (Edit permissions).
4. Copy the **Account ID**, **Access Key ID**, and **Secret Access Key**.
5. Set environment variables on your backend:

```bash
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=<r2-access-key-id>
S3_SECRET_ACCESS_KEY=<r2-secret-access-key>
S3_BUCKET_ORIGINALS=cig-media-originals
S3_BUCKET_THUMBS=cig-media-thumbs
USE_LOCAL_AI=true
```

## Vercel Deployment

Set these variables on the Vercel project before building:

```bash
NEXT_PUBLIC_API_URL=https://cig-project-production.up.railway.app
NEXT_PUBLIC_CDN_URL=https://d3nud6oinr5u62.cloudfront.net
```

Because these are `NEXT_PUBLIC_*` variables, they are embedded into the client bundle at build time. Redeploy Vercel after changing either value.

## Railway Deployment

The Railway deployment needs two app services from the same repository:

- `cig-project`: API service
- `cig-worker`: background worker service

### API Service

Build command:

```bash
npm install && npx turbo run build --filter=@cig/api
```

Start command:

```bash
npx tsx apps/api/src/index.ts
```

Required variables:

```bash
DATABASE_URL=<railway-postgres-url>
REDIS_URL=<railway-redis-url>
JWT_SECRET=<strong-secret>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<aws-secret-access-key>
S3_BUCKET_ORIGINALS=cig-media-originals
S3_BUCKET_THUMBS=cig-media-thumbs
REKOGNITION_COLLECTION_ID=cig-faces
CDN_URL=https://d3nud6oinr5u62.cloudfront.net
WEB_URL=https://cig-project-web.vercel.app
PORT=8080
```

### Worker Service

The worker must not run the API start command. Its logs should show:

```text
[worker] Media processing worker started
```

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npx tsx apps/api/src/worker.ts
```

Required variables:

```bash
DATABASE_URL=<railway-postgres-url>
REDIS_URL=<railway-redis-url>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<aws-secret-access-key>
S3_BUCKET_ORIGINALS=cig-media-originals
S3_BUCKET_THUMBS=cig-media-thumbs
REKOGNITION_COLLECTION_ID=cig-faces
```

If the worker is not running, media uploads will still create database rows, but `thumbKey`, `tags`, and `faceIds` will remain empty. Face Discovery depends on those `faceIds`.

## AWS Setup

Create two S3 buckets:

```bash
cig-media-originals
cig-media-thumbs
```

Create the Rekognition collection:

```bash
aws rekognition create-collection \
  --collection-id cig-faces \
  --region us-east-1
```

Useful verification commands:

```bash
aws rekognition describe-collection \
  --collection-id cig-faces \
  --region us-east-1

aws s3api head-bucket --bucket cig-media-originals
aws s3api head-bucket --bucket cig-media-thumbs
```

IAM permissions required by the app:

- `s3:GetObject`
- `s3:PutObject`
- `s3:HeadBucket`
- `rekognition:IndexFaces`
- `rekognition:SearchFacesByImage`
- `rekognition:DetectFaces`
- `rekognition:DetectLabels`
- `rekognition:DescribeCollection`

## Database

Schema source:

```text
packages/db/prisma/schema.prisma
```

Primary models:

- `User`
- `Club`
- `Event`
- `Album`
- `Media`
- `AlbumMember`
- `Reaction`
- `Comment`

Generate Prisma client:

```bash
npm run db:generate
```

Run migrations:

```bash
npm run db:migrate
```

Open Prisma Studio:

```bash
npm run db:studio
```

## API Reference

Base URL:

```text
http://localhost:4000
```

Production:

```text
https://cig-project-production.up.railway.app
```

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | API health check |
| `POST` | `/auth/register` | Public | Register a user |
| `POST` | `/auth/login` | Public | Login and receive JWT |
| `GET` | `/clubs` | Public | List clubs |
| `GET` | `/events` | Public | List events |
| `POST` | `/events` | Admin | Create event |
| `GET` | `/events/:id` | Public | Get event details |
| `DELETE` | `/events/:id` | Admin/Club | Delete event |
| `POST` | `/events/:id/albums` | Admin/Club | Create album |
| `GET` | `/albums/:id/media` | Auth | Paginated album media |
| `POST` | `/albums/:id/media/presign` | Auth | Create S3 upload URL |
| `POST` | `/albums/:id/media/confirm` | Auth | Confirm upload and enqueue processing |
| `GET` | `/albums/:id/qr` | Auth | Generate or fetch QR share link |
| `GET` | `/albums/share/:token` | Public | Read album by QR token |
| `GET` | `/media/:id/download` | Auth | Download watermarked media |
| `POST` | `/media/:id/reactions` | Auth | Toggle reaction |
| `GET` | `/media/:id/reactions` | Auth | Get reaction counts |
| `POST` | `/media/:id/comments` | Auth | Add comment |
| `GET` | `/media/:id/comments` | Auth | List comments |
| `POST` | `/users/selfie` | Auth | Upload and index reference selfie |
| `GET` | `/users/me` | Auth | Current user profile |
| `GET` | `/users/me/photos` | Auth | Face-matched photos |
| `GET` | `/admin/users/pending` | Admin | Pending approvals |
| `POST` | `/admin/users/:id/approve` | Admin | Approve user |
| `GET` | `/admin/media-processing/status` | Admin | Media/queue processing status |
| `POST` | `/admin/media-processing/requeue` | Admin | Requeue unprocessed media |

## Media Processing Diagnostics

Use the admin status endpoint after deployment:

```bash
curl https://cig-project-production.up.railway.app/admin/media-processing/status \
  -H "Authorization: Bearer <admin-jwt>"
```

Expected response shape:

```json
{
  "ok": true,
  "data": {
    "totalMedia": 12,
    "missingThumbs": 0,
    "missingTags": 0,
    "missingFaceIds": 3,
    "queue": {
      "waiting": 0,
      "active": 0,
      "delayed": 0,
      "failed": 0,
      "completed": 12,
      "paused": 0
    }
  }
}
```

Requeue old or partially processed media:

```bash
curl -X POST https://cig-project-production.up.railway.app/admin/media-processing/requeue \
  -H "Authorization: Bearer <admin-jwt>"
```

## Troubleshooting

### Face Discovery shows no photos

Check these in order:

1. `POST /users/selfie` returns `200`.
2. The current user has a non-null `faceId`.
3. The Railway worker logs show `[worker] Media processing worker started`.
4. Uploaded `Media` rows have non-empty `faceIds`.
5. `REKOGNITION_COLLECTION_ID` matches the collection used to index selfies.
6. The album photos actually contain faces close enough to the reference selfie.

### Worker service is online but nothing processes

Check the start command. It must be:

```bash
npx tsx apps/api/src/worker.ts
```

If logs show `[api] Listening`, the worker is running the API process by mistake.

### Images upload but thumbnails never appear

Likely causes:

- Worker is not running.
- `REDIS_URL` differs between API and worker.
- Worker lacks S3 permissions.
- `S3_BUCKET_THUMBS` is wrong.
- Sharp failed on the uploaded image.

### Rekognition fails

Verify collection and region:

```bash
aws rekognition describe-collection \
  --collection-id cig-faces \
  --region us-east-1
```

The API and worker must use the same `AWS_REGION` and `REKOGNITION_COLLECTION_ID`.

### Rate-limit proxy warning on Railway

The API sets:

```ts
app.set('trust proxy', 1);
```

This allows Express and `express-rate-limit` to handle Railway/Vercel proxy headers correctly.

## Security Notes

- Do not expose AWS credentials to the frontend.
- Rotate secrets if they are printed in CLI output, logs, screenshots, or chat.
- Keep originals private and serve them through signed URLs or controlled download routes.
- Use a strong `JWT_SECRET` in every production environment.
- Restrict IAM permissions to only the required S3 buckets and Rekognition collection.
- Redeploy Vercel after changing public frontend environment variables.

## Project Status

This project is built for the Event and Media Management Platform problem statement. It includes the core user, event, upload, AI processing, face discovery, sharing, and download workflows needed for a complete club media platform.
