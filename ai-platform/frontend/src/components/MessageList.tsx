import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { AlertBadge } from './AlertBadge';

const roleColors: Record<string, { bg: string; text: string }> = {
  backend:  { bg: '#2e1f47', text: '#c9bede' },
  dba:      { bg: '#1a2a3a', text: '#7abfde' },
  network:  { bg: '#1a2e1a', text: '#7ade9a' },
  frontend: { bg: '#2e2010', text: '#deaa7a' },
  devops:   { bg: '#2a1a3a', text: '#de7ade' },
};

export function MessageList() {
  const { messages, activeChannel } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgs = messages[activeChannel] ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  if (msgs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slack-muted text-sm">
        Henüz mesaj yok. İlk mesajı sen gönder!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
      {msgs.map((msg) => {
        const rc = roleColors[msg.senderRole] ?? roleColors.devops;
        return (
          <div key={msg.id} className="flex gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: msg.avatarColor, color: msg.textColor }}
            >
              {msg.senderInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-white text-sm font-medium">{msg.senderName}</span>
                <span
                  className="text-xs px-1.5 py-px rounded font-semibold"
                  style={{ background: rc.bg, color: rc.text }}
                >
                  {msg.senderRole}
                </span>
                <span className="text-slack-muted text-xs">
                  {msg.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slack-text text-sm leading-relaxed">{msg.content}</p>
              {msg.alert && <AlertBadge alert={msg.alert} />}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}