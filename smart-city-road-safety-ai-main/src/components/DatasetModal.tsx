import React, { useState } from 'react';
import { AccidentDatasetRecord } from '../types/engine';
import { DEFAULT_CSV_RAW, parseCsvDataset } from '../data/smartCityDataset';
import {
  X,
  Database,
  Download,
  Upload,
  Search,
  AlertOctagon,
  CheckCircle,
} from 'lucide-react';

interface DatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: AccidentDatasetRecord[];
  onUpdateDataset: (newDataset: AccidentDatasetRecord[]) => void;
}

export const DatasetModal: React.FC<DatasetModalProps> = ({
  isOpen,
  onClose,
  dataset,
  onUpdateDataset,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyBlackspots, setOnlyBlackspots] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredRecords = dataset.filter((r) => {
    const matchesSearch =
      r.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.locationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.roadType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBlackspot = onlyBlackspots ? r.isBlackspot : true;
    return matchesSearch && matchesBlackspot;
  });

  const handleDownloadCsv = () => {
    const headers = [
      'Geolocation_ID',
      'Location_Name',
      'Hour',
      'Day_Of_Week',
      'Peak_Hour_Flag',
      'Weather_Condition',
      'Visibility_Meters',
      'Road_Surface_Quality',
      'Pothole_Count',
      'Sudden_Diversion_Flag',
      'Speed_Breaker_Count',
      'Traffic_Level',
      'Speed_Limit_kmh',
      'Road_Type',
      'Curvature_Rating',
      'Previous_Accidents_Annual',
      'Blackspot_Indicator',
      'Fatalities_Historical',
    ].join(',');

    const rows = dataset.map((d) =>
      [
        d.locationId,
        `"${d.locationName}"`,
        d.hour,
        d.dayOfWeek,
        d.isPeakHour ? 1 : 0,
        `"${d.weather}"`,
        d.visibilityMeters,
        `"${d.surfaceQuality}"`,
        d.potholeCount,
        d.suddenDiversion ? 1 : 0,
        d.speedBreakerCount,
        `"${d.trafficLevel}"`,
        d.speedLimitKmh,
        `"${d.roadType}"`,
        `"${d.curvature}"`,
        d.historicalAccidentsAnnual,
        d.isBlackspot ? 1 : 0,
        d.historicalFatalities,
      ].join(','),
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smart_city_accident_dataset_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        try {
          const parsed = parseCsvDataset(text);
          if (parsed.length > 0) {
            onUpdateDataset(parsed);
            setUploadFeedback(`Successfully imported ${parsed.length} custom spatial-temporal records!`);
            setTimeout(() => setUploadFeedback(null), 4000);
          } else {
            setUploadFeedback('Failed to parse rows. Please check CSV column schema headers.');
          }
        } catch (err: any) {
          setUploadFeedback(`Error parsing CSV: ${err.message}`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefault = () => {
    const defaultData = parseCsvDataset(DEFAULT_CSV_RAW);
    onUpdateDataset(defaultData);
    setUploadFeedback('Reset to default Smart City historical database.');
    setTimeout(() => setUploadFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white border border-sky-100 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#FAF7F2] px-6 py-4 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Smart City Accident Dataset Context Explorer
              </h2>
              <p className="text-[11px] text-slate-500">
                Spatial-temporal traffic, environmental & blackspot historical records ({dataset.length} active corridors)
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

        {/* Toolbar: Search, Filters & Upload/Export */}
        <div className="p-4 border-b border-sky-100 bg-[#FFFDF9] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2.5 flex-1 min-w-[280px]">
            {/* Search input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search corridor ID, name, road type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 font-medium"
              />
            </div>

            {/* Blackspots only filter */}
            <button
              onClick={() => setOnlyBlackspots(!onlyBlackspots)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                onlyBlackspots
                  ? 'bg-pink-50 text-rose-700 border-pink-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              <span>Only Blackspots</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Upload CSV input */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition shadow-2xs hover:-translate-y-0.5">
              <Upload className="w-3.5 h-3.5 text-sky-600" />
              <span>Upload CSV</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* Download CSV */}
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold transition cursor-pointer shadow-2xs hover:-translate-y-0.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleResetDefault}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs border border-slate-200 transition font-medium"
              title="Reset to default dataset"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Upload feedback notification */}
        {uploadFeedback && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>{uploadFeedback}</span>
          </div>
        )}

        {/* Table View of Dataset Schema */}
        <div className="flex-1 overflow-auto p-4 bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#FAF7F2] sticky top-0 text-[10px] uppercase font-bold text-slate-600 tracking-wider border-b border-amber-200/60">
              <tr>
                <th className="py-2.5 px-3">Location ID</th>
                <th className="py-2.5 px-3">Corridor Name</th>
                <th className="py-2.5 px-2">Time/Peak</th>
                <th className="py-2.5 px-3">Weather/Vis</th>
                <th className="py-2.5 px-3">Surface & Hazards</th>
                <th className="py-2.5 px-2">Traffic</th>
                <th className="py-2.5 px-2">Limit</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2">Curvature</th>
                <th className="py-2.5 px-2">Crashes/Fatal</th>
                <th className="py-2.5 px-3">Blackspot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr
                  key={record.locationId}
                  className={`hover:bg-sky-50/40 transition font-mono ${
                    record.isBlackspot ? 'bg-pink-50/30' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-bold text-sky-800">{record.locationId}</td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">
                    {record.locationName}
                  </td>
                  <td className="py-2 px-2 text-slate-600">
                    {record.hour}:00 ({record.dayOfWeek.slice(0, 3)}){' '}
                    {record.isPeakHour && (
                      <span className="text-rose-600 font-bold ml-1">PEAK</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-sans">
                    {record.weather} ({record.visibilityMeters}m)
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-sans">
                    {record.surfaceQuality} • {record.potholeCount} potholes • {record.speedBreakerCount} bumps
                    {record.suddenDiversion && <span className="text-rose-600 font-bold ml-1">⚠️ DIVERSION</span>}
                  </td>
                  <td className="py-2 px-2 text-slate-700 font-sans">{record.trafficLevel}</td>
                  <td className="py-2 px-2 font-bold text-slate-800">{record.speedLimitKmh} km/h</td>
                  <td className="py-2 px-2 text-slate-600 font-sans">{record.roadType}</td>
                  <td className="py-2 px-2 text-slate-600 font-sans">{record.curvature}</td>
                  <td className="py-2 px-2 font-bold text-slate-800">
                    <span className="text-amber-700">{record.historicalAccidentsAnnual}</span> /{' '}
                    <span className="text-rose-600">{record.historicalFatalities}</span>
                  </td>
                  <td className="py-2 px-3">
                    {record.isBlackspot ? (
                      <span className="px-2 py-0.5 rounded-full bg-pink-50 text-rose-700 border border-pink-200 text-[10px] font-bold">
                        BLACKSPOT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        SAFE
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAF7F2] px-6 py-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredRecords.length} of {dataset.length} corridors</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
