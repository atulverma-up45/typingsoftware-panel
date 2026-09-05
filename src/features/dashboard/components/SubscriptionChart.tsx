import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDashboardSubscriptions } from '../api/dashboardApi';
import { CreditCard } from 'lucide-react';

const COLORS: Record<string, string> = {
  ACTIVE: '#16a34a', // Green
  TRIAL: '#0ea5e9', // Blue
  EXPIRED: '#ef4444', // Red
  CANCELLED: '#9ca3af', // Gray
  PAST_DUE: '#f59e0b', // Yellow
  SUSPENDED: '#71717a', // Dark gray
};

interface SubscriptionChartProps {
  enabled?: boolean;
}

const SubscriptionChart: React.FC<SubscriptionChartProps> = ({ enabled = true }) => {
  const { data = [], isLoading } = useDashboardSubscriptions(enabled);

  return (
    <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex flex-col h-[400px]">
      <div>
        <h3 className="text-[16px] font-bold text-gray-800 tracking-tight">Subscription Health</h3>
        <p className="text-xs text-gray-400 mt-0.5">Commercial plan status breakdown</p>
      </div>

      <div className="flex-1 w-full min-h-0 relative mt-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-36 h-36 rounded-full border-4 border-gray-100 border-t-[#ff8a5c] animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mb-3">
              <CreditCard size={24} />
            </div>
            <p className="text-sm font-semibold text-gray-700">No Subscriptions</p>
            <p className="text-xs text-gray-400 mt-1">
              Active tenant subscriptions will appear here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name.toUpperCase()] || '#94a3b8'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                }}
                itemStyle={{ color: '#1e293b', fontWeight: 600 }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SubscriptionChart;
