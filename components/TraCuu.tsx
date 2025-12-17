
import React, { useState, useEffect } from 'react';
import { CadastralMap, User, Role } from '../types';
import { Search, Map, Edit, Plus, X, Save } from 'lucide-react';

// Use mock data import pattern or prop passing. 
// For simplicity in this demo structure, we'll fetch/use the initial data 
// assuming it would be passed from App.tsx or fetched. 
// Here we will accept it as props to keep it stateless primarily or manage local state.

interface TraCuuProps {
  initialMaps: CadastralMap[];
  currentUser: User;
}

const TraCuu: React.FC<TraCuuProps> = ({ initialMaps, currentUser }) => {
  const [maps, setMaps] = useState<CadastralMap[]>(initialMaps);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMap, setEditingMap] = useState<CadastralMap | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<CadastralMap, 'id'>>({
    commune: '',
    newMap: '',
    oldMap: '',
    lucDate: '',
    ontDate: ''
  });

  // Filter Logic
  const filteredMaps = maps.filter(m => 
    m.commune.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.newMap.includes(searchTerm)
  );

  const canEdit = currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.DIRECTOR;

  const handleOpenModal = (map?: CadastralMap) => {
    if (map) {
      setEditingMap(map);
      setFormData({
        commune: map.commune,
        newMap: map.newMap,
        oldMap: map.oldMap,
        lucDate: map.lucDate,
        ontDate: map.ontDate
      });
    } else {
      setEditingMap(null);
      setFormData({ commune: '', newMap: '', oldMap: '', lucDate: '', ontDate: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMap) {
      // Update
      const updatedMaps = maps.map(m => m.id === editingMap.id ? { ...m, ...formData } : m);
      setMaps(updatedMaps);
    } else {
      // Add
      const newMapItem = {
        id: Date.now().toString(),
        ...formData
      };
      setMaps([...maps, newMapItem]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Map className="mr-2 text-indigo-600"/> Tra cứu Bản đồ Địa chính
        </h2>
        
        <div className="flex gap-2 w-full sm:w-auto">
             <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Tìm theo Tên xã..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
            </div>
            
            {canEdit && (
              <button 
                onClick={() => handleOpenModal()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center shrink-0 shadow-sm"
              >
                <Plus size={18} className="mr-2" /> Thêm mới
              </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-16">STT</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-l">Tên xã</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-l text-center">Bản đồ mới</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-l text-center">Bản đồ cũ (LUC, ONT)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-l text-center">Ngày ký LUC</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-l text-center">Ngày ký ONT</th>
                {canEdit && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-l text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMaps.map((map, index) => (
                <tr key={map.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 border-l text-sm font-bold text-blue-700">{map.commune}</td>
                  <td className="px-6 py-4 border-l text-center text-sm font-medium text-gray-700">{map.newMap}</td>
                  <td className="px-6 py-4 border-l text-center text-sm text-gray-600">{map.oldMap}</td>
                  <td className="px-6 py-4 border-l text-center text-sm text-gray-600">{map.lucDate}</td>
                  <td className="px-6 py-4 border-l text-center text-sm text-gray-600">{map.ontDate}</td>
                  {canEdit && (
                    <td className="px-6 py-4 border-l text-center">
                      <button 
                        onClick={() => handleOpenModal(map)}
                        className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredMaps.length === 0 && (
                <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400 italic">Không tìm thấy dữ liệu phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-xl font-bold text-gray-800">
                        {editingMap ? 'Cập nhật thông tin' : 'Thêm dữ liệu xã'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên xã</label>
                        <input required type="text" value={formData.commune} onChange={(e) => setFormData({...formData, commune: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500" placeholder="VD: An Bình"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bản đồ mới</label>
                            <input type="text" value={formData.newMap} onChange={(e) => setFormData({...formData, newMap: e.target.value})} className="w-full border rounded p-2" placeholder="VD: 1-56"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bản đồ cũ</label>
                            <input type="text" value={formData.oldMap} onChange={(e) => setFormData({...formData, oldMap: e.target.value})} className="w-full border rounded p-2" placeholder="VD: 1,3,4"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày ký LUC</label>
                            <input type="text" value={formData.lucDate} onChange={(e) => setFormData({...formData, lucDate: e.target.value})} className="w-full border rounded p-2" placeholder="dd/mm/yyyy"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày ký ONT</label>
                            <input type="text" value={formData.ontDate} onChange={(e) => setFormData({...formData, ontDate: e.target.value})} className="w-full border rounded p-2" placeholder="dd/mm/yyyy"/>
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center">
                            <Save size={18} className="mr-2"/> Lưu lại
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default TraCuu;
