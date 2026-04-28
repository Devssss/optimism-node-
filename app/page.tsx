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
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);
  const [alerts, setAlerts] = useState<NodeAlert[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'custom'>('24h');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // Global Ping Test State
  const [pingTarget, setPingTarget] = useState<string>('node-01');
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ rtt: number; status: 'success' | 'fail' | null }>({ rtt: 0, status: null });

  // Per-Node Ping Test State
  const [perNodePings, setPerNodePings] = useState<Record<string, { rtt: number; status: 'pinging' | 'success' | 'fail' | null }>>({});

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

  const selectedNodeForModal = useMemo(() => 
    nodes.find(n => n.id === selectedNodeModalId),
  [selectedNodeModalId, nodes]);

  const triggerPing = async () => {
    setIsPinging(true);
    setPingResult({ rtt: 0, status: null });
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
    setPerNodePings(prev => ({ ...prev, [nodeId]: { rtt: 0, status: 'pinging' } }));
    await new Promise(resolve => setTimeout(resolve, 1200));
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode || targetNode.status === 'error') {
      setPerNodePings(prev => ({ ...prev, [nodeId]: { rtt: 0, status: 'fail' } }));
    } else {
      const baseLatency = parseInt(targetNode.latency);
      const rtt = baseLatency + Math.floor(Math.random() * 12);
      setPerNodePings(prev => ({ ...prev, [nodeId]: { rtt, status: 'success' } }));
    }
  };

  const calculateHealthScore = useCallback((node: any) => {
    let score = 0;
    if (node.status === 'synced') score += 40;
    else if (node.status === 'syncing') score += 20;
    const lat = parseInt(node.latency);
    if (!isNaN(lat)) {
      if (lat < 30) score += 20;
      else if (lat < 100) score += 15;
      else if (lat < 300) score += 8;
      else score += 4;
    }
    if (node.cpu < 50) score += 15;
    else if (node.cpu < 80) score += 10;
    else score += 1;
    const memPercent = (node.memory / 64) * 100;
    if (memPercent < 60) score += 15;
    else if (memPercent < 85) score += 10;
    else score += 1;
    if (node.networkIO < 500 && node.diskIO < 200) score += 10;
    else score += 2;
    return Math.min(100, score);
  }, []);

  const addAlert = useCallback((node: any, type: NodeAlert['type'], message: string) => {
    const alertId = `${node.id}-${type}-${Date.now()}`;
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

  const dismissAlert = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodeIds(prev => prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]);
  };

  useEffect(() => {
    const init = async () => {
      try { await sdk.actions.ready(); } catch (e) { console.error("SDK ready failed", e); }
      setIsReady(true);
    };
    init();

    const interval = setInterval(() => {
      setBlockHeight(prev => {
        const nextHeight = prev + 1;
        setNodes(prevNodes => prevNodes.map(node => {
          let newStatus = node.status;
          let newLatency = node.latency;
          const roll = Math.random();
          if (roll < 0.05) {
            newStatus = 'error';
            newLatency = 'timeout';
            addAlert(node, 'error', 'Critical: Node entered ERROR state');
          } else if (roll < 0.15) {
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
        }));
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        const newLog = { type: 'INFO', time: timeStr, msg: `Advancing L2 head to block #${nextHeight}` };
        setLogs(prev => [newLog, ...prev.slice(0, 3)]);
        return nextHeight;
      });
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, addAlert]);

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF0420] selection:text-white pb-20">
      {/* Alert Overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-xs pointer-events-none">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div layout initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} key={alert.id}
              className={`pointer-events-auto p-4 rounded-xl border flex gap-3 backdrop-blur-md ${alert.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-200' : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-200'}`}>
              <div className="mt-1">{alert.type === 'error' ? <AlertTriangle size={18} className="text-red-500" /> : <Info size={18} className="text-yellow-500" />}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-[10px] uppercase font-black tracking-widest leading-none mb-1">{alert.nodeName}</h4>
                  <button onClick={() => dismissAlert(alert.id)} className="text-zinc-500 hover:text-white"><X size={14} /></button>
                </div>
                <p className="text-xs font-medium">{alert.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-[1024px] mx-auto p-4 md:p-6 flex flex-col gap-6">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF0420] rounded-full flex items-center justify-center font-bold text-xl text-white shadow-[0_0_20px_rgba(255,4,32,0.3)]">OP</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">OP-STACK NODE <span className="text-zinc-500 font-mono text-sm ml-2 font-medium">v1.7.4-mainnet</span></h1>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-zinc-400 uppercase tracking-widest font-bold">Status: Active Monitor</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-lg p-1.5">
              <Clock size={12} className="text-zinc-500" />
              <select value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))} className="bg-transparent text-[10px] font-black uppercase text-zinc-400 focus:outline-none cursor-pointer">
                <option value={5000}>5s</option>
                <option value={15000}>15s</option>
                <option value={30000}>30s</option>
                <option value={60000}>1m</option>
                <option value={300000}>5m</option>
              </select>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 uppercase tracking-tighter text-[10px] font-black">Cluster Health</p>
              <p className="font-mono font-bold text-sm">{nodes.filter(n => n.status === 'synced').length}/{nodes.length} OK</p>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-2 bento-card p-6 rounded-xl relative overflow-hidden group">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1 font-black">Current Block Height</p>
            <h2 className="text-4xl md:text-5xl font-black font-mono tracking-tighter">{blockHeight.toLocaleString()}</h2>
            <div className="mt-4 w-full bg-zinc-800/50 h-2 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="bg-[#FF0420] h-full" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bento-card p-5 rounded-xl flex flex-col justify-between">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">Peers</p>
            <h3 className="text-4xl font-bold font-mono">42</h3>
          </motion.div>

          {/* Node Diagnostics Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-1 bento-card p-5 rounded-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">Diagnostics</p>
              <Zap size={14} className="text-[#FF0420]" />
            </div>
            <select value={pingTarget} onChange={(e) => setPingTarget(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[10px] font-black text-white focus:outline-none focus:border-[#FF0420] appearance-none cursor-pointer mb-3">
              {nodes.map(node => <option key={node.id} value={node.id}>{node.name}</option>)}
            </select>
            <button onClick={triggerPing} disabled={isPinging} className="w-full py-2 bg-[#FF0420] disabled:bg-zinc-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
              {isPinging ? 'DIAGNOSING...' : 'PING TEST'}
            </button>
            {pingResult.status && (
              <div className="mt-3 p-2 bg-zinc-900 rounded border border-zinc-800">
                <p className="text-[8px] text-zinc-500 uppercase">RTT: <span className="text-white font-mono">{pingResult.rtt}ms</span></p>
              </div>
            )}
          </motion.div>

          {/* Nodes List */}
          <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {nodes.map(node => (
              <div key={node.id} className="bento-card p-4 rounded-xl border border-zinc-800 hover:border-[#FF0420] group">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span onClick={() => setSelectedNodeModalId(node.id)} className="text-xs font-black cursor-pointer hover:text-[#FF0420] transition-colors">{node.name}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF0420]" style={{ width: `${calculateHealthScore(node)}%` }} />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => triggerPerNodePing(node.id)} className="text-zinc-500 hover:text-white"><Zap size={12} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5"><Cpu size={10} className="text-zinc-500"/><span className="font-mono">{node.cpu.toFixed(1)}%</span></div>
                  <div className="flex items-center gap-1.5"><Globe size={10} className="text-zinc-500"/><span className="font-mono">{node.latency}</span></div>
                </div>
                {perNodePings[node.id] && (
                  <div className="mt-2 pt-2 border-t border-zinc-800 flex justify-between items-center text-[8px] font-black uppercase">
                    <span className="text-zinc-500">Last Ping</span>
                    <span className="text-green-500">{perNodePings[node.id].status === 'pinging' ? '...' : `${perNodePings[node.id].rtt}ms`}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedNodeModalId && selectedNodeForModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedNodeModalId(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase">{selectedNodeForModal.name}</h2>
                <button onClick={() => setSelectedNodeModalId(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
                  <p className="text-[10px] text-zinc-500 uppercase mb-1">CPU Load</p>
                  <p className="text-2xl font-black font-mono">{selectedNodeForModal.cpu.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
                  <p className="text-[10px] text-zinc-500 uppercase mb-1">Memory</p>
                  <p className="text-2xl font-black font-mono">{selectedNodeForModal.memory}GB</p>
                </div>
              </div>
              <button onClick={() => setSelectedNodeModalId(null)} className="w-full mt-6 py-3 bg-[#FF0420] text-white rounded-lg text-[10px] font-black uppercase">Close Session</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
