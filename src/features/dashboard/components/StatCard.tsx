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
      icon: <Users2 size={24} className="text-white" />,
    },
    blue: {
      bg: 'bg-gradient-to-br from-[#8ba7fa] to-[#7191f4]',
      iconBg: 'bg-white/20',
      icon: <BrainCircuit size={24} className="text-white" />,
    },
    cyan: {
      bg: 'bg-gradient-to-br from-[#77dbe8] to-[#5ecbe0]',
      iconBg: 'bg-white/20',
      icon: <Layers size={24} className="text-white" />,
    },
    coral: {
      bg: 'bg-gradient-to-br from-[#fc9b7f] to-[#f97b58]',
      iconBg: 'bg-white/20',
      icon: <FileText size={24} className="text-white" />,
    },
    emerald: {
      bg: 'bg-gradient-to-br from-[#48bb78] to-[#38a169]',
      iconBg: 'bg-white/20',
      icon: <BrainCircuit size={24} className="text-white" />,
    },
    purple: {
      bg: 'bg-gradient-to-br from-[#9f7aea] to-[#805ad5]',
      iconBg: 'bg-white/20',
      icon: <Layers size={24} className="text-white" />,
    },
  };

  const currentStyle = styles[type];

  return (
    <div
      onClick={onClick}
      className={`${currentStyle.bg} rounded-[20px] p-6 flex items-center justify-between shadow-xs relative overflow-hidden h-[130px] transition-all duration-150 ${
        onClick
          ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-[0.99]'
          : 'hover:scale-[1.01]'
      } ${active ? 'ring-2 ring-white/90 shadow-md scale-[1.01]' : ''}`}
    >
      <div className="z-10 relative flex flex-col justify-center h-full">
        <p className="text-white/90 text-[13px] font-medium mb-1.5">{title}</p>
        <h3 className="text-white text-[32px] font-bold tracking-tight leading-none">
          {isLoading ? (
            <span className="inline-block w-16 h-8 bg-white/30 rounded-lg animate-pulse" />
          ) : (
            value
          )}
        </h3>
        {subtitle && <p className="text-white/70 text-[11px] mt-1">{subtitle}</p>}
      </div>

      <div
        className={`h-[52px] w-[52px] rounded-full ${currentStyle.iconBg} flex items-center justify-center z-10 relative backdrop-blur-sm`}
      >
        {customIcon || currentStyle.icon}
      </div>
    </div>
  );
};

export { StatCard };
export default StatCard;
