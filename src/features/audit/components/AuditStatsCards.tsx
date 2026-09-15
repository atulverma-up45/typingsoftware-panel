import React from 'react';
import { ShieldCheck, Activity, Calendar, Tag } from 'lucide-react';
import type { AuditMetrics } from '../api/auditApi';

interface AuditStatsCardsProps {
  stats: AuditMetrics;
}

export const AuditStatsCards: React.FC<AuditStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Total Audit Logs</span>
          <ShieldCheck size={18} className="text-primary" />
        </div>
        <div className="text-3xl font-black text-gray-900">
          {stats.totalAuditLogs.toLocaleString()}
        </div>
        <span className="text-xs text-gray-400 mt-0.5 block">Recorded compliance events</span>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Past 24 Hours</span>
          <Activity size={18} className="text-emerald-500" />
        </div>
        <div className="text-3xl font-black text-emerald-600">
          {stats.logsLast24Hours.toLocaleString()}
        </div>
        <span className="text-xs text-emerald-600/80 mt-0.5 block">Today's mutation velocity</span>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Past 7 Days</span>
          <Calendar size={18} className="text-blue-500" />
        </div>
        <div className="text-3xl font-black text-blue-600">
          {stats.logsLast7Days.toLocaleString()}
        </div>
        <span className="text-xs text-gray-400 mt-0.5 block">Weekly operational volume</span>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Log Governance</span>
          <Tag size={18} className="text-purple-500" />
        </div>
        <div className="text-xl font-bold text-purple-700 flex items-center gap-1.5 mt-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          Append-Only
        </div>
        <span className="text-xs text-gray-400 mt-0.5 block">Zero mutable modifications</span>
      </div>
    </div>
  );
};

