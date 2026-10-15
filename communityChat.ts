import { CommunityChatMessage } from '../src/types/index.ts';

const INITIAL_MESSAGES: CommunityChatMessage[] = [
  {
    id: 'msg-1',
    channelId: 'general',
    userId: 'dev-alex-vance',
    userName: 'Alex Vance',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    role: 'DEVELOPER',
    badge: 'PRO DEV',
    message: 'Welcome everyone to the Flame Developer Community! Great to see the new Cloud APK Builder live.',
    timestamp: '10m ago',
    likesCount: 5,
    likedByUser: false
  },
  {
    id: 'msg-2',
    channelId: 'cloud-apk-builder',
    userId: 'dev-sarah-chen',
    userName: 'Sarah Chen (Pixel Forge)',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    role: 'DEVELOPER',
    badge: 'STUDIO',
    message: 'Just compiled our HTML5 canvas action game into Android APK in 3 seconds! The 60s "Try Now" preview is awesome for testers.',
    timestamp: '6m ago',
    likesCount: 8,
    likedByUser: true
  },
  {
    id: 'msg-3',
    channelId: 'game-devs',
    userId: 'gamer-rahul-99',
    userName: 'Rahul Sharma (Free Fire Pro)',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    role: 'USER',
    badge: 'ESPORTS',
    message: 'Can developers add auto IAP for custom in-game coin top-ups? We want direct tournament rewards.',
    timestamp: '4m ago',
    likesCount: 12,
    likedByUser: false
  },
  {
    id: 'msg-4',
    channelId: 'ai-mesh-security',
    userId: 'admin-flame-sec',
    userName: 'FAS Security Sentinel',
    userAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    role: 'ADMIN',
    badge: 'ROOT ADMIN',
    message: 'Notice: 100+ Sub-AIs are now live. All uploaded binaries are analyzed in real-time with a transparent 14-day resolution window for any flagged policies.',
    timestamp: '1m ago',
    likesCount: 16,
    likedByUser: true
  }
];

class CommunityChatManager {
  private messages: CommunityChatMessage[] = [...INITIAL_MESSAGES];

  public getMessages(channelId?: string): CommunityChatMessage[] {
    if (!channelId || channelId === 'all') {
      return this.messages;
    }
    return this.messages.filter(m => m.channelId === channelId);
  }

  public postMessage(payload: {
    channelId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    role?: any;
    badge?: string;
    message: string;
  }): CommunityChatMessage {
    const newMsg: CommunityChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      channelId: payload.channelId || 'general',
      userId: payload.userId || 'user-current',
      userName: payload.userName || 'Flame Creator',
      userAvatar: payload.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      role: payload.role || 'DEVELOPER',
      badge: payload.badge || 'CREATOR',
      message: payload.message.trim(),
      timestamp: 'Just now',
      likesCount: 0,
      likedByUser: false
    };

    this.messages.push(newMsg);
    return newMsg;
  }

  public likeMessage(messageId: string): { success: boolean; likesCount: number } {
    const msg = this.messages.find(m => m.id === messageId);
    if (!msg) return { success: false, likesCount: 0 };

    if (msg.likedByUser) {
      msg.likedByUser = false;
      msg.likesCount = Math.max(0, msg.likesCount - 1);
    } else {
      msg.likedByUser = true;
      msg.likesCount += 1;
    }

    return { success: true, likesCount: msg.likesCount };
  }
}

export const communityChat = new CommunityChatManager();
