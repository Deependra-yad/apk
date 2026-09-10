"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Trash2, Users, Database, Shield, Lock, User, 
  Activity, Image as ImageIcon, LayoutDashboard, 
  Ban, CheckCircle, Search, LogOut, Clock, Smartphone, Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { downloadFile } from '@/utils/apiUrl';

export default function AdminDashboard() {
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'media' | 'logs'>('overview');
  
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

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
      setLoginError('Invalid credentials');
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
    } catch (e) { console.error(e); setIsLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users', getHeaders());
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
      const res = await axios.post(`/api/admin/users/${id}/ban`, {}, getHeaders());
      fetchUsers();
    } catch (e) { alert('Failed to update ban status'); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('WARNING: This completely deletes the user, their messages, groups, and logs forever! Continue?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, getHeaders());
      fetchUsers();
      fetchStats();
    } catch (e) { alert('Failed to delete user'); }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Delete this file permanently?')) return;
    try {
      await axios.delete(`/api/admin/media/${id}`, getHeaders());
      fetchMedia();
      fetchStats();
    } catch (e) { alert('Failed to delete media'); }
  };

  const handleClearStorage = async () => {
    if (!confirm('CRITICAL WARNING: This deletes ALL uploaded files globally across the app to free up space. Continue?')) return;
    try {
      const res = await axios.post('/api/admin/clear-storage', {}, getHeaders());
      alert(res.data.message);
      fetchStats();
      fetchMedia();
    } catch (e) { alert('Failed to clear storage'); }
  };

  if (!isLoggedIn) {
    if (isLoading) return <div className="h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-liquid-accent border-t-transparent rounded-full animate-spin"></div></div>;
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#13131a] p-8 rounded-2xl shadow-2xl border border-white/5">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
              <Shield className="text-blue-500" size={36} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2">LiquidChat Admin</h1>
          <p className="text-gray-400 text-center mb-8 text-sm">Secure Access Required</p>
          
          {loginError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6 text-center">{loginError}</div>}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input type="text" placeholder="Admin Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input type="password" placeholder="Admin Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all mt-4">
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const TabButton = ({ id, icon: Icon, label }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
    >
      <Icon size={20} className={activeTab === id ? 'text-blue-500' : ''} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="h-screen bg-[#0a0a0f] text-gray-200 flex overflow-hidden">
      {/* Sidebar (WordPress Style) */}
      <div className="w-64 bg-[#13131a] border-r border-white/5 flex-col hidden md:flex h-full shrink-0">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Shield className="text-blue-500" size={20} />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">Admin</h2>
              <p className="text-xs text-gray-500">Workspace</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-4 mt-2">Menu</div>
          <TabButton id="overview" icon={LayoutDashboard} label="Dashboard" />
          <TabButton id="users" icon={Users} label="All Users" />
          <TabButton id="media" icon={ImageIcon} label="Media Library" />
          <TabButton id="logs" icon={Activity} label="Login Logs" />
        </div>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden h-full relative">
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
          
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="md:hidden flex items-center justify-between mb-6 bg-[#13131a] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <Shield className="text-blue-500" size={24} />
              <span className="font-bold text-white">Admin</span>
            </div>
            <select 
              value={activeTab} 
              onChange={(e: any) => setActiveTab(e.target.value)}
              className="bg-black/50 border border-white/10 text-white text-sm rounded-lg py-2 px-3 focus:outline-none"
            >
              <option value="overview">Dashboard</option>
              <option value="users">Users</option>
              <option value="media">Media</option>
              <option value="logs">Logs</option>
            </select>
          </div>

          {/* Tab Contents */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#13131a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
                  <Users className="text-blue-400 mb-4" size={28} />
                  <p className="text-gray-400 font-medium mb-1">Total Users</p>
                  <h3 className="text-3xl font-bold text-white">{stats.totalUsers}</h3>
                </div>
                <div className="bg-[#13131a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full group-hover:bg-purple-500/10 transition-colors"></div>
                  <Database className="text-purple-400 mb-4" size={28} />
                  <p className="text-gray-400 font-medium mb-1">Storage Used</p>
                  <h3 className="text-3xl font-bold text-white">{stats.uploadsSizeMb} MB</h3>
                  <p className="text-xs text-gray-500 mt-2">{stats.fileCount} files uploaded</p>
                </div>
                <div className="bg-[#13131a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>
                  <Activity className="text-emerald-400 mb-4" size={28} />
                  <p className="text-gray-400 font-medium mb-1">Messages Sent</p>
                  <h3 className="text-3xl font-bold text-white">{stats.totalMessages}</h3>
                </div>
                <div className="bg-[#13131a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 rounded-full group-hover:bg-orange-500/10 transition-colors"></div>
                  <LayoutDashboard className="text-orange-400 mb-4" size={28} />
                  <p className="text-gray-400 font-medium mb-1">Total Groups</p>
                  <h3 className="text-3xl font-bold text-white">{stats.totalGroups}</h3>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-2xl mt-8">
                <div className="flex items-start gap-4">
                  <div className="bg-red-500/10 p-3 rounded-xl"><Trash2 className="text-red-400" size={24}/></div>
                  <div>
                    <h3 className="text-lg font-bold text-red-400 mb-1">Clear Server Storage</h3>
                    <p className="text-sm text-gray-400 mb-4">Warning: This instantly deletes all user-uploaded photos, videos, and files across the entire platform. This action is irreversible.</p>
                    <button onClick={handleClearStorage} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                      Clear Storage Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Manage Users</h2>
              </div>
              <div className="bg-[#13131a] border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/20 text-gray-400 text-sm">
                        <th className="p-4 font-medium">Username</th>
                        <th className="p-4 font-medium">IP Address</th>
                        <th className="p-4 font-medium text-center">Status</th>
                        <th className="p-4 font-medium">Activity</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold uppercase">
                                {u.username.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-2">
                                  {u.username}
                                  {u.isAdmin && <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">ADMIN</span>}
                                </div>
                                <div className="text-xs text-gray-500">{u.email || 'No email'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-gray-400">
                            {u.lastIpAddress || <span className="text-gray-600 italic">Unknown</span>}
                          </td>
                          <td className="p-4 text-center">
                            {u.isBanned 
                              ? <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 px-2 py-1 rounded-full text-xs font-medium"><Ban size={12}/> Banned</span>
                              : <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full text-xs font-medium"><CheckCircle size={12}/> Active</span>
                            }
                          </td>
                          <td className="p-4 text-gray-400">
                            <div>{u._count.messagesSent} msgs</div>
                            <div className="text-xs text-gray-500">{u._count.mediaUploaded} files</div>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => handleToggleBan(u.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${u.isBanned ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'}`}>
                              {u.isBanned ? 'Unban' : 'Ban'}
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors">
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

          {activeTab === 'media' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-white mb-6">Media Library</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {media.map(m => (
                  <div key={m.id} className="bg-[#13131a] border border-white/5 rounded-xl overflow-hidden group">
                    <div className="h-32 bg-black/50 relative flex items-center justify-center">
                      {m.mimeType?.startsWith('image/') ? (
                        <img src={`/api/upload/${m.id}`} alt="Media" className="w-full h-full object-cover" />
                      ) : m.mimeType?.startsWith('video/') ? (
                        <video src={`/api/upload/${m.id}`} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-gray-600" size={32} />
                      )}
                      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => downloadFile(`/api/upload/${m.id}`, m.fileName || `media_${m.id}`)} 
                          className="w-8 h-8 bg-black/60 rounded-full text-white flex items-center justify-center hover:bg-blue-500 transition-all cursor-pointer"
                          title="Download File"
                        >
                          <Download size={16} />
                        </button>
                        <button onClick={() => handleDeleteMedia(m.id)} className="w-8 h-8 bg-black/60 rounded-full text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-white truncate font-medium" title={m.fileName}>{m.fileName || 'Unnamed File'}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-[10px] text-gray-500">{m.user ? m.user.username : 'Unknown'}</p>
                        <p className="text-[10px] text-gray-500">{(m.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  </div>
                ))}
                {media.length === 0 && <div className="col-span-full py-12 text-center text-gray-500">Media library is empty.</div>}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-white mb-6">Security & Login Logs</h2>
              <div className="bg-[#13131a] border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/20 text-gray-400 text-sm">
                        <th className="p-4 font-medium">User</th>
                        <th className="p-4 font-medium">IP Address</th>
                        <th className="p-4 font-medium">Device / Browser</th>
                        <th className="p-4 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-medium text-white">{log.user?.username || 'Unknown'}</td>
                          <td className="p-4 text-blue-400 font-mono text-xs">{log.ipAddress}</td>
                          <td className="p-4 text-gray-400 max-w-xs truncate" title={log.userAgent}>
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
                  {logs.length === 0 && <div className="p-8 text-center text-gray-500">No logs recorded yet.</div>}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
