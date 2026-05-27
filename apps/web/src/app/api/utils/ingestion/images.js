let sharp = null;

async function getSharp() {
  if (!sharp) sharp = (await import("sharp")).default;
  return sharp;
}

export async function analyzeImage(buffer, mime) {
  const { default: s } = await getSharp();
  const meta = await s(buffer).metadata();

  return {
    format: meta.format,
    width: meta.width,
    height: meta.height,
    size: buffer.length,
    channels: meta.channels,
    hasAlpha: meta.hasAlpha || false,
    space: meta.space || "srgb",
    density: meta.density || 72,
    orientation: meta.orientation || 1,
    aspectRatio: meta.width && meta.height ? (meta.width / meta.height).toFixed(4) : null,
    megapixels: meta.width && meta.height ? ((meta.width * meta.height) / 1e6).toFixed(2) : null,
  };
}

export async function resizeImage(buffer, width, height) {
  const { default: s } = await getSharp();
  return s(buffer).resize(width, height, { fit: "inside", withoutEnlargement: true }).toBuffer();
}

export async function extractFrames(buffer, count = 5) {
  // Extract evenly-spaced frames via sharp (for image sequences)
  const { default: s } = await getSharp();
  const meta = await s(buffer).metadata();
  if (!meta.pages || meta.pages < 2) {
    return [buffer.toString("base64")];
  }

  const frames = [];
  const step = Math.max(1, Math.floor(meta.pages / count));
  for (let i = 0; i < meta.pages && frames.length < count; i += step) {
    const buf = await s(buffer, { page: i }).resize(800).toBuffer();
    frames.push(buf.toString("base64"));
  }
  return frames;
}

export async function preprocessForOcr(buffer) {
  const { default: s } = await getSharp();
  return s(buffer).grayscale().normalize().sharpen().resize(2000, 2000, { fit: "inside", withoutEnlargement: true }).toBuffer();
}

export async function getImageBase64(buffer, mime) {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
