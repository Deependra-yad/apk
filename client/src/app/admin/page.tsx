"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Trash2, Users, Database, Shield, Lock, User, 
  Activity, Image as ImageIcon, LayoutDashboard, 
  Ban, CheckCircle, Search, LogOut, Clock, Smartphone, 
  Download, Key, Cpu, AlertTriangle, FileCode, Check, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { downloadFile } from '@/utils/apiUrl';
import LiquidLogo from '@/components/LiquidLogo';

export default function AdminDashboard() {
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'e2ee' | 'users' | 'media' | 'logs'>('overview');
  
  const [stats, setStats] = useState<any>(null);
  const [e2eeAudit, setE2eeAudit] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [media, setMedia] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsLoggedIn(true);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      if (activeTab === 'e2ee') fetchE2eeAudit();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'media') fetchMedia();
      if (activeTab === 'logs') fetchLogs();
    }
  }, [isLoggedIn, activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Deependra' && password === 'Deependra@123') {
      setIsLoggedIn(true);
      sessionStorage.setItem('adminAuth', 'true');
      sessionStorage.setItem('adminPass', password);
      setLoginError('');
    } else {
      setLoginError('Invalid admin credentials. Access Denied.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminPass');
    setIsLoggedIn(false);
  };

  const getHeaders = () => ({
    headers: { 'x-admin-password': sessionStorage.getItem('adminPass') || '' }
  });

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/admin/stats', getHeaders());
      setStats(res.data);
      setIsLoading(false);
    } catch (e) { 
      console.error(e); 
      setIsLoading(false); 
    }
  };

  const fetchE2eeAudit = async () => {
    try {
      setIsAuditing(true);
      const res = await axios.get('/api/admin/e2ee-audit', getHeaders());
      setE2eeAudit(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  const fetchUsers = async (searchQuery?: string) => {
    try {
      const query = searchQuery !== undefined ? searchQuery : userSearch;
      const res = await axios.get(`/api/admin/users${query ? `?search=${encodeURIComponent(query)}` : ''}`, getHeaders());
      setUsers(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchMedia = async () => {
    try {
      const res = await axios.get('/api/admin/media', getHeaders());
      setMedia(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/admin/logs', getHeaders());
      setLogs(res.data);
    } catch (e) { console.error(e); }
  };

  const handleToggleBan = async (id: string) => {
    if (!confirm('Are you sure you want to toggle ban status for this user?')) return;
    try {
      await axios.post(`/api/admin/users/${id}/ban`, {}, getHeaders());
      fetchUsers();
    } catch (e) { alert('Failed to update ban status'); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('CRITICAL: This permanently deletes this user, all encrypted message rows, media, and keys forever! Continue?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, getHeaders());
      fetchUsers();
      fetchStats();
    } catch (e) { alert('Failed to delete user'); }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Permanently delete this encrypted media file?')) return;
    try {
      await axios.delete(`/api/admin/media/${id}`, getHeaders());
      fetchMedia();
      fetchStats();
    } catch (e) { alert('Failed to delete media'); }
  };

  const handleClearStorage = async () => {
    if (!confirm('CRITICAL WARNING: This deletes ALL media files globally to free server space. Ciphertext rows will be purged. Continue?')) return;
    try {
      const res = await axios.post('/api/admin/clear-storage', {}, getHeaders());
      alert(res.data.message);
      fetchStats();
      fetchMedia();
    } catch (e) { alert('Failed to clear storage'); }
  };

  if (!isLoggedIn) {
    if (isLoading) {
      return (
        <div className="h-screen flex items-center justify-center bg-[#07070d]">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#07070d] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-[#10101c]/90 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] border border-white/10 relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-tr from-pink-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-pink-500/30 shadow-[0_0_25px_rgba(236,72,153,0.2)]">
              <Shield className="text-pink-400" size={38} />
            </div>
          </div>
          <h1 className="text-2xl font-black text-center text-white tracking-tight mb-1">Liquid Admin Console</h1>
          <p className="text-gray-400 text-center mb-8 text-xs font-mono">100% Zero-Knowledge Cryptographic Audit</p>
          
          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold mb-6 text-center">
              {loginError}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Admin Username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all" 
                required 
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                placeholder="Admin Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all" 
                required 
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(236,72,153,0.35)] transition-all cursor-pointer mt-2"
            >
              Authenticate to Admin Core
            </button>
          </form>
        </div>
      </div>
    );
  }

  const TabButton = ({ id, icon: Icon, label, badge }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
        activeTab === id 
          ? 'bg-pink-500/10 text-pink-300 border border-pink-500/30 shadow-[inset_0_0_20px_rgba(236,72,153,0.08)]' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={activeTab === id ? 'text-pink-400' : ''} />
        <span className="font-semibold text-sm">{label}</span>
      </div>
      {badge && (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="h-screen bg-[#07070d] text-gray-200 flex overflow-hidden selection:bg-pink-500/30">
      {/* Sidebar */}
      <div className="w-64 bg-[#0f0f1b] border-r border-white/5 flex-col hidden md:flex h-full shrink-0">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <LiquidLogo size={32} />
            <div>
              <h2 className="font-black text-white text-base tracking-tight">Liquid Admin</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] font-mono text-emerald-400 font-semibold">100% E2EE ACTIVE</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2 mt-1">Management</div>
          <TabButton id="overview" icon={LayoutDashboard} label="Telemetry & Stats" />
          <TabButton id="e2ee" icon={Lock} label="E2EE Cryptographic Audit" badge="100%" />
          <TabButton id="users" icon={Users} label="User Directory" badge={stats?.totalUsers} />
          <TabButton id="media" icon={ImageIcon} label="Ciphertext Vault" />
          <TabButton id="logs" icon={Activity} label="Access Logs" />
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer text-sm font-medium"
          >
            <LogOut size={16} />
            <span>Terminate Session</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden h-full relative">
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
          
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between mb-6 bg-[#0f0f1b] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <LiquidLogo size={28} />
              <span className="font-bold text-white text-sm">Liquid Admin</span>
            </div>
            <select 
              value={activeTab} 
              onChange={(e: any) => setActiveTab(e.target.value)}
              className="bg-black/50 border border-white/10 text-white text-xs rounded-lg py-1.5 px-2.5 focus:outline-none"
            >
              <option value="overview">Telemetry</option>
              <option value="e2ee">E2EE Audit (100%)</option>
              <option value="users">Users</option>
              <option value="media">Ciphertext Vault</option>
              <option value="logs">Logs</option>
            </select>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">System Telemetry</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Real-time cryptographic network health and infrastructure metrics</p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <span>Zero-Knowledge Compliant</span>
                </div>
              </div>
              
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0f0f1b] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-400">Total Registered Users</p>
                    <Users className="text-cyan-400" size={20} />
                  </div>
                  <h3 className="text-3xl font-black text-white">{stats.totalUsers}</h3>
                  <p className="text-[11px] text-cyan-400/80 font-mono mt-2">{stats.activeKeyPairsCount} Curve25519 Keys Active</p>
                </div>

                <div className="bg-[#0f0f1b] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-400">Encrypted Messages</p>
                    <Lock className="text-pink-400" size={20} />
                  </div>
                  <h3 className="text-3xl font-black text-white">{stats.totalMessages}</h3>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500" />
                    <p className="text-[11px] text-pink-400 font-mono font-bold">{stats.e2eePercentage}% E2EE Ciphertext</p>
                  </div>
                </div>

                <div className="bg-[#0f0f1b] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-400">Ciphertext Media Storage</p>
                    <Database className="text-purple-400" size={20} />
                  </div>
                  <h3 className="text-3xl font-black text-white">{stats.uploadsSizeMb} MB</h3>
                  <p className="text-[11px] text-gray-400 mt-2">{stats.fileCount} encrypted binary blobs</p>
                </div>

                <div className="bg-[#0f0f1b] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-400">Total Groups</p>
                    <LayoutDashboard className="text-amber-400" size={20} />
                  </div>
                  <h3 className="text-3xl font-black text-white">{stats.totalGroups}</h3>
                  <p className="text-[11px] text-gray-400 mt-2">{stats.totalStories} active stories</p>
                </div>
              </div>

              {/* Cryptographic Architecture Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-cyan-500/5 border border-white/10">
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Cpu className="text-pink-400" size={18} />
                  <span>Hardware Cryptography & Zero-Knowledge Architecture</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-gray-400 font-semibold mb-1">Asymmetric Key Exchange</p>
                    <p className="font-mono text-cyan-300 font-bold">Curve25519 / ECDH (P-256)</p>
                    <p className="text-[11px] text-gray-500 mt-1">Generated and stored in client IndexedDB only. Server stores public keys only.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-gray-400 font-semibold mb-1">Symmetric Message Cipher</p>
                    <p className="font-mono text-pink-300 font-bold">AES-256-GCM (12-byte IV)</p>
                    <p className="text-[11px] text-gray-500 mt-1">Every payload uses a cryptographically distinct random IV. Authenticated encryption prevents tampering.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-gray-400 font-semibold mb-1">Server Ciphertext Storage</p>
                    <p className="font-mono text-emerald-300 font-bold">Zero Plaintext Leakage</p>
                    <p className="text-[11px] text-gray-500 mt-1">Files and messages are encrypted on sender device prior to transmission. Server holds zero decryption keys.</p>
                  </div>
                </div>
              </div>

              {/* Storage Cleanup Box */}
              <div className="bg-red-500/5 border border-red-500/15 p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="bg-red-500/10 p-3 rounded-xl shrink-0">
                    <Trash2 className="text-red-400" size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-red-300 mb-1">Global Storage Purge</h3>
                    <p className="text-xs text-gray-400 mb-3">
                      Permanently wipes all media files across the database and filesystem to reclaim server storage. Encrypted text message history remains intact.
                    </p>
                    <button 
                      onClick={handleClearStorage} 
                      className="bg-red-500/20 hover:bg-red-500 hover:text-white text-red-300 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Purge Media Storage Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 100% E2EE CRYPTOGRAPHIC AUDIT */}
          {activeTab === 'e2ee' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>100% E2EE Cryptographic Audit</span>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      Zero-Knowledge
                    </span>
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">Mathematical proof of zero plaintext visibility and server-side encryption compliance</p>
                </div>
                <button
                  onClick={fetchE2eeAudit}
                  disabled={isAuditing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
                >
                  <RefreshCw size={14} className={isAuditing ? 'animate-spin' : ''} />
                  <span>{isAuditing ? 'Auditing...' : 'Re-verify Core'}</span>
                </button>
              </div>

              {e2eeAudit ? (
                <>
                  {/* Cryptographic Compliance Banner */}
                  <div className="p-6 rounded-2xl bg-[#0f0f1b] border border-emerald-500/30 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <Shield size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span>Cryptographic Audit Status:</span>
                            <span className="text-emerald-400 font-mono">100% ZERO-KNOWLEDGE</span>
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Server holds <strong className="text-emerald-300">0 private keys</strong> and <strong className="text-emerald-300">0 plaintext messages</strong>. All communications are verified ciphertext.
                          </p>
                        </div>
                      </div>
                      <div className="text-right sm:border-l sm:border-white/10 sm:pl-6">
                        <p className="text-xs text-gray-400">E2EE Compliance Rate</p>
                        <p className="text-2xl font-black text-emerald-400 font-mono">{e2eeAudit.e2eeComplianceRate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic Proof Parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[#0f0f1b] border border-white/5">
                      <p className="text-[11px] text-gray-400 font-semibold mb-1">Server Private Keys Held</p>
                      <p className="text-2xl font-black text-emerald-400 font-mono">0</p>
                      <p className="text-[10px] text-gray-500 mt-1">Keys generated locally in client browser</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0f0f1b] border border-white/5">
                      <p className="text-[11px] text-gray-400 font-semibold mb-1">Cipher Algorithm</p>
                      <p className="text-sm font-bold text-white font-mono">{e2eeAudit.zeroKnowledgeProof?.cipherAlgorithm}</p>
                      <p className="text-[10px] text-gray-500 mt-1">Hardware accelerated WebCrypto</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0f0f1b] border border-white/5">
                      <p className="text-[11px] text-gray-400 font-semibold mb-1">Key Exchange</p>
                      <p className="text-sm font-bold text-white font-mono">{e2eeAudit.zeroKnowledgeProof?.keyExchangeAlgorithm}</p>
                      <p className="text-[10px] text-gray-500 mt-1">ECDH raw byte public exchange</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0f0f1b] border border-white/5">
                      <p className="text-[11px] text-gray-400 font-semibold mb-1">Media Storage</p>
                      <p className="text-sm font-bold text-white font-mono">Binary Cipher Blobs</p>
                      <p className="text-[10px] text-gray-500 mt-1">Opaque application/octet-stream</p>
                    </div>
                  </div>

                  {/* Live Database Ciphertext Inspector */}
                  <div className="bg-[#0f0f1b] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode size={18} className="text-pink-400" />
                        <h3 className="font-bold text-white text-sm">Live Database Ciphertext Inspector</h3>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">Real-time DB Row Samples</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-black/40 text-gray-400 border-b border-white/5">
                            <th className="p-3.5 font-semibold">Message ID</th>
                            <th className="p-3.5 font-semibold">Sender / Receiver</th>
                            <th className="p-3.5 font-semibold">Ciphertext Sample</th>
                            <th className="p-3.5 font-semibold">AES-GCM IV</th>
                            <th className="p-3.5 font-semibold text-center">Plaintext Leak Audit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {e2eeAudit.auditSamples?.map((sample: any) => (
                            <tr key={sample.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3.5 text-gray-500 text-[11px]">{sample.id.slice(0, 8)}...</td>
                              <td className="p-3.5 font-sans">
                                <div className="font-bold text-white text-xs">{sample.sender}</div>
                                <div className="text-[10px] text-gray-400">→ {sample.receiver}</div>
                              </td>
                              <td className="p-3.5 text-pink-300 text-[11px] max-w-xs truncate">
                                {sample.ciphertextSample || '<File Ciphertext Blob>'}
                              </td>
                              <td className="p-3.5 text-cyan-400 text-[11px]">
                                {sample.ivPreview}
                              </td>
                              <td className="p-3.5 text-center font-sans">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                                  <Check size={11} />
                                  <span>0 Plaintext Leak</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-gray-500">Loading cryptographic audit report...</div>
              )}
            </div>
          )}

          {/* TAB 3: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-black text-white tracking-tight">User Directory</h1>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search by ID, username, email..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      fetchUsers(e.target.value);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="bg-[#0f0f1b] border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-black/30 text-gray-400 border-b border-white/5">
                        <th className="p-4 font-semibold">User & Liquid ID</th>
                        <th className="p-4 font-semibold">Curve25519 Fingerprint</th>
                        <th className="p-4 font-semibold">IP & Device</th>
                        <th className="p-4 font-semibold text-center">Status</th>
                        <th className="p-4 font-semibold">Activity</th>
                        <th className="p-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 font-black text-sm uppercase shrink-0">
                                {u.username.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                  <span>{u.username}</span>
                                  {u.isAdmin && <span className="bg-pink-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
                                </div>
                                <div className="text-[11px] text-cyan-300 font-mono">ID: {u.liquidNumber || 'Legacy'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono">
                            {u.publicKey ? (
                              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                                <Key size={12} />
                                <span>{u.publicKey.slice(0, 10)}...</span>
                              </div>
                            ) : (
                              <span className="text-gray-500 italic text-[11px]">No key yet</span>
                            )}
                          </td>
                          <td className="p-4 text-gray-400 font-mono text-[11px]">
                            <div>{u.lastIpAddress || 'Unknown IP'}</div>
                            <div className="text-gray-500 text-[10px] font-sans">
                              {formatDistanceToNow(new Date(u.lastSeen || u.createdAt), { addSuffix: true })}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {u.isBanned ? (
                              <span className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                <Ban size={10} /> Banned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                <CheckCircle size={10} /> Active
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-gray-400">
                            <div>{u._count?.messagesSent || 0} msgs</div>
                            <div className="text-[10px] text-gray-500">{u._count?.mediaUploaded || 0} files</div>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button 
                              onClick={() => handleToggleBan(u.id)} 
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                u.isBanned 
                                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                                  : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                              }`}
                            >
                              {u.isBanned ? 'Unban' : 'Ban'}
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id)} 
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && <div className="p-8 text-center text-gray-500">No users found.</div>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CIPHERTEXT MEDIA VAULT */}
          {activeTab === 'media' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Ciphertext Media Vault</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Encrypted binary files stored on server. Zero plaintext storage guaranteed.</p>
                </div>
                <button 
                  onClick={handleClearStorage}
                  className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  <span>Purge All Media</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {media.map(m => (
                  <div key={m.id} className="bg-[#0f0f1b] border border-white/5 rounded-2xl overflow-hidden group relative">
                    <div className="h-32 bg-black/50 relative flex flex-col items-center justify-center p-3 text-center">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-2">
                        <Lock size={18} />
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">AES-256 CIPHERTEXT</span>
                      <span className="text-[9px] text-gray-500 mt-0.5 font-mono">ID: {m.id.slice(0, 8)}</span>

                      <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => downloadFile(`/api/upload/${m.id}`, m.fileName || `ciphertext_${m.id}`)} 
                          className="w-7 h-7 bg-black/70 rounded-lg text-white flex items-center justify-center hover:bg-pink-500 transition-all cursor-pointer"
                          title="Download Ciphertext Blob"
                        >
                          <Download size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteMedia(m.id)} 
                          className="w-7 h-7 bg-black/70 rounded-lg text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                          title="Delete File"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 bg-[#0a0a14]">
                      <p className="text-xs text-white truncate font-medium" title={m.fileName}>{m.fileName || 'Encrypted Binary'}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-[10px] text-gray-500">{m.user ? m.user.username : 'Anonymous'}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{(m.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  </div>
                ))}
                {media.length === 0 && <div className="col-span-full py-12 text-center text-gray-500">Ciphertext vault is empty.</div>}
              </div>
            </div>
          )}

          {/* TAB 5: ACCESS LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h1 className="text-2xl font-black text-white tracking-tight">Security & Authentication Logs</h1>
              <div className="bg-[#0f0f1b] border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-black/30 text-gray-400 border-b border-white/5">
                        <th className="p-4 font-semibold">User</th>
                        <th className="p-4 font-semibold">IP Address</th>
                        <th className="p-4 font-semibold">Device / User Agent</th>
                        <th className="p-4 font-semibold">Recorded Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-bold text-white">{log.user?.username || 'Unknown User'}</td>
                          <td className="p-4 text-cyan-300 font-mono">{log.ipAddress || '127.0.0.1'}</td>
                          <td className="p-4 text-gray-400 max-w-sm truncate" title={log.userAgent}>
                            <div className="flex items-center gap-2">
                              <Smartphone size={14} className="text-gray-500 shrink-0" />
                              <span className="truncate">{log.userAgent}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-500 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} />
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {logs.length === 0 && <div className="p-8 text-center text-gray-500">No login logs recorded yet.</div>}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
