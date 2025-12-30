export interface Card {
  id: string;
  companyName: string;
  name: string;
  email: string;
  messageTemplate: string;
  notionId?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface CardFormData {
  companyName: string;
  name: string;
  email: string;
  messageTemplate: string;
  tags?: string[];
}

export interface CardWithId extends CardFormData {
  id: string;
  notionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
