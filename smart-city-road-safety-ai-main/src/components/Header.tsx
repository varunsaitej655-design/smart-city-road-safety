import React, { useState, useEffect } from 'react';
import { UserProfile, DbStatusResponse } from '../types/auth';
import {
  ShieldAlert,
  Database,
  FileSpreadsheet,
  History,
  LogOut,
  Sparkles,
  Clock,
  Compass,
} from 'lucide-react';

interface HeaderProps {
  recordsCount: number;
  blackspotsCount: number;
  isAiProcessing: boolean;
  user: UserProfile | null;
  dbStatus: DbStatusResponse | null;
  currentHour?: number;
  onOpenDatasetModal: () => void;
  onResetDefaults: () => void;
  onOpenLoginModal: () => void;
  onOpenHistoryDrawer: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  recordsCount,
  blackspotsCount,
  user,
  dbStatus,
  currentHour = 19,
  onOpenDatasetModal,
  onResetDefaults,
  onOpenLoginModal,
  onOpenHistoryDrawer,
  onLogout,
}) => {
  // Live IST Clock
  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Calculate IST (UTC + 5:30)
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istDate = new Date(utc + 3600000 * 5.5);
      const hours = istDate.getHours().toString().padStart(2, '0');
      const mins = istDate.getMinutes().toString().padStart(2, '0');
      const secs = istDate.getSeconds().toString().padStart(2, '0');
      setIstTime(`${hours}:${mins}:${secs} IST`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getIstWindowBadge = (hour: number) => {
    if (hour >= 22 || hour <= 5) {
      return { text: 'Night Hazard (22:00-05:00)', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (hour >= 8 && hour <= 10) {
      return { text: 'Morning Peak (08:00-11:00)', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    if (hour >= 17 && hour <= 20) {
      return { text: 'Evening Peak (17:00-20:00)', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    return { text: 'Off-Peak Day Window', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const windowBadge = getIstWindowBadge(currentHour);

  return (
    <header className="bg-white/85 border-b border-sky-100 backdrop-blur-md sticky top-0 z-40 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 via-pink-400 to-rose-400 flex items-center justify-center shadow-md shadow-pink-300/40 ring-2 ring-white">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Visual Smart City Accident Risk & Dynamic Route Advisory Engine
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                India Region
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                Powered by OpenAI
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Pan-India Highway & Urban Blackspot Analytics • Real-Time Environmental Feeds • Time-Aware Speed Thresholds
            </p>
          </div>
        </div>

        {/* Live IST Clock, Status Indicators & Actions */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Live IST Clock Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-amber-200/80 text-slate-700 font-mono text-[11px] shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-sky-600 animate-spin-slow" />
            <span className="font-bold text-slate-800">{istTime || 'Live IST'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${windowBadge.color}`}>
              {windowBadge.text}
            </span>
          </div>

          {/* Dataset Status Badge */}
          <button
            onClick={onOpenDatasetModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-sky-200 hover:border-pink-300 text-slate-700 hover:text-sky-700 transition shadow-2xs hover:-translate-y-0.5 cursor-pointer"
            title="Inspect Indian Highway & Blackspot Dataset"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
            <span>
              {recordsCount} Corridors ({blackspotsCount} Blackspots)
            </span>
          </button>

          {/* User Session Interface */}
          {user ? (
            <div className="flex items-center gap-1.5 bg-pink-50/70 border border-pink-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <button
                onClick={onOpenHistoryDrawer}
                className="font-medium text-slate-800 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
                title="View Saved Trips & Routes"
              >
                <History className="w-3 h-3 text-pink-600" />
                <span className="truncate max-w-[110px]">{user.mobileNumber || user.email}</span>
              </button>
              <button
                onClick={onLogout}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-sky-500 to-pink-500 text-white font-medium text-xs shadow-xs hover:shadow-sm hover:opacity-95 transition cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Reset Defaults */}
          <button
            onClick={onResetDefaults}
            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 transition shadow-2xs cursor-pointer"
            title="Reset Defaults"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
