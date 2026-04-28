'use client';

import { useEffect, useState } from 'react';
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
  Terminal as TerminalIcon 
} from 'lucide-react';

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [blockHeight, setBlockHeight] = useState(114290512);
  const [nodes, setNodes] = useState([
    { id: 'node-01', name: 'Optimism Mainnet 01', status: 'synced', latency: '12ms' },
    { id: 'node-02', name: 'Optimism Mainnet 02', status: 'syncing', latency: '45ms' },
    { id: 'node-03', name: 'Optimism Backup', status: 'error', latency: 'timeout' }
  ]);
  const [logs, setLogs] = useState([
    { type: 'INFO', time: '12:04:22', msg: 'Advancing L2 head to block #114290512' },
    { type: 'INFO', time: '12:04:20', msg: 'Derivation layer: processing L1 origin #18492021' },
    { type: 'WARN', time: '12:04:18', msg: 'Slow P2P response from peer 0x82...a1 (240ms)' },
    { type: 'INFO', time: '12:04:16', msg: 'Synced L1 payload metadata for sequencer' }
  ]);

  useEffect(() => {
    const init = async () => {
      await sdk.actions.ready();
      setIsReady(true);
    };
    init();

    const interval = setInterval(() => {
      setBlockHeight(prev => prev + 1);
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const newLog = { 
        type: 'INFO', 
        time: timeStr, 
        msg: `Advancing L2 head to block #${blockHeight + 1}` 
      };
      setLogs(prev => [newLog, ...prev.slice(0, 3)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [blockHeight]);

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF0420] selection:text-white">
      <div className="max-w-[1024px] mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF0420] rounded-full flex items-center justify-center font-bold text-xl text-white shadow-[0_0_20px_rgba(255,4,32,0.3)]">
              OP
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                OP-STACK NODE <span className="text-zinc-500 font-mono text-sm ml-2">v1.7.4-mainnet</span>
              </h1>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-zinc-400 uppercase tracking-widest font-medium">Status: Fully Synced</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-8">
            <div className="text-left md:text-right">
              <p className="text-zinc-500 uppercase tracking-tighter text-[10px] font-bold">Uptime</p>
              <p className="font-mono font-bold text-sm">14d 06h 22m</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-zinc-500 uppercase tracking-tighter text-[10px] font-bold">Network</p>
              <p className="font-mono font-bold text-sm">Mainnet (10)</p>
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
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1 font-bold">Current Block Height</p>
                <h2 className="text-4xl md:text-6xl font-black font-mono tracking-tighter">
                  {blockHeight.toLocaleString()}
                </h2>
              </div>
              <div className="p-2 rounded bg-zinc-800/50 text-[10px] font-mono text-zinc-300 border border-zinc-700">
                0x4d2a...8b1e
              </div>
            </div>

            <div className="space-y-4 relative z-10 pt-8">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-500 uppercase tracking-widest">Syncing Progress</span>
                <span className="text-[#FF0420] font-bold">100%</span>
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
                  <p className="text-zinc-500 mb-1 text-[10px] uppercase font-bold">Avg Block</p>
                  <p className="text-lg md:text-xl font-bold font-mono">2.0s</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1 text-[10px] uppercase font-bold">Base Fee</p>
                  <p className="text-lg md:text-xl font-bold font-mono">0.01 <span className="text-xs font-normal opacity-60">Gwei</span></p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1 text-[10px] uppercase font-bold">L1 Origin</p>
                  <p className="text-lg md:text-xl font-bold font-mono">18,492,021</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Peer Connections */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bento-card p-5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Peers</p>
              <Globe size={14} className="text-zinc-600" />
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl md:text-5xl font-bold font-mono">42</h3>
              <div className="flex gap-1 h-12 items-end pb-1">
                <div className="w-1 bg-zinc-700 h-4 rounded-t-sm"></div>
                <div className="w-1 bg-zinc-700 h-6 rounded-t-sm"></div>
                <div className="w-1 bg-[#FF0420] h-10 rounded-t-sm shadow-[0_0_8px_rgba(255,4,32,0.4)]"></div>
                <div className="w-1 bg-[#FF0420] h-8 rounded-t-sm shadow-[0_0_8px_rgba(255,4,32,0.4)]"></div>
                <div className="w-1 bg-[#FF0420] h-12 rounded-t-sm shadow-[0_0_8px_rgba(255,4,32,0.4)]"></div>
              </div>
            </div>
          </motion.div>

          {/* Gas Price */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bento-card p-5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">L2 Gas</p>
              <Activity size={14} className="text-zinc-600" />
            </div>
            <div>
              <h3 className="text-3xl md:text-4xl font-bold font-mono text-[#FF0420] shadow-text">0.0012</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1 flex items-center gap-1">
                <Zap size={10} className="text-green-500" /> -12% vs last hour
              </p>
            </div>
          </motion.div>

          {/* CPU Usage */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bento-card p-5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">CPU</p>
              <Cpu size={14} className="text-zinc-600" />
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <h3 className="text-2xl md:text-3xl font-bold font-mono">24%</h3>
                <span className="text-[8px] font-mono text-zinc-500 font-bold">16 CORES</span>
              </div>
              <div className="w-full bg-zinc-800/50 h-1.5 rounded-full overflow-hidden border border-zinc-700">
                <div className="bg-blue-500 h-full w-1/4 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
              </div>
            </div>
          </motion.div>

          {/* Memory */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bento-card p-5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Memory</p>
              <Database size={14} className="text-zinc-600" />
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <h3 className="text-2xl md:text-3xl font-bold font-mono">18.4 <span className="text-xs opacity-50">GB</span></h3>
                <span className="text-[8px] font-mono text-zinc-500 font-bold">OF 64 GB</span>
              </div>
              <div className="w-full bg-zinc-800/50 h-1.5 rounded-full overflow-hidden border border-zinc-700">
                <div className="bg-purple-500 h-full w-[28%] shadow-[0_0_8px_rgba(168,85,247,0.4)]"></div>
              </div>
            </div>
          </motion.div>

          {/* Recent Events / Logs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="md:col-span-2 bento-card p-5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <TerminalIcon size={14} className="text-zinc-600" />
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Recent Events</p>
              </div>
              <span className="text-[8px] text-zinc-600 font-mono animate-pulse font-bold">LIVE LOG STREAM</span>
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
                    <span className={`${log.type === 'WARN' ? 'text-yellow-400' : 'text-blue-400'} w-10 font-bold`}>
                      {log.type}
                    </span>
                    <span className="text-zinc-600 whitespace-nowrap">[{log.time}]</span>
                    <span className="truncate">{log.msg}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Cluster Nodes Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="md:col-span-1 bento-card p-5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Cluster Health</p>
              <Activity size={14} className="text-zinc-600" />
            </div>
            <div className="space-y-3">
              {nodes.map((node) => (
                <div key={node.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        node.status === 'synced' ? 'bg-green-500' : 
                        node.status === 'syncing' ? 'bg-yellow-500 animate-pulse' : 
                        'bg-red-500'
                      }`} />
                      <span className="text-[10px] font-bold truncate max-w-[80px]">{node.name}</span>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      node.status === 'synced' ? 'bg-green-500/10 text-green-500' : 
                      node.status === 'syncing' ? 'bg-yellow-500/10 text-yellow-500' : 
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {node.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 px-4">
                    <span>Latency</span>
                    <span className={node.status === 'error' ? 'text-red-500' : ''}>{node.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Throughput */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bento-card p-5 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#FF0420] transition-colors duration-300 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Throughput</p>
              <Layers size={14} className="text-zinc-600" />
            </div>
            <div>
              <div className="flex justify-between items-end">
                <h3 className="text-2xl md:text-3xl font-bold font-mono">14.2</h3>
                <span className="text-xs font-mono text-[#FF0420] font-bold">TPS</span>
              </div>
              <p className="text-[9px] text-zinc-500 uppercase mt-1 font-bold">Peak 250 TPS</p>
            </div>
          </motion.div>

        </main>
        
        <footer className="mt-4 flex justify-center">
           <div className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-[#222222] rounded-full">
              <CheckCircle2 size={12} className="text-green-500" />
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Mainnet Cluster Verified</span>
           </div>
        </footer>
      </div>
    </div>
  );
}
