/**
 * Load an image from a URL (object URL or http) for canvas use.
 */
export function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (e) => reject(e));
    image.src = url;
  });
}

/**
 * Returns a JPEG blob cropped to pixelCrop from imageSrc (react-easy-crop pixel crop).
 */
export async function getCroppedImg(imageSrc, pixelCrop, mimeType = 'image/jpeg', quality = 0.92) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas is empty'));
      },
      mimeType,
      quality
    );
  });
}
