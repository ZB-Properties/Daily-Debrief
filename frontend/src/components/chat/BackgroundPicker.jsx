import React, { useState } from 'react';
import { FiX, FiCheck, FiRefreshCw, FiImage, FiUpload } from 'react-icons/fi';
import backgroundService from '../../services/background';
import toast from 'react-hot-toast';

const BackgroundPicker = ({ currentBackground, onSelect, onClose, onReset }) => {
  const [activeTab, setActiveTab] = useState('colors');
  const [selected, setSelected] = useState(() => {
    // Handle both string and object gradients
    if (currentBackground?.type === 'gradient') {
      if (typeof currentBackground.value === 'object') {
        return currentBackground.value.light; // Default to light mode for preview
      }
      return currentBackground.value;
    }
    return currentBackground?.value || '#f3f4f6';
  });
  const [uploading, setUploading] = useState(false);

  const presets = backgroundService.presets;

  const handleSelect = (type, value) => {
    setSelected(typeof value === 'object' ? value.light : value);
    onSelect(type, value);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      setSelected(url);
      onSelect('image', url, file);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    const defaultGradient = {
      light: 'from-red-50 to-blue-200',
      dark: 'from-gray-800 to-red-950',
      name: 'Default'
    };
    setSelected(defaultGradient.light);
    onReset();
    toast.success('Background reset to default');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:p-0 sm:bg-transparent">
      <div className="w-full max-w-sm sm:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white">Chat Background</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex-1 py-3 text-sm font-medium transition-colors min-h-[44px] ${
              activeTab === 'colors'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Colors
          </button>
          <button
            onClick={() => setActiveTab('gradients')}
            className={`flex-1 py-3 text-sm font-medium transition-colors min-h-[44px] ${
              activeTab === 'gradients'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Gradients
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 py-3 text-sm font-medium transition-colors min-h-[44px] ${
              activeTab === 'images'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Images
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {activeTab === 'colors' && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {presets.colors.map((color, index) => (
                <button
                  key={`color-${color}-${index}`}
                  onClick={() => handleSelect('color', color)}
                  className="relative w-full aspect-square rounded-lg border-2 border-transparent hover:border-gray-300 transition-all min-h-[44px]"
                  style={{ backgroundColor: color }}
                >
                  {selected === color && (
                    <FiCheck className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'gradients' && (
            <div className="grid grid-cols-2 gap-3">
              {presets.gradients.map((gradient, index) => {
                // For preview, use light mode version
                const previewGradient = gradient.light;
                const isSelected = 
                  (typeof currentBackground?.value === 'object' && 
                   currentBackground.value.name === gradient.name) ||
                  selected === gradient.light;
                
                return (
                  <button
                    key={`gradient-${gradient.name}-${index}`}
                    onClick={() => handleSelect('gradient', gradient)}
                    className={`w-full h-14 rounded-lg border-2 transition-all ${
                      isSelected ? 'border-red-600' : 'border-transparent hover:border-gray-300'
                    } bg-gradient-to-r ${previewGradient}`}
                    title={gradient.name}
                  >
                    {isSelected && (
                      <FiCheck className="mx-auto w-5 h-5 text-white drop-shadow-md" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex flex-col items-center justify-center p-4">
                  <FiImage className="w-10 h-10 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 text-center">Click to upload image</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
              
              {uploading && (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <FiUpload className="w-4 h-4 animate-pulse" />
                  <span>Uploading...</span>
                </div>
              )}

              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 Recommended size: 1920x1080px or larger for best quality
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] flex-1 sm:flex-initial"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors min-h-[44px] flex-1 sm:flex-initial"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundPicker;