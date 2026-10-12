import { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { useAuth } from '../../store/AuthContext';
import { uploadImage } from '../../utils/uploadImage';

export default function CoverImageSlot() {
  const { year, setStore } = useStore();
  const { isAdmin } = useAuth();
  const src = year.coverImage;
  const [uploading, setUploading] = useState(false);

  const setImage = (url: string) =>
    setStore((s) => {
      s.years[String(s.activeYear)].coverImage = url;
    });

  const onFiles = async (files: FileList | File[] | null) => {
    if (!isAdmin || !files) return;
    const f = Array.from(files).find((x) => x.type.startsWith('image/'));
    if (!f) return;
    setUploading(true);
    try {
      const url = await uploadImage(f, 'cover');
      setImage(url);
    } catch (e) {
      console.warn('Cover photo upload failed', e);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onFiles(e.dataTransfer.files);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    if (!isAdmin) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) onFiles([f]);
      }
    }
  };

  return (
    <label
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onPaste={onPaste}
      style={{
        position: 'absolute', inset: 0, cursor: isAdmin ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundImage: src ? `url(${src})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center',
      }}
    >
      {!src && isAdmin && (
        <div
          style={{
            border: '1.5px dashed rgba(255,255,255,.45)', borderRadius: 10, padding: '18px 22px', color: 'rgba(255,255,255,.75)',
            fontSize: 12.5, textAlign: 'center', maxWidth: 200,
          }}
        >
          {uploading ? 'Uploading…' : 'Drop a plant / facility photo'}
          {!uploading && <div style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,.5)' }}>or click to upload, or paste</div>}
        </div>
      )}
      <input type="file" accept="image/*" disabled={!isAdmin} style={{ display: 'none' }} onChange={(e) => onFiles(e.target.files)} />
    </label>
  );
}
