import { Capacitor } from "@capacitor/core";
import { TextRecognition } from "@capacitor-mlkit/text-recognition";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { blobToDataURL } from "./db";

// Browser-only OCR wrapper (Tesseract.js). Lazy-load to keep bundle out of SSR.
export async function runOCR(image: Blob, onProgress?: (p: number) => void): Promise<string> {
  console.log(`[OCR] Starting runOCR. isNative: ${Capacitor.isNativePlatform()}`);
  if (Capacitor.isNativePlatform()) {
    console.log("[OCR] Using native ML Kit implementation");
    // Native ML Kit implementation
    if (onProgress) onProgress(0.2);
    
    console.log("[OCR] Converting blob to data URL");
    // ML Kit requires a local file path. Save Blob to temporary file.
    const base64DataUrl = await blobToDataURL(image);
    if (!base64DataUrl) {
      console.error("[OCR] Failed to convert image to base64");
      throw new Error("Could not convert image to base64");
    }
    
    // Extract base64 without prefix
    const base64Str = base64DataUrl.split(",")[1];
    
    const fileName = `ocr_temp_${Date.now()}.jpg`;
    console.log(`[OCR] Writing temporary file: ${fileName}`);
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Str,
      directory: Directory.Cache
    });
    console.log(`[OCR] File written successfully at: ${savedFile.uri}`);
    
    if (onProgress) onProgress(0.5);

    try {
      console.log(`[OCR] Calling TextRecognition.processImage with path: ${savedFile.uri}`);
      const result = await TextRecognition.processImage({
        path: savedFile.uri
      });
      console.log(`[OCR] TextRecognition succeeded. Found text of length: ${result.text.length}`);
      if (onProgress) onProgress(1.0);
      return result.text;
    } catch (err) {
      console.error("[OCR] TextRecognition.processImage failed:", err);
      throw err;
    } finally {
      console.log(`[OCR] Cleaning up temporary file: ${fileName}`);
      // Clean up temp file
      await Filesystem.deleteFile({
        path: fileName,
        directory: Directory.Cache
      }).catch(e => console.warn("[OCR] Failed to delete temporary file:", e));
    }
  }

  console.log("[OCR] Using Web Fallback (Tesseract.js)");
  // Web Fallback: Tesseract
  const { createWorker } = await import("tesseract.js");
  console.log("[OCR] Creating Tesseract worker...");
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      console.log(`[OCR Tesseract] ${m.status}: ${m.progress}`);
      if (m.status === "recognizing text" && onProgress) onProgress(m.progress);
    },
  });
  console.log("[OCR] Worker created, starting recognition...");
  try {
    const { data } = await worker.recognize(image);
    console.log("[OCR] Tesseract recognition succeeded");
    return data.text;
  } catch (err) {
    console.error("[OCR] Tesseract recognition failed:", err);
    throw err;
  } finally {
    console.log("[OCR] Terminating Tesseract worker");
    await worker.terminate();
  }
}
