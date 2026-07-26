export async function compressImage(
  blob: Blob,
  maxWidth: number = 800,
  quality: number = 0.7
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve(blob); // fallback
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (compressed) => {
          if (compressed) {
            resolve(compressed);
          } else {
            resolve(blob); // fallback
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob); // fallback to original on error
    };

    img.src = url;
  });
}
