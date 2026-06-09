import { api } from '@/lib/api';

function filenameFromDisposition(header: string | null, fallback: string) {
  const match = header?.match(/filename="([^"]+)"/);
  return match?.[1] ?? fallback;
}

export async function downloadMedia(mediaId: string) {
  const token = localStorage.getItem('cig-token');
  const res = await fetch(api.media.downloadUrl(mediaId), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error('Download failed');
  }

  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filenameFromDisposition(
    res.headers.get('Content-Disposition'),
    `photo-${mediaId}.jpg`,
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}
