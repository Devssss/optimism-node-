'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Globe, 
  Layers, 
  Zap, 
  CheckCircle2, 
  Clock, 
  HardDrive, 
  Terminal as TerminalIcon,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  AlertTriangle,
  X,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface NodeAlert {
  id: string;
  nodeId: string;
  nodeName: string;
  type: 'error' | 'warning' | 'high-latency';
  message: string;
  timestamp: string;
}

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [blockHeight, setBlockHeight] = useState(114290512);
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>(['node-01']);
  const [selectedNodeModalId, setSelectedNodeModalId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<NodeAlert[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'custom'>('24h');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // Global Ping Test State
  const [pingTarget, setPingTarget] = useState<string>('node-01');
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ rtt: number; status: 'success' | 'fail' | null }>({ rtt: 0, status: null });

  // Per-Node Ping Test State
  const [perNodePings, setPerNodePings] = useState<Record<string, { rtt: number; status: 'pinging' | 'success' | 'fail' | null }>>({});

  const selectedNodeForModal = useMemo(() => 
    nodes.find(n => n.id === selectedNodeModalId),
  [selectedNodeModalId, nodes]);

  const triggerPing = async () => {
    setIsPinging(true);
    setPingResult({ rtt: 0, status: null });
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const targetNode = nodes.find(n => n.id === pingTarget);
    if (!targetNode || targetNode.status === 'error') {
      setPingResult({ rtt: 0, status: 'fail' });
    } else {
      const baseLatency = parseInt(targetNode.latency);
      const rtt = baseLatency + Math.floor(Math.random() * 15);
      setPingResult({ rtt, status: 'success' });
    }
    setIsPinging(false);
  };

  const triggerPerNodePing = async (nodeId: string) => {
    setPerNodePings(prev => ({ 
      ...prev, 
      [nodeId]: { rtt: 0, status: 'pinging' } 
    }));
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode || targetNode.status === 'error') {
      setPerNodePings(prev => ({ 
        ...prev, 
        [nodeId]: { rtt: 0, status: 'fail' } 
      }));
    } else {
      const baseLatency = parseInt(targetNode.latency);
      const rtt = baseLatency + Math.floor(Math.random() * 12);
      setPerNodePings(prev => ({ 
        ...prev, 
        [nodeId]: { rtt, status: 'success' } 
      }));
    }
  };

  const calculateHealthScore = useCallback((node: any) => {
    let score = 0;
    
    // Status Weight: 40%
    if (node.status === 'synced') score += 40;
    else if (node.status === 'syncing') score += 20;
    
    // Latency Weight: 20%
    const lat = parseInt(node.latency);
    if (!isNaN(lat)) {
      if (lat < 30) score += 20;
      else if (lat < 100) score += 15;
      else if (lat < 300) score += 8;
      else score += 4;
    }

    // CPU Weight: 15%
    if (node.cpu < 50) score += 15;
    else if (node.cpu < 80) score += 10;
    else if (node.cpu < 95) score += 4;
    else score += 1;

    // Memory Weight: 15% (assuming 64GB max)
    const memPercent = (node.memory / 64) * 100;
    if (memPercent < 60) score += 15;
    else if (memPercent < 85) score += 10;
    else if (memPercent < 95) score += 4;
    else score += 1;

    // Load/IO Weight: 10%
    if (node.networkIO < 500 && node.diskIO < 200) score += 10;
    else if (node.networkIO < 1000 && node.diskIO < 400) score += 6;
    else score += 2;

    return Math.min(100, score);
  }, []);

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodeIds(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId) 
        : [...prev, nodeId]
    );
  };
  
  const historyData = useMemo(() => {
    const baseData = [
      { time: '08:00', cpu: 15, mem: 12, disk: 40, net: 110 },
      { time: '09:00', cpu: 25, mem: 14, disk: 42, net: 220 },
      { time: '10:00', cpu: 45, mem: 18, disk: 45, net: 450 },
      { time: '11:00', cpu: 30, mem: 20, disk: 48, net: 310 },
      { time: '12:00', cpu: 24, mem: 22, disk: 50, net: 280 },
      { time: '13:00', cpu: 60, mem: 25, disk: 55, net: 850 },
      { time: '14:00', cpu: 35, mem: 26, disk: 58, net: 420 },
    ];

    if (timeRange === '7d') {
      return baseData.map((d, i) => ({ ...d, time: `Day ${i + 1}`, cpu: d.cpu + Math.random() * 10 }));
    }
    if (timeRange === '30d') {
      return baseData.map((d, i) => ({ ...d, time: `Week ${Math.floor(i / 2) + 1}`, cpu: d.cpu + Math.random() * 20 }));
    }
    if (timeRange === 'custom') {
      return baseData.map((d, i) => ({ ...d, time: `C-${i}`, cpu: d.cpu + Math.random() * 5 }));
    }
    return baseData;
  }, [timeRange]);

  const [nodes, setNodes] = useState([
    { 
      id: 'node-01', 
      name: 'Optimism Mainnet 01', 
      status: 'synced', 
      latency: '12ms',
      cpu: 24,
      memory: 18.4,
      networkIO: 125,
      diskIO: 45
    },
    { 
      id: 'node-02', 
      name: 'Optimism Mainnet 02', 
      status: 'synced', 
      latency: '45ms',
      cpu: 58,
      memory: 32.1,
      networkIO: 850,
      diskIO: 120
    },
    { 
      id: 'node-03', 
      name: 'Optimism Backup', 
      status: 'synced', 
      latency: '34ms',
      cpu: 10,
      memory: 5.1,
      networkIO: 40,
      diskIO: 12
    }
  ]);

  const [logs, setLogs] = useState([
    { type: 'INFO', time: '14:04:22', msg: 'Advancing L2 head to block #114290512' },
    { type: 'INFO', time: '14:04:20', msg: 'Derivation layer: processing L1 origin #18492021' },
    { type: 'INFO', time: '14:04:18', msg: 'P2P handshake successful with peer 0x82...a1' },
    { type: 'INFO', time: '14:04:16', msg: 'Synced L1 payload metadata for sequencer' }
  ]);

  const addAlert = useCallback((node: any, type: NodeAlert['type'], message: string) => {
    const alertId = `${node.id}-${type}-${Date.now()}`;
    // Only add if not already alerting for this specific reason
    setAlerts(prev => {
      if (prev.some(a => a.nodeId === node.id && a.type === type)) return prev;
      return [{
        id: alertId,
        nodeId: node.id,
        nodeName: node.name,
        type,
        message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }, ...prev].slice(0, 5);
    });
  }, []);

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
      } catch (e) {
        console.error("SDK ready failed", e);
      }
      setIsReady(true);
    };
    init();

    const interval = setInterval(() => {
      setBlockHeight(prev => prev + 1);
      
      // Simulate real-time variation and anomalies
      setNodes(prevNodes => {
        return prevNodes.map(node => {
          let newStatus = node.status;
          let newLatency = node.latency;
          
          // Random anomaly simulation (5% chance)
          const roll = Math.random();
          if (roll < 0.05) {
            newStatus = 'error';
            newLatency = 'timeout';
            addAlert(node, 'error', 'Critical: Node entered ERROR state');
          } else if (roll < 0.15 && roll >= 0.05) {
            newStatus = 'syncing';
            newLatency = `${Math.floor(Math.random() * 500 + 100)}ms`;
            addAlert(node, 'high-latency', `High Latency Detected: ${newLatency}`);
          } else {
            newStatus = 'synced';
            newLatency = `${Math.floor(Math.random() * 20 + 10)}ms`;
          }

          return {
            ...node,
            status: newStatus,
            latency: newLatency,
            cpu: Math.min(100, Math.max(0, node.cpu + (Math.random() * 10 - 5))),
            networkIO: Math.max(0, node.networkIO + (Math.random() * 100 - 50))
          };
        });
      });

      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const newLog = { 
        type: 'INFO', 
        time: timeStr, 
        msg: `Advancing L2 head to block #${blockHeight + 1}` 
      };
      setLogs(prev => [newLog, ...prev.slice(0, 3)]);
    }, 5000);

    return () => clearInterval(interval);
  }, [blockHeight, addAlert]);

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF0420] selection:text-white">
      {/* Alert Overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-xs pointer-events-none">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              key={alert.id}
              className={`pointer-events-auto p-4 rounded-xl border flex gap-3 shadow-2xl backdrop-blur-md ${
                alert.type === 'error' 
                  ? 'bg-red-500/10 border-red-500/50 text-red-200' 
                  : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-200'
              }`}
            >
              <div className="mt-1">
                {alert.type === 'error' ? <AlertTriangle size={18} className="text-red-500" /> : <Info size={18} className="text-yellow-500" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-[10px] uppercase font-black tracking-widest leading-none mb-1">{alert.nodeName}</h4>
                  <button onClick={() => dismissAlert(alert.id)} className="text-zinc-500 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs font-medium">{alert.message}</p>
                <span className="text-[8px] opacity-60 font-mono mt-1 block">{alert.timestamp}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-[1024px] mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF0420] rounded-full flex items-center justify-center font-bold text-xl text-white shadow-[0_0_20px_rgba(255,4,32,0.3)]">
              OP
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                OP-STACK NODE <span className="text-zinc-500 font-mono text-sm ml-2 font-medium">v1.7.4-mainnet</span>
              </h1>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-zinc-400 uppercase tracking-widest font-bold">Status: Active Monitor</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="relative group">
              <Bell size={18} className={`${alerts.length > 0 ? 'text-[#FF0420] animate-bounce' : 'text-zinc-500'}`} />
              {alerts.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#050505]">
                  {alerts.length}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-zinc-500 uppercase tracking-tighter text-[10px] font-black">Cluster Health</p>
              <p className="font-mono font-bold text-sm">{nodes.filter(n => n.status === 'synced').length}/{nodes.length} OK</p>
            </div>
          </div>
        </header>

        {/* Main Bento Grid */}
        <main className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4">
          
          {/* Main Block Status - Large Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 md:row-span-2 bento-card p-6 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF0420]/10 to-transparent pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1 font-black">Current Block Height</p>
                <h2 className="text-4xl md:text-6xl font-black font-mono tracking-tighter">
                  {blockHeight.toLocaleString()}
                </h2>
              </div>
              <div className="p-2 rounded bg-zinc-800/50 text-[10px] font-mono text-zinc-300 border border-zinc-700 font-bold">
                0x4d2a...8b1e
              </div>
            </div>

            <div className="space-y-4 relative z-10 pt-8">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-500 uppercase tracking-widest font-bold">Syncing Progress</span>
                <span className="text-[#FF0420] font-black">100%</span>
              </div>
              <div className="w-full bg-zinc-800/50 h-3 rounded-full overflow-hidden border border-zinc-700">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  className="bg-[#FF0420] h-full shadow-[0_0_10px_rgba(255,4,32,0.5)]" 
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-800">
                <div>
                  <p className="text-zinc-500 mb-1 text-[10px] uppercase font-black">Avg Block</p>
                  <p className="text-lg md:text-xl font-bold font-mono">2.0s</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1 text-[10px] uppercase font-black">Base Fee</p>
                  <p className="text-lg md:text-xl font-bold font-mono">0.01 <span className="text-[10px] font-bold opacity-60">GWEI</span></p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1 text-[10px] uppercase font-black">L1 Origin</p>
                  <p className="text-lg md:text-xl font-bold font-mono text-zinc-200">18,492,021</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Peer Connections */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bento-card p-5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 flex flex-col justify-between shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">Peers</p>
              <Globe size={14} className="text-zinc-600" />
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl md:text-5xl font-bold font-mono">42</h3>
              <div className="flex gap-1 h-12 items-end pb-1 text-red-500">
                <div className="w-1 bg-zinc-700 h-4 rounded-t-sm"></div>
                <div className="w-1 bg-zinc-700 h-6 rounded-t-sm"></div>
                <div className="w-1 bg-[#FF0420] h-10 rounded-t-sm shadow-[0_0_8px_rgba(255,4,32,0.4)]"></div>
                <div className="w-1 bg-[#FF0420] h-8 rounded-t-sm shadow-[0_0_8px_rgba(255,4,32,0.4)]"></div>
                <div className="w-1 bg-[#FF0420] h-12 rounded-t-sm shadow-[0_0_8px_rgba(255,4,32,0.4)]"></div>
              </div>
            </div>
          </motion.div>

          {/* L2 Gas Price */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bento-card p-5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">L2 Gas</p>
              <Zap size={14} className="text-zinc-600" />
            </div>
            <div>
              <h3 className="text-3xl md:text-4xl font-bold font-mono text-[#FF0420] shadow-text">0.0012</h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase mt-1 flex items-center gap-1">
                <ArrowDownRight size={10} className="text-green-500" /> -12% vs last hour
              </p>
            </div>
          </motion.div>

          {/* Recent Events / Logs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 bento-card p-5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <TerminalIcon size={14} className="text-zinc-600" />
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">Recent Events</p>
              </div>
              <span className="text-[8px] text-zinc-600 font-mono animate-pulse font-black">LIVE LOG STREAM</span>
            </div>
            <div className="space-y-2 font-mono text-[10px] overflow-hidden">
              <AnimatePresence mode="popLayout">
                {logs.map((log, i) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    key={`${log.time}-${i}`}
                    className="flex gap-4 text-zinc-400 border-b border-zinc-800 pb-2 last:border-0"
                  >
                    <span className={`${log.type === 'WARN' ? 'text-yellow-400' : 'text-blue-400'} w-10 font-black`}>
                      {log.type}
                    </span>
                    <span className="text-zinc-600 whitespace-nowrap">[{log.time}]</span>
                    <span className="truncate">{log.msg}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Cluster Status Side Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-1 bento-card p-5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">Node Cluster</p>
              <Activity size={14} className="text-zinc-600" />
            </div>
            <div className="space-y-3">
              {nodes.map((node) => (
                <div 
                  key={node.id} 
                  className={`flex flex-col gap-2 p-2 rounded-lg transition-colors border ${
                    expandedNodeIds.includes(node.id) ? 'bg-[#1a1a1a] border-zinc-700 shadow-inner' : 'hover:bg-[#161616] border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        node.status === 'synced' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 
                        node.status === 'syncing' ? 'bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 
                        'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                      }`} />
                      <span 
                        onClick={() => setSelectedNodeModalId(node.id)}
                        className="text-[10px] font-black truncate max-w-[80px] hover:text-[#FF0420] cursor-pointer transition-colors"
                      >
                        {node.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              calculateHealthScore(node) > 80 ? 'bg-green-500' : 
                              calculateHealthScore(node) > 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${calculateHealthScore(node)}%` }}
                          />
                        </div>
                        <span className={`text-[7px] font-mono font-black ${
                          calculateHealthScore(node) > 80 ? 'text-green-500' : 
                          calculateHealthScore(node) > 50 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {calculateHealthScore(node)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase ${
                        node.status === 'synced' ? 'bg-green-500/10 text-green-500' : 
                        node.status === 'syncing' ? 'bg-yellow-500/10 text-yellow-500' : 
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {node.status}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerPerNodePing(node.id);
                        }}
                        disabled={perNodePings[node.id]?.status === 'pinging'}
                        className={`p-1 rounded hover:bg-zinc-800 transition-colors flex items-center gap-1 group/ping ${
                          perNodePings[node.id]?.status === 'pinging' ? 'opacity-50 cursor-not-allowed' : 'text-zinc-500 hover:text-[#FF0420]'
                        }`}
                        title="Quick Ping Test"
                      >
                        <Zap size={10} className={perNodePings[node.id]?.status === 'pinging' ? 'animate-pulse' : ''} />
                        {perNodePings[node.id]?.status === 'pinging' ? (
                          <span className="text-[7px] font-black uppercase">...</span>
                        ) : (
                          <span className="text-[7px] font-black uppercase group-hover/ping:inline hidden">Ping</span>
                        )}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNodeExpansion(node.id);
                        }}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                      >
                        {expandedNodeIds.includes(node.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Per-Node Ping Result */}
                  <AnimatePresence>
                    {perNodePings[node.id] && perNodePings[node.id].status !== 'pinging' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={`mx-2 p-1.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between mt-1 ${
                          perNodePings[node.id].status === 'success' ? 'border-green-500/20' : 'border-red-500/20'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <Clock size={8} className="text-zinc-500" />
                            <span className="text-[7px] font-black uppercase text-zinc-500">RTT</span>
                          </div>
                          <span className={`text-[8px] font-mono font-bold ${
                            perNodePings[node.id].status === 'success' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {perNodePings[node.id].status === 'success' ? `${perNodePings[node.id].rtt}ms` : 'FAILED'}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence>
                    {expandedNodeIds.includes(node.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 gap-3 pt-3 border-t border-zinc-800 mt-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-[7px] text-zinc-500 uppercase font-black">CPU Usage</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${node.cpu}%` }}
                                  className="h-full bg-blue-500"
                                />
                              </div>
                              <span className="text-[8px] font-mono whitespace-nowrap">{Math.round(node.cpu)}%</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <span className="text-[7px] text-zinc-500 uppercase font-black">Memory Allocation</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min((node.memory/64)*100, 100)}%` }}
                                  className="h-full bg-purple-500"
                                />
                              </div>
                              <span className="text-[8px] font-mono whitespace-nowrap">{node.memory.toFixed(1)} GB</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-[7px] text-zinc-500 uppercase font-black">Network I/O</span>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((node.networkIO/1000)*100, 100)}%` }}
                                    className="h-full bg-green-500"
                                  />
                                </div>
                                <span className="text-[8px] font-mono whitespace-nowrap">{Math.round(node.networkIO)} MB/s</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[7px] text-zinc-500 uppercase font-black">Disk I/O</span>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((node.diskIO/500)*100, 100)}%` }}
                                    className="h-full bg-amber-500"
                                  />
                                </div>
                                <span className="text-[8px] font-mono whitespace-nowrap">{node.diskIO} MB/s</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 px-2 mt-1">
                    <span>Latency</span>
                    <span className={node.status === 'error' ? 'text-red-500 font-bold' : ''}>{node.latency}</span>
                  </div>
                </div>
              ))}
            </div>
            {alerts.length > 0 && expandedNodeIds.length === 0 && (
               <div className="mt-auto pt-4 text-center">
                  <p className="text-[8px] text-[#FF0420] animate-pulse font-black uppercase">Attention Required ({alerts.length})</p>
               </div>
            )}
          </motion.div>

          {/* Node Diagnostics / Ping Test */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="md:col-span-1 bento-card p-5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">Diagnostics</p>
              <Zap size={14} className="text-[#FF0420]" />
            </div>
            
            <div className="flex flex-col gap-4 flex-1">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Target Node</label>
                <select 
                  value={pingTarget}
                  onChange={(e) => setPingTarget(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[10px] font-black text-white focus:outline-none focus:border-[#FF0420] appearance-none cursor-pointer"
                >
                  {nodes.map(node => (
                    <option key={node.id} value={node.id}>{node.name}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={triggerPing}
                disabled={isPinging}
                className="w-full py-3 bg-[#FF0420] disabled:bg-zinc-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,4,32,0.2)] disabled:shadow-none"
              >
                {isPinging ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Zap size={12} />
                    </motion.div>
                    DIAGNOSING...
                  </>
                ) : (
                  <>
                    <Activity size={12} />
                    INITIATE PING TEST
                  </>
                )}
              </button>

              <div className="mt-auto space-y-3">
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Resulting RTT</span>
                    <span className={`text-[8px] font-black uppercase ${
                      pingResult.status === 'success' ? 'text-green-500' : 
                      pingResult.status === 'fail' ? 'text-red-500' : 'text-zinc-600'
                    }`}>
                      {pingResult.status || 'NO DATA'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-mono font-black ${
                      pingResult.rtt > 50 ? 'text-yellow-500' : 'text-white'
                    }`}>
                      {pingResult.rtt || '--'}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-600">ms</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-2 text-[8px] text-zinc-600 font-bold uppercase tracking-tighter italic">
                  <Info size={10} />
                  <span>Diagnostics bypass standard cache layer</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Historical Trends */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="md:col-span-3 bento-card p-5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-zinc-600" />
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">Cluster Health History</p>
              </div>
              <div className="flex flex-col md:flex-row items-end gap-2">
                {timeRange === 'custom' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2 items-center mr-2"
                  >
                    <input 
                      type="date" 
                      className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[8px] font-mono text-zinc-400 focus:outline-none focus:border-[#FF0420]" 
                      onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                    <span className="text-[8px] text-zinc-600 font-bold tracking-tighter">TO</span>
                    <input 
                      type="date" 
                      className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[8px] font-mono text-zinc-400 focus:outline-none focus:border-[#FF0420]" 
                      onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </motion.div>
                )}
                <div className="flex items-center gap-4">
                  <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                    {(['24h', '7d', '30d', 'custom'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase transition-all ${
                          timeRange === range 
                            ? 'bg-[#FF0420] text-white' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                  <div className="h-4 w-[1px] bg-zinc-800 mx-1" />
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-[8px] font-mono text-zinc-500 font-black uppercase">CPU</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[8px] font-mono text-zinc-500 font-black uppercase">NET</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-[140px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#555555" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#555555" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111111', 
                      border: '1px solid #333333',
                      fontSize: '10px',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    stroke="#22c55e" 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </main>
        
        <footer className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 px-2">
           <div className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-[#222222] rounded-full">
              <CheckCircle2 size={12} className="text-green-500" />
              <span className="text-[10px] text-zinc-400 font-black uppercase tracking-tight">Mainnet Cluster Verified</span>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Database size={12} className="text-zinc-600" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">1.2 TB STORAGE ACTIVE</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu size={12} className="text-zinc-600" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">NODE VERSION 1.7.4-STABLE</span>
              </div>
           </div>
        </footer>
      </div>

      {/* Node Detail Modal */}
      <AnimatePresence>
        {selectedNodeModalId && selectedNodeForModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNodeModalId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedNodeForModal.status === 'synced' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 
                      selectedNodeForModal.status === 'syncing' ? 'bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.6)]' : 
                      'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                    }`} />
                    <div>
                      <h2 className="text-xl font-black uppercase text-white">{selectedNodeForModal.name}</h2>
                      <p className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                        {selectedNodeForModal.id} • STATUS: <span className="text-[#FF0420]">{selectedNodeForModal.status.toUpperCase()}</span> • HEALTH: <span className={
                          calculateHealthScore(selectedNodeForModal) > 80 ? 'text-green-500' : 
                          calculateHealthScore(selectedNodeForModal) > 50 ? 'text-yellow-500' : 'text-red-500'
                        }>{calculateHealthScore(selectedNodeForModal)}%</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedNodeModalId(null)}
                    className="p-2 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'CPU LOAD', value: `${Math.round(selectedNodeForModal.cpu)}%`, icon: Cpu, color: 'text-blue-500' },
                    { label: 'MEMORY', value: `${selectedNodeForModal.memory.toFixed(1)} GB`, icon: Database, color: 'text-purple-500' },
                    { label: 'LATENCY', value: selectedNodeForModal.latency, icon: Activity, color: 'text-yellow-500' },
                    { label: 'NETWORK I/O', value: `${Math.round(selectedNodeForModal.networkIO)} MB/s`, icon: Globe, color: 'text-green-500' },
                    { label: 'DISK I/O', value: `${selectedNodeForModal.diskIO} MB/s`, icon: HardDrive, color: 'text-amber-500' },
                    { label: 'BLOCK HT', value: blockHeight.toLocaleString(), icon: Layers, color: 'text-zinc-500' },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <stat.icon size={12} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{stat.label}</span>
                      </div>
                      <p className={`text-xl font-mono font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                  <div className="flex items-center justify-between mb-3 text-zinc-500">
                     <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
                       <Zap size={12} />
                       <span>Real-time Health Spectrum</span>
                     </div>
                     <span className="text-[8px] font-mono">STABLE: 99.8%</span>
                  </div>
                  <div className="flex gap-1 h-8">
                     {Array.from({ length: 40 }).map((_, i) => (
                       <div 
                        key={i} 
                        className={`flex-1 rounded-sm ${
                          i > 35 ? 'bg-red-500/20' : 
                          i > 30 ? 'bg-orange-500/40' : 
                          'bg-green-500/40'
                        }`} 
                       />
                     ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setSelectedNodeModalId(null)}
                    className="px-6 py-2 bg-[#FF0420] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#D7031B] transition-all shadow-[0_0_15px_rgba(255,4,32,0.3)]"
                  >
                    Close Session
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
