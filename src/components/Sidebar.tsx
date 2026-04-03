import React from 'react';
import { Database, Server, Globe, Shield, Cpu, HardDrive, Layout, MessageSquare } from 'lucide-react';

import { motion } from 'motion/react';

const nodeTypes = [
  { type: 'server', label: 'API Server', icon: Server, color: 'text-blue-600', bg: 'bg-blue-50' },
  { type: 'database', label: 'Database', icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { type: 'loadbalancer', label: 'Load Balancer', icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
  { type: 'cache', label: 'Cache', icon: Cpu, color: 'text-purple-600', bg: 'bg-purple-50' },
  { type: 'client', label: 'Client', icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { type: 'frontend', label: 'Frontend', icon: Layout, color: 'text-rose-600', bg: 'bg-rose-50' },
  { type: 'storage', label: 'Storage', icon: HardDrive, color: 'text-slate-600', bg: 'bg-slate-50' },
  { type: 'queue', label: 'Message Queue', icon: MessageSquare, color: 'text-cyan-600', bg: 'bg-cyan-50' },
];

export const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-xl font-display font-bold text-slate-800 mb-2">Components</h2>
        <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-wider">
          Drag & drop to architect
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {nodeTypes.map((node, index) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            key={node.type}
            className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-brand-200 hover:shadow-xl hover:shadow-brand-50 cursor-grab transition-all duration-300 active:scale-95"
            onDragStart={(event) => onDragStart(event, node.type)}
            draggable
          >
            <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${node.bg} ${node.color}`}>
              <node.icon size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700 group-hover:text-brand-600 transition-colors">{node.label}</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">System Node</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-12 p-5 rounded-2xl bg-brand-50 border border-brand-100">
        <h4 className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-2">Pro Tip</h4>
        <p className="text-[11px] text-brand-600 leading-relaxed font-medium">
          Connect nodes to simulate data flow. Use the simulation panel to test system limits.
        </p>
      </div>
    </aside>
  );
};
