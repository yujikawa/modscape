import { useStore } from '../../store/useStore';
import { Database, ChevronDown } from 'lucide-react';

const FileSelector = () => {
  const { availableFiles, currentModelSlug, setCurrentModel, isSidebarOpen, theme } = useStore();

  if (!isSidebarOpen || availableFiles.length <= 0) return null;

  const activeSlug = currentModelSlug || availableFiles[0]?.slug;

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Current Model
        </div>
      </div>
      <div className="relative group">
        <select
          value={activeSlug}
          onChange={(e) => setCurrentModel(e.target.value)}
          className={`w-full pl-9 pr-8 py-2 rounded-md text-sm appearance-none focus:outline-hidden focus:ring-1 focus:ring-blue-500/50 transition-all shadow-xs cursor-pointer ${
            theme === 'dark' 
              ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-750' 
              : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-slate-200/50'
          }`}
        >
          {availableFiles.map((file) => (
            <option key={file.slug} value={file.slug} className={theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-100'}>
              {file.name}
            </option>
          ))}
        </select>
        <Database size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
        <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
          theme === 'dark' ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600'
        }`} />
      </div>
    </div>
  );
};

export default FileSelector;
