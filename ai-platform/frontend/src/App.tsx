import { useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { useWebSocket } from './hooks/useWebSocket';
import { useChatStore } from './store/chatStore';
import { AlertPayload, Message, Role } from './types/index.ts';

const WS_URL = "ws://localhost:8002/ws";

export default function App() {
  const { addAlert, addMessage, setWsConnected, setTyping, activeChannel } = useChatStore();

  const handleMessage = useCallback((data: unknown) => {
    const msg = data as Record<string, unknown>;

    if (msg.type === 'alert') {
      addAlert(msg as unknown as AlertPayload);
    }

    if (msg.type === 'agent_message') {
      const m: Message = {
        id: crypto.randomUUID(),
        senderId: msg.senderId as string,
        senderName: msg.senderName as string,
        senderRole: msg.senderRole as Role,
        senderInitials: (msg.senderName as string)
          .split(' ')
          .map((w: string) => w[0])
          .join(''),
        avatarColor: msg.avatarColor as string,
        textColor: msg.textColor as string,
        content: msg.content as string,
        timestamp: new Date(),
        channelId: msg.channelId as string,
      };
      addMessage(m);
      setTyping(msg.channelId as string, null);
    }

    if (msg.type === 'typing') {
      setTyping(msg.channelId as string, msg.senderName as string);
      setTimeout(() => setTyping(msg.channelId as string, null), 4000);
    }
  }, [addAlert, addMessage, setTyping]);

  const { send } = useWebSocket({
    url: WS_URL,
    onMessage: handleMessage,
    onOpen: () => setWsConnected(true),
    onClose: () => setWsConnected(false),
  });

  const handleSend = useCallback((text: string) => {
    send({ type: 'user_message', content: text, channelId: activeChannel });
  }, [send, activeChannel]);

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <ChatArea onSend={handleSend} />
    </div>
  );
}
