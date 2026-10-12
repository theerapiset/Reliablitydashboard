import { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { colors } from '../theme';

export default function AdminLock() {
  const { isAdmin, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAdmin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: colors.green }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.green, flex: 'none' }} />
          🔓 Admin mode
        </span>
        <button
          onClick={() => logout()}
          title="ล็อกกลับเป็นโหมดดูอย่างเดียว"
          style={{ height: 28, border: '1px solid #cfd7e0', background: '#fff', borderRadius: 6, padding: '0 9px', fontSize: 11.5, color: '#46566a' }}
        >
          Lock
        </button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await login(password);
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      setPassword('');
    } else {
      setError(res.error || 'เข้าไม่สำเร็จ');
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="ปลดล็อกเพื่อแก้ไขข้อมูล"
        style={{ height: 28, display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #cfd7e0', background: '#fff', borderRadius: 6, padding: '0 9px', fontSize: 11.5, color: '#8a97a6' }}
      >
        🔒 View only
      </button>
      {open && (
        <form
          onSubmit={submit}
          style={{
            position: 'absolute', top: 34, right: 0, zIndex: 70, background: '#fff', border: '1px solid #d4dbe3',
            borderRadius: 9, padding: 12, boxShadow: '0 8px 24px rgba(0,0,0,.18)', width: 220, display: 'flex', flexDirection: 'column', gap: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.ink }}>ใส่รหัส Admin เพื่อแก้ไข</div>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="รหัสผ่าน"
            style={{ height: 34, border: '1px solid #cfd7e0', borderRadius: 7, padding: '0 10px' }}
          />
          {error && <div style={{ fontSize: 11.5, color: colors.danger }}>{error}</div>}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError('');
                setPassword('');
              }}
              style={{ height: 32, border: '1px solid #cfd7e0', background: '#fff', borderRadius: 6, padding: '0 10px', fontSize: 12 }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={busy || !password}
              style={{ height: 32, border: 'none', background: colors.navy, color: '#fff', borderRadius: 6, padding: '0 12px', fontSize: 12, fontWeight: 700, opacity: busy || !password ? 0.6 : 1 }}
            >
              {busy ? '...' : 'ปลดล็อก'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
