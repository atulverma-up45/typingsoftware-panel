import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import api from '@/lib/api/client';

const colors = {
  fees: '#ff8a5c', // Coral/orange matching the screenshot
  other: '#2ccce4', // Cyan matching the screenshot
};

const LicenseChart: React.FC = () => {
  const [data, setData] = useState<Array<{ name: string; fees: number; other: number }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/v1/dashboard/allocation');
        if (response.data?.success && response.data?.data) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch allocation data", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex flex-col h-[400px]">
      <h3 className="text-[16px] font-bold text-gray-800 mb-8">License Allocation</h3>
      <div className="flex-1 w-full min-h-0 relative -left-4">
        <ResponsiveContainer width="105%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            barSize={24}
          >
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
              tickFormatter={(value) => value === 0 ? '0' : value.toString()}
              dx={-15}
              ticks={[0, 250000, 500000, 750000, 1000000]}
              domain={[0, 1000000]}
            />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="fees" stackId="a" fill={colors.fees} radius={[6, 6, 0, 0]} />
            <Bar dataKey="other" stackId="a" fill={colors.other} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LicenseChart;
