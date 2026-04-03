import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, Server, Globe, Shield, Cpu, HardDrive, Layout, MessageSquare } from 'lucide-react';

const NodeWrapper = ({ children, label, icon: Icon, selected, isActive, isOverloaded, load }: { children?: React.ReactNode, label: string, icon: any, selected?: boolean, isActive?: boolean, isOverloaded?: boolean, load?: number }) => {
  const getStatusColor = () => {
    if (load === undefined) return 'bg-brand-50 text-brand-600 border-slate-200';
    if (load >= 0.8) return 'bg-red-50 text-red-600 border-red-500 shadow-red-100';
    if (load >= 0.5) return 'bg-amber-50 text-amber-600 border-amber-500 shadow-amber-100';
    return 'bg-emerald-50 text-emerald-600 border-emerald-500 shadow-emerald-100';
  };

  const getIconBg = () => {
    if (load === undefined) return 'bg-brand-500 text-white';
    if (load >= 0.8) return 'bg-red-500 text-white';
    if (load >= 0.5) return 'bg-amber-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  return (
    <div className={`px-4 py-3 glass-panel rounded-2xl border-2 transition-all duration-300 min-w-[180px] ${
      load !== undefined ? `border-2 ${getStatusColor().split(' ')[2]} ${getStatusColor().split(' ')[3]} ${getStatusColor().split(' ')[4]}` :
      selected ? 'border-brand-500 ring-4 ring-brand-100' : 
      'border-slate-200 hover:border-slate-300'
    } ${isActive ? 'scale-105' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl transition-all duration-300 shadow-sm ${getIconBg()}`}>
            <Icon size={18} className={isActive || isOverloaded ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Node</div>
            <div className="text-sm font-bold text-slate-800 leading-none">{label}</div>
          </div>
        </div>
        {load !== undefined && (
          <div className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${
            load >= 0.8 ? 'bg-red-100 text-red-700' :
            load >= 0.5 ? 'bg-amber-100 text-amber-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>
            {Math.round(load * 100)}%
          </div>
        )}
      </div>
      
      {load !== undefined && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ease-out ${
                load >= 0.8 ? 'bg-red-500' :
                load >= 0.5 ? 'bg-amber-500' :
                'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, load * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
            <span>Load</span>
            <span className={load >= 0.8 ? 'text-red-500' : load >= 0.5 ? 'text-amber-500' : 'text-emerald-500'}>
              {load >= 0.8 ? 'Critical' : load >= 0.5 ? 'Moderate' : 'Stable'}
            </span>
          </div>
        </div>
      )}
      
      {children}
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-brand-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-brand-500 !border-2 !border-white" />
    </div>
  );
};

export const ServerNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper label={data.label || 'API Server'} icon={Server} selected={selected} isActive={data.isActive} isOverloaded={data.isOverloaded} load={data.metrics?.load} />
));

export const DatabaseNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper label={data.label || 'Database'} icon={Database} selected={selected} isActive={data.isActive} isOverloaded={data.isOverloaded} load={data.metrics?.load} />
));

export const LoadBalancerNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper label={data.label || 'Load Balancer'} icon={Shield} selected={selected} isActive={data.isActive} isOverloaded={data.isOverloaded} load={data.metrics?.load} />
));

export const ClientNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper label={data.label || 'Client'} icon={Globe} selected={selected} isActive={data.isActive} isOverloaded={data.isOverloaded} load={data.metrics?.load} />
));

export const CacheNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper label={data.label || 'Cache'} icon={Cpu} selected={selected} isActive={data.isActive} isOverloaded={data.isOverloaded} load={data.metrics?.load} />
));

export const StorageNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper label={data.label || 'Storage'} icon={HardDrive} selected={selected} isActive={data.isActive} isOverloaded={data.isOverloaded} load={data.metrics?.load} />
));

export const FrontendNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper label={data.label || 'Frontend'} icon={Layout} selected={selected} isActive={data.isActive} isOverloaded={data.isOverloaded} load={data.metrics?.load} />
));

export const QueueNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper label={data.label || 'Message Queue'} icon={MessageSquare} selected={selected} isActive={data.isActive} isOverloaded={data.isOverloaded} load={data.metrics?.load} />
));
