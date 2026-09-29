export type MessageChannel = 'amob' | 'whatsapp' | 'sms' | 'email';

export interface ChannelCapabilities {
  text: boolean;
  images: boolean;
  files: boolean;
  audio: boolean;
  links: boolean;
}

export interface ChannelConfig {
  id: MessageChannel;
  displayName: string;
  accessibleLabel: string;
  badgeVariant: 'primary' | 'success' | 'warning' | 'neutral' | 'info';
  capabilities: ChannelCapabilities;
}

export const CHANNEL_CONFIGS: Record<MessageChannel, ChannelConfig> = {
  amob: {
    id: 'amob',
    displayName: 'aMob',
    accessibleLabel: 'aMob Internal Network',
    badgeVariant: 'primary',
    capabilities: {
      text: true,
      images: true,
      files: true,
      audio: true,
      links: true,
    },
  },
  whatsapp: {
    id: 'whatsapp',
    displayName: 'WhatsApp',
    accessibleLabel: 'WhatsApp Business',
    badgeVariant: 'success',
    capabilities: {
      text: true,
      images: true,
      files: true,
      audio: true,
      links: true,
    },
  },
  sms: {
    id: 'sms',
    displayName: 'SMS',
    accessibleLabel: 'SMS Text Message',
    badgeVariant: 'warning',
    capabilities: {
      text: true,
      images: false,
      files: false,
      audio: false,
      links: true,
    },
  },
  email: {
    id: 'email',
    displayName: 'Email',
    accessibleLabel: 'Email Message',
    badgeVariant: 'neutral',
    capabilities: {
      text: true,
      images: true,
      files: true,
      audio: true,
      links: true,
    },
  },
};
