import React from 'react';
import { Users2, BrainCircuit, Layers, FileText } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  type: 'orange' | 'blue' | 'cyan' | 'coral' | 'emerald' | 'purple';
  isLoading?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  type,
  isLoading = false,
  subtitle,
  icon: customIcon,
  onClick,
  active = false,
}) => {
  const styles = {
    orange: {
      bg: 'bg-gradient-to-br from-[#ffb48b] to-[#f89c6d]',
      iconBg: 'bg-white/20',
      icon: <Users2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
    },
    blue: {
      bg: 'bg-gradient-to-br from-[#8ba7fa] to-[#7191f4]',
      iconBg: 'bg-white/20',
      icon: <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
    },
    cyan: {
      bg: 'bg-gradient-to-br from-[#77dbe8] to-[#5ecbe0]',
      iconBg: 'bg-white/20',
      icon: <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
    },
    coral: {
      bg: 'bg-gradient-to-br from-[#fc9b7f] to-[#f97b58]',
      iconBg: 'bg-white/20',
      icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
    },
    emerald: {
      bg: 'bg-gradient-to-br from-[#48bb78] to-[#38a169]',
      iconBg: 'bg-white/20',
      icon: <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
    },
    purple: {
      bg: 'bg-gradient-to-br from-[#9f7aea] to-[#805ad5]',
      iconBg: 'bg-white/20',
      icon: <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
    },
  };

  const currentStyle = styles[type] || styles.orange;

  return (
    <div
      onClick={onClick}
      className={`${currentStyle.bg} rounded-2xl sm:rounded-[20px] p-4 sm:p-5 lg:p-6 flex items-center justify-between shadow-xs relative overflow-hidden min-h-[110px] sm:min-h-[125px] transition-all duration-200 select-none ${
        onClick
          ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-[0.98]'
          : 'hover:scale-[1.01]'
      } ${active ? 'ring-2 ring-white/90 shadow-md scale-[1.01]' : ''}`}
    >
      <div className="z-10 relative flex flex-col justify-center h-full pr-2">
        <p className="text-white/90 text-xs sm:text-[13px] font-medium mb-1 line-clamp-1">{title}</p>
        <h3 className="text-white text-2xl sm:text-[28px] lg:text-[32px] font-bold tracking-tight leading-none">
          {isLoading ? (
            <span className="inline-block w-16 h-7 sm:h-8 bg-white/30 rounded-lg animate-pulse" />
          ) : (
            value
          )}
        </h3>
        {subtitle && <p className="text-white/75 text-[10px] sm:text-[11px] mt-1 line-clamp-1">{subtitle}</p>}
      </div>

      <div
        className={`h-10 w-10 sm:h-12 sm:w-12 lg:h-[52px] lg:w-[52px] rounded-full ${currentStyle.iconBg} flex items-center justify-center shrink-0 z-10 relative backdrop-blur-xs`}
      >
        {customIcon || currentStyle.icon}
      </div>
    </div>
  );
};

export { StatCard };
export default StatCard;
