import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const events = [
  { id: 1, title: 'Typing Core v2.0 Release', date: 'Aug 22', color: '#f77f52' },
  { id: 2, title: 'Server Maintenance Window', date: 'Aug 24', color: '#f77f52' },
  { id: 3, title: 'New Multi-Language Module', date: 'Aug 26', color: '#f77f52' },
  { id: 4, title: 'Content Sync Job', date: 'Aug 28', color: '#eab308' },
];

const PlatformCalendar: React.FC = () => {
  return (
    <div className="bg-[#fff6f2] rounded-[20px] shadow-sm border border-[#fdece5] p-6 flex flex-col h-[500px]">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#ff8a5c] shadow-sm border border-[#fdece5]">
          <Calendar size={18} strokeWidth={2.5} />
        </div>
        <h3 className="text-[16px] font-bold text-gray-800 tracking-tight">Platform Calendar</h3>
      </div>
      
      <div className="bg-white rounded-[20px] p-4 shadow-sm mb-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <button className="p-1 text-gray-400 hover:bg-gray-50 rounded-md">
            <ChevronLeft size={16} />
          </button>
          <span className="font-semibold text-sm text-gray-800">August 2026</span>
          <button className="p-1 text-gray-400 hover:bg-gray-50 rounded-md">
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
          <span className="text-gray-400 font-medium">Su</span>
          <span className="text-gray-400 font-medium">Mo</span>
          <span className="text-gray-400 font-medium">Tu</span>
          <span className="text-gray-400 font-medium">We</span>
          <span className="text-gray-400 font-medium">Th</span>
          <span className="text-gray-400 font-medium">Fr</span>
          <span className="text-gray-400 font-medium">Sa</span>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {/* Previous month days */}
          <span className="text-gray-300 py-1.5">26</span>
          <span className="text-gray-300 py-1.5">27</span>
          <span className="text-gray-300 py-1.5">28</span>
          <span className="text-gray-300 py-1.5">29</span>
          <span className="text-gray-300 py-1.5">30</span>
          <span className="text-gray-300 py-1.5">31</span>
          
          {/* Current month days - simplified for demo */}
          <span className="font-medium text-gray-700 py-1.5">1</span>
          <span className="font-medium text-gray-700 py-1.5">2</span>
          <span className="font-medium text-gray-700 py-1.5">3</span>
          <div className="bg-[#e0f2fe] text-[#0284c7] rounded-full mx-auto w-7 h-7 flex items-center justify-center font-bold">4</div>
          <span className="font-medium text-gray-700 py-1.5">5</span>
          <span className="font-medium text-gray-700 py-1.5">6</span>
          <span className="font-medium text-gray-700 py-1.5">7</span>
          <span className="font-medium text-gray-700 py-1.5">8</span>
          <span className="font-medium text-gray-700 py-1.5">9</span>
          <span className="font-medium text-gray-700 py-1.5">10</span>
          <span className="font-medium text-gray-700 py-1.5">11</span>
          <span className="font-medium text-gray-700 py-1.5">12</span>
          <span className="font-medium text-gray-700 py-1.5">13</span>
          <span className="font-medium text-gray-700 py-1.5">14</span>
          <span className="font-medium text-gray-700 py-1.5">15</span>
          
          {/* Highlighted days from screenshot */}
          <span className="font-medium text-gray-700 py-1.5">16</span>
          <span className="font-medium text-gray-700 py-1.5">17</span>
          <span className="font-medium text-gray-700 py-1.5">18</span>
          <div className="bg-[#f77f52] text-white rounded-full mx-auto w-7 h-7 flex items-center justify-center font-bold">19</div>
          <span className="font-medium text-gray-700 py-1.5">20</span>
          <span className="font-medium text-gray-700 py-1.5">21</span>
          <div className="bg-[#fcdabf] text-[#d65e2b] rounded-full mx-auto w-7 h-7 flex items-center justify-center font-bold">22</div>
          <span className="font-medium text-gray-700 py-1.5">23</span>
          <div className="bg-[#fcdabf] text-[#d65e2b] rounded-full mx-auto w-7 h-7 flex items-center justify-center font-bold">24</div>
          <span className="font-medium text-gray-700 py-1.5">25</span>
          <div className="bg-[#fcdabf] text-[#d65e2b] rounded-full mx-auto w-7 h-7 flex items-center justify-center font-bold">26</div>
          <span className="font-medium text-gray-700 py-1.5">27</span>
          <div className="bg-[#fcdabf] text-[#d65e2b] rounded-full mx-auto w-7 h-7 flex items-center justify-center font-bold">28</div>
          <div className="bg-[#fcdabf] text-[#d65e2b] rounded-full mx-auto w-7 h-7 flex items-center justify-center font-bold">29</div>
          <span className="font-medium text-gray-700 py-1.5">30</span>
          <span className="font-medium text-gray-700 py-1.5">31</span>
          
          {/* Next month days */}
          <div className="bg-[#fee2e2] text-[#ef4444] rounded-full mx-auto w-7 h-7 flex items-center justify-center font-bold">1</div>
          <div className="bg-[#fee2e2] text-[#ef4444] rounded-full mx-auto w-7 h-7 flex items-center justify-center font-bold">2</div>
          <div className="bg-[#fee2e2] text-[#ef4444] rounded-full mx-auto w-7 h-7 flex items-center justify-center font-bold">3</div>
          <div className="bg-[#fee2e2] text-[#ef4444] rounded-full mx-auto w-7 h-7 flex items-center justify-center font-bold">4</div>
          <div className="bg-[#fee2e2] text-[#ef4444] rounded-full mx-auto w-7 h-7 flex items-center justify-center font-bold">5</div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <h4 className="text-[11px] font-bold text-gray-400 tracking-wider mb-3">UPCOMING</h4>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: event.color }}></div>
                <span className="text-sm font-semibold text-gray-800 leading-tight max-w-[160px]">{event.title}</span>
              </div>
              <span className="text-xs text-gray-500 font-medium">{event.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlatformCalendar;
