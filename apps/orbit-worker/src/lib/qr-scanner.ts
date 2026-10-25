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
    // Native: use image manipulator and barcode scanning via expo-camera on live view
    try {
      const manip = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 500 } }],
        { format: ImageManipulator.SaveFormat.PNG, base64: true }
      );

      if (!manip.base64) {
        throw new Error('Failed to process image');
      }

      // For native image URI decoding without DOM canvas, return error or delegate to CameraView barcode scanner
      throw new Error('QR image file decoding on native uses live CameraView barcode scanning');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to detect QR code in image');
    }
  }
}
