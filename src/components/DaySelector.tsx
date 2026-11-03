import React from 'react';
import { Calendar, Compass } from 'lucide-react';
import { TrekDaySegment } from '../services/multiDaySplitter';

interface DaySelectorProps {
  days: TrekDaySegment[];
  selectedDay: number | 'all';
  onSelectDay: (day: number | 'all') => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  days,
  selectedDay,
  onSelectDay,
}) => {
  if (days.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-x-auto max-w-full">
      <div className="flex items-center gap-1 px-2 py-1 text-slate-400 text-xs font-bold uppercase tracking-wider flex-shrink-0">
        <Calendar className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden sm:inline">Stages:</span>
      </div>

      <button
        onClick={() => onSelectDay('all')}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
          selectedDay === 'all'
            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        All Stages ({days.length} Days)
      </button>

      {days.map((day) => (
        <button
          key={day.dayNumber}
          onClick={() => onSelectDay(day.dayNumber)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
            selectedDay === day.dayNumber
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>Day {day.dayNumber}</span>
          <span className="text-[10px] opacity-75 font-mono font-normal">
            ({day.dateLabel})
          </span>
        </button>
      ))}
    </div>
  );
};

