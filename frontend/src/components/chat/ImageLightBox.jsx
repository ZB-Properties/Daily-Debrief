import React, { useEffect } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiDownload, FiMaximize } from 'react-icons/fi';

const ImageLightBox = ({ isOpen, onClose, imageUrl, fileName, onNext, onPrev, hasNext, hasPrev }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
     
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 rounded-full text-white transition-all z-10"
      >
        <FiX className="w-6 h-6" />
      </button>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="absolute top-4 right-20 p-3 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 rounded-full text-white transition-all z-10"
        title="Download image"
      >
        <FiDownload className="w-5 h-5" />
      </button>

      {/* Navigation buttons */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 p-3 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 rounded-full text-white transition-all z-10"
        >
          <FiChevronLeft className="w-6 h-6" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 p-3 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 rounded-full text-white transition-all z-10"
        >
          <FiChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <img
        src={imageUrl}
        alt="Preview"
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Image info */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm">
        {fileName || 'Image'}
      </div>
    </div>
  );
};

export default ImageLightBox;