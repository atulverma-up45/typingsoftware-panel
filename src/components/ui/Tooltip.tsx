import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  disabled = false,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      if (position === 'right') {
        top = rect.top + rect.height / 2;
        left = rect.right + 8; // 8px margin
      } else if (position === 'top') {
        top = rect.top - 8;
        left = rect.left + rect.width / 2;
      } else if (position === 'bottom') {
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
      } else if (position === 'left') {
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
      }

      setCoords({ top, left });
    }
  }, [isVisible, position]);

  if (disabled) return <>{children}</>;

  const getTransform = () => {
    switch (position) {
      case 'right': return 'translateY(-50%)';
      case 'left': return 'translate(-100%, -50%)';
      case 'top': return 'translate(-50%, -100%)';
      case 'bottom': return 'translateX(-50%)';
      default: return '';
    }
  };



  const getArrowClasses = () => {
    switch (position) {
      case 'right': return 'right-full top-1/2 -translate-y-1/2 border-r-white border-t-transparent border-b-transparent border-l-transparent';
      case 'left': return 'left-full top-1/2 -translate-y-1/2 border-l-white border-t-transparent border-b-transparent border-r-transparent';
      case 'top': return 'top-full left-1/2 -translate-x-1/2 border-t-white border-l-transparent border-r-transparent border-b-transparent';
      case 'bottom': return 'bottom-full left-1/2 -translate-x-1/2 border-b-white border-l-transparent border-r-transparent border-t-transparent';
      default: return '';
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={className}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          className="fixed z-[9999] whitespace-nowrap rounded bg-white border border-gray-100 px-2.5 py-1.5 text-xs font-medium text-primary-light shadow-md transition-opacity duration-200"
          style={{ top: coords.top, left: coords.left, transform: getTransform() }}
        >
          {content}
          <div
            className={`absolute border-[4px] border ${getArrowClasses()}`}
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;
