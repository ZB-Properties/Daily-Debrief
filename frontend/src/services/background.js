import api from './api';

const backgroundService = {
  // Get conversation background
  getBackground: async (conversationId) => {
    try {
      const response = await api.get(`/chats/${conversationId}/background`);
      return response.data;
    } catch (error) {
      console.error('Error getting background:', error);
      throw error;
    }
  },

  // Set conversation background
  setBackground: async (conversationId, type, value) => {
    try {
      const response = await api.put(`/chats/${conversationId}/background`, {
        type,
        value
      });
      return response.data;
    } catch (error) {
      console.error('Error setting background:', error);
      throw error;
    }
  },

  // Reset to default background
  resetBackground: async (conversationId) => {
    try {
      const response = await api.delete(`/chats/${conversationId}/background`);
      return response.data;
    } catch (error) {
      console.error('Error resetting background:', error);
      throw error;
    }
  },

  // Preset backgrounds
  presets: {
    colors: [
      '#f3f4f6', '#fee2e2', '#dbeafe', '#dcfce7', '#fef9c3',
      '#f1f5f9', '#fce7f3', '#e0f2fe', '#d1fae5', '#ffedd5'
    ],
    gradients: [
      {
        light: 'from-red-50 to-blue-200',
        dark: 'from-gray-800 to-red-950',
        name: 'Default'
      },
      {
        light: 'from-blue-500 to-purple-600',
        dark: 'from-blue-900 to-purple-950',
        name: 'Purple Dream'
      },
      {
        light: 'from-green-400 to-blue-500',
        dark: 'from-green-900 to-blue-950',
        name: 'Ocean Breeze'
      },
      {
        light: 'from-yellow-400 to-red-500',
        dark: 'from-yellow-900 to-red-950',
        name: 'Sunset'
      },
      {
        light: 'from-pink-500 to-purple-500',
        dark: 'from-pink-900 to-purple-950',
        name: 'Pink Haze'
      },
      {
        light: 'from-indigo-500 to-purple-600',
        dark: 'from-indigo-900 to-purple-950',
        name: 'Royal'
      },
      {
        light: 'from-red-500 to-yellow-500',
        dark: 'from-red-900 to-yellow-950',
        name: 'Fire'
      },
      {
        light: 'from-green-500 to-teal-500',
        dark: 'from-green-900 to-teal-950',
        name: 'Forest'
      }
    ]
  },

  // Helper to convert Tailwind gradient to CSS gradient with theme support
  tailwindToCssGradient: (tailwindGradient, isDarkMode = false) => {
    if (!tailwindGradient) {
      // Return default based on theme
      return isDarkMode 
        ? 'linear-gradient(to bottom right, #1f2937, #7f1d1d)' // dark: from-gray-800 to-red-950
        : 'linear-gradient(to bottom right, #fee2e2, #bfdbfe)'; // light: from-red-50 to-blue-200
    }
    
    const colorMap = {
      // Grays
      'gray-50': '#f9fafb',
      'gray-100': '#f3f4f6',
      'gray-200': '#e5e7eb',
      'gray-300': '#d1d5db',
      'gray-400': '#9ca3af',
      'gray-500': '#6b7280',
      'gray-600': '#4b5563',
      'gray-700': '#374151',
      'gray-800': '#1f2937',
      'gray-900': '#111827',
      'gray-950': '#030712',
      
      // Reds
      'red-50': '#fee2e2',
      'red-100': '#fee2e2',
      'red-200': '#fecaca',
      'red-300': '#fca5a5',
      'red-400': '#f87171',
      'red-500': '#ef4444',
      'red-600': '#dc2626',
      'red-700': '#b91c1c',
      'red-800': '#991b1b',
      'red-900': '#7f1d1d',
      'red-950': '#450a0a',
      
      // Blues
      'blue-50': '#eff6ff',
      'blue-100': '#dbeafe',
      'blue-200': '#bfdbfe',
      'blue-300': '#93c5fd',
      'blue-400': '#60a5fa',
      'blue-500': '#3b82f6',
      'blue-600': '#2563eb',
      'blue-700': '#1d4ed8',
      'blue-800': '#1e40af',
      'blue-900': '#1e3a8a',
      'blue-950': '#172554',
      
      // Purples
      'purple-50': '#faf5ff',
      'purple-100': '#f3e8ff',
      'purple-200': '#e9d5ff',
      'purple-300': '#d8b4fe',
      'purple-400': '#c084fc',
      'purple-500': '#a855f7',
      'purple-600': '#9333ea',
      'purple-700': '#7e22ce',
      'purple-800': '#6b21a8',
      'purple-900': '#581c87',
      'purple-950': '#3b0764',
      
      // Greens
      'green-50': '#f0fdf4',
      'green-100': '#dcfce7',
      'green-200': '#bbf7d0',
      'green-300': '#86efac',
      'green-400': '#4ade80',
      'green-500': '#22c55e',
      'green-600': '#16a34a',
      'green-700': '#15803d',
      'green-800': '#166534',
      'green-900': '#14532d',
      'green-950': '#052e16',
      
      // Yellows
      'yellow-50': '#fefce8',
      'yellow-100': '#fef9c3',
      'yellow-200': '#fef08a',
      'yellow-300': '#fde047',
      'yellow-400': '#facc15',
      'yellow-500': '#eab308',
      'yellow-600': '#ca8a04',
      'yellow-700': '#a16207',
      'yellow-800': '#854d0e',
      'yellow-900': '#713f12',
      'yellow-950': '#422006',
      
      // Pinks
      'pink-50': '#fdf2f8',
      'pink-100': '#fce7f3',
      'pink-200': '#fbcfe8',
      'pink-300': '#f9a8d4',
      'pink-400': '#f472b6',
      'pink-500': '#ec4899',
      'pink-600': '#db2777',
      'pink-700': '#be185d',
      'pink-800': '#9d174d',
      'pink-900': '#831843',
      'pink-950': '#500724',
      
      // Indigos
      'indigo-50': '#eef2ff',
      'indigo-100': '#e0e7ff',
      'indigo-200': '#c7d2fe',
      'indigo-300': '#a5b4fc',
      'indigo-400': '#818cf8',
      'indigo-500': '#6366f1',
      'indigo-600': '#4f46e5',
      'indigo-700': '#4338ca',
      'indigo-800': '#3730a3',
      'indigo-900': '#312e81',
      'indigo-950': '#1e1b4b',
      
      // Teals
      'teal-50': '#f0fdfa',
      'teal-100': '#ccfbf1',
      'teal-200': '#99f6e4',
      'teal-300': '#5eead4',
      'teal-400': '#2dd4bf',
      'teal-500': '#14b8a6',
      'teal-600': '#0d9488',
      'teal-700': '#0f766e',
      'teal-800': '#115e59',
      'teal-900': '#134e4a',
      'teal-950': '#042f2e'
    };

    try {
      // If it's an object with light/dark properties
      if (typeof tailwindGradient === 'object' && tailwindGradient.light && tailwindGradient.dark) {
        const gradientToUse = isDarkMode ? tailwindGradient.dark : tailwindGradient.light;
        return backgroundService.parseGradientString(gradientToUse, colorMap, isDarkMode);
      }
      
      // If it's a string, parse it directly
      if (typeof tailwindGradient === 'string') {
        return backgroundService.parseGradientString(tailwindGradient, colorMap, isDarkMode);
      }
    } catch (error) {
      console.error('Error converting gradient:', error);
    }
    
    // Default fallback based on theme
    return isDarkMode 
      ? 'linear-gradient(to bottom right, #1f2937, #7f1d1d)'
      : 'linear-gradient(to bottom right, #fee2e2, #bfdbfe)';
  },

  // Helper to parse gradient string
  parseGradientString: (gradientString, colorMap, isDarkMode) => {
    if (gradientString.includes('from-') && gradientString.includes('to-')) {
      const parts = gradientString.split(' ');
      let fromColor = isDarkMode ? '#1f2937' : '#fee2e2'; // default based on theme
      let toColor = isDarkMode ? '#7f1d1d' : '#bfdbfe';   // default based on theme
      
      parts.forEach(part => {
        if (part.startsWith('from-')) {
          const color = part.replace('from-', '');
          fromColor = colorMap[color] || fromColor;
        } else if (part.startsWith('to-')) {
          const color = part.replace('to-', '');
          toColor = colorMap[color] || toColor;
        }
      });
      
      return `linear-gradient(to bottom right, ${fromColor}, ${toColor})`;
    }
    
    return isDarkMode 
      ? 'linear-gradient(to bottom right, #1f2937, #7f1d1d)'
      : 'linear-gradient(to bottom right, #fee2e2, #bfdbfe)';
  },

  // Get gradient display name
  getGradientName: (gradientValue) => {
    if (!gradientValue) return 'Default';
    
    // Find matching preset
    const preset = backgroundService.presets.gradients.find(g => 
      (typeof gradientValue === 'object' && g.light === gradientValue.light && g.dark === gradientValue.dark) ||
      (typeof gradientValue === 'string' && (g.light === gradientValue || g.dark === gradientValue))
    );
    
    return preset?.name || 'Custom';
  }
};

export default backgroundService;