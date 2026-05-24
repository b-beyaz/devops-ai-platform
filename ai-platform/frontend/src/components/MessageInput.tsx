import { useState, KeyboardEvent } from 'react';
import { useChatStore } from '../store/chatStore';
import { Message } from '../types/index.ts';

interface Props {
  onSend: (text: string) => void;
}

export function MessageInput({ onSend }: Props) {
  const [text, setText] = useState('');
  const { me, activeChannel, addMessage, typingUsers } = useChatStore();
  const typing = typingUsers[activeChannel];

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const msg: Message = {
      id: crypto.randomUUID(),
      senderId: me.id,
      senderName: me.name,
      senderRole: me.role,
      senderInitials: me.initials,
      avatarColor: me.avatarColor,
      textColor: me.textColor,
      content: trimmed,
      timestamp: new Date(),
      channelId: activeChannel,
    };

    addMessage(msg);
    onSend(trimmed);
    setText('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) submit();
  };

  const placeholder =
    activeChannel === 'general'
      ? '#general kanalına mesaj yaz...'
      : 'Mesaj yaz...';

  return (
    <div className="px-5 py-3 border-t border-slack-border">
      {typing && (
        <p className="text-xs px-1 mb-1" style={{ color: '#7a6d8c' }}>
          {typing}
        </p>
      )}
      <div className="bg-slack-input rounded-lg flex items-center px-3 py-2 gap-2">
        <button className="text-slack-muted hover:text-slack-text text-lg">+</button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-slack-text text-sm placeholder-slack-muted"
        />
        <button
          onClick={submit}
          className="text-slack-muted hover:text-slack-text text-lg"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
