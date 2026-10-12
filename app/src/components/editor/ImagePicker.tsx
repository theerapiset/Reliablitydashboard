import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { fonts } from '../../theme';
import { uploadImages } from '../../utils/uploadImage';
import type { ImageRef } from '../../types/models';

const IMG_SIZES: [string, number][] = [
  ['S', 96],
  ['M', 150],
  ['L', 230],
  ['XL', 320],
];

export default function ImagePicker({
  images,
  onChange,
  pathPrefix,
}: {
  images: ImageRef[];
  onChange: (images: ImageRef[]) => void;
  pathPrefix: string;
}) {
  const [uploading, setUploading] = useState(0);
  const { isAdmin } = useAuth();

  const addFiles = async (files: FileList | File[]) => {
    const count = Array.from(files).filter((f) => f.type.startsWith('image/')).length;
    if (!count) return;
    setUploading((n) => n + count);
    try {
      const urls = await uploadImages(files, pathPrefix);
      if (urls.length) onChange([...images, ...urls.map((src) => ({ src, h: 150 }))]);
    } catch (e) {
      console.warn('Image upload failed', e);
      window.alert('อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setUploading((n) => Math.max(0, n - count));
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    if (!isAdmin) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  };

  const setSize = (i: number, h: number) => onChange(images.map((img, j) => (j === i ? { ...img, h } : img)));
  const remove = (i: number) => onChange(images.filter((_, j) => j !== i));

  return (
    <div onPaste={onPaste}>
      <span style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: '#7c8a99', textTransform: 'uppercase' }}>
        Images — paste (Ctrl/⌘+V) or upload · pick S/M/L/XL for display size
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6, alignItems: 'flex-start' }}>
        {images.map((img, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid #e2e7ee', borderRadius: 8, padding: 6, background: '#fafbfc' }}>
            <div style={{ position: 'relative', width: 150, height: Math.min(140, Math.max(64, img.h)), borderRadius: 5, overflow: 'hidden', border: '1px solid #d8dee6', background: '#fff' }}>
              <img src={img.src} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <button
                onClick={() => remove(i)}
                style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, border: 'none', borderRadius: 5, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #dde3ea' }}>
              {IMG_SIZES.map(([label, h]) => (
                <button
                  key={label}
                  onClick={() => setSize(i, h)}
                  title={`Display height ${h}px`}
                  style={{
                    border: 'none', padding: '3px 7px', fontSize: 10.5, fontWeight: 700, fontFamily: fonts.mono,
                    background: img.h === h ? '#15355b' : '#eef1f5', color: img.h === h ? '#fff' : '#5a6878',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div
            key={'up' + i}
            style={{ width: 150, height: 78, borderRadius: 8, border: '1px solid #e2e7ee', background: '#fafbfc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9aa6b3', fontSize: 11 }}
          >
            Uploading…
          </div>
        ))}
        <label
          style={{
            width: 104, height: 78, border: '1.5px dashed #c2ccd7', borderRadius: 7, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#8895a3', fontSize: 11, gap: 2,
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>Add image
          <input
            type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}
