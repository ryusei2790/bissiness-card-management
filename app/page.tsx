'use client';

import { useState, useEffect } from 'react';
import { RecipientSelector } from '@/components/mail/RecipientSelector';
import { MailComposer } from '@/components/mail/MailComposer';
import { Card } from '@/types/card';

export default function HomePage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearch = () => {
    fetchCards(searchQuery);
  };

  const handleSendComplete = () => {
    setSelectedCardIds([]);
  };

  return (
    <div className="h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">メール一括送信</h2>
        <p className="text-gray-600">
          宛先を選択して、一括でメールを送信できます
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 h-[calc(100%-100px)]">
        {/* 左側: 宛先選択 */}
        <RecipientSelector
          cards={cards}
          selectedCardIds={selectedCardIds}
          onSelectionChange={setSelectedCardIds}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
        />

        {/* 右側: メール作成 */}
        <MailComposer
          selectedCardIds={selectedCardIds}
          cards={cards}
          onSendComplete={handleSendComplete}
        />
      </div>
    </div>
  );
}
