import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Package, Plus, Trash2, Search, Edit3, X, 
  Box, DollarSign, LogIn, LogOut, Store, Eye, EyeOff, 
  Download, AlertCircle, Clock
} from 'lucide-react';

interface Item {
  id: number;
  nama: string;
  harga: number;
  stok: number;
  kategori: string;
  satuan: string;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{id: number, namaToko: string} | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [items, setItems] = useState<Item[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
  const [stok, setStok] = useState('');
  const [kategori, setKategori] = useState('Umum');
  const [satuan, setSatuan] = useState('Pcs');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('vento_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Masuk...");
    try {
      const res = await axios.post('import.meta.env.VITE_API_URL', {
        username: loginUsername, password: loginPassword
      });
      localStorage.setItem('vento_token', res.data.token);
      localStorage.setItem('vento_user', JSON.stringify(res.data.user));
      setIsLoggedIn(true);
      setUser(res.data.user);
      fetchItems(); fetchLogs();
      toast.success(`Halo, ${res.data.user.namaToko}`, { id: loadingToast });
    } catch (err) {
      toast.error("Gagal Login!", { id: loadingToast });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('vento_user');
    const savedToken = localStorage.getItem('vento_token');
    if (savedUser && savedToken) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
      fetchItems(); fetchLogs();
    }
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/items`, getAuthHeader());
      setItems(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/logs`, getAuthHeader());
      setLogs(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { nama: formatNamaBarang(nama), harga: Number(harga), stok: Number(stok), kategori, satuan };
    try {
      if (isEditing && editId) {
        await axios.put(`http://localhost:5000/items/${editId}`, data, getAuthHeader());
        toast.success("Barang diperbarui");
      } else {
        await axios.post('http://localhost:5000/items', data, getAuthHeader());
        toast.success("Barang ditambah");
      }
      cancelEdit(); fetchItems(); fetchLogs();
    } catch (err) { toast.error("Gagal simpan."); }
  };

  const executeDelete = async () => {
    if (itemToDelete) {
      try {
        await axios.delete(`http://localhost:5000/items/${itemToDelete}`, getAuthHeader());
        fetchItems(); fetchLogs();
        toast.success("Dihapus");
      } catch (err) { toast.error("Gagal"); }
      finally { setShowDeleteModal(false); setItemToDelete(null); }
    }
  };

  const formatNamaBarang = (text: string) => text.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const cancelEdit = () => { setIsEditing(false); setEditId(null); setNama(''); setHarga(''); setStok(''); setKategori('Umum'); setSatuan('Pcs'); };
  const startEdit = (item: Item) => { setIsEditing(true); setEditId(item.id); setNama(item.nama); setHarga(item.harga.toString()); setStok(item.stok.toString()); setKategori(item.kategori); setSatuan(item.satuan); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  
  const totalAset = items.reduce((acc, i) => acc + (i.harga * i.stok), 0);
  const lowStockCount = items.filter(i => i.stok <= 5).length;
  const filteredItems = items.filter(i => {
    const matchesSearch = i.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Semua' || i.kategori === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const exportToExcel = () => {
    if (items.length === 0) return toast.error("Gudang kosong");
    const data = items.map(i => ({ "Nama": i.nama, "Kategori": i.kategori, "Stok": i.stok, "Harga": i.harga, "Total": i.harga * i.stok }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stok");
    XLSX.writeFile(wb, `Laporan_${user?.namaToko}.xlsx`);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Toaster position="top-center" />
        <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden border border-slate-100 shadow-[0_25px_50px_-12px_rgba(79,70,229,0.3)]">
          <div className="bg-indigo-600 p-10 text-center text-white">
            <Package size={32} className="mx-auto mb-2 bg-white p-2 rounded-xl text-indigo-600" />
            <h1 className="text-3xl font-bold tracking-tighter uppercase">Vento</h1>
            <p className="text-indigo-100 text-sm mt-1 font-medium">Sistem Gudang Profesional</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6 text-slate-900">
            <input type="text" required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" placeholder="Username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </div>
            <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">Masuk ke Vento</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10">
      <Toaster position="top-right" />
      <nav className="bg-white border-b px-8 py-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2"><div className="bg-indigo-600 p-2 rounded-lg text-white"><Package size={24} /></div><span className="text-2xl font-bold tracking-tight">VENTO GUDANG</span></div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-slate-600 border-r pr-6 italic underline"><Store size={18} className="text-indigo-500" />{user?.namaToko}</div>
          <button onClick={() => setShowLogoutModal(true)} className="text-red-500 font-bold flex items-center gap-2 border px-4 py-2 rounded-xl hover:bg-red-50 transition-all"><LogOut size={18} /> Keluar</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-slate-900">
          <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Box /></div>
            <div><p className="text-slate-400 text-[10px] font-black uppercase">Total Produk</p><h3 className="text-xl font-bold">{items.length}</h3></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><DollarSign /></div>
            <div><p className="text-slate-400 text-[10px] font-black uppercase">Nilai Aset</p><h3 className="text-xl font-bold">Rp {totalAset.toLocaleString()}</h3></div>
          </div>
          <div className={`bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 border-l-4 ${lowStockCount > 0 ? 'border-l-red-500' : 'border-l-slate-100'}`}>
            <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}><AlertCircle /></div>
            <div><p className="text-slate-400 text-[10px] font-black uppercase">Stok Kritis</p><h3 className={`text-xl font-bold ${lowStockCount > 0 ? 'text-red-600' : ''}`}>{lowStockCount} Item</h3></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-900">
          <div className="lg:col-span-1">
            <div className={`p-6 rounded-2xl border sticky top-28 shadow-sm ${isEditing ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
              <h3 className="font-bold mb-5 flex items-center gap-2 text-slate-800 text-lg">{isEditing ? <Edit3 size={20}/> : <Plus size={20}/>} {isEditing ? 'Edit Barang' : 'Barang Masuk'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="Nama Barang" value={nama} onChange={(e) => setNama(e.target.value)} required />
                <input type="number" className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="Harga / Unit" value={harga} onChange={(e) => setHarga(e.target.value)} required />
                <select className="w-full px-4 py-3 rounded-xl border outline-none bg-white" value={kategori} onChange={(e) => setKategori(e.target.value)}>
                    <option value="Umum">Umum</option><option value="Sembako">Sembako</option><option value="Elektronik">Elektronik</option><option value="Minuman">Minuman</option>
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" className="w-full px-4 py-3 rounded-xl border outline-none" placeholder="Stok" value={stok} onChange={(e) => setStok(e.target.value)} required />
                  <input className="w-full px-4 py-3 rounded-xl border outline-none" placeholder="Satuan" value={satuan} onChange={(e) => setSatuan(e.target.value)} required />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">Simpan Barang</button>
                {isEditing && <button type="button" onClick={cancelEdit} className="w-full bg-slate-200 text-slate-600 font-bold py-3 rounded-xl mt-2">Batal</button>}
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} /><input className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white" placeholder="Cari barang..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <button onClick={exportToExcel} className="bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg flex items-center gap-2 active:scale-95"><Download size={20}/> Excel</button>
            </div>

            <div className="flex flex-wrap gap-2">
              {['Semua', 'Umum', 'Sembako', 'Elektronik', 'Minuman', 'Lainnya'].map((cat) => (
                <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}>{cat}</button>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-slate-900">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-[10px] font-black uppercase tracking-widest text-slate-400"><tr className="text-slate-400"><th className="px-6 py-4">Informasi Produk</th><th className="px-6 py-4 text-right">Kelola</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredItems.sort((a,b) => b.id-a.id).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-all group text-slate-900">
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-700 text-base">{formatNamaBarang(item.nama)}</div>
                        <div className="text-xs font-bold mt-1">
                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase mr-2 text-[9px]">{item.kategori}</span>
                            <span className={item.stok <= 5 ? 'text-red-500' : 'text-indigo-500'}>{item.stok} {item.satuan}</span>
                            <span className="mx-2 text-slate-300">|</span>
                            <span className="text-slate-900 font-bold">Rp {item.harga.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right flex justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={18}/></button>
                        <button onClick={() => { setItemToDelete(item.id); setShowDeleteModal(true); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && <tr><td colSpan={2} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest bg-white"><div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">{searchTerm ? <AlertCircle size={32} /> : <Box size={32} />}</div>{searchTerm ? "Barang tidak ditemukan" : "Gudang Vento Kosong"}</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-slate-900">
              <h3 className="font-bold mb-6 flex items-center gap-2"><Clock size={20} className="text-indigo-500" /> Riwayat Aktivitas</h3>
              <div className="space-y-4">
                {logs.slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all border-l-2 border-l-indigo-500">
                    <div className={`p-2 rounded-lg ${log.aksi === 'TAMBAH' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}><Package size={14} /></div>
                    <div><p className="text-sm font-bold text-slate-700">{log.rincian}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{new Date(log.createdAt).toLocaleString('id-ID')}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500"><LogOut size={40} /></div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Keluar Sesi?</h3>
            <div className="flex flex-col gap-3 mt-8">
              <button onClick={handleLogout} className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95">Ya, Keluar</button>
              <button onClick={() => setShowLogoutModal(false)} className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DELETE */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
          <div className="bg-white w-full max-w-xs rounded-[2rem] shadow-2xl p-8 text-center border border-slate-100 animate-in zoom-in-95 duration-300 text-slate-900">
            <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500"><Trash2 size={32} /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Barang?</h3>
            <p className="text-slate-500 text-sm mb-6 font-medium">Data akan hilang permanen dari gudang.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-slate-100 text-slate-500 font-bold py-3 rounded-2xl">Batal</button>
              <button onClick={executeDelete} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-2xl active:scale-95 shadow-lg">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;