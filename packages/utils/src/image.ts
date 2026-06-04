import sharp from 'sharp';

export type WatermarkRole = 'ADMIN' | 'PHOTOGRAPHER' | 'MEMBER';

interface WatermarkOptions {
  clubName: string;
  eventName: string;
  userRole: WatermarkRole;
}

/**
 * Build an SVG text overlay for use as a Sharp composite input.
 * Positioned bottom-right with semi-transparent background for legibility.
 */
function buildSvgOverlay(text: string): Buffer {
  // Estimate width: ~9px per character at font-size 16
  const padding = 14;
  const width = text.length * 9 + padding * 2;
  const height = 36;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="4" fill="rgba(0,0,0,0.45)" />
      <text
        x="${padding}"
        y="${height / 2 + 6}"
        font-family="Arial, sans-serif"
        font-size="14"
        font-weight="600"
        fill="rgba(255,255,255,0.9)"
        letter-spacing="0.5"
      >${text}</text>
    </svg>
  `.trim();

  return Buffer.from(svg);
}

/**
 * Apply a dynamic watermark to an image buffer.
 * Watermark is composited server-side at download time — cannot be bypassed.
 *
 * @param imageBuffer - Raw image bytes fetched from S3
 * @param opts - Club name, event name, and requesting user's role
 * @returns JPEG buffer with watermark applied
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  opts: WatermarkOptions,
): Promise<Buffer> {
  const text = `${opts.clubName} · ${opts.eventName} · ${opts.userRole}`;
  const svgOverlay = buildSvgOverlay(text);

  return sharp(imageBuffer)
    .composite([
      {
        input: svgOverlay,
        // Position in bottom-right corner with 16px margin
        gravity: 'southeast',
        blend: 'over',
      },
    ])
    .jpeg({ quality: 92, progressive: true })
    .toBuffer();
}

/**
 * Resize an image to a thumbnail for gallery display.
 * Saves bandwidth — client loads thumbs, original only on full view/download.
 */
export async function generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(600, 600, {
      fit: 'inside',       // preserve aspect ratio
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();
}
