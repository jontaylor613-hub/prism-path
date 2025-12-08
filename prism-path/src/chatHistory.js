// Chat History Management for AccommodationGem
// Stores conversations with learner profiles, auto-cleans after 30 days

const CHAT_HISTORY_KEY = 'prismpath_chat_history';
const DELETED_CHATS_KEY = 'prismpath_deleted_chats';
const PROFILE_EXPIRY_DAYS = 30;
const RECOVERY_WINDOW_DAYS = 7; // Keep deleted chats for 7 days for recovery

export const ChatHistoryService = {
  // Get all chat histories
  getAll: () => {
    try {
      const history = localStorage.getItem(CHAT_HISTORY_KEY);
      if (!history) return [];
      const parsed = JSON.parse(history);
      // Clean expired chats
      const cleaned = ChatHistoryService.cleanExpired(parsed);
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  },

  // Get a specific chat by ID
  get: (chatId) => {
    const all = ChatHistoryService.getAll();
    return all.find(chat => chat.id === chatId);
  },

  // Create or update a chat
  save: (chatId, profile, messages) => {
    try {
      const all = ChatHistoryService.getAll();
      const existingIndex = all.findIndex(chat => chat.id === chatId);
      
      const chatData = {
        id: chatId,
        profile: profile,
        messages: messages,
        lastAccessed: new Date().toISOString(),
        createdAt: existingIndex >= 0 ? all[existingIndex].createdAt : new Date().toISOString()
      };

      if (existingIndex >= 0) {
        all[existingIndex] = chatData;
      } else {
        all.unshift(chatData); // Add to beginning
      }

      // Clean expired before saving
      const cleaned = ChatHistoryService.cleanExpired(all);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(cleaned));
      return chatData;
    } catch (error) {
      console.error('Error saving chat:', error);
      return null;
    }
  },

  // Delete a chat (moves to recovery bin)
  delete: (chatId) => {
    try {
      const all = ChatHistoryService.getAll();
      const chatToDelete = all.find(chat => chat.id === chatId);
      
      if (chatToDelete) {
        // Move to recovery bin
        const deletedChats = ChatHistoryService.getDeletedChats();
        deletedChats.push({
          ...chatToDelete,
          deletedAt: new Date().toISOString()
        });
        localStorage.setItem(DELETED_CHATS_KEY, JSON.stringify(deletedChats));
        
        // Remove from active chats
        const filtered = all.filter(chat => chat.id !== chatId);
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(filtered));
      }
      return true;
    } catch {
      return false;
    }
  },

  // Get deleted chats (for recovery)
  getDeletedChats: () => {
    try {
      const deleted = localStorage.getItem(DELETED_CHATS_KEY);
      if (!deleted) return [];
      const parsed = JSON.parse(deleted);
      // Clean old deleted chats (older than recovery window)
      const now = new Date();
      const cleaned = parsed.filter(chat => {
        const deletedAt = new Date(chat.deletedAt);
        const daysSinceDeleted = (now - deletedAt) / (1000 * 60 * 60 * 24);
        return daysSinceDeleted <= RECOVERY_WINDOW_DAYS;
      });
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(DELETED_CHATS_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  },

  // Recover a deleted chat
  recover: (chatId) => {
    try {
      const deletedChats = ChatHistoryService.getDeletedChats();
      const chatToRecover = deletedChats.find(chat => chat.id === chatId);
      
      if (chatToRecover) {
        // Remove deletedAt property
        const { deletedAt, ...chatData } = chatToRecover;
        
        // Add back to active chats
        const all = ChatHistoryService.getAll();
        all.unshift(chatData);
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(all));
        
        // Remove from deleted chats
        const filtered = deletedChats.filter(chat => chat.id !== chatId);
        localStorage.setItem(DELETED_CHATS_KEY, JSON.stringify(filtered));
        
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // Clean expired chats (older than 30 days, but keep profile)
  cleanExpired: (chats) => {
    const now = new Date();
    return chats.map(chat => {
      const lastAccessed = new Date(chat.lastAccessed);
      const daysSinceAccess = (now - lastAccessed) / (1000 * 60 * 60 * 24);
      
      if (daysSinceAccess > PROFILE_EXPIRY_DAYS) {
        // Keep profile but clear messages
        return {
          ...chat,
          messages: [],
          profile: chat.profile // Keep the profile
        };
      }
      return chat;
    });
  },

  // Generate chat ID from profile
  generateChatId: (profile) => {
    if (!profile) return 'default';
    
    // If profile is an object with name, use name for ID
    if (typeof profile === 'object' && profile.name) {
      return `student_${profile.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }
    
    // If profile is a string, try to extract name
    if (typeof profile === 'string') {
      const nameMatch = profile.match(/Student:\s*([^\n]+)/i);
      if (nameMatch) {
        return `student_${nameMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      }
    }
    
    // Fallback: Create ID from profile summary
    const profileStr = typeof profile === 'string' ? profile : JSON.stringify(profile);
    return btoa(profileStr).slice(0, 20).replace(/[^a-zA-Z0-9]/g, '');
  }
};


