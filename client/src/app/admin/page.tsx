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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-foreground/5 p-8 rounded-2xl border border-foreground/10">
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
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-liquid-accent to-liquid-secondary">
            Admin Dashboard
          </h1>
          <div className="flex gap-4">
            <button onClick={() => router.push('/')} className="text-liquid-accent hover:underline">Back to App</button>
            <button onClick={() => { sessionStorage.removeItem('adminAuth'); setIsLoggedIn(false); }} className="text-rose-400 hover:underline">Logout</button>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-xl font-semibold transition-all ${activeTab === 'overview' ? 'bg-liquid-accent text-background' : 'bg-foreground/5 hover:bg-foreground/10'}`}>Overview</button>
          <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-xl font-semibold transition-all ${activeTab === 'users' ? 'bg-liquid-accent text-background' : 'bg-foreground/5 hover:bg-foreground/10'}`}>Manage Users</button>
        </div>

        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-foreground/5 p-6 rounded-2xl border border-foreground/5">
              <div className="flex items-center gap-3 mb-2 text-liquid-accent"><Users /> <h3>Total Users</h3></div>
              <p className="text-4xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-foreground/5 p-6 rounded-2xl border border-foreground/5">
              <div className="flex items-center gap-3 mb-2 text-purple-400"><Database /> <h3>Total Messages</h3></div>
              <p className="text-4xl font-bold">{stats.totalMessages}</p>
            </div>
            <div className="bg-foreground/5 p-6 rounded-2xl border border-foreground/5">
              <div className="flex items-center gap-3 mb-2 text-pink-400"><FileVideo /> <h3>Media Files</h3></div>
              <p className="text-4xl font-bold">{stats.fileCount}</p>
            </div>
            <div className="bg-foreground/5 p-6 rounded-2xl border border-foreground/5">
              <div className="flex items-center gap-3 mb-2 text-rose-400"><Database /> <h3>Storage Used</h3></div>
              <p className="text-4xl font-bold">{stats.uploadsSizeMb} MB</p>
            </div>

            <div className="col-span-full mt-8 bg-rose-500/10 border border-rose-500/20 p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-rose-400 mb-2">Danger Zone</h3>
              <p className="text-foreground/60 mb-6">Clearing server storage will delete all uploaded files and free up disk space.</p>
              <button onClick={handleClearStorage} className="bg-rose-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-600 transition-colors flex items-center gap-2">
                <Trash2 /> Clear Server Storage Now
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-foreground/5 rounded-2xl border border-foreground/5 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-foreground/10">
                <tr>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Messages Sent</th>
                  <th className="p-4 font-semibold">Joined</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-foreground/5">
                    <td className="p-4">
                      <div className="font-semibold">{u.username}</div>
                      <div className="text-xs text-foreground/50">{u.email || 'No email'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${u.isAdmin ? 'bg-liquid-accent/20 text-liquid-accent' : 'bg-foreground/10 text-foreground/70'}`}>
                        {u.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="p-4 text-foreground/70">{u._count.messagesSent}</td>
                    <td className="p-4 text-foreground/70">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {!u.isAdmin && (
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-300 p-2 bg-red-400/10 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
