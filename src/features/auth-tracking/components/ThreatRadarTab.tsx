import React from 'react';
import { Plane, Crosshair, CheckCircle2 } from 'lucide-react';
import type { ThreatRadarData } from '../api/authTrackingApi';

export interface ThreatRadarTabProps {
  threats: ThreatRadarData | undefined;
  isLoadingThreats: boolean;
  onNukeUser: (user: { userId: string; userName: string }) => void;
}

export const ThreatRadarTab: React.FC<ThreatRadarTabProps> = ({
  threats,
  isLoadingThreats,
  onNukeUser,
}) => {
  return (
    <div className="space-y-6">
      {/* Impossible Travel Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Plane className="text-amber-500" size={16} />
              <span>
                Impossible Travel Incidents ({threats?.impossibleTravelIncidents.length || 0})
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Sign-in events from geographically distinct locations within impossible physical travel time windows.
            </p>
          </div>
        </div>

        {isLoadingThreats ? (
          <div className="py-6 text-center text-xs text-gray-400">
            Scanning geographical logs...
          </div>
        ) : (threats?.impossibleTravelIncidents.length || 0) === 0 ? (
          <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500 opacity-70" />
            <p className="text-sm font-bold text-gray-800">No Impossible Travel Anomalies</p>
            <p className="text-xs text-gray-500 mt-0.5">
              All recent sign-ins fall within expected physical velocities.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {threats?.impossibleTravelIncidents.map((inc, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-red-50/70 border border-red-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                      {inc.severity}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{inc.userName}</span>
                    <span className="text-xs text-gray-500">({inc.userEmail})</span>
                  </div>
                  <p className="text-xs text-red-800 font-medium">{inc.reason}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 pt-1 font-mono">
                    <span>
                      Origin: {inc.originLocation} ({inc.originIp || 'IP Hidden'})
                    </span>
                    <span>➔</span>
                    <span>
                      Dest: {inc.destinationLocation} ({inc.destinationIp || 'IP Hidden'})
                    </span>
                    <span>•</span>
                    <span>Delta: {inc.timeDeltaMinutes}m</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onNukeUser({ userId: inc.userId, userName: inc.userName })
                  }
                  className="h-[36px] px-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  Nuke All Devices
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brute Force Attacks Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Crosshair className="text-red-500" size={16} />
              <span>
                Brute-Force Password Bursts ({threats?.bruteForceAttacks.length || 0})
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              IP addresses exceeding consecutive failed login thresholds in the telemetry buffer.
            </p>
          </div>
        </div>

        {(threats?.bruteForceAttacks.length || 0) === 0 ? (
          <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500 opacity-70" />
            <p className="text-sm font-bold text-gray-800">No Brute-Force Attacks Detected</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Zero IP addresses exceeding 3 consecutive failed login attempts in the past 2 hours.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {threats?.bruteForceAttacks.map((bf, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-amber-900">
                    {bf.ipAddress}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                    {bf.failedAttempts} failed attempts
                  </span>
                </div>
                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span>{bf.location}</span>
                </div>
                <div className="text-[11px] text-gray-500 flex items-center justify-between border-t border-amber-200/60 pt-2">
                  <span>Targeted Accounts: {bf.targetedAccountsCount}</span>
                  <span>Last Attempt: {new Date(bf.lastAttemptAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

