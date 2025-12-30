'use client';

import { useState } from 'react';
import { Card } from '@/types/card';

interface MailComposerProps {
  selectedCardIds: string[];
  cards: Card[];
  onSendComplete: () => void;
}

export function MailComposer({ selectedCardIds, cards, onSendComplete }: MailComposerProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedCards = cards.filter((card) => selectedCardIds.includes(card.id));

  const handleSend = async () => {
    if (!subject || !body) {
      setMessage({ type: 'error', text: '件名と本文を入力してください' });
      return;
    }

    if (selectedCardIds.length === 0) {
      setMessage({ type: 'error', text: '宛先を選択してください' });
      return;
    }

    try {
      setSending(true);
      setMessage(null);

      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardIds: selectedCardIds,
          subject,
          body,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setMessage({
          type: 'success',
          text: `${result.sentCount}件のメールを送信しました`,
        });
        setSubject('');
        setBody('');
        onSendComplete();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'メールの送信に失敗しました',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'メールの送信中にエラーが発生しました',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">メール作成</h3>
        <p className="text-sm text-gray-500 mt-1">
          {selectedCardIds.length}件の宛先に送信
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 件名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            件名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="メールの件名を入力..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 本文 */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            本文 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="メールの本文を入力..."
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* 選択中の宛先プレビュー */}
        {selectedCards.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              送信先 ({selectedCards.length}件)
            </label>
            <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
              <div className="text-sm text-gray-600 space-y-1">
                {selectedCards.slice(0, 5).map((card) => (
                  <div key={card.id}>
                    {card.name} ({card.email})
                  </div>
                ))}
                {selectedCards.length > 5 && (
                  <div className="text-gray-500">他 {selectedCards.length - 5}件...</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* メッセージ */}
        {message && (
          <div
            className={`p-3 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* 送信ボタン */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSend}
          disabled={sending || selectedCardIds.length === 0 || !subject || !body}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {sending ? '送信中...' : `${selectedCardIds.length}件に送信`}
        </button>
      </div>
    </div>
  );
}
