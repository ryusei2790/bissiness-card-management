export interface MailRecipient {
  cardId: string;
  email: string;
  name: string;
  companyName: string;
}

export interface MailSendRequest {
  cardIds: string[];
  subject: string;
  body: string;
}

export interface MailSendResponse {
  success: boolean;
  sentCount: number;
  failedEmails?: string[];
  error?: string;
}
