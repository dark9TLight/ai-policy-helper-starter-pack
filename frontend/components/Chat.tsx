'use client';
import React from 'react';
import { apiAsk } from '@/lib/api';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  citations?: { title: string; section?: string }[];
  chunks?: { title: string; section?: string; text: string }[];
  error?: boolean;
};

export default function Chat() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!q.trim() || loading) return;
    const question = q.trim();
    setMessages(m => [...m, { role: 'user', content: question }]);
    setQ('');
    setLoading(true);
    try {
      const res = await apiAsk(question);
      setMessages(m => [...m, {
        role: 'assistant',
        content: res.answer,
        citations: res.citations,
        chunks: res.chunks,
      }]);
    } catch (e: any) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Chat</h2>
      <div style={{
        maxHeight: 400,
        overflowY: 'auto',
        padding: 12,
        border: '1px solid #eee',
        borderRadius: 8,
        marginBottom: 12,
        background: '#fafafa',
      }}>
        {messages.length === 0 && (
          <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>
            Ask a question about our policies or products
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            margin: '12px 0',
            padding: '10px 14px',
            borderRadius: 8,
            background: m.role === 'user' ? '#f0f0f0' : m.error ? '#fff5f5' : '#fff',
            border: m.error ? '1px solid #ffcccc' : '1px solid #e8e8e8',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>
              {m.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div style={{ lineHeight: 1.6 }}>{m.content}</div>

            {m.citations && m.citations.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {m.citations.map((c, idx) => (
                  <span key={idx} style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: '#e8f4ff',
                    border: '1px solid #b3d9ff',
                    color: '#0066cc',
                  }} title={c.section || ''}>
                    📄 {c.title}
                  </span>
                ))}
              </div>
            )}

            {m.chunks && m.chunks.length > 0 && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12, color: '#666' }}>
                  ▶ View supporting chunks ({m.chunks.length})
                </summary>
                {m.chunks.map((c, idx) => (
                  <div key={idx} style={{
                    marginTop: 6,
                    padding: 10,
                    background: '#f8f8f8',
                    borderRadius: 6,
                    border: '1px solid #eee',
                    fontSize: 13,
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: '#333' }}>
                      {c.title}{c.section ? ' — ' + c.section : ''}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#555', lineHeight: 1.5 }}>{c.text}</div>
                  </div>
                ))}
              </details>
            )}
          </div>
        ))}

        {loading && (
          <div style={{
            margin: '12px 0',
            padding: '10px 14px',
            borderRadius: 8,
            background: '#fff',
            border: '1px solid #e8e8e8',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>
              Assistant
            </div>
            <div style={{ color: '#999' }}>⏳ Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="Ask about policy or products..."
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #ddd',
            fontSize: 14,
            outline: 'none',
            opacity: loading ? 0.6 : 1,
          }}
        />
        <button
          onClick={send}
          disabled={loading || !q.trim()}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: loading || !q.trim() ? '#999' : '#111',
            color: '#fff',
            cursor: loading || !q.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 14,
            transition: 'background 0.2s',
          }}
        >
          {loading ? '⏳' : 'Send'}
        </button>
      </div>

      <div style={{ marginTop: 16, padding: 12, background: '#f9f9f9', borderRadius: 8, fontSize: 13 }}>
        <strong>How to test</strong>
        <ol style={{ margin: '6px 0 0 16px', lineHeight: 1.8 }}>
          <li>Click <strong>Ingest sample docs</strong>.</li>
          <li>Ask: <em>Can a customer return a damaged blender after 20 days?</em></li>
          <li>Ask: <em>What&apos;s the shipping SLA to East Malaysia for bulky items?</em></li>
        </ol>
      </div>
    </div>
  );
}
