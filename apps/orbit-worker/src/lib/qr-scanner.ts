// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#pair]
import jsqr from 'jsqr';
import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

export async function decodeQrFromImageUri(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0, img.width, img.height);
          const imgData = context.getImageData(0, 0, img.width, img.height);
          const code = jsqr(imgData.data, imgData.width, imgData.height);
          if (code) {
            resolve(code.data);
          } else {
            reject(new Error('No QR code found in image'));
          }
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = uri;
    });
  } else {
    try {
      const manip = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 500 } }],
        { format: ImageManipulator.SaveFormat.PNG, base64: true }
      );

      if (!manip.base64) {
        throw new Error('Failed to process image');
      }

      return new Promise((resolve, reject) => {
        const win = globalThis as any;
        const ImageCtor = win.Image;
        const img = ImageCtor ? new ImageCtor() : null;
        if (img) {
          img.onload = () => {
            const documentObj = win.document;
            const canvas = documentObj && documentObj.createElement ? documentObj.createElement('canvas') : null;
            if (!canvas) {
              reject(new Error('Canvas not supported'));
              return;
            }
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Context not supported'));
              return;
            }
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, img.width, img.height);
            const code = jsqr(imgData.data, imgData.width, imgData.height);
            if (code) resolve(code.data);
            else reject(new Error('No QR code found in image'));
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = `data:image/png;base64,${manip.base64}`;
        } else {
          reject(new Error('Image decoding requires canvas support'));
        }
      });
    } catch (err: any) {
      throw new Error(err.message || 'Failed to detect QR code in image');
    }
  }
}
