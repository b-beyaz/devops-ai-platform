import { create } from 'zustand';
import { Message, TeamMember, AlertPayload } from '../types/index';

const TEAM: TeamMember[] = [
  {
    id: 'ali',
    name: 'Ali Yılmaz',
    initials: 'AY',
    role: 'backend',
    avatarColor: '#4a2f6e',
    textColor: '#c9bede',
    online: true,
  },
  {
    id: 'ahmet',
    name: 'Ahmet Kaya',
    initials: 'AK',
    role: 'dba',
    avatarColor: '#1a3a4a',
    textColor: '#7abfde',
    online: true,
  },
  {
    id: 'zeynep',
    name: 'Zeynep Demir',
    initials: 'ZD',
    role: 'network',
    avatarColor: '#2a3a1a',
    textColor: '#7ade9a',
    online: true,
  },
  {
    id: 'mert',
    name: 'Mert Öztürk',
    initials: 'MÖ',
    role: 'frontend',
    avatarColor: '#3a2a1a',
    textColor: '#deaa7a',
    online: false,
  },
];

const ME: TeamMember = {
  id: 'me',
  name: 'Sen',
  initials: 'SEN',
  role: 'devops',
  avatarColor: '#2a1a2a',
  textColor: '#de7ade',
  online: true,
};

interface ChatStore {
  team: TeamMember[];
  me: TeamMember;
  messages: Record<string, Message[]>;
  activeChannel: string;
  wsConnected: boolean;
  setActiveChannel: (id: string) => void;
  addMessage: (msg: Message) => void;
  addAlert: (alert: AlertPayload) => void;
  setWsConnected: (v: boolean) => void;
  unreadCounts: Record<string, number>;
  clearUnread: (id: string) => void;
  typingUsers: Record<string, string>;
  setTyping: (channelId: string, name: string | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  team: TEAM,
  me: ME,
  messages: { general: [] },
  activeChannel: 'general',
  wsConnected: false,
  unreadCounts: {},

  setActiveChannel: (id) => set({ activeChannel: id }),

  typingUsers: {},
  setTyping: (channelId, name) =>
    set((s) => ({
      typingUsers: name
        ? { ...s.typingUsers, [channelId]: `${name} writes...` }
        : Object.fromEntries(Object.entries(s.typingUsers).filter(([k]) => k !== channelId)),
    })),

  addMessage: (msg) =>
    set((s) => {
      const prev = s.messages[msg.channelId] ?? [];
      const isActive = s.activeChannel === msg.channelId;
      return {
        messages: { ...s.messages, [msg.channelId]: [...prev, msg] },
        unreadCounts: isActive
          ? s.unreadCounts
          : { ...s.unreadCounts, [msg.channelId]: (s.unreadCounts[msg.channelId] ?? 0) + 1 },
      };
    }),

  addAlert: (alert) => {
    const sender = TEAM[Math.floor(Math.random() * TEAM.length)];
    const msg: Message = {
      id: crypto.randomUUID(),
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      senderInitials: sender.initials,
      avatarColor: sender.avatarColor,
      textColor: sender.textColor,
      content: `${alert.source.toUpperCase()} alertini aldım — ${alert.service} servisinde sorun var.`,
      timestamp: new Date(),
      channelId: 'general',
      alert,
    };
    get().addMessage(msg);
  },

  setWsConnected: (v) => set({ wsConnected: v }),
  clearUnread: (id) =>
    set((s) => ({ unreadCounts: { ...s.unreadCounts, [id]: 0 } })),
}));