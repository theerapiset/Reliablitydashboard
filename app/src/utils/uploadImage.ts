import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { firebaseConfigured, storage } from '../firebase';
import { uid } from './calc';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(file);
  });
}

/**
 * Upload an image and return a URL to store in the shared document.
 * Falls back to an inline data URL when Firebase Storage isn't configured
 * (e.g. local-only dev) so the app still works without setup.
 */
export async function uploadImage(file: File, pathPrefix: string): Promise<string> {
  if (!firebaseConfigured) return fileToDataUrl(file);
  const path = `${pathPrefix}/${Date.now()}-${uid()}-${file.name}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export async function uploadImages(files: FileList | File[], pathPrefix: string): Promise<string[]> {
  const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
  return Promise.all(arr.map((f) => uploadImage(f, pathPrefix)));
}
