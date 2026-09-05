import React from 'react';
import { Users2, BrainCircuit, Layers, FileText } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  type: 'orange' | 'blue' | 'cyan' | 'coral';
  isLoading?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  type,
  isLoading = false,
  subtitle,
  icon: customIcon,
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
  };

  const currentStyle = styles[type];

  return (
    <div
      className={`${currentStyle.bg} rounded-[20px] p-6 flex items-center justify-between shadow-xs relative overflow-hidden h-[130px] transition-transform hover:scale-[1.01] duration-150`}
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

export default StatCard;
