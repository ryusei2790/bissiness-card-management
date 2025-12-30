import { MailRecipient } from './mail';

export interface MailHistory {
  id: string;
  recipients: MailRecipient[];
  subject: string;
  body: string;
  sentAt: Date;
  status: 'success' | 'failed';
  errors?: {
    email: string;
    message: string;
  }[];
}

export interface MailHistoryResponse {
  history: MailHistory[];
  total: number;
  page: number;
  limit: number;
}
