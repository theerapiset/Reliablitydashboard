import type { ReactNode } from 'react';
import { useAuth } from '../store/AuthContext';

/**
 * Wraps a view's editable controls. A native <fieldset disabled> greys out
 * and disables every nested input/select/textarea/button for free — no need
 * to thread a prop through every field. `display:contents` keeps it out of
 * the layout box so it doesn't affect surrounding flex/grid.
 */
export default function EditGate({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  return (
    <fieldset disabled={!isAdmin} style={{ border: 'none', padding: 0, margin: 0, display: 'contents' }}>
      {children}
    </fieldset>
  );
}
