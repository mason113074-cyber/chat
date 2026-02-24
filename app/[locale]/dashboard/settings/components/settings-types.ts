/** Shared types for settings page and tab components */
import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import type { QuickReply } from '@/lib/types';

export type TabId = 'general' | 'personality' | 'behavior' | 'experience' | 'optimize' | 'integrations';

export const TAB_IDS: TabId[] = ['general', 'personality', 'behavior', 'experience', 'optimize', 'integrations'];

export const AI_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o', desc: 'settingsModelGpt4oDesc' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'settingsModelGpt4oMiniDesc' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', desc: 'settingsModelGpt35Desc' },
] as const;

export const EXAMPLE_QUESTIONS_KEYS = ['exampleQ1', 'exampleQ2', 'exampleQ3'] as const;

export interface BusinessHoursSchedule {
  enabled: boolean;
  start: string;
  end: string;
}

export interface BusinessHoursState {
  timezone: string;
  schedule: {
    mon: BusinessHoursSchedule;
    tue: BusinessHoursSchedule;
    wed: BusinessHoursSchedule;
    thu: BusinessHoursSchedule;
    fri: BusinessHoursSchedule;
    sat: BusinessHoursSchedule;
    sun: BusinessHoursSchedule;
  };
}

export interface GuidanceRule {
  id: string;
  rule_title: string;
  rule_content: string;
  is_enabled: boolean;
}

export interface AbTest {
  id: string;
  name: string;
  variant_a_prompt: string;
  variant_b_prompt: string;
  traffic_split: number;
  status: string;
}

export interface SettingsContextValue {
  // General
  storeName: string;
  setStoreName: (v: string) => void;
  aiModel: string;
  setAiModel: (v: string) => void;
  webhookUrl: string;
  // LINE
  lineModalOpen: boolean;
  setLineModalOpen: (v: boolean) => void;
  lineChannelId: string;
  setLineChannelId: (v: string) => void;
  lineChannelSecret: string;
  setLineChannelSecret: (v: string) => void;
  lineAccessToken: string;
  setLineAccessToken: (v: string) => void;
  lineSaving: boolean;
  lineTesting: boolean;
  lineTestResult: 'success' | 'error' | null;
  lineTestError: string | null;
  handleLineSave: () => Promise<void>;
  handleLineTest: () => Promise<void>;
  lineLoginBound: boolean;
  lineLoginDisplayName: string | null;
  lineLoginPhotoUrl: string | null;
  lineUnbinding: boolean;
  setLineUnbinding: (v: boolean) => void;
  setLineLoginBound: (v: boolean) => void;
  setLineLoginDisplayName: (v: string | null) => void;
  setLineLoginPhotoUrl: (v: string | null) => void;
  // Personality / AI
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
  quickReplies: QuickReply[];
  setQuickReplies: Dispatch<SetStateAction<QuickReply[]>>;
  maxReplyLength: number;
  setMaxReplyLength: (v: number) => void;
  replyTemperature: number;
  setReplyTemperature: (v: number) => void;
  replyFormat: string;
  setReplyFormat: (v: string) => void;
  replyDelaySeconds: number;
  setReplyDelaySeconds: (v: number) => void;
  showTypingIndicator: boolean;
  setShowTypingIndicator: (v: boolean) => void;
  autoDetectLanguage: boolean;
  setAutoDetectLanguage: (v: boolean) => void;
  supportedLanguages: string[];
  setSupportedLanguages: Dispatch<SetStateAction<string[]>>;
  fallbackLanguage: string;
  setFallbackLanguage: (v: string) => void;
  handleToneSelect: (tone: 'friendly' | 'professional' | 'concise') => void;
  handleReset: () => void;
  handleSave: () => Promise<void>;
  isSaving: boolean;
  // Behavior
  customSensitiveWords: string[];
  setCustomSensitiveWords: (v: string[]) => void;
  sensitiveWordReply: string;
  setSensitiveWordReply: (v: string) => void;
  guidanceRules: GuidanceRule[];
  setGuidanceRules: Dispatch<SetStateAction<GuidanceRule[]>>;
  guidanceForm: { title: string; content: string } | null;
  setGuidanceForm: Dispatch<SetStateAction<{ title: string; content: string } | null>>;
  confidenceThreshold: number;
  setConfidenceThreshold: (v: number) => void;
  lowConfidenceAction: string;
  setLowConfidenceAction: (v: string) => void;
  handoffMessage: string;
  setHandoffMessage: (v: string) => void;
  businessHoursEnabled: boolean;
  setBusinessHoursEnabled: (v: boolean) => void;
  businessHours: BusinessHoursState;
  setBusinessHours: Dispatch<SetStateAction<BusinessHoursState>>;
  outsideHoursMode: string;
  setOutsideHoursMode: (v: string) => void;
  outsideHoursMessage: string;
  setOutsideHoursMessage: (v: string) => void;
  // Experience
  feedbackEnabled: boolean;
  setFeedbackEnabled: (v: boolean) => void;
  feedbackMessage: string;
  setFeedbackMessage: (v: string) => void;
  conversationMemoryCount: number;
  setConversationMemoryCount: (v: number) => void;
  conversationMemoryMode: string;
  setConversationMemoryMode: (v: string) => void;
  welcomeMessageEnabled: boolean;
  setWelcomeMessageEnabled: (v: boolean) => void;
  welcomeMessage: string;
  setWelcomeMessage: (v: string) => void;
  // Optimize
  testMessage: string;
  setTestMessage: (v: string) => void;
  testReply: string;
  setTestReply: (v: string) => void;
  isTesting: boolean;
  testError: string;
  setTestError: (v: string) => void;
  handleTestAI: () => Promise<void>;
  abTests: AbTest[];
  setAbTests: Dispatch<SetStateAction<AbTest[]>>;
  abTestForm: { name: string; variantA: string; variantB: string; trafficSplit: number } | null;
  setAbTestForm: Dispatch<SetStateAction<{ name: string; variantA: string; variantB: string; trafficSplit: number } | null>>;
  // Preview
  handlePreviewReply: (questionKeyOrText?: string) => Promise<void>;
  previewLoading: boolean;
  previewAnswer: string | 'pending' | 'updated' | null;
  previewQuestionKey: 'exampleQ1' | 'exampleQ2' | 'exampleQ3';
  previewQuestionDisplay: string;
  lastPreviewQuestionRef: MutableRefObject<string>;
  previewOpen: boolean;
  setPreviewOpen: Dispatch<SetStateAction<boolean>>;
  welcomeText: string;
  toast: { show: (message: string, type: 'success' | 'error') => void };
}
