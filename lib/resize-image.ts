/**
 * Shrinks a photo in the browser before upload so a 12 MB phone picture becomes a few hundred KB.
 * Longest side is capped at `max` pixels; the result is a JPEG.
 */
export async function resizeImage(file: File, max = 1100, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process this photo.");
  ctx.fillStyle = "#ffffff"; // transparent PNGs would otherwise turn black in a JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Your browser could not process this photo.");
  return blob;
}
