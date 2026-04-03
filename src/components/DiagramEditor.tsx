import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { io, Socket } from 'socket.io-client';
import { Database, Server, Globe, Shield, Cpu, HardDrive, Layout, MessageSquare } from 'lucide-react';
import { DatabaseNode, ServerNode, LoadBalancerNode, ClientNode, CacheNode, StorageNode, FrontendNode, QueueNode } from './CustomNodes';
import { motion, AnimatePresence } from 'motion/react';

const nodeTypes = {
  database: DatabaseNode,
  server: ServerNode,
  loadbalancer: LoadBalancerNode,
  client: ClientNode,
  cache: CacheNode,
  storage: StorageNode,
  frontend: FrontendNode,
  queue: QueueNode,
};

interface DiagramEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

const DiagramEditor = ({ initialNodes = [], initialEdges = [] }: DiagramEditorProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simConfig, setSimConfig] = useState({ rps: 2, latency: 500, capacity: 5 });
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set());
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [performanceMetrics, setPerformanceMetrics] = useState<Record<string, { throughput: number, avgLatency: number, load: number }>>({});

  useEffect(() => {
    // Initialize Socket.io
    socketRef.current = io();
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to real-time server');
      socket.emit('join-diagram', 'default-diagram');
    });

    socket.on('diagram-remote-update', ({ nodes: remoteNodes, edges: remoteEdges }) => {
      setNodes(remoteNodes);
      setEdges(remoteEdges);
    });

    socket.on('simulation-status', ({ running, config }) => {
      setIsSimulating(running);
      if (config) setSimConfig(config);
      if (!running) {
        setActiveEdges(new Set());
        setActiveNodes(new Set());
        setPerformanceMetrics({});
      }
    });

    socket.on('performance-metrics', (metrics) => {
      setPerformanceMetrics(metrics);
    });

    socket.on('request-flow', ({ edgeId, nodeId }) => {
      // Highlight edge
      setActiveEdges((prev) => {
        const next = new Set(prev);
        next.add(edgeId);
        return next;
      });

      // Highlight target node
      setActiveNodes((prev) => {
        const next = new Set(prev);
        next.add(nodeId);
        return next;
      });

      // Remove highlight after a short duration
      setTimeout(() => {
        setActiveEdges((prev) => {
          const next = new Set(prev);
          next.delete(edgeId);
          return next;
        });
        setActiveNodes((prev) => {
          const next = new Set(prev);
          next.delete(nodeId);
          return next;
        });
      }, 300);
    });

    return () => {
      socket.disconnect();
    };
  }, [setNodes, setEdges]);

  // Apply active styles to nodes and edges
  const styledNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isActive: activeNodes.has(node.id),
        metrics: performanceMetrics[node.id],
        isOverloaded: performanceMetrics[node.id]?.load > 0.8,
      },
    }));
  }, [nodes, activeNodes, performanceMetrics]);

  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const isActive = activeEdges.has(edge.id);
      return {
        ...edge,
        animated: isSimulating || isActive,
        className: isActive ? 'active-edge' : isSimulating ? 'simulating-edge' : '',
        style: {
          stroke: isActive ? '#38a9f8' : isSimulating ? '#94a3b8' : '#cbd5e1',
          strokeWidth: isActive ? 6 : isSimulating ? 3 : 2,
          transition: 'stroke 0.4s, stroke-width 0.4s',
        },
      };
    });
  }, [edges, activeEdges, isSimulating]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge(params, eds);
        socketRef.current?.emit('diagram-update', { diagramId: 'default-diagram', nodes, edges: newEdges });
        return newEdges;
      });
    },
    [nodes, setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `${type === 'server' ? 'API Server' : type.charAt(0).toUpperCase() + type.slice(1)}` },
      };

      setNodes((nds) => {
        const newNodes = nds.concat(newNode);
        socketRef.current?.emit('diagram-update', { diagramId: 'default-diagram', nodes: newNodes, edges });
        return newNodes;
      });
    },
    [reactFlowInstance, setNodes, edges]
  );

  // Sync local changes to remote
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      socketRef.current?.emit('diagram-update', { diagramId: 'default-diagram', nodes, edges });
    }
  }, [nodes, edges]);

  const onClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    socketRef.current?.emit('diagram-update', { diagramId: 'default-diagram', nodes: [], edges: [] });
  }, [setNodes, setEdges]);

  const toggleSimulation = () => {
    if (isSimulating) {
      socketRef.current?.emit('stop-simulation', 'default-diagram');
    } else {
      socketRef.current?.emit('start-simulation', {
        diagramId: 'default-diagram',
        nodes,
        edges,
        config: simConfig,
      });
    }
  };

  return (
    <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#cbd5e1" gap={20} variant="dots" />
        <Controls className="!bg-white !border-slate-200 !shadow-lg !rounded-xl overflow-hidden" />
        <MiniMap 
          nodeColor={(n) => {
            if (n.type === 'database') return '#0e8ce4';
            if (n.type === 'server') return '#10b981';
            if (n.type === 'loadbalancer') return '#f59e0b';
            return '#94a3b8';
          }}
          maskColor="rgba(241, 245, 249, 0.7)"
          className="!bg-white border border-slate-200 rounded-2xl shadow-xl"
        />
        
        <Panel position="top-left">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-5 rounded-3xl w-72"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-xl transition-all duration-500 ${isSimulating ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                <Cpu size={22} className={isSimulating ? 'animate-spin' : ''} />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-800 leading-tight">Simulation</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engine Control</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requests / Sec</label>
                  <span className="text-xs font-bold text-brand-600">{simConfig.rps} RPS</span>
                </div>
                <input 
                  type="range" min="1" max="10" step="1"
                  value={simConfig.rps}
                  onChange={(e) => setSimConfig(prev => ({ ...prev, rps: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Latency</label>
                  <span className="text-xs font-bold text-brand-600">{simConfig.latency}ms</span>
                </div>
                <input 
                  type="range" min="100" max="2000" step="100"
                  value={simConfig.latency}
                  onChange={(e) => setSimConfig(prev => ({ ...prev, latency: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>

              <button
                onClick={toggleSimulation}
                className={`w-full py-3.5 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-sm tracking-tight ${
                  isSimulating 
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200 shadow-xl' 
                  : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200 shadow-xl'
                }`}
              >
                {isSimulating ? 'Stop Simulation' : 'Launch Simulation'}
              </button>
            </div>
          </motion.div>
        </Panel>

        <AnimatePresence>
          {isSimulating && (
            <Panel position="bottom-left">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="glass-panel p-5 rounded-3xl w-80 max-h-[400px] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                      <Layout size={18} />
                    </div>
                    <h3 className="font-display font-bold text-slate-800">System Health</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
                  </div>
                </div>
                
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                  {nodes.map(node => {
                    const metrics = performanceMetrics[node.id];
                    if (!metrics) return null;
                    const isOverloaded = metrics.load > 0.8;
                    const isModerate = metrics.load >= 0.5;
                    
                    return (
                      <motion.div 
                        layout
                        key={node.id} 
                        className="metric-card"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{node.data.label}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                            isOverloaded ? 'bg-red-100 text-red-600' : 
                            isModerate ? 'bg-amber-100 text-amber-600' :
                            'bg-emerald-100 text-emerald-600'
                          }`}>
                            {Math.round(metrics.load * 100)}% Load
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-2">
                          <div>
                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Throughput</div>
                            <div className="text-xs font-bold text-slate-700">{metrics.throughput} <span className="text-[9px] text-slate-400 font-medium">req/s</span></div>
                          </div>
                          <div>
                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Latency</div>
                            <div className="text-xs font-bold text-slate-700">{Math.round(metrics.avgLatency)} <span className="text-[9px] text-slate-400 font-medium">ms</span></div>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, metrics.load * 100)}%` }}
                            className={`h-full transition-colors duration-500 ${
                              isOverloaded ? 'bg-red-500' : 
                              isModerate ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </Panel>
          )}
        </AnimatePresence>

        <Panel position="top-right" className="flex flex-col gap-3">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-3 rounded-2xl flex items-center gap-4"
          >
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Engine Status</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-500 animate-pulse shadow-emerald-200 shadow-lg' : 'bg-slate-400'}`} />
                <span className="text-xs font-bold text-slate-700">{isSimulating ? 'Simulating' : 'Ready'}</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <button
              onClick={onClear}
              className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
              title="Clear Canvas"
            >
              <HardDrive size={18} />
            </button>
          </motion.div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default DiagramEditor;
