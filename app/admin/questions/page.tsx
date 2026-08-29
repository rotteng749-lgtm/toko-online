'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Question {
  id: number;
  product_id: number;
  product_name: string;
  customer_name: string;
  question: string;
  answer: string | null;
  created_at: number;
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/questions');
      const data = await res.json();
      if (data.ok) setQuestions(data.questions);
    } catch {}
    setLoading(false);
  };

  const handleAnswer = async (questionId: number) => {
    const answer = answerText[questionId];
    if (!answer?.trim()) return;
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: questionId, answer }),
      });
      if (res.ok) {
        setQuestions(prev => prev.map(q =>
          q.id === questionId ? { ...q, answer, answered_at: Math.floor(Date.now() / 1000) } : q
        ));
        setAnswerText(prev => ({ ...prev, [questionId]: '' }));
        (window as any).showToast?.('Jawaban dikirim! ✅', 'success');
      }
    } catch {
      (window as any).showToast?.('Gagal mengirim jawaban', 'error');
    }
  };

  const handleDelete = async (questionId: number) => {
    if (!confirm('Hapus pertanyaan ini?')) return;
    try {
      await fetch('/api/admin/questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: questionId }),
      });
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      (window as any).showToast?.('Pertanyaan dihapus', 'success');
    } catch {}
  };

  const unanswered = questions.filter(q => !q.answer);
  const answered = questions.filter(q => q.answer);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
          ❓ Kelola Pertanyaan
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600,
            background: unanswered.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
            color: unanswered.length > 0 ? '#ef4444' : '#22c55e',
          }}>
            {unanswered.length} belum dijawab
          </span>
          <span style={{
            padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600,
            background: 'rgba(34,197,94,0.15)', color: '#22c55e',
          }}>
            {answered.length} terjawab
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>⏳ Memuat...</div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 16, fontWeight: 600 }}>Belum ada pertanyaan</p>
        </div>
      ) : (
        <>
          {/* Unanswered */}
          {unanswered.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', marginBottom: 16 }}>
                🔴 Belum Dijawab ({unanswered.length})
              </h2>
              {unanswered.map(q => (
                <div key={q.id} style={{
                  background: 'var(--glass)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{q.customer_name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>
                        → {q.product_name}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(q.created_at * 1000).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6 }}>
                    ❓ {q.question}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="form-input"
                      placeholder="Tulis jawaban..."
                      value={answerText[q.id] || ''}
                      onChange={e => setAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAnswer(q.id)}
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => handleAnswer(q.id)}>
                      ✅ Jawab
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleDelete(q.id)}
                      style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Answered */}
          {answered.length > 0 && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#22c55e', marginBottom: 16 }}>
                ✅ Sudah Dijawab ({answered.length})
              </h2>
              {answered.map(q => (
                <div key={q.id} style={{
                  background: 'var(--glass)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 12, opacity: 0.8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{q.customer_name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>
                        → {q.product_name}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(q.created_at * 1000).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: 14 }}>❓ {q.question}</p>
                  <div style={{
                    background: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: 12,
                    borderLeft: '3px solid #22c55e',
                  }}>
                    <p style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, margin: '0 0 4px' }}>✅ Jawaban:</p>
                    <p style={{ margin: 0, fontSize: 14 }}>{q.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
