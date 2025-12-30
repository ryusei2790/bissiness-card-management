'use client';

import { useState, useEffect } from 'react';
import { MailHistory } from '@/types/history';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function HistoryPage() {
  const [history, setHistory] = useState<MailHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/history?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">送信履歴</h2>
        <p className="text-gray-600 mt-1">
          メールの送信履歴を確認できます
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            送信履歴がありません
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {history.map((item) => (
                <div key={item.id} className="p-4">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{item.subject}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            item.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.status === 'success' ? '送信成功' : '送信失敗'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(item.sentAt), 'yyyy年M月d日 HH:mm', { locale: ja })}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        宛先: {item.recipients.length}件
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700">
                      {expandedId === item.id ? '▲ 閉じる' : '▼ 詳細'}
                    </button>
                  </div>

                  {expandedId === item.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">本文</h4>
                        <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
                          {item.body}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          宛先一覧 ({item.recipients.length}件)
                        </h4>
                        <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                          <div className="space-y-1 text-sm text-gray-600">
                            {item.recipients.map((recipient, index) => (
                              <div key={index}>
                                {recipient.name} ({recipient.companyName}) - {recipient.email}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {item.errors && item.errors.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-red-700 mb-2">
                            エラー ({item.errors.length}件)
                          </h4>
                          <div className="bg-red-50 rounded p-3 text-sm text-red-700 space-y-1">
                            {item.errors.map((error, index) => (
                              <div key={index}>
                                {error.email}: {error.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  前へ
                </button>
                <span className="text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  次へ
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
