import React, { useState, useEffect } from 'react';
import { FiArrowDown } from 'react-icons/fi';

const ScrollToBottomButton = ({ containerRef, show = true }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // Show button when not at bottom (more than 100px from bottom)
      setIsVisible(distanceFromBottom > 100);
    };

    container.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  if (!isVisible || !show) return null;

  return (
    <button
      onClick={scrollToBottom}
      className="fixed bottom-24 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110 z-10"
      title="Scroll to bottom"
    >
      <FiArrowDown className="w-5 h-5" />
    </button>
  );
};

export default ScrollToBottomButton;