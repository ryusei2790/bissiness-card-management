import { db, COLLECTIONS } from './config';
import { Card, CardFormData } from '@/types/card';
import { MailHistory } from '@/types/history';
import { FieldValue } from 'firebase-admin/firestore';

// 名刺CRUD操作

export async function getCards(searchQuery?: string): Promise<Card[]> {
  try {
    let query = db.collection(COLLECTIONS.CARDS).orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const cards: Card[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const card: Card = {
        id: doc.id,
        companyName: data.companyName,
        name: data.name,
        email: data.email,
        messageTemplate: data.messageTemplate,
        notionId: data.notionId,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        tags: data.tags || [],
      };

      // 検索クエリでのフィルタリング（クライアントサイド）
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          card.companyName.toLowerCase().includes(query) ||
          card.name.toLowerCase().includes(query) ||
          card.email.toLowerCase().includes(query)
        ) {
          cards.push(card);
        }
      } else {
        cards.push(card);
      }
    });

    return cards;
  } catch (error) {
    console.error('Error getting cards:', error);
    throw new Error('名刺の取得に失敗しました');
  }
}

export async function getCardById(id: string): Promise<Card | null> {
  try {
    const doc = await db.collection(COLLECTIONS.CARDS).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      id: doc.id,
      companyName: data.companyName,
      name: data.name,
      email: data.email,
      messageTemplate: data.messageTemplate,
      notionId: data.notionId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      tags: data.tags || [],
    };
  } catch (error) {
    console.error('Error getting card by ID:', error);
    throw new Error('名刺の取得に失敗しました');
  }
}

export async function createCard(data: CardFormData & { notionId?: string }): Promise<Card> {
  try {
    const now = FieldValue.serverTimestamp();
    const docRef = await db.collection(COLLECTIONS.CARDS).add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    const createdDoc = await docRef.get();
    const createdData = createdDoc.data()!;

    return {
      id: docRef.id,
      companyName: createdData.companyName,
      name: createdData.name,
      email: createdData.email,
      messageTemplate: createdData.messageTemplate,
      notionId: createdData.notionId,
      createdAt: createdData.createdAt.toDate(),
      updatedAt: createdData.updatedAt.toDate(),
      tags: createdData.tags || [],
    };
  } catch (error) {
    console.error('Error creating card:', error);
    throw new Error('名刺の作成に失敗しました');
  }
}

export async function updateCard(
  id: string,
  data: Partial<CardFormData>
): Promise<Card> {
  try {
    const docRef = db.collection(COLLECTIONS.CARDS).doc(id);
    const now = FieldValue.serverTimestamp();

    await docRef.update({
      ...data,
      updatedAt: now,
    });

    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) {
      throw new Error('名刺が見つかりません');
    }

    const updatedData = updatedDoc.data()!;
    return {
      id: docRef.id,
      companyName: updatedData.companyName,
      name: updatedData.name,
      email: updatedData.email,
      messageTemplate: updatedData.messageTemplate,
      notionId: updatedData.notionId,
      createdAt: updatedData.createdAt.toDate(),
      updatedAt: updatedData.updatedAt.toDate(),
      tags: updatedData.tags || [],
    };
  } catch (error) {
    console.error('Error updating card:', error);
    throw new Error('名刺の更新に失敗しました');
  }
}

export async function deleteCard(id: string): Promise<void> {
  try {
    await db.collection(COLLECTIONS.CARDS).doc(id).delete();
  } catch (error) {
    console.error('Error deleting card:', error);
    throw new Error('名刺の削除に失敗しました');
  }
}

// notionIdで既存の名刺を検索
export async function getCardByNotionId(notionId: string): Promise<Card | null> {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.CARDS)
      .where('notionId', '==', notionId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      companyName: data.companyName,
      name: data.name,
      email: data.email,
      messageTemplate: data.messageTemplate,
      notionId: data.notionId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      tags: data.tags || [],
    };
  } catch (error) {
    console.error('Error getting card by Notion ID:', error);
    return null;
  }
}

// メールアドレスで既存の名刺を検索
export async function getCardByEmail(email: string): Promise<Card | null> {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.CARDS)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      companyName: data.companyName,
      name: data.name,
      email: data.email,
      messageTemplate: data.messageTemplate,
      notionId: data.notionId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      tags: data.tags || [],
    };
  } catch (error) {
    console.error('Error getting card by email:', error);
    return null;
  }
}

// メール送信履歴の保存

export async function saveMailHistory(historyData: Omit<MailHistory, 'id'>): Promise<string> {
  try {
    const docRef = await db.collection(COLLECTIONS.MAIL_HISTORY).add({
      ...historyData,
      sentAt: FieldValue.serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving mail history:', error);
    throw new Error('送信履歴の保存に失敗しました');
  }
}

export async function getMailHistory(
  page: number = 1,
  limit: number = 20
): Promise<{ history: MailHistory[]; total: number }> {
  try {
    const offset = (page - 1) * limit;

    // 総数を取得
    const totalSnapshot = await db.collection(COLLECTIONS.MAIL_HISTORY).count().get();
    const total = totalSnapshot.data().count;

    // ページネーション付きでデータ取得
    const snapshot = await db
      .collection(COLLECTIONS.MAIL_HISTORY)
      .orderBy('sentAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const history: MailHistory[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        recipients: data.recipients,
        subject: data.subject,
        body: data.body,
        sentAt: data.sentAt.toDate(),
        status: data.status,
        errors: data.errors,
      };
    });

    return { history, total };
  } catch (error) {
    console.error('Error getting mail history:', error);
    throw new Error('送信履歴の取得に失敗しました');
  }
}
