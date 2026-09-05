import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useDashboardGrowth } from '../api/dashboardApi';

const colors = {
  institutions: '#06B6D4', // Cyan
  licenses: '#ff8a5c', // Coral/orange
};

interface LicenseChartProps {
  enabled?: boolean;
}

const LicenseChart: React.FC<LicenseChartProps> = ({ enabled = true }) => {
  const { data = [], isLoading } = useDashboardGrowth(5, enabled);

  return (
    <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex flex-col h-[400px]">
      <div>
        <h3 className="text-[16px] font-bold text-gray-800 tracking-tight">Platform Growth</h3>
        <p className="text-xs text-gray-400 mt-0.5">New institutions & licenses issued</p>
      </div>

      <div className="flex-1 w-full min-h-0 relative -left-4 mt-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse text-xs text-gray-400">Loading growth trends...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
            No growth records available.
          </div>
        ) : (
          <ResponsiveContainer width="105%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                allowDecimals={false}
                dx={-10}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend verticalAlign="top" height={32} iconType="circle" />
              <Bar
                name="Institutions"
                dataKey="institutions"
                fill={colors.institutions}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Licenses"
                dataKey="licenses"
                fill={colors.licenses}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default LicenseChart;
