import React, { useEffect, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '@/lib/api/client';

const UsageChart: React.FC = () => {
  const [data, setData] = useState<Array<{ name: string; uv: number }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/v1/dashboard/usage');
        if (response.data?.success && response.data?.data) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch usage data", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex flex-col h-[400px]">
      <h3 className="text-[16px] font-bold text-gray-800 mb-8">Platform Usage</h3>
      <div className="flex-1 w-full min-h-0 relative -left-4">
        <ResponsiveContainer width="105%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f77f52" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#f77f52" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9ca3af' }} 
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              dx={-15}
              ticks={[0, 40, 80, 120, 160]}
              domain={[0, 160]}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
            />
            <Area 
              type="monotone" 
              dataKey="uv" 
              stroke="#f77f52" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorUv)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UsageChart;
