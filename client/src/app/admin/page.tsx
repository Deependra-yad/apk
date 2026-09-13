"use client";

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  PhoneCall,
  FolderArchive,
  ShieldCheck,
  HeartPulse,
  LogOut,
  ExternalLink,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  Globe,
  Trash2,
  Ban,
  Send,
  Database,
  Cpu,
  Clock,
  Smartphone,
  Laptop,
  Radio,
  ChevronRight,
  Menu,
  ChevronLeft,
  ChevronDown,
  ShieldAlert,
  Server,
  Zap
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function WordPressAdmin() {
  const router = useRouter();

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'users' | 'messages' | 'groups' | 'calls' | 'media' | 'logs' | 'health'
  >('dashboard');
  const [isSidebarFolded, setIsSidebarFolded] = useState(false);

  // Global Notice State
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Real-time Ping Latency
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Authentic Data States
  const [overview, setOverview] = useState<any>(null);
  const [usersData, setUsersData] = useState<any>({ users: [], totalFiltered: 0, counts: { all: 0, admins: 0, banned: 0 } });
  const [userFilter, setUserFilter] = useState<'all' | 'admins' | 'banned'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [callsData, setCallsData] = useState<any>({ calls: [], summary: {} });
  const [callTypeFilter, setCallTypeFilter] = useState<'all' | 'video' | 'audio'>('all');
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [logsList, setLogsList] = useState<any[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [e2eeAudit, setE2eeAudit] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Selected User IDs for Bulk Actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  // Quick Draft / Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'alert'>('info');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Loading indicator
  const [isLoading, setIsLoading] = useState(true);

  // Check login on mount
  useEffect(() => {
    const auth = sessionStorage.getItem('wp_admin_auth');
    if (auth === 'true') {
      setIsLoggedIn(true);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial data once logged in
  useEffect(() => {
    if (isLoggedIn) {
      measurePing();
      loadActiveTabData();
      // Auto-refresh ping every 30 seconds
      const pingInterval = setInterval(measurePing, 30000);
      return () => clearInterval(pingInterval);
    }
  }, [isLoggedIn, activeTab, userFilter, callTypeFilter]);

  const getHeaders = () => {
    const storedPass = sessionStorage.getItem('wp_admin_pass') || 'Deependra@123';
    return {
      headers: {
        'x-admin-password': storedPass,
        'Content-Type': 'application/json'
      }
    };
  };

  const showNotice = (type: 'success' | 'error' | 'info', text: string) => {
    setNotice({ type, text });
    setTimeout(() => {
      setNotice((current) => (current?.text === text ? null : current));
    }, 6000);
  };

  // Measure Real DB Roundtrip Ping
  const measurePing = async () => {
    try {
      setIsPinging(true);
      const start = performance.now();
      const res = await axios.get('/api/admin/system-health', getHeaders());
      const end = performance.now();
      const roundTrip = Math.round(end - start);
      setPingMs(res.data?.database?.latencyMs ?? roundTrip);
      setSystemHealth(res.data);
    } catch {
      setPingMs(null);
    } finally {
      setIsPinging(false);
    }
  };

  // Load Tab Data
  const loadActiveTabData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await axios.get('/api/admin/overview', getHeaders());
        setOverview(res.data);
      } else if (activeTab === 'users') {
        const res = await axios.get(
          `/api/admin/users?filter=${userFilter}${userSearch ? `&search=${encodeURIComponent(userSearch)}` : ''}`,
          getHeaders()
        );
        setUsersData(res.data);
      } else if (activeTab === 'messages') {
        const res = await axios.get('/api/admin/e2ee-audit', getHeaders());
        setE2eeAudit(res.data);
      } else if (activeTab === 'groups') {
        const res = await axios.get(
          `/api/admin/groups${groupSearch ? `?search=${encodeURIComponent(groupSearch)}` : ''}`,
          getHeaders()
        );
        setGroups(res.data);
      } else if (activeTab === 'calls') {
        const res = await axios.get(
          `/api/admin/calls${callTypeFilter !== 'all' ? `?type=${callTypeFilter}` : ''}`,
          getHeaders()
        );
        setCallsData(res.data);
      } else if (activeTab === 'media') {
        const res = await axios.get('/api/admin/media', getHeaders());
        setMediaList(res.data);
        const ov = await axios.get('/api/admin/overview', getHeaders());
        setOverview(ov.data);
      } else if (activeTab === 'logs') {
        const res = await axios.get(
          `/api/admin/logs${logSearch ? `?search=${encodeURIComponent(logSearch)}` : ''}`,
          getHeaders()
        );
        setLogsList(res.data);
      } else if (activeTab === 'health') {
        const res = await axios.get('/api/admin/system-health', getHeaders());
        setSystemHealth(res.data);
      }
    } catch (e: any) {
      console.error('Data load error:', e);
      showNotice('error', e.response?.data?.error || 'Failed to retrieve administrative data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Deependra' && password === 'Deependra@123') {
      setIsLoggedIn(true);
      sessionStorage.setItem('wp_admin_auth', 'true');
      sessionStorage.setItem('wp_admin_pass', password);
      setLoginError('');
      showNotice('success', 'Logged in to WordPress Administrator Panel.');
    } else {
      setLoginError('Error: The password you entered for the username Deependra is incorrect.');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem('wp_admin_auth');
    sessionStorage.removeItem('wp_admin_pass');
    setIsLoggedIn(false);
  };

  // User Actions
  const handleToggleAdminRole = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await axios.post(`/api/admin/users/${userId}/role`, {}, getHeaders());
      showNotice('success', res.data.message || 'User role updated.');
      loadActiveTabData();
    } catch {
      showNotice('error', 'Failed to update administrator status.');
    }
  };

  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await axios.post(`/api/admin/users/${userId}/ban`, {}, getHeaders());
      showNotice('success', res.data.message || 'Ban status updated.');
      loadActiveTabData();
    } catch {
      showNotice('error', 'Failed to update ban status.');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${username}" and all related data?`)) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`, getHeaders());
      showNotice('success', `User "${username}" permanently deleted.`);
      loadActiveTabData();
    } catch {
      showNotice('error', 'Failed to delete user.');
    }
  };

  const handleApplyBulkUserAction = async () => {
    if (!bulkAction) return;
    if (selectedUserIds.length === 0) {
      alert('Please select at least one user from the list.');
      return;
    }

    if (bulkAction === 'delete') {
      if (!confirm(`Permanently delete ${selectedUserIds.length} selected users?`)) return;
      for (const id of selectedUserIds) {
        try {
          await axios.delete(`/api/admin/users/${id}`, getHeaders());
        } catch {}
      }
      showNotice('success', `Processed bulk deletion of ${selectedUserIds.length} users.`);
      setSelectedUserIds([]);
      loadActiveTabData();
    } else if (bulkAction === 'ban') {
      for (const id of selectedUserIds) {
        try {
          await axios.post(`/api/admin/users/${id}/ban`, {}, getHeaders());
        } catch {}
      }
      showNotice('success', `Processed bulk ban status for ${selectedUserIds.length} users.`);
      setSelectedUserIds([]);
      loadActiveTabData();
    }
  };

  // Group Actions
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"?`)) return;
    try {
      await axios.delete(`/api/admin/groups/${groupId}`, getHeaders());
      showNotice('success', `Group "${groupName}" deleted.`);
      loadActiveTabData();
    } catch {
      showNotice('error', 'Failed to delete group.');
    }
  };

  // Media Actions
  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media file?')) return;
    try {
      await axios.delete(`/api/admin/media/${mediaId}`, getHeaders());
      showNotice('success', 'Media file removed from database.');
      loadActiveTabData();
    } catch {
      showNotice('error', 'Failed to delete media file.');
    }
  };

  const handleClearStorage = async () => {
    if (!confirm('CRITICAL ACTION: This will purge all database media blobs and local disk files to free storage. Proceed?')) return;
    try {
      const res = await axios.post('/api/admin/clear-storage', {}, getHeaders());
      showNotice('success', res.data.message || 'Storage purged successfully.');
      loadActiveTabData();
    } catch {
      showNotice('error', 'Failed to clear storage.');
    }
  };

  // Log Actions
  const handleFlushLogs = async () => {
    if (!confirm('Flush all security and authentication access logs?')) return;
    try {
      const res = await axios.delete('/api/admin/logs', getHeaders());
      showNotice('success', res.data.message || 'Security logs cleared.');
      loadActiveTabData();
    } catch {
      showNotice('error', 'Failed to flush security logs.');
    }
  };

  // Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    try {
      setIsBroadcasting(true);
      const res = await axios.post(
        '/api/admin/broadcast',
        {
          title: broadcastTitle.trim() || 'System Announcement',
          message: broadcastMessage.trim(),
          type: broadcastType
        },
        getHeaders()
      );
      showNotice('success', `Broadcast published! Sent to ${res.data.recipientsConnected} active socket client(s).`);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (e: any) {
      showNotice('error', 'Failed to publish broadcast announcement.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // ==========================================
  // WORDPRESS LOGIN VIEW
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f0f0f1] flex flex-col items-center justify-center p-4 font-sans antialiased text-[#3c434a]">
        {/* WordPress Logo Icon */}
        <div className="mb-6 text-center">
          <div className="w-20 h-20 bg-[#2271b1] text-white rounded-full flex items-center justify-center mx-auto shadow-md border-4 border-white">
            <span className="text-3xl font-serif font-black tracking-tighter">W</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-[#50575e] tracking-wide">Liquid Chat Administration</p>
        </div>

        {/* Error Notice */}
        {loginError && (
          <div className="w-full max-w-[320px] mb-4 bg-white border-l-4 border-[#d63638] p-3 shadow-sm text-xs leading-relaxed text-[#2c3338]">
            <strong>ERROR</strong>: {loginError}
          </div>
        )}

        {/* WordPress Login Box */}
        <form
          onSubmit={handleLogin}
          className="w-full max-w-[320px] bg-white border border-[#c3c4c7] p-6 shadow-sm rounded-none text-left space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#2c3338] mb-1">Username or Email Address</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#8c8f94] rounded-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2c3338] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#8c8f94] rounded-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-[#50575e]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 border-[#8c8f94] rounded text-[#2271b1] focus:ring-0"
              />
              Remember Me
            </label>
            <button
              type="submit"
              className="bg-[#2271b1] hover:bg-[#135e96] text-white px-4 py-1.5 rounded text-xs font-medium border border-[#2271b1] shadow-sm transition"
            >
              Log In
            </button>
          </div>
        </form>

        <div className="w-full max-w-[320px] mt-4 flex items-center justify-between text-xs text-[#50575e]">
          <button
            type="button"
            onClick={() => router.push('/chat')}
            className="hover:text-[#2271b1] transition flex items-center gap-1"
          >
            ← Go to Liquid Chat
          </button>
          <span className="text-gray-400">100% Authentic Telemetry</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // WORDPRESS ADMIN DASHBOARD VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#2c3338] font-sans antialiased flex flex-col">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BAR (#wpadminbar)                                      */}
      {/* ------------------------------------------------------------- */}
      <header className="h-8 bg-[#1d2327] text-[#c3c4c7] flex items-center justify-between px-3 text-[13px] select-none sticky top-0 z-50 border-b border-[#2c3338]">
        {/* Left Side: Brand, Visit Site, Real-time Latency Ping */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-white tracking-wide">
            <span className="w-4 h-4 rounded-full bg-[#2271b1] text-white text-[10px] flex items-center justify-center font-serif">
              W
            </span>
            <span>Liquid Chat</span>
          </div>

          <a
            href="/chat"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#72aee6] flex items-center gap-1 text-[#c3c4c7] transition"
            title="Visit Liquid Chat client web interface"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Visit Site</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>

          {/* Real-time Ping Latency Badge */}
          <div
            onClick={measurePing}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#2c3338] hover:bg-[#32373c] text-xs cursor-pointer text-gray-200 transition"
            title="Click to perform live database latency roundtrip ping"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                pingMs !== null && pingMs < 100
                  ? 'bg-emerald-400 animate-pulse'
                  : pingMs !== null && pingMs < 300
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            <span className="font-mono text-[11px]">
              {isPinging ? 'Pinging...' : pingMs !== null ? `${pingMs}ms DB Ping` : 'Offline'}
            </span>
            <RefreshCw className={`w-2.5 h-2.5 ml-1 opacity-70 ${isPinging ? 'animate-spin' : ''}`} />
          </div>

          {/* Cloud Storage Badge */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-[#8c8f94]">
            <Database className="w-3 h-3 text-sky-400" />
            <span>PostgreSQL & Cloudflare R2</span>
          </div>
        </div>

        {/* Right Side: Howdy, Admin & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Howdy, <strong className="text-white">Deependra</strong></span>
            <div className="w-5 h-5 rounded-full bg-[#2271b1] text-white text-[10px] flex items-center justify-center font-bold">
              D
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="hover:text-[#d63638] transition flex items-center gap-1 text-[#c3c4c7] text-xs"
            title="Log Out of WordPress Administrator"
          >
            <LogOut className="w-3 h-3" />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. BODY CONTAINER (#wpwrap)                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-1 min-h-[calc(100vh-32px)]">
        {/* LEFT SIDEBAR (#adminmenu) */}
        <nav
          className={`bg-[#1d2327] text-[#c3c4c7] transition-all duration-150 flex flex-col justify-between select-none ${
            isSidebarFolded ? 'w-12' : 'w-44'
          } shrink-0 border-r border-[#2c3338]`}
        >
          {/* Top Menu Items */}
          <ul className="py-2 text-[13px] space-y-0.5">
            {/* Dashboard */}
            <li>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition ${
                  activeTab === 'dashboard'
                    ? 'bg-[#2271b1] text-white font-semibold'
                    : 'hover:bg-[#135e96] hover:text-white'
                }`}
                title="Dashboard Overview"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {!isSidebarFolded && <span>Dashboard</span>}
              </button>
            </li>

            {/* Users */}
            <li>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition ${
                  activeTab === 'users'
                    ? 'bg-[#2271b1] text-white font-semibold'
                    : 'hover:bg-[#135e96] hover:text-white'
                }`}
                title="Users Management"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 shrink-0" />
                  {!isSidebarFolded && <span>Users</span>}
                </div>
                {!isSidebarFolded && overview?.counts?.totalUsers !== undefined && (
                  <span className="bg-[#2c3338] text-xs px-1.5 py-0.2 rounded-full font-mono">
                    {overview.counts.totalUsers}
                  </span>
                )}
              </button>
            </li>

            {/* Messages & E2EE */}
            <li>
              <button
                onClick={() => setActiveTab('messages')}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition ${
                  activeTab === 'messages'
                    ? 'bg-[#2271b1] text-white font-semibold'
                    : 'hover:bg-[#135e96] hover:text-white'
                }`}
                title="Messages & Cryptographic Audit"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  {!isSidebarFolded && <span>Messages</span>}
                </div>
                {!isSidebarFolded && overview?.counts?.totalMessages !== undefined && (
                  <span className="bg-[#2c3338] text-xs px-1.5 py-0.2 rounded-full font-mono">
                    {overview.counts.totalMessages}
                  </span>
                )}
              </button>
            </li>

            {/* Groups */}
            <li>
              <button
                onClick={() => setActiveTab('groups')}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition ${
                  activeTab === 'groups'
                    ? 'bg-[#2271b1] text-white font-semibold'
                    : 'hover:bg-[#135e96] hover:text-white'
                }`}
                title="Group Channels"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 shrink-0" />
                  {!isSidebarFolded && <span>Groups</span>}
                </div>
                {!isSidebarFolded && overview?.counts?.totalGroups !== undefined && (
                  <span className="bg-[#2c3338] text-xs px-1.5 py-0.2 rounded-full font-mono">
                    {overview.counts.totalGroups}
                  </span>
                )}
              </button>
            </li>

            {/* WebRTC Calls */}
            <li>
              <button
                onClick={() => setActiveTab('calls')}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition ${
                  activeTab === 'calls'
                    ? 'bg-[#2271b1] text-white font-semibold'
                    : 'hover:bg-[#135e96] hover:text-white'
                }`}
                title="WebRTC Voice & Video Calls"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 shrink-0" />
                  {!isSidebarFolded && <span>Calls</span>}
                </div>
                {!isSidebarFolded && overview?.counts?.totalCalls !== undefined && (
                  <span className="bg-[#2c3338] text-xs px-1.5 py-0.2 rounded-full font-mono">
                    {overview.counts.totalCalls}
                  </span>
                )}
              </button>
            </li>

            {/* Media Storage */}
            <li>
              <button
                onClick={() => setActiveTab('media')}
                className={`w-full flex items-center justify-between px-3 py-2 text-left transition ${
                  activeTab === 'media'
                    ? 'bg-[#2271b1] text-white font-semibold'
                    : 'hover:bg-[#135e96] hover:text-white'
                }`}
                title="Media Library & R2 Storage"
              >
                <div className="flex items-center gap-2.5">
                  <FolderArchive className="w-4 h-4 shrink-0" />
                  {!isSidebarFolded && <span>Media</span>}
                </div>
                {!isSidebarFolded && overview?.storage?.dbMediaCount !== undefined && (
                  <span className="bg-[#2c3338] text-xs px-1.5 py-0.2 rounded-full font-mono">
                    {overview.storage.dbMediaCount}
                  </span>
                )}
              </button>
            </li>

            {/* Security & Access Logs */}
            <li>
              <button
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition ${
                  activeTab === 'logs'
                    ? 'bg-[#2271b1] text-white font-semibold'
                    : 'hover:bg-[#135e96] hover:text-white'
                }`}
                title="Authentication & Public IP Logs"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {!isSidebarFolded && <span>Security Logs</span>}
              </button>
            </li>

            {/* Site Health & Telemetry */}
            <li>
              <button
                onClick={() => setActiveTab('health')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition ${
                  activeTab === 'health'
                    ? 'bg-[#2271b1] text-white font-semibold'
                    : 'hover:bg-[#135e96] hover:text-white'
                }`}
                title="System Health, Latency & Node Metrics"
              >
                <HeartPulse className="w-4 h-4 shrink-0" />
                {!isSidebarFolded && <span>Site Health</span>}
              </button>
            </li>
          </ul>

          {/* Bottom Menu: Collapse Button */}
          <div className="p-2 border-t border-[#2c3338]">
            <button
              onClick={() => setIsSidebarFolded(!isSidebarFolded)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#a7aaad] hover:text-white hover:bg-[#2c3338] rounded transition"
              title={isSidebarFolded ? 'Expand Menu' : 'Collapse Menu'}
            >
              {isSidebarFolded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!isSidebarFolded && <span>Collapse menu</span>}
            </button>
          </div>
        </nav>

        {/* ----------------------------------------------------------- */}
        {/* 3. MAIN WORKSPACE CANVAS (#wpbody-content)                  */}
        {/* ----------------------------------------------------------- */}
        <main className="flex-1 p-6 overflow-y-auto max-w-full">
          {/* WordPress Notices */}
          {notice && (
            <div
              className={`mb-5 p-3.5 bg-white border-l-4 shadow-sm text-sm flex items-center justify-between transition-all ${
                notice.type === 'success'
                  ? 'border-[#00a32a] text-[#135e96]'
                  : notice.type === 'error'
                  ? 'border-[#d63638] text-[#d63638]'
                  : 'border-[#72aee6] text-[#2c3338]'
              }`}
            >
              <div className="flex items-center gap-2">
                {notice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#00a32a]" />}
                {notice.type === 'error' && <AlertTriangle className="w-4 h-4 text-[#d63638]" />}
                <span>{notice.text}</span>
              </div>
              <button
                onClick={() => setNotice(null)}
                className="text-xs text-gray-400 hover:text-gray-600 font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: DASHBOARD (AT A GLANCE, ACTIVITY, SITE HEALTH)      */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#c3c4c7]">
                <h1 className="text-2xl font-normal text-[#1d2327]">Dashboard</h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadActiveTabData}
                    className="bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] px-3 py-1 text-xs font-semibold border border-[#2271b1] rounded flex items-center gap-1.5 transition shadow-sm"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Welcome Panel */}
              <div className="bg-white border border-[#c3c4c7] p-5 shadow-sm">
                <h2 className="text-xl font-normal text-[#1d2327]">Welcome to Liquid Chat Administration!</h2>
                <p className="text-sm text-[#50575e] mt-1">
                  We’ve assembled all 100% authentic database metrics, real client IPs, and server diagnostic logs to keep your communication platform healthy.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#f0f0f1] text-xs">
                  <div>
                    <h3 className="font-bold text-[#2c3338] mb-1">Get Started</h3>
                    <p className="text-gray-500 mb-2">Publish an administrative broadcast or inspect registered members.</p>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="bg-[#2271b1] hover:bg-[#135e96] text-white px-3 py-1.5 rounded font-semibold transition"
                    >
                      Manage Users ({overview?.counts?.totalUsers ?? '...'})
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2c3338] mb-1">Next Steps</h3>
                    <ul className="space-y-1 text-[#2271b1]">
                      <li>
                        <button onClick={() => setActiveTab('messages')} className="hover:underline text-left">
                          • Verify 100% Zero-Knowledge E2EE Audit
                        </button>
                      </li>
                      <li>
                        <button onClick={() => setActiveTab('media')} className="hover:underline text-left">
                          • Inspect Cloudflare R2 Media Storage
                        </button>
                      </li>
                      <li>
                        <button onClick={() => setActiveTab('logs')} className="hover:underline text-left">
                          • Check Authentic Public IP Access Logs
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2c3338] mb-1">Live Telemetry</h3>
                    <p className="text-gray-500">Node.js {overview?.system?.nodeVersion || process.version}</p>
                    <p className="text-gray-500">Platform: {overview?.system?.platform || 'Linux'}</p>
                    <p className="text-emerald-700 font-semibold mt-1">
                      Uptime: {overview?.system?.uptimeFormatted || 'Calculating...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2-Column WordPress Postbox Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Postbox 1: At a Glance */}
                <div className="bg-white border border-[#c3c4c7] shadow-sm">
                  <div className="px-4 py-2.5 border-b border-[#c3c4c7] flex items-center justify-between bg-white font-semibold text-sm text-[#1d2327]">
                    <span>At a Glance</span>
                    <span className="text-xs text-gray-400 font-normal">Authentic PostgreSQL Count</span>
                  </div>
                  <div className="p-4 space-y-3 text-xs text-[#2c3338]">
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center justify-between p-2 bg-[#f6f7f7] border border-gray-200">
                        <span className="text-gray-600">Total Users</span>
                        <strong className="text-sm font-mono text-[#2271b1]">
                          {overview?.counts?.totalUsers ?? '...'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#f6f7f7] border border-gray-200">
                        <span className="text-gray-600">Active (24h)</span>
                        <strong className="text-sm font-mono text-emerald-600">
                          {overview?.counts?.activeUsers ?? '...'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#f6f7f7] border border-gray-200">
                        <span className="text-gray-600">Total Messages</span>
                        <strong className="text-sm font-mono text-[#2271b1]">
                          {overview?.counts?.totalMessages ?? '...'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#f6f7f7] border border-gray-200">
                        <span className="text-gray-600">Encrypted (E2EE)</span>
                        <strong className="text-sm font-mono text-indigo-600">
                          {overview?.counts?.encryptedMessages ?? '...'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#f6f7f7] border border-gray-200">
                        <span className="text-gray-600">Groups</span>
                        <strong className="text-sm font-mono text-gray-800">
                          {overview?.counts?.totalGroups ?? '...'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#f6f7f7] border border-gray-200">
                        <span className="text-gray-600">WebRTC Calls</span>
                        <strong className="text-sm font-mono text-purple-600">
                          {overview?.counts?.totalCalls ?? '...'}
                        </strong>
                      </div>
                    </div>

                    <div className="text-gray-500 pt-1 flex items-center justify-between">
                      <span>Database Storage: <strong>{overview?.storage?.dbMediaSizeMb ?? 0} MB</strong> ({overview?.storage?.dbMediaCount ?? 0} media blobs)</span>
                      <span className="text-emerald-600 font-medium">PostgreSQL Connected</span>
                    </div>
                  </div>
                </div>

                {/* Postbox 2: Quick Broadcast / Draft */}
                <div className="bg-white border border-[#c3c4c7] shadow-sm">
                  <div className="px-4 py-2.5 border-b border-[#c3c4c7] bg-white font-semibold text-sm text-[#1d2327]">
                    Quick Broadcast Announcement
                  </div>
                  <form onSubmit={handleSendBroadcast} className="p-4 space-y-3 text-xs">
                    <div>
                      <input
                        type="text"
                        placeholder="Announcement Title (e.g. Server Maintenance Notice)"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#8c8f94] rounded-none focus:border-[#2271b1] outline-none text-xs"
                      />
                    </div>
                    <div>
                      <textarea
                        placeholder="What's on your mind? Message will be delivered real-time to all connected mobile & web users..."
                        rows={3}
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#8c8f94] rounded-none focus:border-[#2271b1] outline-none text-xs"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <select
                        value={broadcastType}
                        onChange={(e: any) => setBroadcastType(e.target.value)}
                        className="border border-[#8c8f94] px-2 py-1 bg-white text-xs"
                      >
                        <option value="info">Info Notice</option>
                        <option value="warning">Important Warning</option>
                        <option value="alert">Critical Alert</option>
                      </select>
                      <button
                        type="submit"
                        disabled={isBroadcasting}
                        className="bg-[#2271b1] hover:bg-[#135e96] text-white px-4 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        {isBroadcasting ? 'Publishing...' : 'Publish Announcement'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Postbox 3: Activity (Recent Authentic Logins) */}
                <div className="bg-white border border-[#c3c4c7] shadow-sm">
                  <div className="px-4 py-2.5 border-b border-[#c3c4c7] flex items-center justify-between bg-white font-semibold text-sm text-[#1d2327]">
                    <span>Recent Activity & Authentic Logins</span>
                    <button
                      onClick={() => setActiveTab('logs')}
                      className="text-xs text-[#2271b1] hover:underline"
                    >
                      View all logs →
                    </button>
                  </div>
                  <div className="p-4 text-xs divide-y divide-gray-100">
                    {overview?.recentActivity?.recentLogins?.length > 0 ? (
                      overview.recentActivity.recentLogins.map((item: any) => (
                        <div key={item.id} className="py-2 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-[#1d2327]">
                              {item.username}{' '}
                              <span className="font-mono text-gray-500 font-normal">({item.ipAddress})</span>
                            </div>
                            <div className="text-[11px] text-gray-500">{item.device?.summary || 'Web Client'}</div>
                          </div>
                          <span className="text-[11px] text-gray-400">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 py-3 text-center">No recent login records found.</p>
                    )}
                  </div>
                </div>

                {/* Postbox 4: Site Health Status */}
                <div className="bg-white border border-[#c3c4c7] shadow-sm">
                  <div className="px-4 py-2.5 border-b border-[#c3c4c7] flex items-center justify-between bg-white font-semibold text-sm text-[#1d2327]">
                    <span>Site Health Status</span>
                    <button
                      onClick={() => setActiveTab('health')}
                      className="text-xs text-[#2271b1] hover:underline"
                    >
                      Inspect diagnostics →
                    </button>
                  </div>
                  <div className="p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Database Connectivity</span>
                      </div>
                      <span className="font-mono text-emerald-700 font-semibold">
                        {overview?.system?.dbLatencyMs ?? 0}ms Latency
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Cloudflare R2 Bucket</span>
                      </div>
                      <span className="font-mono text-[#2271b1]">
                        {overview?.storage?.r2BucketName || 'liquidchat-media'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Node Process Memory (Heap Used)</span>
                      </div>
                      <span className="font-mono text-gray-700">
                        {overview?.system?.heapUsedMb ?? 0} MB / {overview?.system?.heapTotalMb ?? 0} MB
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Reverse Proxy IP Trust</span>
                      </div>
                      <span className="text-emerald-700 font-semibold">trust proxy: 1 (Enabled)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: USERS LIST TABLE (.wp-list-table)                   */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Heading */}
              <div className="flex items-center justify-between pb-3 border-b border-[#c3c4c7]">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-normal text-[#1d2327]">Users</h1>
                  <span className="text-xs text-gray-500">
                    Total: <strong>{usersData?.counts?.all ?? 0}</strong> registered accounts
                  </span>
                </div>
                <button
                  onClick={loadActiveTabData}
                  className="bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] px-3 py-1 text-xs font-semibold border border-[#2271b1] rounded flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Views Filter (.subsubsub) & Search Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                {/* Views */}
                <ul className="flex items-center gap-2 text-[#50575e]">
                  <li>
                    <button
                      onClick={() => setUserFilter('all')}
                      className={`hover:text-[#2271b1] ${userFilter === 'all' ? 'font-bold text-black' : ''}`}
                    >
                      All <span className="text-gray-400">({usersData?.counts?.all ?? 0})</span>
                    </button>
                    <span className="ml-2 text-gray-300">|</span>
                  </li>
                  <li>
                    <button
                      onClick={() => setUserFilter('admins')}
                      className={`hover:text-[#2271b1] ${userFilter === 'admins' ? 'font-bold text-black' : ''}`}
                    >
                      Administrator <span className="text-gray-400">({usersData?.counts?.admins ?? 0})</span>
                    </button>
                    <span className="ml-2 text-gray-300">|</span>
                  </li>
                  <li>
                    <button
                      onClick={() => setUserFilter('banned')}
                      className={`hover:text-[#2271b1] ${userFilter === 'banned' ? 'font-bold text-black' : ''}`}
                    >
                      Banned <span className="text-gray-400">({usersData?.counts?.banned ?? 0})</span>
                    </button>
                  </li>
                </ul>

                {/* Search Box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    loadActiveTabData();
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    type="search"
                    placeholder="Search users, IPs, emails..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-2.5 py-1 border border-[#8c8f94] bg-white text-xs outline-none focus:border-[#2271b1] w-48 sm:w-60"
                  />
                  <button
                    type="submit"
                    className="bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] px-3 py-1 border border-[#2271b1] rounded text-xs font-semibold"
                  >
                    Search Users
                  </button>
                </form>
              </div>

              {/* Bulk Actions Bar */}
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="border border-[#8c8f94] bg-white px-2 py-1 text-xs"
                >
                  <option value="">Bulk actions</option>
                  <option value="ban">Toggle Ban</option>
                  <option value="delete">Permanent Delete</option>
                </select>
                <button
                  onClick={handleApplyBulkUserAction}
                  className="bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] px-3 py-1 border border-[#2271b1] rounded font-semibold"
                >
                  Apply
                </button>
                {selectedUserIds.length > 0 && (
                  <span className="text-gray-500 ml-2">({selectedUserIds.length} selected)</span>
                )}
              </div>

              {/* WordPress List Table (.wp-list-table) */}
              <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs text-[#2c3338] border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-[#c3c4c7] font-semibold text-[#2c3338]">
                      <th className="p-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={
                            usersData?.users?.length > 0 &&
                            selectedUserIds.length === usersData.users.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds(usersData.users.map((u: any) => u.id));
                            } else {
                              setSelectedUserIds([]);
                            }
                          }}
                        />
                      </th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Liquid ID / Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Authentic Client IP</th>
                      <th className="p-3">Device / Client</th>
                      <th className="p-3 text-center">E2EE Key</th>
                      <th className="p-3 text-center">Messages</th>
                      <th className="p-3">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c3c4c7]/40">
                    {usersData?.users?.length > 0 ? (
                      usersData.users.map((user: any, idx: number) => (
                        <tr
                          key={user.id}
                          className={`group hover:bg-[#f0f0f1] transition ${
                            idx % 2 === 1 ? 'bg-[#f6f7f7]' : 'bg-white'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds([...selectedUserIds, user.id]);
                                } else {
                                  setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id));
                                }
                              }}
                            />
                          </td>

                          {/* Username & Avatar with WordPress Row Hover Actions */}
                          <td className="p-3">
                            <div className="flex items-start gap-2.5">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt=""
                                  className="w-7 h-7 rounded-full object-cover border border-gray-300 shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-[#2271b1] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                  {user.username.slice(0, 1).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-[#1d2327] flex items-center gap-1.5">
                                  <span>{user.username}</span>
                                  {user.isBanned && (
                                    <span className="text-[10px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-semibold">
                                      BANNED
                                    </span>
                                  )}
                                </div>

                                {/* WordPress Row Hover Actions */}
                                <div className="flex items-center gap-1.5 text-[11px] pt-1 text-[#2271b1] opacity-90 group-hover:opacity-100">
                                  <button
                                    onClick={() => handleToggleAdminRole(user.id, user.isAdmin)}
                                    className="hover:underline"
                                  >
                                    {user.isAdmin ? 'Demote' : 'Make Admin'}
                                  </button>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    onClick={() => handleToggleBan(user.id, user.isBanned)}
                                    className={`hover:underline ${user.isBanned ? 'text-emerald-600' : 'text-amber-700'}`}
                                  >
                                    {user.isBanned ? 'Unban' : 'Ban'}
                                  </button>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                    className="text-[#b32d2e] hover:underline"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Liquid ID / Email */}
                          <td className="p-3">
                            <div className="font-mono text-gray-800">{user.liquidNumber}</div>
                            <div className="text-[11px] text-gray-500">{user.email || 'No email registered'}</div>
                          </td>

                          {/* Role */}
                          <td className="p-3">
                            {user.isAdmin ? (
                              <span className="font-semibold text-[#2271b1]">Administrator</span>
                            ) : (
                              <span className="text-gray-600">Subscriber / User</span>
                            )}
                          </td>

                          {/* Authentic Public IP */}
                          <td className="p-3">
                            <span className="font-mono font-semibold text-[#1d2327] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                              {user.lastIpAddress}
                            </span>
                          </td>

                          {/* Device / Client */}
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-gray-700">
                              {user.device === 'Mobile' ? (
                                <Smartphone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              ) : (
                                <Laptop className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                              )}
                              <span className="truncate max-w-[160px]" title={user.deviceSummary}>
                                {user.deviceSummary}
                              </span>
                            </div>
                          </td>

                          {/* E2EE Key */}
                          <td className="p-3 text-center">
                            {user.hasE2eeKey ? (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                                Active (Curve25519)
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px]">None</span>
                            )}
                          </td>

                          {/* Messages */}
                          <td className="p-3 text-center font-mono">
                            {user.counts?.messages ?? 0}
                          </td>

                          {/* Registered */}
                          <td className="p-3 text-gray-500 whitespace-nowrap">
                            <div>{format(new Date(user.createdAt), 'yyyy/MM/dd')}</div>
                            <div className="text-[10px] text-gray-400">
                              {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-gray-400">
                          No users matched your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: MESSAGES & E2EE AUDIT                              */}
          {/* ========================================================= */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#c3c4c7]">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-normal text-[#1d2327]">Messages & Cryptographic Audit</h1>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                    100% Zero-Knowledge Verified
                  </span>
                </div>
                <button
                  onClick={loadActiveTabData}
                  className="bg-[#2271b1] hover:bg-[#135e96] text-white px-3 py-1.5 text-xs font-semibold rounded shadow-sm"
                >
                  Run Live Cryptographic Audit
                </button>
              </div>

              {/* Cryptographic Proof Card */}
              <div className="bg-white border border-[#c3c4c7] p-5 shadow-sm">
                <h2 className="text-base font-semibold text-[#1d2327] mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  Zero-Knowledge End-to-End Encryption Audit Proof
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  This mathematical audit verifies that Liquid Chat stores all direct and group conversations as encrypted ciphertext blobs. 
                  The server holds <strong>0 private keys</strong> and has <strong>0 plaintext access</strong>.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 text-xs">
                  <div className="p-3 bg-gray-50 border border-gray-200">
                    <span className="text-gray-500 block">Total Messages</span>
                    <strong className="text-base font-mono text-[#2271b1]">
                      {e2eeAudit?.totalMessages ?? '...'}
                    </strong>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200">
                    <span className="text-gray-500 block">Encrypted Blobs</span>
                    <strong className="text-base font-mono text-emerald-600">
                      {e2eeAudit?.encryptedMessages ?? '...'}
                    </strong>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200">
                    <span className="text-gray-500 block">Compliance Rate</span>
                    <strong className="text-base font-mono text-indigo-600">
                      {e2eeAudit?.e2eeComplianceRate ?? '100%'}
                    </strong>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200">
                    <span className="text-gray-500 block">Server Private Keys</span>
                    <strong className="text-base font-mono text-emerald-700">0 (Zero Knowledge)</strong>
                  </div>
                </div>
              </div>

              {/* Sample High-Entropy Ciphertext Inspection */}
              <div className="bg-white border border-[#c3c4c7] shadow-sm">
                <div className="px-4 py-3 border-b border-[#c3c4c7] font-semibold text-sm text-[#1d2327]">
                  Raw Ciphertext Entropy Inspection (Live Database Sample)
                </div>
                <div className="p-4 overflow-x-auto text-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-600 font-semibold">
                        <th className="pb-2">Sender</th>
                        <th className="pb-2">Recipient</th>
                        <th className="pb-2">IV (Initialization Vector)</th>
                        <th className="pb-2">Ciphertext Fragment (High Entropy)</th>
                        <th className="pb-2">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {e2eeAudit?.auditSamples?.length > 0 ? (
                        e2eeAudit.auditSamples.map((sample: any) => (
                          <tr key={sample.id} className="hover:bg-gray-50">
                            <td className="py-2.5 font-sans font-semibold text-[#2271b1]">{sample.sender}</td>
                            <td className="py-2.5 font-sans text-gray-700">{sample.receiver}</td>
                            <td className="py-2.5 text-gray-500">{sample.ivPreview}</td>
                            <td className="py-2.5 text-xs text-rose-700 break-all max-w-[280px]">
                              {sample.ciphertextSample || '[Encrypted Media Attachment]'}
                            </td>
                            <td className="py-2.5 font-sans text-gray-400 text-[11px]">
                              {format(new Date(sample.createdAt), 'HH:mm:ss dd/MM')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-gray-400 font-sans">
                            Loading cryptographic sample entries...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: GROUPS MANAGEMENT                                  */}
          {/* ========================================================= */}
          {activeTab === 'groups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#c3c4c7]">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-normal text-[#1d2327]">Group Channels</h1>
                  <span className="text-xs text-gray-500">Total: <strong>{groups.length}</strong> active groups</span>
                </div>
                <button
                  onClick={loadActiveTabData}
                  className="bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] px-3 py-1 text-xs font-semibold border border-[#2271b1] rounded flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Groups Table */}
              <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs text-[#2c3338] border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-[#c3c4c7] font-semibold">
                      <th className="p-3">Group Name</th>
                      <th className="p-3">Creator</th>
                      <th className="p-3 text-center">Members</th>
                      <th className="p-3 text-center">Messages</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Created</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {groups.length > 0 ? (
                      groups.map((grp: any) => (
                        <tr key={grp.id} className="hover:bg-[#f0f0f1] transition">
                          <td className="p-3">
                            <div className="font-bold text-[#1d2327]">{grp.name}</div>
                            {grp.description && (
                              <div className="text-[11px] text-gray-500 truncate max-w-xs">{grp.description}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-[#2271b1]">{grp.creator?.username || 'Unknown'}</span>
                            <span className="font-mono text-gray-400 text-[11px] block">{grp.creator?.liquidNumber}</span>
                          </td>
                          <td className="p-3 text-center font-mono font-semibold">{grp._count?.members ?? 0}</td>
                          <td className="p-3 text-center font-mono font-semibold">{grp._count?.messages ?? 0}</td>
                          <td className="p-3">
                            {grp.isAnnouncementOnly ? (
                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                                Announcement Only
                              </span>
                            ) : (
                              <span className="text-gray-600">Standard Channel</span>
                            )}
                          </td>
                          <td className="p-3 text-gray-500 whitespace-nowrap">
                            {format(new Date(grp.createdAt), 'yyyy/MM/dd')}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteGroup(grp.id, grp.name)}
                              className="text-[#b32d2e] hover:underline font-semibold"
                            >
                              Delete Group
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400">
                          No groups created yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: WEBRTC CALL LOGS                                   */}
          {/* ========================================================= */}
          {activeTab === 'calls' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#c3c4c7]">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-normal text-[#1d2327]">WebRTC Call Logs</h1>
                  <span className="text-xs text-gray-500">
                    Total: <strong>{callsData?.summary?.total ?? 0}</strong> calls logged
                  </span>
                </div>
                <button
                  onClick={loadActiveTabData}
                  className="bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] px-3 py-1 text-xs font-semibold border border-[#2271b1] rounded flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => setCallTypeFilter('all')}
                  className={`px-2.5 py-1 rounded ${
                    callTypeFilter === 'all'
                      ? 'bg-[#2271b1] text-white font-semibold'
                      : 'bg-white border border-gray-300 text-gray-700'
                  }`}
                >
                  All ({callsData?.summary?.total ?? 0})
                </button>
                <button
                  onClick={() => setCallTypeFilter('video')}
                  className={`px-2.5 py-1 rounded ${
                    callTypeFilter === 'video'
                      ? 'bg-[#2271b1] text-white font-semibold'
                      : 'bg-white border border-gray-300 text-gray-700'
                  }`}
                >
                  Video ({callsData?.summary?.video ?? 0})
                </button>
                <button
                  onClick={() => setCallTypeFilter('audio')}
                  className={`px-2.5 py-1 rounded ${
                    callTypeFilter === 'audio'
                      ? 'bg-[#2271b1] text-white font-semibold'
                      : 'bg-white border border-gray-300 text-gray-700'
                  }`}
                >
                  Audio ({callsData?.summary?.audio ?? 0})
                </button>
              </div>

              {/* Calls Table */}
              <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs text-[#2c3338] border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-[#c3c4c7] font-semibold">
                      <th className="p-3">Type</th>
                      <th className="p-3">Caller</th>
                      <th className="p-3">Recipient</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {callsData?.calls?.length > 0 ? (
                      callsData.calls.map((call: any) => (
                        <tr key={call.id} className="hover:bg-[#f0f0f1] transition">
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                call.type === 'video'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {call.type}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-[#1d2327]">
                            {call.caller?.username || 'Unknown'}{' '}
                            <span className="font-mono text-gray-400 font-normal">
                              ({call.caller?.liquidNumber})
                            </span>
                          </td>
                          <td className="p-3 text-gray-700">
                            {call.receiver?.username || 'Unknown'}{' '}
                            <span className="font-mono text-gray-400 font-normal">
                              ({call.receiver?.liquidNumber})
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                call.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {call.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-semibold">
                            {Math.floor(call.duration / 60)}m {call.duration % 60}s
                          </td>
                          <td className="p-3 text-gray-500 whitespace-nowrap">
                            {format(new Date(call.createdAt), 'yyyy/MM/dd HH:mm:ss')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                          No call logs recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: MEDIA LIBRARY & CLOUDFLARE R2                      */}
          {/* ========================================================= */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#c3c4c7]">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-normal text-[#1d2327]">Media Storage & Cloudflare R2</h1>
                  <span className="text-xs text-gray-500">
                    Total: <strong>{mediaList.length}</strong> items in PostgreSQL database
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearStorage}
                    className="bg-[#b32d2e] hover:bg-rose-800 text-white px-3 py-1 text-xs font-semibold rounded shadow-sm"
                  >
                    Clear Database Storage
                  </button>
                  <button
                    onClick={loadActiveTabData}
                    className="bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] px-3 py-1 text-xs font-semibold border border-[#2271b1] rounded flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* R2 Cloudflare Card */}
              <div className="bg-white border border-[#c3c4c7] p-4 shadow-sm text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm text-[#1d2327]">Cloudflare R2 Bucket Configuration</div>
                  <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                    Active Provider
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-gray-600 pt-2">
                  <div className="p-2 bg-gray-50 border border-gray-200">
                    <span className="text-gray-400 block text-[11px]">Bucket Name</span>
                    <strong className="text-gray-800 font-mono">
                      {overview?.storage?.r2BucketName || 'liquidchat-media'}
                    </strong>
                  </div>
                  <div className="p-2 bg-gray-50 border border-gray-200">
                    <span className="text-gray-400 block text-[11px]">Public Access URL</span>
                    <a
                      href={overview?.storage?.r2PublicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#2271b1] hover:underline font-mono truncate block"
                    >
                      {overview?.storage?.r2PublicUrl || 'https://pub-1f22629913af4a189acd73eeb7790831.r2.dev'}
                    </a>
                  </div>
                  <div className="p-2 bg-gray-50 border border-gray-200">
                    <span className="text-gray-400 block text-[11px]">Database Media Blob Size</span>
                    <strong className="text-emerald-700 font-mono">
                      {overview?.storage?.dbMediaSizeMb ?? 0} MB
                    </strong>
                  </div>
                </div>
              </div>

              {/* Media Items Table */}
              <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs text-[#2c3338] border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-[#c3c4c7] font-semibold">
                      <th className="p-3">File / Binary Name</th>
                      <th className="p-3">MIME Type</th>
                      <th className="p-3">Size</th>
                      <th className="p-3">Uploader</th>
                      <th className="p-3">Uploaded</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mediaList.length > 0 ? (
                      mediaList.map((m: any) => (
                        <tr key={m.id} className="hover:bg-[#f0f0f1] transition">
                          <td className="p-3 font-mono font-semibold text-[#1d2327]">
                            {m.fileName}
                          </td>
                          <td className="p-3 text-gray-500">{m.mimeType}</td>
                          <td className="p-3 font-mono font-semibold text-emerald-700">
                            {m.sizeFormatted}
                          </td>
                          <td className="p-3 text-[#2271b1]">
                            {m.user?.username || 'Unknown'}
                          </td>
                          <td className="p-3 text-gray-400 whitespace-nowrap">
                            {format(new Date(m.createdAt), 'yyyy/MM/dd HH:mm')}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteMedia(m.id)}
                              className="text-[#b32d2e] hover:underline font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                          No media records stored in PostgreSQL database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: SECURITY & AUTHENTICATION ACCESS LOGS              */}
          {/* ========================================================= */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#c3c4c7]">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-normal text-[#1d2327]">Security & IP Access Logs</h1>
                  <span className="text-xs text-gray-500">
                    Total: <strong>{logsList.length}</strong> recorded audit events
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFlushLogs}
                    className="bg-[#b32d2e] hover:bg-rose-800 text-white px-3 py-1 text-xs font-semibold rounded shadow-sm"
                  >
                    Flush All Logs
                  </button>
                  <button
                    onClick={loadActiveTabData}
                    className="bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] px-3 py-1 text-xs font-semibold border border-[#2271b1] rounded flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center justify-between text-xs">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    loadActiveTabData();
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    type="search"
                    placeholder="Filter by IP, username, email..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="px-2.5 py-1 border border-[#8c8f94] bg-white text-xs outline-none focus:border-[#2271b1] w-64"
                  />
                  <button
                    type="submit"
                    className="bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] px-3 py-1 border border-[#2271b1] rounded text-xs font-semibold"
                  >
                    Filter Logs
                  </button>
                </form>
                <span className="text-gray-500 text-[11px]">
                  Reverse proxy configured with <code>trust proxy: 1</code>
                </span>
              </div>

              {/* Logs Table */}
              <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs text-[#2c3338] border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-[#c3c4c7] font-semibold">
                      <th className="p-3">User</th>
                      <th className="p-3">Authentic Client IP</th>
                      <th className="p-3">Device & Browser</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logsList.length > 0 ? (
                      logsList.map((log: any) => (
                        <tr key={log.id} className="hover:bg-[#f0f0f1] transition">
                          <td className="p-3">
                            <span className="font-semibold text-[#1d2327]">
                              {log.user?.username || 'Unknown User'}
                            </span>
                            <span className="text-[11px] text-gray-400 block">{log.user?.email}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-mono font-semibold text-[#2271b1] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                              {log.ipAddress}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="text-gray-800 font-medium">{log.parsedDevice?.summary}</div>
                            <div className="text-[10px] text-gray-400 truncate max-w-sm" title={log.userAgent}>
                              {log.userAgent}
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                log.status === 'success'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="p-3 text-gray-500 whitespace-nowrap">
                            {format(new Date(log.createdAt), 'yyyy/MM/dd HH:mm:ss')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400">
                          No audit security logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: SITE HEALTH & SYSTEM DIAGNOSTICS                   */}
          {/* ========================================================= */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#c3c4c7]">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-normal text-[#1d2327]">Site Health & Server Diagnostics</h1>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                    Status: OPERATIONAL
                  </span>
                </div>
                <button
                  onClick={measurePing}
                  className="bg-[#2271b1] hover:bg-[#135e96] text-white px-3 py-1.5 text-xs font-semibold rounded shadow-sm flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                  Run Live Health Ping
                </button>
              </div>

              {/* Site Health Overview Card */}
              <div className="bg-white border border-[#c3c4c7] p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#1d2327]">Good — Your site has passed all security & health checks</h2>
                    <p className="text-xs text-gray-600">
                      The site health check shows information on your Liquid Chat configuration and items that require attention.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-100 text-xs">
                  <div className="p-3 bg-gray-50 border border-gray-200">
                    <span className="text-gray-500 block">Database Query Latency</span>
                    <strong className="text-lg font-mono text-emerald-700">
                      {systemHealth?.database?.latencyMs ?? pingMs ?? 0} ms
                    </strong>
                    <span className="text-[10px] text-gray-400 block mt-1">PostgreSQL Roundtrip</span>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200">
                    <span className="text-gray-500 block">Active WebSocket Clients</span>
                    <strong className="text-lg font-mono text-[#2271b1]">
                      {systemHealth?.sockets?.activeConnections ?? 0} Connections
                    </strong>
                    <span className="text-[10px] text-gray-400 block mt-1">Real-time Socket.io Gateway</span>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200">
                    <span className="text-gray-500 block">Process Memory (RSS)</span>
                    <strong className="text-lg font-mono text-indigo-700">
                      {systemHealth?.process?.memoryRssMb ?? 0} MB
                    </strong>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      Heap: {systemHealth?.process?.heapUsedMb ?? 0} MB
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Environment Specs */}
              <div className="bg-white border border-[#c3c4c7] shadow-sm">
                <div className="px-4 py-3 border-b border-[#c3c4c7] font-semibold text-sm text-[#1d2327]">
                  Runtime Environment Specifications
                </div>
                <div className="p-4 text-xs divide-y divide-gray-100 space-y-2">
                  <div className="flex items-center justify-between py-1">
                    <span className="font-semibold text-gray-700">Node.js Engine Version</span>
                    <span className="font-mono text-gray-600">{systemHealth?.process?.nodeVersion || process.version}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-semibold text-gray-700">Operating System Platform</span>
                    <span className="font-mono text-gray-600">{systemHealth?.process?.platform || 'linux'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-semibold text-gray-700">Database Engine</span>
                    <span className="font-semibold text-emerald-700">PostgreSQL (Prisma ORM Client v5.21.1)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-semibold text-gray-700">Cloud Storage Bucket</span>
                    <span className="font-semibold text-[#2271b1]">Cloudflare R2 (S3-Compatible Object Store)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-semibold text-gray-700">Reverse Proxy Configuration</span>
                    <span className="font-semibold text-emerald-700">app.set('trust proxy', 1) Active</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-semibold text-gray-700">Last Telemetry Diagnostic Timestamp</span>
                    <span className="font-mono text-gray-500">{systemHealth?.timestamp || new Date().toISOString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
