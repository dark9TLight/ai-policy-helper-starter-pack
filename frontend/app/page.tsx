import Chat from '@/components/Chat';
import AdminPanel from '@/components/AdminPanel';

export default function Page() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
        AI Policy & Product Helper
      </h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Local-first RAG starter. Ingest sample docs, ask questions, and see citations.
      </p>
      <AdminPanel />
      <Chat />
    </div>
  );
}
