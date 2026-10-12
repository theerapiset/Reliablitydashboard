import { fmt } from '../utils/calc';
import type { CostSavingProject } from '../utils/calc';

export default function CostSavingTooltip({ title, projects, total }: { title: string; projects: CostSavingProject[]; total: number }) {
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>
        {title} — {fmt(total, 2)} MB
      </div>
      {projects.length ? (
        projects.map((p, i) => (
          <div key={i} style={{ fontSize: 11.5, color: '#d6e0ec', margin: '2px 0' }}>
            • {p.name || '(untitled project)'} <span style={{ color: '#fff', fontWeight: 700 }}>({fmt(p.mb, 2)} MB)</span>
          </div>
        ))
      ) : (
        <div style={{ fontSize: 11.5, color: '#9fb6cf' }}>No project recorded.</div>
      )}
    </div>
  );
}
