/**
 * Typed API client for the CIG platform.
 * Reads the JWT token from localStorage and injects it into every request.
 * All methods return the unwrapped `data` or throw on error.
 */

const BASE = (
  process.env.NEXT_PUBLIC_API_URL || 'https://aura-z3li.onrender.com'
).replace(/\/$/, '');

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('cig-token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const json = await res.json();

  if (!json.ok) {
    throw new Error(json.error ?? 'API error');
  }

  return json.data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CLUB' | 'PHOTOGRAPHER' | 'MEMBER';
}

export interface AuthResult {
  user: AuthUser;
  token: string | null;
  needsApproval: boolean;
  message?: string;
}

export interface Club {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: AuthUser['role'];
  createdAt: string;
}

export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string; role?: AuthUser['role'] }) =>
      request<AuthResult>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      request<AuthResult>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  },

  events: {
    list: () => request<Event[]>('/events'),
    get: (id: string) => request<EventDetail>(`/events/${id}`),
    create: (body: CreateEventBody) =>
      request<Event>('/events', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id: string) => request<null>(`/events/${id}`, { method: 'DELETE' }),
    createAlbum: (eventId: string, body: { name: string; isPublic: boolean }) =>
      request<{ id: string; name: string; isPublic: boolean; qrToken: string | null }>(
        `/events/${eventId}/albums`,
        { method: 'POST', body: JSON.stringify(body) },
      ),
  },

  clubs: {
    list: () => request<Club[]>('/clubs'),
  },

  admin: {
    pendingUsers: () => request<PendingUser[]>('/admin/users/pending'),
    approveUser: (id: string) => request<PendingUser>(`/admin/users/${id}/approve`, { method: 'POST' }),
  },

  albums: {
    getMedia: (albumId: string, cursor?: string) =>
      request<{ items: MediaItem[]; nextCursor: string | null }>(
        `/albums/${albumId}/media${cursor ? `?cursor=${cursor}` : ''}`,
      ),
    delete: (albumId: string) => request<null>(`/albums/${albumId}`, { method: 'DELETE' }),
    presign: (albumId: string, body: { fileName: string; contentType: string }) =>
      request<{ uploadUrl: string; s3Key: string }>(
        `/albums/${albumId}/media/presign`,
        { method: 'POST', body: JSON.stringify({ ...body, albumId }) },
      ),
    confirm: (albumId: string, s3Key: string) =>
      request<MediaItem>(`/albums/${albumId}/media/confirm`, {
        method: 'POST',
        body: JSON.stringify({ s3Key, albumId }),
      }),
    getQr: (albumId: string) =>
      request<{ qrToken: string; shareUrl: string }>(`/albums/${albumId}/qr`),
    getByToken: (token: string) => request<AlbumShare>(`/albums/share/${token}`),
  },

  media: {
    react: (mediaId: string, type: string) =>
      request<unknown>(`/media/${mediaId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      }),
    getReactions: (mediaId: string) =>
      request<{ counts: { type: string; _count: { type: number } }[]; userReaction: string | null }>(
        `/media/${mediaId}/reactions`,
      ),
    addComment: (mediaId: string, body: string) =>
      request<Comment>(`/media/${mediaId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    getComments: (mediaId: string) => request<Comment[]>(`/media/${mediaId}/comments`),
    downloadUrl: (mediaId: string) => `${BASE}/media/${mediaId}/download`,
  },

  users: {
    me: () => request<AuthUser & { selfieKey: string | null; faceId: string | null }>('/users/me'),
    myPhotos: () => request<MyPhoto[]>('/users/me/photos'),
  },
};

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  name: string;
  description: string | null;
  date: string;
  isPublic: boolean;
  club: { id: string; name: string; logoUrl: string | null };
  albums: { id: string; name: string }[];
}

export interface EventDetail extends Event {
  albums: { id: string; name: string; isPublic: boolean; qrToken: string | null }[];
}

export interface MediaItem {
  id: string;
  s3Key: string;
  thumbKey: string | null;
  viewUrl: string;
  mimeType: string;
  tags: string[];
  faceIds: string[];
  caption: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string };
  _count: { reactions: number; comments: number };
}

export interface MyPhoto {
  id: string;
  s3Key: string;
  thumbKey: string | null;
  viewUrl?: string;
  albumId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string };
}

export interface AlbumShare {
  id: string;
  name: string;
  event: { name: string; club: { name: string } };
  media: { id: string; s3Key: string; thumbKey: string | null; tags: string[] }[];
}

export interface CreateEventBody {
  name: string;
  description?: string;
  date: string;
  clubId: string;
  isPublic: boolean;
}
