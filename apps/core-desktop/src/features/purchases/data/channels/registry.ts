// [PHASE: marketplace-preview — Order flow]
import { OrderChannel } from './OrderChannel';
import { WhatsAppChannel } from './WhatsAppChannel';

class ChannelRegistry {
  private channels = new Map<string, OrderChannel>();

  constructor() {
    this.register(new WhatsAppChannel());
  }

  register(channel: OrderChannel) {
    this.channels.set(channel.id, channel);
  }

  get(id: string): OrderChannel {
    return this.channels.get(id) || this.channels.get('whatsapp')!;
  }
}

export const channelRegistry = new ChannelRegistry();
