// Sistema de eventos en tiempo real para sincronización entre pestañas
// usando BroadcastChannel API

const CHANNEL_NAME = 'lovable-matching-system';

export type EventType = 
  | 'challenge-created'
  | 'challenge-updated'
  | 'user-created'
  | 'user-updated'
  | 'match-created'
  | 'match-updated'
  | 'message-created'
  | 'profile-updated'
  | 'matching-event-created'
  | 'notification-created';

export interface RealtimeEvent {
  type: EventType;
  data: any;
  timestamp: number;
}

class RealtimeEventManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<EventType, Set<(data: any) => void>> = new Map();

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent<RealtimeEvent>) => {
        this.handleMessage(event.data);
      };
    }
  }

  // Emitir un evento
  emit(type: EventType, data: any) {
    if (!this.channel) return;

    const event: RealtimeEvent = {
      type,
      data,
      timestamp: Date.now()
    };

    this.channel.postMessage(event);
  }

  // Escuchar un tipo de evento
  on(type: EventType, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Retornar función para dejar de escuchar
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  // Manejar mensajes recibidos
  private handleMessage(event: RealtimeEvent) {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => callback(event.data));
    }
  }

  // Destruir el canal
  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

// Instancia singleton
export const realtimeEvents = new RealtimeEventManager();
