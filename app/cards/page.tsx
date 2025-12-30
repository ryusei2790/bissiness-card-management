'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/types/card';
import Link from 'next/link';

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async (search?: string) => {
    try {
      setLoading(true);
      const url = search
        ? `/api/cards?search=${encodeURIComponent(search)}`
        : '/api/cards';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setMessage(null);

      const res = await fetch('/api/notion/sync', { method: 'POST' });
      const result = await res.json();

      if (res.ok && result.success) {
        setMessage({
          type: 'success',
          text: `Notionから${result.syncedCount}件同期しました (作成: ${result.createdCount}, 更新: ${result.updatedCount})`,
        });
        fetchCards();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Notion同期に失敗しました',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Notion同期中にエラーが発生しました',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = () => {
    fetchCards(searchQuery);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name}さんの名刺を削除しますか?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/cards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: '名刺を削除しました' });
        fetchCards(searchQuery);
      } else {
        setMessage({ type: 'error', text: '削除に失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '削除中にエラーが発生しました' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">名刺管理</h2>
          <p className="text-gray-600 mt-1">名刺の登録・編集・削除ができます</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? 'Notion同期中...' : '📥 Notionから同期'}
        </button>
      </div>

      {/* メッセージ */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 検索バー */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="名前、会社名、メールアドレスで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          検索
        </button>
        <Link
          href="/cards/new"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + 新規登録
        </Link>
      </div>

      {/* 名刺リスト */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>名刺が登録されていません</p>
            <p className="text-sm mt-2">Notionから同期するか、新規登録してください</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {cards.map((card) => (
              <div
                key={card.id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{card.name}</h3>
                  <p className="text-gray-600">{card.companyName}</p>
                  <p className="text-sm text-gray-500">{card.email}</p>
                  {card.tags && card.tags.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {card.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/cards/${card.id}`}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    編集
                  </Link>
                  <button
                    onClick={() => handleDelete(card.id, card.name)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
