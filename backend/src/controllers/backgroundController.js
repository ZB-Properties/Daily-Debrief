const Conversation = require('../models/Conversation');

/**
 * @desc    Set conversation background
 * @route   PUT /api/chats/:conversationId/background
 * @access  Private
 */
const setBackground = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { type, value } = req.body;
    const userId = req.user._id;

    console.log('\n📸 ===== SET BACKGROUND DEBUG =====');
    console.log('1. Request params:', { conversationId });
    console.log('2. Request body:', { type, value });
    console.log('3. User ID:', userId);

    // Validate input
    if (!type || !value) {
      return res.status(400).json({
        success: false,
        error: 'Type and value are required'
      });
    }

    // Validate type
    if (!['color', 'gradient', 'image'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid background type'
      });
    }

    // Find conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      deletedBy: { $ne: userId }
    });

    if (!conversation) {
      console.log('❌ Conversation not found:', conversationId);
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Handle gradient objects vs strings
    let backgroundValue = value;
    if (type === 'gradient' && typeof value === 'object' && value !== null) {
      backgroundValue = {
        light: value.light || 'from-red-50 to-blue-200',
        dark: value.dark || 'from-gray-800 to-red-950',
        name: value.name || 'Custom'
      };
    }

    // Create background object using flattened structure
    conversation.background = {
      bgType: type,
      bgValue: backgroundValue,
      customBy: userId,
      updatedAt: new Date()
    };

    console.log('4. Saving background:', conversation.background);
    await conversation.save();
    console.log('✅ Background saved successfully');

    // Transform response to match frontend expectations
    const responseBackground = {
      type: conversation.background.bgType,
      value: conversation.background.bgValue,
      customBy: conversation.background.customBy,
      updatedAt: conversation.background.updatedAt
    };

    res.json({
      success: true,
      data: { background: responseBackground }
    });

  } catch (error) {
    console.error('❌ Error setting background:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set background: ' + error.message
    });
  }
};

/**
 * @desc    Get conversation background
 * @route   GET /api/chats/:conversationId/background
 * @access  Private
 */
const getBackground = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    console.log('📸 Getting background for conversation:', conversationId);

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      deletedBy: { $ne: userId }
    }).select('background');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // If no background set, return default gradient
    if (!conversation.background || !conversation.background.bgType) {
      return res.json({
        success: true,
        data: { 
          background: { 
            type: 'gradient',
            value: {
              light: 'from-red-50 to-blue-200',
              dark: 'from-gray-800 to-red-950',
              name: 'Default'
            }
          } 
        }
      });
    }

    // Transform database format to frontend format
    const responseBackground = {
      type: conversation.background.bgType,
      value: conversation.background.bgValue,
      customBy: conversation.background.customBy,
      updatedAt: conversation.background.updatedAt
    };

    res.json({
      success: true,
      data: { background: responseBackground }
    });
  } catch (error) {
    console.error('Error getting background:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get background: ' + error.message
    });
  }
};

/**
 * @desc    Reset to default background
 * @route   DELETE /api/chats/:conversationId/background
 * @access  Private
 */
const resetBackground = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    console.log('📸 Resetting background for conversation:', conversationId);

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      deletedBy: { $ne: userId }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Remove the background field
    conversation.background = undefined;
    await conversation.save();

    console.log('✅ Background reset successfully');

    res.json({
      success: true,
      message: 'Background reset to default'
    });
  } catch (error) {
    console.error('Error resetting background:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset background: ' + error.message
    });
  }
};

module.exports = {
  setBackground,
  getBackground,
  resetBackground
};