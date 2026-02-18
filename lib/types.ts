export interface QuickReply {
  id: string;
  text: string;
  enabled: boolean;
}

export interface Settings {
  systemPrompt: string | null;
  aiModel: string;
  storeName: string | null;
  quick_replies?: QuickReply[];
}
