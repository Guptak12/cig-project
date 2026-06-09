export function buildMediaUrl(baseUrl: string, bucket: 'thumbs' | 'originals', key: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const normalizedKey = key.startsWith('/') ? key.slice(1) : key;

  if (!baseUrl) {
    return `${apiBase}/mock-s3-view/${bucket}/${normalizedKey}`;
  }

  const normalizedBase = baseUrl.replace(/\/$/, '');
  if (normalizedBase.includes('/mock-s3-view')) {
    return `${normalizedBase}/${bucket}/${normalizedKey}`;
  }

  return `${normalizedBase}/${normalizedKey}`;
}
