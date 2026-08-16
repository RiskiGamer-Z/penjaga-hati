/**
 * Kompresi gambar di sisi client sebelum diunggah.
 * Mengecilkan dimensi & kualitas agar hemat ruang penyimpanan dan
 * menghindari limit body 1MB pada Next.js Server Actions.
 */

interface CompressOptions {
  /** Lebar/tinggi maksimum (px). Default 1600. */
  maxDimension?: number;
  /** Kualitas JPEG 0-1. Default 0.75. */
  quality?: number;
  /** Target ukuran maksimum hasil (bytes). Default 900KB (aman < 1MB). */
  maxSizeBytes?: number;
}

/**
 * Mengompres File gambar menjadi JPEG yang lebih kecil.
 * File non-gambar (mis. PDF) dikembalikan apa adanya.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxDimension = 1600,
    quality = 0.75,
    maxSizeBytes = 900 * 1024,
  } = options;

  // Lewati kompresi untuk non-gambar (mis. PDF)
  if (!file.type.startsWith("image/")) return file;

  // Muat gambar ke dalam elemen Image
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);

  // Hitung dimensi baru dengan menjaga rasio aspek
  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  // Turunkan kualitas bertahap hingga di bawah target ukuran
  let currentQuality = quality;
  let blob = await canvasToBlob(canvas, currentQuality);

  while (blob && blob.size > maxSizeBytes && currentQuality > 0.3) {
    currentQuality -= 0.1;
    blob = await canvasToBlob(canvas, currentQuality);
  }

  if (!blob) return file;

  // Jika hasil kompresi malah lebih besar dari asli, pakai file asli
  if (blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });
}
