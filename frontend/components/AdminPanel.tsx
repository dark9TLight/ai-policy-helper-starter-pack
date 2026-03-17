'use client';
import React from 'react';
import { apiIngest, apiMetrics } from '@/lib/api';

export default function AdminPanel() {
  const [metrics, setMetrics] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState<{ msg: string; ok: boolean } | null>(null);

  const refresh = async () => {
    try {
      const m = await apiMetrics();
      setMetrics(m);
    } catch {
      setStatus({ msg: 'Could not fetch metrics. Is the backend running?', ok: false });
    }
  };

  const ingest = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await apiIngest();
      await refresh();
      setStatus({ msg: `✅ Ingested ${res.indexed_docs} docs, ${res.indexed_chunks} chunks`, ok: true });
    } catch {
      setStatus({ msg: '❌ Ingest failed. Make sure the backend is running.', ok: false });
    } finally {
      setBusy(false);
    }
  };

  React.useEffect(() => { refresh(); }, []);

  return (
    <div className="card">
      <h2>Admin</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={ingest}
          disabled={busy}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #111',
            background: busy ? '#eee' : '#fff',
            cursor: busy ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
        >
          {busy ? '⏳ Indexing...' : 'Ingest sample docs'}
        </button>
        <button
          onClick={refresh}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #111',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Refresh metrics
        </button>
      </div>

      {status && (
        <div style={{
          padding: '8px 12px',
          borderRadius: 6,
          marginBottom: 10,
          background: status.ok ? '#f0fff4' : '#fff5f5',
          border: `1px solid ${status.ok ? '#9ae6b4' : '#ffcccc'}`,
          fontSize: 13,
          color: status.ok ? '#276749' : '#c53030',
        }}>
          {status.msg}
        </div>
      )}

      {metrics && (
        <div style={{
          background: '#f8f8f8',
          borderRadius: 8,
          padding: 12,
          border: '1px solid #eee',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: '📄 Total Docs', value: metrics.total_docs },
              { label: '🔢 Total Chunks', value: metrics.total_chunks },
              { label: '⚡ Avg Retrieval', value: `${metrics.avg_retrieval_latency_ms} ms` },
              { label: '🤖 Avg Generation', value: `${metrics.avg_generation_latency_ms} ms` },
              { label: '🧠 LLM Model', value: metrics.llm_model },
              { label: '📐 Embedding', value: metrics.embedding_model },
            ].map(({ label, value }) => (
              <div key={label} style={{
                padding: '8px 10px',
                background: '#fff',
                borderRadius: 6,
                border: '1px solid #eee',
              }}>
                <div style={{ fontSize: 11, color: '#888' }}>{label}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
