import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useDashboardUsage } from '../api/dashboardApi';
import { Activity } from 'lucide-react';

const UsageChart: React.FC = () => {
  const [days, setDays] = useState(7);
  const { data = [], isLoading } = useDashboardUsage(days);

  return (
    <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold text-gray-800 tracking-tight">Practice & Exam Usage</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Student participation across lessons, exams, and typing games
          </p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { label: '7D', value: 7 },
            { label: '14D', value: 14 },
            { label: '30D', value: 30 },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setDays(item.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                days === item.value
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative -left-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-2 text-gray-300">
              <Activity size={32} className="animate-spin text-[#ff8a5c]" />
              <span className="text-xs">Loading usage trends...</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
            No practice data recorded for this time window.
          </div>
        ) : (
          <ResponsiveContainer width="105%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f77f52" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f77f52" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGames" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                dx={-10}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '14px',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                  padding: '10px 14px',
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                type="monotone"
                dataKey="lessons"
                name="Lessons"
                stackId="1"
                stroke="#f77f52"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorLessons)"
              />
              <Area
                type="monotone"
                dataKey="exams"
                name="Exams"
                stackId="1"
                stroke="#06B6D4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorExams)"
              />
              <Area
                type="monotone"
                dataKey="games"
                name="Typing Games"
                stackId="1"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorGames)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default UsageChart;
