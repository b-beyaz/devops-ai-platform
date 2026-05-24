export type Role = 'backend' | 'dba' | 'network' | 'frontend' | 'devops';

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: Role;
  avatarColor: string;
  textColor: string;
  online: boolean;
}

export interface AlertPayload {
  severity: 'critical' | 'warning' | 'info';
  source: string;
  service: string;
  message: string;
  metadata?: Record<string, string>;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  senderInitials: string;
  avatarColor: string;
  textColor: string;
  content: string;
  timestamp: Date;
  channelId: string;
  alert?: AlertPayload;
}

export type Channel = 'general';
