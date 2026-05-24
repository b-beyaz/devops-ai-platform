import { useChatStore } from '../store/chatStore';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface Props {
  onSend: (text: string) => void;
}

export function ChatArea({ onSend }: Props) {
  const { activeChannel, team } = useChatStore();

  const isGeneral = activeChannel === 'general';
  const member = team.find((m) => m.id === activeChannel);

  return (
    <div className="flex-1 bg-slack-main flex flex-col min-w-0 min-h-0">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slack-border flex items-center gap-2 flex-shrink-0">
        {isGeneral ? (
          <>
            <span className="text-slack-muted font-bold">#</span>
            <span className="text-white font-medium">general</span>
            <span className="text-slack-muted text-xs ml-1">— Takım genel kanalı</span>
          </>
        ) : member ? (
          <>
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
              style={{ background: member.avatarColor, color: member.textColor }}
            >
              {member.initials.slice(0, 1)}
            </div>
            <span className="text-white font-medium">{member.name}</span>
            <span
              className="text-xs px-1.5 py-px rounded ml-1"
              style={{ background: '#2e2040', color: '#ab9fd0' }}
            >
              {member.role}
            </span>
            <span className={`w-2 h-2 rounded-full ml-auto ${member.online ? 'bg-green-400' : 'bg-gray-600'}`} />
          </>
        ) : null}
      </div>

      <MessageList />
      <MessageInput onSend={onSend} />
    </div>
  );
}