export function buildMediaUrl(baseUrl: string, bucket: 'thumbs' | 'originals', key: string) {
  const apiBase = (
    process.env.NEXT_PUBLIC_API_URL || 'https://aura-z3li.onrender.com'
  ).replace(/\/$/, '');
  const normalizedKey = key.startsWith('/') ? key.slice(1) : key;

  if (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('/mock-s3-view')) {
    return `${apiBase}/media/view?key=${encodeURIComponent(normalizedKey)}`;
  }

  const normalizedBase = baseUrl.replace(/\/$/, '');
  return `${normalizedBase}/${normalizedKey}`;
}
