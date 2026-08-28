import React from 'react';
import { Users2, BrainCircuit, Layers, FileText } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  type: 'orange' | 'blue' | 'cyan' | 'coral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, type }) => {
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
    <div className={`${currentStyle.bg} rounded-[20px] p-6 flex items-center justify-between shadow-sm relative overflow-hidden h-[130px]`}>
      <div className="z-10 relative flex flex-col justify-center h-full">
        <p className="text-white/90 text-[13px] font-medium mb-2">{title}</p>
        <h3 className="text-white text-[32px] font-bold tracking-tight leading-none">{value}</h3>
      </div>
      
      <div className={`h-[52px] w-[52px] rounded-full ${currentStyle.iconBg} flex items-center justify-center z-10 relative backdrop-blur-sm`}>
        {currentStyle.icon}
      </div>
    </div>
  );
};

export default StatCard;
