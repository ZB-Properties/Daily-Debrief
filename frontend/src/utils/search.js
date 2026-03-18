/**
 * Search messages within a conversation
 * @param {Array} messages - Array of message objects
 * @param {string} query - Search query
 * @returns {Array} Filtered and highlighted messages
 */
export const searchMessages = (messages, query) => {
  if (!query.trim()) return messages;

  const searchTerm = query.toLowerCase().trim();
  
  return messages.filter(message => {
    // Search in message content
    if (message.content?.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    // Search in sender name
    if (message.sender?.name?.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    // Search in file names
    if (message.fileName?.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    return false;
  });
};

/**
 * Highlight search terms in text
 * @param {string} text - Original text
 * @param {string} query - Search query
 * @returns {Array} Array of text segments with highlighted parts
 */
export const highlightText = (text, query) => {
  if (!query || !text) return [{ text, highlighted: false }];

  const searchTerm = query.toLowerCase().trim();
  const textLower = text.toLowerCase();
  
  if (!textLower.includes(searchTerm)) {
    return [{ text, highlighted: false }];
  }

  const result = [];
  let lastIndex = 0;
  let index = textLower.indexOf(searchTerm);

  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      result.push({
        text: text.substring(lastIndex, index),
        highlighted: false
      });
    }
    
    // Add matched text
    result.push({
      text: text.substring(index, index + searchTerm.length),
      highlighted: true
    });
    
    lastIndex = index + searchTerm.length;
    index = textLower.indexOf(searchTerm, lastIndex);
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    result.push({
      text: text.substring(lastIndex),
      highlighted: false
    });
  }
  
  return result;
};

/**
 * Group messages by date for better organization
 * @param {Array} messages - Array of message objects
 * @returns {Object} Messages grouped by date
 */
export const groupMessagesByDate = (messages) => {
  const groups = {};
  
  messages.forEach(message => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });
  
  return groups;
};

/**
 * Filter messages by type
 * @param {Array} messages - Array of message objects
 * @param {string} type - Message type (text, image, file, voice)
 * @returns {Array} Filtered messages
 */
export const filterMessagesByType = (messages, type) => {
  if (type === 'all') return messages;
  return messages.filter(message => message.type === type);
};

/**
 * Get message statistics
 * @param {Array} messages - Array of message objects
 * @returns {Object} Message statistics
 */
export const getMessageStats = (messages) => {
  return {
    total: messages.length,
    text: messages.filter(m => m.type === 'text').length,
    image: messages.filter(m => m.type === 'image').length,
    file: messages.filter(m => m.type === 'file').length,
    voice: messages.filter(m => m.type === 'voice' || m.type === 'audio').length,
    edited: messages.filter(m => m.isEdited).length,
    withReactions: messages.filter(m => m.reactions?.length > 0).length
  };
};