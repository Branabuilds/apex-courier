'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

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

export default function AdminPanel() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Search state
  const [searchId, setSearchId] = useState('');
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  
  // Update form states
  const [status, setStatus] = useState('');
  const [statusColor, setStatusColor] = useState('border-blue-500/30 text-blue-400 bg-blue-500/5');
  const [currentLocation, setCurrentLocation] = useState('');
  const [destination, setDestination] = useState('');
  
  // New log state
  const [newLogTime, setNewLogTime] = useState('');
  const [newLogEvent, setNewLogEvent] = useState('');

  // Status message states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Check session storage on load so you don't have to re-login every refresh
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('admin_authenticated');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Handle Login Gate
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hardcoded master bypass password string
    const masterPassword = "Prosper77";

    //clean the input: remove spaces and enforce exact case match
    const cleanInput = passwordInput.trim();

    if (cleanInput === masterPassword) {
      setIsAuthenticated(true);

      //safety handle sessionStorage for mobile incognito/private tabs
      try {
      window.sessionStorage.setItem('admin_authenticated', 'true');
      } catch (error) {
        console.warn("storage blocked by browser security settings:", error);
      }
      setAuthError('');
    } else {
      setAuthError('Access Denied. Cryptographic key invalid.');
    }
  };

  // Fetch shipment to edit
  const fetchShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('tracking_id', searchId.trim())
        .single();

      if (error || !data) {
        setMessage({ text: 'Shipment not found. Enter a new tracking ID below to initialize it.', isError: true });
        setShipment(null);
        return;
      }

      setShipment(data as ShipmentData);
      setStatus(data.status);
      setStatusColor(data.status_color || 'border-blue-500/30 text-blue-400 bg-blue-500/5');
      setCurrentLocation(data.current_location);
      setDestination(data.destination);
    } catch (err) {
      setMessage({ text: 'Error fetching database record.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Save core shipment changes or create new
  const handleSaveShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const targetId = searchId.trim() || shipment?.tracking_id;
    if (!targetId) {
      setMessage({ text: 'Tracking ID is required.', isError: true });
      setLoading(false);
      return;
    }

    const payload = {
      tracking_id: targetId,
      status,
      status_color: statusColor,
      current_location: currentLocation,
      destination,
      transit_logs: shipment?.transit_logs || []
    };

    try {
      const { error } = await supabase
        .from('shipments')
        .upsert(payload, { onConflict: 'tracking_id' });

      if (error) throw error;

      setMessage({ text: 'Mainframe records synchronized successfully!', isError: false });
      setShipment(payload as ShipmentData);
    } catch (err: any) {
      setMessage({ text: `Update Failed: ${err.message}`, isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Push a new transit event to the timeline array
  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment || !newLogTime.trim() || !newLogEvent.trim()) return;

    setLoading(true);
    setMessage(null);

    const updatedLogs = [
      { time: newLogTime.trim(), event: newLogEvent.trim() },
      ...(shipment.transit_logs || [])
    ];

    try {
      const { error } = await supabase
        .from('shipments')
        .update({ transit_logs: updatedLogs })
        .eq('tracking_id', shipment.tracking_id);

      if (error) throw error;

      setShipment({ ...shipment, transit_logs: updatedLogs });
      setNewLogTime('');
      setNewLogEvent('');
      setMessage({ text: 'New transit milestone broadcasting live.', isError: false });
    } catch (err: any) {
      setMessage({ text: `Failed to push log: ${err.message}`, isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#020617] text-slate-200 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/[0.02] border border-white/5 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center space-y-6">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl mx-auto mb-4">
              🔐
            </div>
            <h1 className="text-xl font-black text-white tracking-wider uppercase">Terminal Lock</h1>
            <p className="text-xs text-slate-400 mt-1">Enter master administrative passkey to decrypt route.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              placeholder="Enter Terminal Password..."
              className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-sm text-center text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
            {authError && <p className="text-xs text-red-400 font-semibold">{authError}</p>}
            
            <button
              type="submit"
              className="w-full bg-white hover:bg-slate-100 text-[#020617] font-bold text-xs py-3 rounded-xl transition-all uppercase tracking-wider shadow-lg"
            >
              Authorize Node Access
            </button>
          </form>
          
          <a href="/" className="text-[11px] text-slate-500 hover:text-slate-400 transition-colors block">
            ← Abort and Return to Manifest
          </a>
        </div>
      </main>
    );
  }

  // Render Main Dashboard if authenticated
  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header navigation back */}
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-wider">APEX COMMAND CENTER</h1>
            <p className="text-xs text-slate-400">Database node controller & waypoint injection router.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                sessionStorage.removeItem('admin_authenticated');
                setIsAuthenticated(false);
              }}
              className="text-xs text-red-400/80 hover:text-red-400 px-3 py-2 transition-colors font-medium"
            >
              Lock Terminal
            </button>
            <a href="/" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all font-bold">
              ← Main Manifest View
            </a>
          </div>
        </div>

        {/* Global Messaging Box */}
        {message && (
          <div className={`p-4 rounded-xl text-sm border font-medium ${
            message.isError ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Grid Setup */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Section 1: Query Database Card (Left Side) */}
          <div className="md:col-span-5 bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-1">Target Search</h2>
              <p className="text-xs text-slate-400">Query or create a tracking block signature.</p>
            </div>

            <form onSubmit={fetchShipment} className="space-y-3">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Waybill ID (e.g., APEX200)..."
                className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all uppercase tracking-wider"
              >
                Sync Waybill Target
              </button>
            </form>

            <div className="border-t border-white/5 pt-4 text-[11px] text-slate-500 space-y-1">
              <p>💡 To update: Search standard Waybill ID, change values, hit save.</p>
              <p>💡 To create new: Put unassigned ID in search input, fill values below, hit save.</p>
            </div>
          </div>

          {/* Section 2: Form Configurations (Right Side) */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Core Metrics Setup Box */}
            <form onSubmit={handleSaveShipment} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-3">
                {shipment ? `Editing Node: ${shipment.tracking_id}` : 'Create / Initialize Shipment Parameter'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status Text</label>
                  <input
                    type="text"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="e.g., IN TRANSIT, DELIVERED"
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status Color Theme</label>
                  <select
                    value={statusColor}
                    onChange={(e) => setStatusColor(e.target.value)}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="border-blue-500/30 text-blue-400 bg-blue-500/5">Blue (In Transit / Default)</option>
                    <option value="border-emerald-500/30 text-emerald-400 bg-emerald-500/5">Green (Delivered)</option>
                    <option value="border-amber-500/30 text-amber-400 bg-amber-500/5">Amber (Delayed / Custom)</option>
                    <option value="border-red-500/30 text-red-400 bg-red-500/5">Red (Exception)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Destination Target</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., Garki, Abuja (NG) or Houston, Texas (USA)"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Node Location</label>
                <input
                  type="text"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  placeholder="e.g., MMIA International Airport"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-slate-100 text-[#020617] font-bold text-xs py-3 px-4 rounded-xl transition-all uppercase tracking-wider"
              >
                {shipment ? 'Commit Record Override' : 'Initialize Database Entry'}
              </button>
            </form>

            {/* Injection Live Milestones Module */}
            {shipment && (
              <form onSubmit={handleAddMilestone} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-3">
                  Inject Live Milestone Log
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Timestamp</label>
                    <input
                      type="text"
                      value={newLogTime}
                      onChange={(e) => setNewLogTime(e.target.value)}
                      placeholder="e.g., TODAY, 11:20 AM"
                      className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Event Description</label>
                    <input
                      type="text"
                      value={newLogEvent}
                      onChange={(e) => setNewLogEvent(e.target.value)}
                      placeholder="e.g., Package arrived at logistics sort facility."
                      className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs py-3 px-4 rounded-xl transition-all uppercase tracking-wider"
                >
                  Broadcast Milestone To Timeline
                </button>
              </form>
            )}

          </div>
        </div>

      </div>
    </main>
  );
}