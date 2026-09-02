"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Trash2, Users, Database, FileVideo, Shield, Lock, User } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');

  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth');
    if (auth === 'true') setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      fetchUsers();
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Deependra' && password === 'Deependra@123') {
      setIsLoggedIn(true);
      sessionStorage.setItem('adminAuth', 'true');
      sessionStorage.setItem('adminPass', password);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const getHeaders = () => ({
    headers: { 'x-admin-password': sessionStorage.getItem('adminPass') || '' }
  });

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/admin/stats', getHeaders());
      setStats(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users', getHeaders());
      setUsers(res.data);
    } catch (e) { console.error(e); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to completely delete this user?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, getHeaders());
      fetchUsers();
      fetchStats();
    } catch (e) { alert('Failed to delete user'); }
  };

  const handleClearStorage = async () => {
    if (!confirm('WARNING: This will permanently delete ALL uploaded images and videos from the server to free up space. Continue?')) return;
    try {
      const res = await axios.post('/api/admin/clear-storage', {}, getHeaders());
      alert(res.data.message);
      fetchStats();
    } catch (e) { alert('Failed to clear storage'); }
  };

  if (!isLoggedIn) {
    return (
      <div className="h-screen overflow-y-auto bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-foreground/5 p-8 rounded-2xl border border-foreground/10 my-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-liquid-accent/20 rounded-full flex items-center justify-center">
              <Shield className="text-liquid-accent" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-8 text-foreground">Admin Login</h1>
          {loginError && <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl text-sm mb-6 text-center">{loginError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
              <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-background border border-foreground/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-liquid-accent transition-colors" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-background border border-foreground/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-liquid-accent transition-colors" required />
            </div>
            <button type="submit" className="w-full bg-liquid-accent text-background font-bold py-3 rounded-xl hover:brightness-110 transition-all">
              Login to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-6xl mx-auto pb-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-liquid-accent to-liquid-secondary">
            Admin Dashboard
          </h1>
          <div className="flex gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <button onClick={() => router.push('/')} className="text-liquid-accent hover:underline">Back to App</button>
            <button onClick={() => { sessionStorage.removeItem('adminAuth'); setIsLoggedIn(false); }} className="text-rose-400 hover:underline">Logout</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4 mb-8">
          <button onClick={() => setActiveTab('overview')} className={`px-4 sm:px-6 py-2 rounded-xl font-semibold transition-all flex-1 sm:flex-none text-center ${activeTab === 'overview' ? 'bg-liquid-accent text-background' : 'bg-foreground/5 hover:bg-foreground/10'}`}>Overview</button>
          <button onClick={() => setActiveTab('users')} className={`px-4 sm:px-6 py-2 rounded-xl font-semibold transition-all flex-1 sm:flex-none text-center ${activeTab === 'users' ? 'bg-liquid-accent text-background' : 'bg-foreground/5 hover:bg-foreground/10'}`}>Manage Users</button>
        </div>

        {activeTab === 'overview' && stats && (
            </div>

            <div className="col-span-full mt-4 sm:mt-8 bg-rose-500/10 border border-rose-500/20 p-4 sm:p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-rose-400 mb-2">Danger Zone</h3>
              <p className="text-foreground/60 mb-6 text-sm sm:text-base">Clearing server storage will delete all uploaded files and free up disk space.</p>
              <button onClick={handleClearStorage} className="w-full sm:w-auto bg-rose-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-600 transition-colors flex items-center justify-center gap-2">
                <Trash2 size={20} /> Clear Server Storage Now
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {users.map(u => (
              <div key={u.id} className="bg-foreground/5 p-4 rounded-2xl border border-foreground/10 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg truncate max-w-[200px]">{u.username}</h3>
                    <p className="text-sm text-foreground/50 truncate max-w-[200px]">{u.email || 'No email'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs shrink-0 ${u.isAdmin ? 'bg-liquid-accent/20 text-liquid-accent' : 'bg-foreground/10 text-foreground/70'}`}>
                    {u.isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-foreground/70 mb-4 bg-background/50 p-3 rounded-xl">
                  <div>
                    <span className="block text-xs opacity-70">Messages</span>
                    <span className="font-semibold text-foreground">{u._count.messagesSent}</span>
                  </div>
                  <div>
                    <span className="block text-xs opacity-70">Joined</span>
                    <span className="font-semibold text-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex justify-end mt-auto">
                  {!u.isAdmin ? (
                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-300 px-4 py-2 bg-red-400/10 hover:bg-red-400/20 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold">
                      <Trash2 size={16} /> Delete User
                    </button>
                  ) : (
                    <div className="px-4 py-2 text-sm text-foreground/40 font-medium">Cannot delete admin</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
