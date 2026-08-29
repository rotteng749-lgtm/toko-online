'use client';

import { useState, useEffect } from 'react';

interface Question {
  id: number;
  product_id: number;
  customer_name: string;
  question: string;
  answer: string | null;
  answered_at: number | null;
  created_at: number;
}

export default function ProductQA({ productId }: { productId: number }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`/api/questions?product_id=${productId}`)
      .then(r => r.json())
      .then(data => setQuestions(data.questions || []))
      .catch(() => {});
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !question.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, customer_name: name, question }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(prev => [data.question, ...prev]);
        setQuestion('');
        setShowForm(false);
      }
    } catch {}
    setSubmitting(false);
  };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #fff)', margin: 0 }}>
          ❓ Pertanyaan ({questions.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: 'var(--accent, #a855f7)', color: '#fff',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}
        >
          {showForm ? '✕ Batal' : '💬 Tanya'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: 'var(--card-bg, rgba(255,255,255,0.05))', borderRadius: 12,
          padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <input
            placeholder="Nama kamu"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{
              padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary, #fff)',
              fontSize: 14, outline: 'none',
            }}
          />
          <textarea
            placeholder="Tulis pertanyaan kamu..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            required
            rows={3}
            style={{
              padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary, #fff)',
              fontSize: 14, outline: 'none', resize: 'vertical',
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: 'var(--accent, #a855f7)', color: '#fff',
              fontWeight: 600, fontSize: 14, cursor: 'pointer', alignSelf: 'flex-start',
            }}
          >
            {submitting ? 'Mengirim...' : '📤 Kirim Pertanyaan'}
          </button>
        </form>
      )}

      {questions.length === 0 && !showForm && (
        <p style={{ color: 'var(--text-secondary, #888)', fontSize: 14 }}>
          Belum ada pertanyaan. Jadikan yang pertama bertanya! 💬
        </p>
      )}

      {questions.map(q => (
        <div key={q.id} style={{
          background: 'var(--card-bg, rgba(255,255,255,0.05))', borderRadius: 12,
          padding: 16, marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent, #a855f7)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
            }}>
              {q.customer_name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary, #fff)', fontSize: 14 }}>
              {q.customer_name}
            </span>
            <span style={{ color: 'var(--text-secondary, #666)', fontSize: 12 }}>
              {new Date(q.created_at * 1000).toLocaleDateString('id-ID')}
            </span>
          </div>
          <p style={{ color: 'var(--text-primary, #fff)', fontSize: 14, margin: '0 0 12px' }}>
            ❓ {q.question}
          </p>
          {q.answer ? (
            <div style={{
              background: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: 12,
              borderLeft: '3px solid #22c55e',
            }}>
              <p style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, margin: '0 0 4px' }}>
                ✅ Jawaban Toko
              </p>
              <p style={{ color: 'var(--text-primary, #fff)', fontSize: 14, margin: 0 }}>
                {q.answer}
              </p>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary, #666)', fontSize: 12, fontStyle: 'italic', margin: 0 }}>
              ⏳ Menunggu jawaban dari toko...
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
