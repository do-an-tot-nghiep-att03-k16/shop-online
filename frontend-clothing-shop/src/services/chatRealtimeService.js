import { supabase } from '../config/supabaseClient';
import { groupMessagesBySession, parseHumanMessage, parseAIMessage } from '../utils/chatParser';

/**
 * Chat Realtime Service
 * Handles Supabase realtime subscriptions for n8n_chat_histories table
 */

class ChatRealtimeService {
  constructor() {
    this.subscription = null;
    this.callbacks = {
      onNewMessage: [],
      onMessageUpdate: [],
      onMessageDelete: [],
      onError: []
    };
    this.isConnected = false;
    this.currentSessions = {};
  }

  /**
   * Subscribe to chat histories changes
   * @param {string|null} sessionId - Optional specific session ID to filter
   * @returns {Promise<boolean>} - Success status
   */
  async subscribe(sessionId = null) {
    try {
      // Unsubscribe if already connected
      if (this.subscription) {
        await this.unsubscribe();
      }
            
      let query = supabase
        .channel('chat_histories_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'n8n_chat_histories',
            ...(sessionId && { filter: `session_id=eq.${sessionId}` })
          },
          (payload) => this.handleRealtimeChange(payload)
        );

      this.subscription = query.subscribe((status) => {
        this.isConnected = status === 'SUBSCRIBED';
        
        if (status === 'SUBSCRIBED') {
        } else if (status === 'CLOSED') {
          this.isConnected = false;
        }
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to subscribe to chat histories:', error);
      this.triggerCallbacks('onError', error);
      return false;
    }
  }

  /**
   * Handle realtime database changes
   * @param {object} payload - Supabase realtime payload
   */
  handleRealtimeChange(payload) {
    
    try {
      switch (payload.eventType) {
        case 'INSERT':
          this.handleNewMessage(payload.new);
          break;
        case 'UPDATE':
          this.handleMessageUpdate(payload.new, payload.old);
          break;
        case 'DELETE':
          this.handleMessageDelete(payload.old);
          break;
        default:
      }
    } catch (error) {
      console.error('Error handling realtime change:', error);
      this.triggerCallbacks('onError', error);
    }
  }

  /**
   * Handle new message insertion
   * @param {object} newMessage - New message data
   */
  handleNewMessage(newMessage) {    
    const parsedMessage = this.parseMessage(newMessage);
    
    // Update local sessions cache
    const sessionId = newMessage.session_id || 'unknown';
    if (!this.currentSessions[sessionId]) {
      this.currentSessions[sessionId] = {
        sessionId,
        messages: [],
        lastActivity: null
      };
    }
    
    this.currentSessions[sessionId].messages.push(parsedMessage);
    this.currentSessions[sessionId].lastActivity = parsedMessage.timestamp;
    
    // Sort messages by timestamp
    this.currentSessions[sessionId].messages.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    this.triggerCallbacks('onNewMessage', {
      message: parsedMessage,
      session: this.currentSessions[sessionId],
      allSessions: { ...this.currentSessions }
    });
  }

  /**
   * Handle message update
   * @param {object} updatedMessage - Updated message data
   * @param {object} oldMessage - Previous message data
   */
  handleMessageUpdate(updatedMessage, oldMessage) {    
    const parsedMessage = this.parseMessage(updatedMessage);
    const sessionId = updatedMessage.session_id || 'unknown';
    
    // Update in local cache
    if (this.currentSessions[sessionId]) {
      const messageIndex = this.currentSessions[sessionId].messages.findIndex(
        m => m.id === updatedMessage.id
      );
      
      if (messageIndex !== -1) {
        this.currentSessions[sessionId].messages[messageIndex] = parsedMessage;
        this.currentSessions[sessionId].lastActivity = parsedMessage.timestamp;
      }
    }
    
    this.triggerCallbacks('onMessageUpdate', {
      message: parsedMessage,
      oldMessage: oldMessage,
      session: this.currentSessions[sessionId],
      allSessions: { ...this.currentSessions }
    });
  }

  /**
   * Handle message deletion
   * @param {object} deletedMessage - Deleted message data
   */
  handleMessageDelete(deletedMessage) {    
    const sessionId = deletedMessage.session_id || 'unknown';
    
    // Remove from local cache
    if (this.currentSessions[sessionId]) {
      this.currentSessions[sessionId].messages = this.currentSessions[sessionId].messages.filter(
        m => m.id !== deletedMessage.id
      );
      
      // If no messages left, remove session
      if (this.currentSessions[sessionId].messages.length === 0) {
        delete this.currentSessions[sessionId];
      }
    }
    
    this.triggerCallbacks('onMessageDelete', {
      deletedMessage,
      sessionId,
      allSessions: { ...this.currentSessions }
    });
  }

  /**
   * Parse message for consistent format
   * @param {object} message - Raw message from database
   * @returns {object} - Parsed message
   */
  parseMessage(message) {
    const parsedMessage = {
      id: message.id,
      type: message.message?.type,
      timestamp: new Date().toISOString(), // Use current time since table doesn't have created_at
      sessionId: message.session_id || 'unknown'
    };

    if (message.message?.type === 'human') {
      parsedMessage.content = parseHumanMessage(message.message.content);
      parsedMessage.isUser = true;
    } else if (message.message?.type === 'ai') {
      const aiData = parseAIMessage(message.message.content);
      parsedMessage.content = aiData.reply;
      parsedMessage.metadata = aiData.metadata;
      parsedMessage.isUser = false;
      parsedMessage.showMetadata = aiData.metadata && typeof aiData.metadata === 'object';
    }

    return parsedMessage;
  }

  /**
   * Load initial chat history
   * @param {number} limit - Number of messages to load
   * @param {string|null} sessionId - Optional specific session ID
   * @returns {Promise<object>} - Grouped sessions data
   */
  async loadInitialHistory(limit = 50, sessionId = null) {
    try {      
      let query = supabase
        .from('n8n_chat_histories')
        .select('*')
        .order('id', { ascending: false })
        .limit(limit);
      
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Group messages by session
      const groupedSessions = groupMessagesBySession(data.reverse()); // Reverse to get chronological order
      this.currentSessions = { ...groupedSessions };
      
      return groupedSessions;
    } catch (error) {
      console.error('❌ Failed to load initial history:', error);
      this.triggerCallbacks('onError', error);
      return {};
    }
  }

  /**
   * Register callback for realtime events
   * @param {string} eventType - Event type (onNewMessage, onMessageUpdate, onMessageDelete, onError)
   * @param {function} callback - Callback function
   */
  on(eventType, callback) {
    if (this.callbacks[eventType]) {
      this.callbacks[eventType].push(callback);
    }
  }

  /**
   * Unregister callback
   * @param {string} eventType - Event type
   * @param {function} callback - Callback function to remove
   */
  off(eventType, callback) {
    if (this.callbacks[eventType]) {
      this.callbacks[eventType] = this.callbacks[eventType].filter(cb => cb !== callback);
    }
  }

  /**
   * Trigger callbacks for specific event
   * @param {string} eventType - Event type
   * @param {any} data - Data to pass to callbacks
   */
  triggerCallbacks(eventType, data) {
    if (this.callbacks[eventType]) {
      this.callbacks[eventType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} callback:`, error);
        }
      });
    }
  }

  /**
   * Unsubscribe from realtime changes
   */
  async unsubscribe() {
    if (this.subscription) {
      await supabase.removeChannel(this.subscription);
      this.subscription = null;
      this.isConnected = false;
    }
  }

  /**
   * Get current connection status
   * @returns {boolean} - Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get current sessions cache
   * @returns {object} - Current sessions
   */
  getCurrentSessions() {
    return { ...this.currentSessions };
  }

  /**
   * Send/Insert a new message to Supabase
   * @param {object} messageData - Message data to insert
   * @returns {Promise<object>} - Inserted message data
   */
  async sendMessage(messageData) {
    try {      
      const { data, error } = await supabase
        .from('n8n_chat_histories')
        .insert([{
          session_id: messageData.session_id,
          message: messageData.message
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.error('❌ Failed to insert message:', error);
      this.triggerCallbacks('onError', error);
      throw error;
    }
  }
}

// Create singleton instance
export const chatRealtimeService = new ChatRealtimeService();
export default chatRealtimeService;