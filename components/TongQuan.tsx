
import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { AlertTriangle, FileText, Building, MapPin, Plus, Edit, Phone, X, Calendar, User as UserIcon } from 'lucide-react';
import { Project, ProjectStatus, Office, User, Role } from '../types';

interface TongQuanProps {
  projects: Project[];
  offices: Office[];
  currentUser: User; // To check license limits
  onAddOffice: (office: Office) => void;
  onUpdateOffice: (office: Office) => void;
}

const TongQuan: React.FC<TongQuanProps> = ({ projects, offices, currentUser, onAddOffice, onUpdateOffice }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'ALL'>('ALL'); // New: Month Filter
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('ALL');
  
  // Office Management State
  const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [officeFormData, setOfficeFormData] = useState({ name: '', address: '', phone: '' });

  // Overdue Modal State
  const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);

  // Generate Year Options dynamically (From 2022 to Current Year + 1)
  const yearOptions = useMemo(() => {
    const startYear = 2022;
    const endYear = currentYear + 1;
    const years = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // --- Filtering Logic ---
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const pDate = new Date(p.createdDate);
      const yearMatch = pDate.getFullYear() === selectedYear;
      const monthMatch = selectedMonth === 'ALL' || (pDate.getMonth() + 1) === selectedMonth;
      const officeMatch = selectedOfficeId === 'ALL' || p.officeId === selectedOfficeId;
      return yearMatch && monthMatch && officeMatch;
    });
  }, [projects, selectedYear, selectedMonth, selectedOfficeId]);

  // --- Logic for Overdue Projects (Global context, not limited by createdDate filter usually, but let's filter by Office) ---
  const overdueProjects = useMemo(() => {
    const now = new Date();
    // Reset time part to ensure fair comparison
    now.setHours(0, 0, 0, 0);

    return projects.filter(p => {
        // Filter by office if selected
        if (selectedOfficeId !== 'ALL' && p.officeId !== selectedOfficeId) return false;

        // Status check: Must be active (Not Completed, Not Cancelled)
        if (p.status === ProjectStatus.COMPLETED || p.status === ProjectStatus.CANCELLED) return false;
        
        // Date check
        if (!p.dueDate) return false;
        const dueDate = new Date(p.dueDate);
        return dueDate < now;
    });
  }, [projects, selectedOfficeId]);

  // --- Stats Calculations ---
  // 1. Office Usage
  const maxOffices = currentUser.licenseInfo?.maxOffices || 1;
  const currentOfficesCount = offices.length;
  const officeUsagePercent = (currentOfficesCount / maxOffices) * 100;

  // 2. Project Counts
  const totalProjects = filteredProjects.length;
  const activeProjects = filteredProjects.filter(p => p.status !== ProjectStatus.COMPLETED && p.status !== ProjectStatus.CANCELLED).length;
  
  // 3. Chart Data (Projects per Month) - Keep this Year-based to show trend, regardless of Month selection
  const chartData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      name: `T${i + 1}`,
      hoSo: 0
    }));

    // We filter chart data only by Year and Office (ignoring selectedMonth to keep the annual view)
    const chartSourceProjects = projects.filter(p => {
        const pDate = new Date(p.createdDate);
        const yearMatch = pDate.getFullYear() === selectedYear;
        const officeMatch = selectedOfficeId === 'ALL' || p.officeId === selectedOfficeId;
        return yearMatch && officeMatch;
    });

    chartSourceProjects.forEach(p => {
      const month = new Date(p.createdDate).getMonth(); // 0-11
      data[month].hoSo += 1;
    });

    return data;
  }, [projects, selectedYear, selectedOfficeId]);


  // --- Office Modal Handlers ---
  const openAddOffice = () => {
    setEditingOffice(null);
    setOfficeFormData({ name: '', address: '', phone: '' });
    setIsOfficeModalOpen(true);
  };

  const openEditOffice = (office: Office) => {
    setEditingOffice(office);
    setOfficeFormData({ name: office.name, address: office.address, phone: office.phone || '' });
    setIsOfficeModalOpen(true);
  };

  const handleOfficeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOffice) {
      // Update
      onUpdateOffice({
        ...editingOffice,
        name: officeFormData.name,
        address: officeFormData.address,
        phone: officeFormData.phone
      });
    } else {
      // Add
      onAddOffice({
        id: `OFF-${Date.now()}`,
        directorId: currentUser.id,
        name: officeFormData.name,
        address: officeFormData.address,
        phone: officeFormData.phone
      });
    }
    setIsOfficeModalOpen(false);
  };

  const canEditOffice = (office: Office) => {
      if (currentUser.role === Role.SUPER_ADMIN) return true;
      if (currentUser.role === Role.DIRECTOR && office.directorId === currentUser.id) return true;
      return false;
  }
  
  const canAddOffice = currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.DIRECTOR;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Tổng quan (Dashboard)</h2>
        
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2">
           {/* Month Filter */}
           <select 
            className="border rounded-lg px-3 py-2 bg-white shadow-sm text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
          >
            <option value="ALL">Cả năm</option>
            {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
            ))}
          </select>

          {/* Year Filter */}
          <select 
            className="border rounded-lg px-3 py-2 bg-white shadow-sm text-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>Năm {year}</option>
            ))}
          </select>

          {/* Office Filter */}
          <select 
            className="border rounded-lg px-3 py-2 bg-white shadow-sm text-sm"
            value={selectedOfficeId}
            onChange={(e) => setSelectedOfficeId(e.target.value)}
          >
            <option value="ALL">Tất cả văn phòng</option>
            {offices.map(off => (
              <option key={off.id} value={off.id}>{off.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Office Limit Card */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-sm text-gray-500 font-medium">Văn phòng hoạt động</p>
                <div className="flex items-baseline mt-1">
                   <span className="text-3xl font-bold text-indigo-600">{currentOfficesCount}</span>
                   <span className="text-sm text-gray-400 ml-1">/ {maxOffices} cho phép</span>
                </div>
             </div>
             <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                <Building size={24} />
             </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${officeUsagePercent >= 100 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                style={{ width: `${Math.min(officeUsagePercent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Total Projects Card */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tổng hồ sơ ({selectedMonth === 'ALL' ? 'Cả năm' : `Tháng ${selectedMonth}`})</p>
            <p className="text-2xl font-bold text-gray-800">{totalProjects}</p>
            <p className="text-xs text-gray-400 mt-1">Đang xử lý: {activeProjects}</p>
          </div>
        </div>

         {/* Warning Card (Clickable) */}
        <div 
          onClick={() => overdueProjects.length > 0 && setIsOverdueModalOpen(true)}
          className={`bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4 transition relative ${overdueProjects.length > 0 ? 'cursor-pointer hover:bg-red-50 border-red-100' : ''}`}
        >
          <div className={`p-3 rounded-full ${overdueProjects.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Cảnh báo trễ hạn</p>
            <p className={`text-2xl font-bold ${overdueProjects.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {overdueProjects.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">
                {overdueProjects.length > 0 ? 'Click để xem chi tiết' : 'Mọi thứ đều ổn'}
            </p>
          </div>
          {overdueProjects.length > 0 && (
              <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Chart - Projects per Month */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Biểu đồ phát triển ({selectedYear})</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="hoSo" name="Số lượng hồ sơ" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Office Management Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <h3 className="text-lg font-bold text-gray-800 flex items-center">
             <Building className="mr-2" size={20} /> Danh sách Văn phòng
           </h3>
           <div 
             className="relative group z-0" 
           >
                {canAddOffice && (
                  <button 
                      onClick={openAddOffice}
                      disabled={currentOfficesCount >= maxOffices}
                      title={`Đã tạo: ${currentOfficesCount}/${maxOffices} văn phòng`}
                      className={`flex items-center px-3 py-2 rounded text-sm font-medium transition ${
                      currentOfficesCount >= maxOffices 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                  >
                      <Plus size={16} className="mr-1" /> Thêm văn phòng
                  </button>
                )}
                {/* Custom Tooltip on Hover - Fixed Positioning/Z-Index */}
                <div className="absolute top-full mt-2 right-0 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                    Đã dùng: {currentOfficesCount}/{maxOffices}
                </div>
           </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {offices.map((office) => (
             <div key={office.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition bg-white group relative">
                <div className="flex justify-between items-start mb-2">
                   <div className="font-bold text-lg text-gray-800">{office.name}</div>
                   {canEditOffice(office) && (
                     <button onClick={() => openEditOffice(office)} className="text-gray-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded" title="Chỉnh sửa thông tin">
                        <Edit size={16} />
                     </button>
                   )}
                </div>
                <div className="text-sm text-gray-600 flex items-start mb-1">
                   <MapPin size={16} className="mr-2 mt-0.5 text-gray-400 shrink-0" />
                   {office.address}
                </div>
                <div className="text-sm text-gray-600 flex items-center">
                   <Phone size={16} className="mr-2 text-gray-400" />
                   {office.phone || 'Chưa cập nhật'}
                </div>
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -z-0 opacity-50 pointer-events-none"></div>
             </div>
           ))}

           {offices.length === 0 && (
             <div className="col-span-full text-center py-8 text-gray-500 italic">
               Chưa có văn phòng nào được tạo.
             </div>
           )}
        </div>
      </div>

      {/* Modal Add/Edit Office */}
      {isOfficeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              {editingOffice ? 'Cập nhật Văn phòng' : 'Thêm Văn phòng mới'}
            </h3>
            <form onSubmit={handleOfficeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên Văn phòng</label>
                <input required type="text" value={officeFormData.name} onChange={(e) => setOfficeFormData({...officeFormData, name: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500" placeholder="VD: Chi nhánh Củ Chi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                <input required type="text" value={officeFormData.address} onChange={(e) => setOfficeFormData({...officeFormData, address: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500" placeholder="Số 123, Đường ABC..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input type="text" value={officeFormData.phone} onChange={(e) => setOfficeFormData({...officeFormData, phone: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500" placeholder="028..." />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsOfficeModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  {editingOffice ? 'Lưu thay đổi' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Overdue Projects */}
      {isOverdueModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold text-red-600 flex items-center">
                    <AlertTriangle className="mr-2" /> Hồ sơ trễ hạn ({overdueProjects.length})
                </h3>
                <button onClick={() => setIsOverdueModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
                {overdueProjects.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className="bg-red-50">
                            <tr>
                                <th className="px-4 py-2 text-xs font-medium text-red-800 uppercase">Mã HS</th>
                                <th className="px-4 py-2 text-xs font-medium text-red-800 uppercase">Khách hàng</th>
                                <th className="px-4 py-2 text-xs font-medium text-red-800 uppercase">Ngày hẹn trả</th>
                                <th className="px-4 py-2 text-xs font-medium text-red-800 uppercase">NV Phụ trách</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                            {overdueProjects.map(p => (
                                <tr key={p.id} className="hover:bg-red-50">
                                    <td className="px-4 py-3 font-bold text-gray-700">{p.id}</td>
                                    <td className="px-4 py-3 text-sm">{p.customerName}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-red-600 flex items-center">
                                        <Calendar size={14} className="mr-1"/> {p.dueDate}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 flex items-center">
                                        <UserIcon size={14} className="mr-1"/> {p.technicianName || 'Chưa phân công'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <p>Không có hồ sơ nào trễ hạn.</p>
                    </div>
                )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button 
                    onClick={() => setIsOverdueModalOpen(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                >
                    Đóng
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TongQuan;
