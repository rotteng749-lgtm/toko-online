'use client';

import { useState } from 'react';

interface GiftWrapProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  message: string;
  onMessageChange: (msg: string) => void;
}

const GIFT_WRAP_PRICE = 5000;

export { GIFT_WRAP_PRICE };

export default function GiftWrap({ enabled, onToggle, message, onMessageChange }: GiftWrapProps) {
  return (
    <div style={{
      background: 'var(--card-bg, rgba(255,255,255,0.05))', borderRadius: 12,
      padding: 20, marginTop: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: enabled ? 16 : 0 }}>
        <button
          onClick={() => onToggle(!enabled)}
          style={{
            width: 44, height: 24, borderRadius: 12, border: 'none',
            background: enabled ? 'var(--accent, #a855f7)' : 'rgba(255,255,255,0.15)',
            cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 3, left: enabled ? 23 : 3,
            transition: 'left 0.2s',
          }} />
        </button>
        <div>
          <p style={{
            fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #fff)', margin: 0,
          }}>
            🎁 Gift Wrapping
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary, #888)', margin: '2px 0 0' }}>
            +Rp {GIFT_WRAP_PRICE.toLocaleString('id-ID')} — Kami bungkus dengan cantik!
          </p>
        </div>
      </div>

      {enabled && (
        <div>
          <textarea
            placeholder="Tulis pesan untuk penerima (opsional)..."
            value={message}
            onChange={e => onMessageChange(e.target.value)}
            rows={2}
            maxLength={200}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary, #fff)',
              fontSize: 14, outline: 'none', resize: 'vertical',
            }}
          />
          <p style={{ fontSize: 11, color: 'var(--text-secondary, #666)', marginTop: 4, textAlign: 'right' }}>
            {message.length}/200
          </p>
        </div>
      )}
    </div>
  );
}
