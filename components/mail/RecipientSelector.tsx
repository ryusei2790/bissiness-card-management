'use client';

import { Card } from '@/types/card';

interface RecipientSelectorProps {
  cards: Card[];
  selectedCardIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
}

export function RecipientSelector({
  cards,
  selectedCardIds,
  onSelectionChange,
  loading,
  searchQuery,
  onSearchChange,
  onSearch,
}: RecipientSelectorProps) {
  const handleToggle = (cardId: string) => {
    if (selectedCardIds.includes(cardId)) {
      onSelectionChange(selectedCardIds.filter((id) => id !== cardId));
    } else {
      onSelectionChange([...selectedCardIds, cardId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCardIds.length === cards.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(cards.map((card) => card.id));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-3">宛先選択</h3>

        {/* 検索バー */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="名前、会社名、メールアドレスで検索..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={onSearch}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            検索
          </button>
        </div>

        {/* 全選択ボタン */}
        <button
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {selectedCardIds.length === cards.length ? '全選択解除' : '全選択'}
        </button>
        <span className="ml-2 text-sm text-gray-500">
          ({selectedCardIds.length} / {cards.length} 件選択)
        </span>
      </div>

      {/* 名刺リスト */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        ) : cards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            名刺が登録されていません
          </div>
        ) : (
          cards.map((card) => (
            <label
              key={card.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedCardIds.includes(card.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedCardIds.includes(card.id)}
                onChange={() => handleToggle(card.id)}
                className="mt-1 h-4 w-4 text-blue-600 rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{card.name}</div>
                <div className="text-sm text-gray-600">{card.companyName}</div>
                <div className="text-sm text-gray-500 truncate">{card.email}</div>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
