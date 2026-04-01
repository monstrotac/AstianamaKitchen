import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrials, createTrial } from '../../api/sanctum';
import TrialCard from '../../components/sanctum/TrialCard';
import { useAuth } from '../../contexts/AuthContext';
import { useTitle } from '../../hooks/useTitle';
import GuestBanner from '../../components/ui/GuestBanner';

const STATUSES = ['', 'pending', 'active', 'complete', 'failed'];
const PAGE_SIZE = 10;

function Pagination({ page, total, onChange }) {
  if (total <= 1) return null;
  return (
    <div className="s-pagination">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}>← Prev</button>
      <span>{page} / {total}</span>
      <button disabled={page === total} onClick={() => onChange(page + 1)}>Next →</button>
    </div>
  );
}

export default function SpireTrialsPage() {
  useTitle('Trials');
  const { isMember } = useAuth();
  const navigate = useNavigate();

  const [trials, setTrials]             = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [page, setPage]                 = useState(1);

  const load = useCallback(() => getTrials().then(setTrials).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const drafts     = trials.filter(t => !t.is_published);
  const allPublished = trials.filter(t => t.is_published);
  const filtered   = statusFilter ? allPublished.filter(t => t.status === statusFilter) : allPublished;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleCreate() {
    setSaving(true);
    setError('');
    try {
      const trial = await createTrial({});
      navigate(`/trials/${trial.id}/edit`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create trial');
      setSaving(false);
    }
  }

  return (
    <div>
      <GuestBanner />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="s-section-title" style={{ margin: '0 0 1rem' }}>Trials</div>
        {isMember && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {error && <span style={{ color: '#e74c3c', fontSize: '0.75rem' }}>{error}</span>}
            <button className="s-btn small" onClick={handleCreate} disabled={saving}>
              {saving ? '…' : '+ New Trial'}
            </button>
          </div>
        )}
      </div>

      {drafts.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--dim)', letterSpacing: '0.12em', fontFamily: "'Share Tech Mono',monospace", marginBottom: '0.5rem' }}>
            YOUR DRAFTS
          </div>
          {drafts.map(t => <TrialCard key={t.id} trial={t} />)}
        </div>
      )}

      <div className="s-search-row">
        <select
          className="s-select"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {paginated.length === 0
        ? <div className="s-empty">No trials found.</div>
        : paginated.map(t => <TrialCard key={t.id} trial={t} />)
      }

      <Pagination page={page} total={totalPages} onChange={setPage} />
    </div>
  );
}
