import React, { useEffect, useState } from 'react';
import { UserLocationRecord, UserProfile } from '../types/auth';
import { authService } from '../services/authService';
import {
  X,
  History,
  MapPin,
  Navigation,
  Gauge,
  Calendar,
  Trash2,
  RefreshCw,
  Database,
  ArrowRight,
} from 'lucide-react';

interface UserLocationHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSelectSavedRoute: (record: UserLocationRecord) => void;
}

export const UserLocationHistoryDrawer: React.FC<UserLocationHistoryDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onSelectSavedRoute,
}) => {
  const [history, setHistory] = useState<UserLocationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const records = await authService.getLocationHistory(user.userId);
      setHistory(records);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchHistory();
    }
  }, [isOpen, user]);

  const handleClearHistory = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to clear your saved location history from the backend database?')) {
      return;
    }

    try {
      await authService.clearLocationHistory(user.userId);
      setHistory([]);
    } catch (err: any) {
      setError(err.message || 'Failed to clear history');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="bg-white border-l border-sky-100 w-full max-w-lg h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="bg-[#FAF7F2] px-6 py-4 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                User Location & Pace History
              </h2>
              <p className="text-[11px] text-slate-500">
                Stored in MongoDB: <span className="font-mono font-semibold text-sky-700">user_location_history</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Account Snapshot */}
        {user && (
          <div className="bg-sky-50/60 px-6 py-3 border-b border-sky-100 flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-800 font-bold font-mono">{user.mobileNumber}</div>
              <div className="text-[10px] text-slate-500">{user.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchHistory}
                disabled={isLoading}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer shadow-2xs"
                title="Refresh from MongoDB"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-rose-700 border border-pink-200 text-[10px] font-bold transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFFDF9]">
          {error && (
            <div className="p-3 rounded-xl bg-pink-50 border border-pink-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
              <span className="text-xs">Querying MongoDB collections...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-500 gap-3">
              <MapPin className="w-10 h-10 text-slate-400 stroke-[1.5]" />
              <div className="text-xs font-bold text-slate-700">
                No location choices recorded yet
              </div>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Whenever you select an origin, destination, or test speed paces, your choices are automatically saved to your MongoDB backend account profile.
              </p>
            </div>
          ) : (
            history.map((record) => {
              const formattedDate = new Date(record.timestamp).toLocaleString();
              const isHighRisk = record.riskLevel === 'HIGH' || record.riskLevel === 'CRITICAL';

              return (
                <div
                  key={record.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300 transition-all duration-200 flex flex-col gap-2.5 shadow-xs hover:shadow-md"
                >
                  {/* Card Header: Timestamp & Risk Badge */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1 text-slate-500 font-mono">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formattedDate}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        isHighRisk
                          ? 'bg-pink-50 text-rose-700 border border-pink-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {record.riskLevel} ({record.accidentProbabilityScore}%)
                    </span>
                  </div>

                  {/* Origin to Destination */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{record.currentLocation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{record.destination}</span>
                    </div>
                  </div>

                  {/* Telemetry pill */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600">
                    <span className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 flex items-center gap-1 text-sky-800 font-mono font-bold">
                      <Gauge className="w-3 h-3 text-sky-600" />
                      {record.speed} km/h pace
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                      {record.vehicleType}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                      {record.weatherCondition}
                    </span>
                  </div>

                  {/* Action: Re-apply to engine */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSavedRoute(record);
                      onClose();
                    }}
                    className="mt-1 w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200 border border-slate-200 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Load This Location & Pace</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="bg-[#FAF7F2] px-6 py-3 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-sky-600" />
            <span>MongoDB localhost:27017</span>
          </span>
          <span className="font-mono text-slate-600 font-bold">{history.length} records</span>
        </div>
      </div>
    </div>
  );
};
