/**
 * Chat message parser for N8N chat histories from Supabase
 * Handles stringify content for both human and AI messages
 */

/**
 * Parse human message content
 * @param {string} stringifiedContent - Stringify content from database
 * @returns {string} - User message content
 */
export const parseHumanMessage = (stringifiedContent) => {
  // If content contains "userMessage:", extract it directly (don't try JSON.parse)
  if (typeof stringifiedContent === 'string' && stringifiedContent.includes('userMessage:')) {
    const userMessageMatch = stringifiedContent.match(/userMessage:\s*(.+?)(?:\nsessionId:|$)/);
    if (userMessageMatch) {
      return userMessageMatch[1].trim();
    }
  }
  
  // Try JSON parsing only if it looks like JSON (starts with { or [)
  if (typeof stringifiedContent === 'string' && (stringifiedContent.startsWith('{') || stringifiedContent.startsWith('['))) {
    try {
      const parsed = JSON.parse(stringifiedContent);
      
      // Handle different possible structures
      if (parsed.userMessage) {
        return parsed.userMessage;
      }
      
      if (parsed.content) {
        return parsed.content;
      }
      
      // If it's already a string
      if (typeof parsed === 'string') {
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse JSON in human message:', error.message);
    }
  }
  
  // Return as-is if not parseable
  return stringifiedContent;
};

/**
 * Parse AI message content
 * @param {string} stringifiedContent - Stringify content from database
 * @returns {object} - Parsed AI response with reply and metadata
 */
export const parseAIMessage = (stringifiedContent) => {
  try {
    const parsed = JSON.parse(stringifiedContent);
    
    const result = {
      reply: '',
      metadata: null,
      sessionId: null,
      rawContent: parsed
    };
    
    // Extract reply from output
    if (parsed.output && parsed.output.reply) {
      result.reply = parsed.output.reply;
    } else if (parsed.reply) {
      result.reply = parsed.reply;
    } else if (parsed.content) {
      result.reply = parsed.content;
    }
    
    // Extract metadata
    if (parsed.output && parsed.output.metadata) {
      result.metadata = parsed.output.metadata;
    } else if (parsed.metadata) {
      result.metadata = parsed.metadata;
    }
    
    // Extract session ID
    if (parsed.output && parsed.output.session_id) {
      result.sessionId = parsed.output.session_id;
    } else if (parsed.session_id) {
      result.sessionId = parsed.session_id;
    }
    
    return result;
  } catch (error) {
    console.warn('Failed to parse AI message:', error);
    return {
      reply: stringifiedContent,
      metadata: null,
      sessionId: null,
      rawContent: null
    };
  }
};

/**
 * Check if metadata should be displayed based on template
 * @param {object} metadata - Metadata object
 * @returns {boolean} - Whether to display metadata
 */
export const shouldDisplayMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }
  
  // Add your template validation logic here
  // For example, check if metadata has required structure
  const requiredFields = ['type', 'data']; // Adjust based on your template
  
  return requiredFields.every(field => metadata.hasOwnProperty(field));
};

/**
 * Parse markdown content in AI replies
 * @param {string} content - Content with potential markdown
 * @returns {string} - HTML string or plain text
 */
export const parseMarkdown = (content) => {
  if (!content) return '';
  
  // Basic markdown parsing - you can enhance this or use a library like marked
  return content
    // Bold **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code `code`
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
};

/**
 * Group messages by session ID
 * @param {array} messages - Array of chat messages
 * @returns {object} - Grouped messages by session ID
 */
export const groupMessagesBySession = (messages) => {
  const grouped = {};
  
  messages.forEach(message => {
    const sessionId = message.session_id || 'unknown';
    
    if (!grouped[sessionId]) {
      grouped[sessionId] = {
        sessionId,
        messages: [],
        lastActivity: null
      };
    }
    
    const parsedMessage = {
      id: message.id,
      type: message.message?.type,
      timestamp: message.created_at || new Date().toISOString(),
      sessionId: sessionId
    };
    
    if (message.message?.type === 'human') {
      parsedMessage.content = parseHumanMessage(message.message.content);
      parsedMessage.isUser = true;
    } else if (message.message?.type === 'ai') {
      const aiData = parseAIMessage(message.message.content);
      parsedMessage.content = aiData.reply;
      parsedMessage.metadata = aiData.metadata;
      parsedMessage.htmlContent = parseMarkdown(aiData.reply);
      parsedMessage.isUser = false;
      parsedMessage.showMetadata = shouldDisplayMetadata(aiData.metadata);
    }
    
    grouped[sessionId].messages.push(parsedMessage);
    grouped[sessionId].lastActivity = parsedMessage.timestamp;
  });
  
  // Sort messages within each session by timestamp
  Object.values(grouped).forEach(session => {
    session.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });
  
  return grouped;
};

/**
 * Get the latest session or create a new one
 * @param {object} groupedSessions - Grouped sessions object
 * @returns {string} - Session ID
 */
export const getLatestSessionId = (groupedSessions) => {
  if (!groupedSessions || Object.keys(groupedSessions).length === 0) {
    return 'unknown';
  }
  
  const sessions = Object.values(groupedSessions);
  const latestSession = sessions.reduce((latest, current) => {
    return new Date(current.lastActivity) > new Date(latest.lastActivity) ? current : latest;
  });
  
  return latestSession.sessionId;
};