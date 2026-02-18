import type { QuickReply } from '@/lib/types';

type Props = {
  items: QuickReply[];
  onSelect?: (query: string) => void;
};

/** Renders quick reply buttons (Widget / chat UI). Use with globals.css .quick-replies / .quick-reply-btn */
export function QuickReplies({ items, onSelect }: Props) {
  const visible = items.filter((item) => item.enabled && item.text.trim());
  if (visible.length === 0) return null;

  return (
    <div className="quick-replies">
      {visible.map((item) => (
        <button
          key={item.id}
          type="button"
          className="quick-reply-btn"
          data-query={item.text}
          onClick={() => onSelect?.(item.text)}
        >
          {item.text}
        </button>
      ))}
    </div>
  );
}
