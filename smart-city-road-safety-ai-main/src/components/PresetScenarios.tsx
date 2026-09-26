import React from 'react';
import { EngineUserInputs } from '../types/engine';
import { AlertTriangle, CloudRain, CloudFog, Navigation, ShieldCheck, Wind } from 'lucide-react';

interface PresetScenariosProps {
  onSelectPreset: (preset: Partial<EngineUserInputs>, title: string) => void;
}

export const PRESET_SCENARIOS = [
  {
    id: 'mumbai_pune_monsoon',
    title: 'Mumbai-Pune Expy (Heavy Monsoon Aquaplaning)',
    subtitle: 'Heavy Commercial Vehicle @ 85 km/h on wet Bhor Ghat downgrade',
    icon: CloudRain,
    gradient: 'from-sky-400 to-blue-500',
    accentBg: 'hover:border-sky-300 hover:bg-sky-50/60',
    data: {
      originLocation: 'Mumbai-Pune Expressway (Bhor Ghat Blackspot)',
      currentLocation: 'Mumbai-Pune Expressway (Bhor Ghat Blackspot)',
      destinationLocation: 'Samruddhi Mahamarg Safe Expressway Corridor',
      destination: 'Samruddhi Mahamarg Safe Expressway Corridor',
      targetSpeed: 85,
      speed: 85,
      vehicleType: 'Heavy Commercial Vehicle' as const,
      timeOfTravel: '23:00 hrs IST (Night Hazard: 22:00 - 05:00 IST)',
      hour: 23,
      dayOfWeek: 'Saturday',
      isPeakHour: false,
      weatherCondition: 'Heavy Monsoon' as const,
      visibilityMeters: 120,
      roadType: 'Curvature' as const,
      curvature: 'Hairpin / Ghat' as const,
    },
  },
  {
    id: 'yamuna_fog_blackspot',
    title: 'Yamuna Expressway (Winter Dense Fog Pileup Hazard)',
    subtitle: 'Passenger Car @ 110 km/h in 40m sight envelope during 03:00 IST night hours',
    icon: CloudFog,
    gradient: 'from-pink-400 to-rose-500',
    accentBg: 'hover:border-pink-300 hover:bg-pink-50/60',
    data: {
      originLocation: 'Yamuna Expressway Km 21-38 (Noida-Agra Blackspot)',
      currentLocation: 'Yamuna Expressway Km 21-38 (Noida-Agra Blackspot)',
      destinationLocation: 'Delhi-Meerut Expressway Link (Safe Bypass Corridor)',
      destination: 'Delhi-Meerut Expressway Link (Safe Bypass Corridor)',
      targetSpeed: 110,
      speed: 110,
      vehicleType: 'Car' as const,
      timeOfTravel: '03:00 hrs IST (Night Hazard: 22:00 - 05:00 IST)',
      hour: 3,
      dayOfWeek: 'Friday',
      isPeakHour: false,
      weatherCondition: 'Dense Fog' as const,
      visibilityMeters: 40,
      roadType: 'Highway' as const,
      curvature: 'Straight' as const,
    },
  },
  {
    id: 'bengaluru_ecity_peak',
    title: 'Bengaluru Electronic City Flyover (Morning Peak Surge)',
    subtitle: '2-Wheeler @ 75 km/h during 09:00 IST morning commute with sudden drizzle',
    icon: AlertTriangle,
    gradient: 'from-amber-400 to-orange-500',
    accentBg: 'hover:border-amber-300 hover:bg-amber-50/60',
    data: {
      originLocation: 'Electronic City Elevated Highway Blackspot',
      currentLocation: 'Electronic City Elevated Highway Blackspot',
      destinationLocation: 'Bengaluru-Mysuru Access Controlled Safe Expressway',
      destination: 'Bengaluru-Mysuru Access Controlled Safe Expressway',
      targetSpeed: 75,
      speed: 75,
      vehicleType: '2-Wheeler' as const,
      timeOfTravel: '09:00 hrs IST (Morning Peak: 08:00 - 11:00 IST)',
      hour: 9,
      dayOfWeek: 'Thursday',
      isPeakHour: true,
      weatherCondition: 'Rain' as const,
      visibilityMeters: 220,
      roadType: 'Highway' as const,
      curvature: 'Mild' as const,
    },
  },
  {
    id: 'jaipur_dust_storm',
    title: 'NH-48 Jaipur-Kotputli (Arid Desert Dust Storm)',
    subtitle: 'Auto-Rickshaw (3-Wheeler) @ 58 km/h on windborne sand drifts',
    icon: Wind,
    gradient: 'from-orange-400 to-amber-600',
    accentBg: 'hover:border-orange-300 hover:bg-orange-50/60',
    data: {
      originLocation: 'NH-48 Jaipur-Kotputli Desert Highway',
      currentLocation: 'NH-48 Jaipur-Kotputli Desert Highway',
      destinationLocation: 'Jaipur South Bypass Safe Arterial',
      destination: 'Jaipur South Bypass Safe Arterial',
      targetSpeed: 58,
      speed: 58,
      vehicleType: 'Auto-Rickshaw' as const,
      timeOfTravel: '16:00 hrs IST (Off-Peak Day Window)',
      hour: 16,
      dayOfWeek: 'Thursday',
      isPeakHour: false,
      weatherCondition: 'Dust Storm' as const,
      visibilityMeters: 120,
      roadType: 'Highway' as const,
      curvature: 'Straight' as const,
    },
  },
  {
    id: 'thoppur_ghat_bus',
    title: 'NH-44 Thoppur Ghat (Severe Downgrade Freight S-Curve)',
    subtitle: 'Transit Bus @ 65 km/h on hairpin curve with un-marked speed calming breakers',
    icon: Navigation,
    gradient: 'from-rose-400 to-pink-600',
    accentBg: 'hover:border-rose-300 hover:bg-rose-50/60',
    data: {
      originLocation: 'NH-44 Krishnagiri-Dharmapuri Thoppur Ghat Blackspot',
      currentLocation: 'NH-44 Krishnagiri-Dharmapuri Thoppur Ghat Blackspot',
      destinationLocation: 'Chennai Outer Ring Road (Safe Bypass Corridor)',
      destination: 'Chennai Outer Ring Road (Safe Bypass Corridor)',
      targetSpeed: 65,
      speed: 65,
      vehicleType: 'Bus' as const,
      timeOfTravel: '23:00 hrs IST (Night Hazard: 22:00 - 05:00 IST)',
      hour: 23,
      dayOfWeek: 'Sunday',
      isPeakHour: false,
      weatherCondition: 'Mist' as const,
      visibilityMeters: 150,
      roadType: 'Curvature' as const,
      curvature: 'Hairpin / Ghat' as const,
    },
  },
  {
    id: 'hyderabad_orr_safe',
    title: 'Hyderabad Outer Ring Road (Compliant Safe Corridor)',
    subtitle: 'Passenger Car @ 90 km/h on clear access-controlled 8-lane expressway',
    icon: ShieldCheck,
    gradient: 'from-emerald-400 to-teal-500',
    accentBg: 'hover:border-emerald-300 hover:bg-emerald-50/60',
    data: {
      originLocation: 'Nehru Outer Ring Road Hyderabad (Safe Green Corridor)',
      currentLocation: 'Nehru Outer Ring Road Hyderabad (Safe Green Corridor)',
      destinationLocation: 'PVNR Elevated Expressway & Mehdipatnam Junction',
      destination: 'PVNR Elevated Expressway & Mehdipatnam Junction',
      targetSpeed: 90,
      speed: 90,
      vehicleType: 'Car' as const,
      timeOfTravel: '14:00 hrs IST (Off-Peak Day Window)',
      hour: 14,
      dayOfWeek: 'Wednesday',
      isPeakHour: false,
      weatherCondition: 'Clear' as const,
      visibilityMeters: 3000,
      roadType: 'Highway' as const,
      curvature: 'Straight' as const,
    },
  },
];

export const PresetScenarios: React.FC<PresetScenariosProps> = ({ onSelectPreset }) => {
  return (
    <div className="bg-white/80 border border-sky-100 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xs transition-all">
      <div className="flex items-center justify-between mb-3 border-b border-sky-100/90 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
            Real Indian Corridors & Blackspot Scenarios
          </h2>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Pan-India Highways • Night Hazard • Monsoon • Fog • Dust Storm
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {PRESET_SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <button
              key={scenario.id}
              onClick={() => onSelectPreset(scenario.data, scenario.title)}
              className={`p-3 rounded-xl border border-slate-200/80 bg-[#FFFDF9] text-left transition-all duration-200 ${scenario.accentBg} hover:shadow-xs group cursor-pointer flex flex-col justify-between`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${scenario.gradient} text-white shrink-0 shadow-2xs group-hover:scale-105 transition`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-800 group-hover:text-sky-900 transition leading-snug">
                    {scenario.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {scenario.subtitle}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
