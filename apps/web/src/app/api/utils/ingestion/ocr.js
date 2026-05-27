let tesseract = null;

async function getTesseract() {
  if (!tesseract) {
    const mod = await import("tesseract.js");
    tesseract = mod;
  }
  return tesseract;
}

export async function ocrImage(buffer, options = {}) {
  const { TesseractWorker } = await getTesseract();
  const worker = await TesseractWorker.create({
    language: options.language || "eng",
    logger: options.debug ? (m) => console.log("OCR:", m.status, m.progress) : undefined,
  });

  try {
    const { data } = await worker.recognize(buffer);
    return {
      text: data.text,
      confidence: data.confidence,
      blocks: data.blocks?.length || 0,
      lines: data.lines?.length || 0,
      words: data.words?.length || 0,
      paragraphs: data.paragraphs?.map((p) => ({
        text: p.text,
        confidence: p.confidence,
      })),
    };
  } finally {
    await worker.terminate();
  }
}

export async function ocrPdfPage(buffer, pageNum = 1) {
  const { TesseractWorker } = await getTesseract();
  const worker = await TesseractWorker.create({ language: "eng" });

  try {
    const { data } = await worker.recognize(buffer);
    return {
      page: pageNum,
      text: data.text,
      confidence: data.confidence,
    };
  } finally {
    await worker.terminate();
  }
}

export async function ocrTable(buffer) {
  const ocr = await ocrImage(buffer);
  const rows = ocr.text
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => l.split(/\s{2,}|\t/).map((c) => c.trim()));
  return {
    rows,
    text: ocr.text,
    confidence: ocr.confidence,
  };
}
