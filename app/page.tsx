'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface TransitLog {
  time: string;
  event: string;
}

interface ShipmentData {
  tracking_id: string;
  status: string;
  status_color: string;
  destination: string;
  current_location: string;
  transit_logs: TransitLog[];
}

export default function Home() {
  const [searchId, setSearchId] = useState('');
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Live Clock State
  const [timeString, setTimeString] = useState('');

  // Clock running every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-US', { hour12: true }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setShipment(null);

    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('tracking_id', searchId.trim().toUpperCase())
        .single();

      if (error || !data) {
        setErrorMsg('Invalid Waybill ID. No matching cryptographic asset route found.');
        return;
      }

      setShipment(data as ShipmentData);
    } catch (err) {
      setErrorMsg('Database connection timeout.');
    } finally {
      setLoading(false);
    }
  };

  // Printable Trigger Function
  const triggerPrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 py-12 px-6 print:bg-white print:text-black print:py-0 print:px-0">
      <div className="max-w-4xl mx-auto space-y-8 print:max-w-full">
        
        {/* Top Header - Hides completely when printing */}
        <div className="flex items-center justify-between border-b border-white/5 pb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-black text-white tracking-wider">APEX LOGISTICS</h1>
            <p className="text-xs text-slate-400">Global Manifest & Cryptographic Transit Verification.</p>
          </div>
          <div className="text-right space-y-1">
            <div className="text-xs font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              NODE TIME: {timeString || 'SYNCHRONIZING...'}
            </div>
          </div>
        </div>

        {/* Tracking Input Card - Hides completely when printing */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 print:hidden">
          <h2 className="text-sm font-black text-white uppercase tracking-widest mb-3">Query Waybill Gateway</h2>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Waybill ID (e.g., APEX100)..."
              className="flex-1 bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-sm text-white uppercase placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all uppercase tracking-wider whitespace-nowrap"
            >
              {loading ? 'Decrypting...' : 'Query Waybill Database'}
            </button>
          </form>
          {errorMsg && <p className="text-xs text-red-400 font-semibold mt-3">{errorMsg}</p>}
        </div>

        {/* Shipment Manifest Result Sheet */}
        {shipment && (
          <div className="space-y-6 bg-white/[0.01] border border-white/5 rounded-2xl p-8 print:border-none print:print:p-0">
            
            {/* Manifest Sheet Header */}
            <div className="flex items-start justify-between border-b border-white/5 pb-6 print:border-black/10">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 print:text-slate-600">Official Tracking Receipt</span>
                <h3 className="text-xl font-black text-white print:text-black">{shipment.tracking_id}</h3>
              </div>
              <div className="flex items-center gap-3 print:hidden">
                <button
                  onClick={triggerPrint}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-2"
                >
                  🖨️ Print Invoice
                </button>
              </div>
              <div className="hidden print:block text-right text-xs text-slate-600 font-mono">
                Generated: {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* Core Metrics Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 print:border-black/10 print:p-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 print:text-slate-600">Current Status</span>
                <div>
                  <span className="inline-block text-xs font-black tracking-wider uppercase px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 print:border print:border-black print:text-black">
                    {shipment.status}
                  </span>
                </div>
              </div>

              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 print:border-black/10 print:p-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 print:text-slate-600">Destination Target</span>
                <p className="text-sm font-bold text-white print:text-black">{shipment.destination}</p>
              </div>

              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 print:border-black/10 print:p-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 print:text-slate-600">Current Node Location</span>
                <p className="text-sm font-bold text-white print:text-black">{shipment.current_location}</p>
              </div>
            </div>

            {/* Live Timelines Tracking Component */}
            <div className="pt-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 print:text-black">Live Transit Milestones</h4>
              <div className="relative border-l border-white/10 ml-2 space-y-8 print:border-black/20">
                {shipment.transit_logs && shipment.transit_logs.length > 0 ? (
                  shipment.transit_logs.map((log, index) => (
                    <div key={index} className="relative pl-6">
                      {/* Timeline dot element */}
                      <span className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${index === 0 ? 'bg-blue-400 ring-4 ring-blue-500/20' : 'bg-slate-700'} print:bg-black`}></span>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase print:text-slate-600">{log.time}</span>
                        <p className="text-xs font-medium text-slate-200 print:text-black">{log.event}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 pl-4">No milestone data injected for this node route configuration.</p>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}