import React, { useState } from 'react';
import { User, Role, LicenseInfo } from '../types';
import { ShieldCheck, UserPlus, Calendar, AlertTriangle, CheckCircle, XCircle, Key, Clock, Edit, MoreHorizontal } from 'lucide-react';

interface AdminPortalProps {
  directors: User[];
  onAddDirector: (user: User) => void;
  onUpdateDirector: (user: User) => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ directors, onAddDirector, onUpdateDirector }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDirector, setSelectedDirector] = useState<User | null>(null);
  
  // Extension State
  const [extendMode, setExtendMode] = useState<'YEARS' | 'DATE'>('YEARS');
  const [extendYears, setExtendYears] = useState(1);
  const [extendDate, setExtendDate] = useState('');
  
  // Form State for Add New
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    startDate: new Date().toISOString().split('T')[0],
    durationYears: 1,
    maxOffices: 1,
    maxEmployees: 5,
  });

  // Form State for Edit
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    username: '',
    newPassword: '',
    maxOffices: 1,
    maxEmployees: 5,
  });

  // Calculate end date based on duration
  const calculateEndDate = (start: string, years: number) => {
    const date = new Date(start);
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString().split('T')[0];
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'durationYears' || name === 'maxOffices' || name === 'maxEmployees' ? parseInt(value) : value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'maxOffices' || name === 'maxEmployees' ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const endDate = calculateEndDate(formData.startDate, formData.durationYears);
    
    const newDirector: User = {
      id: `DIR-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      username: formData.username,
      password: formData.password,
      role: Role.DIRECTOR,
      licenseInfo: {
        startDate: formData.startDate,
        durationYears: formData.durationYears,
        endDate: endDate,
        maxOffices: formData.maxOffices,
        maxEmployees: formData.maxEmployees,
        isActive: true,
      }
    };

    onAddDirector(newDirector);
    setIsModalOpen(false);
    // Reset form
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      startDate: new Date().toISOString().split('T')[0],
      durationYears: 1,
      maxOffices: 1,
      maxEmployees: 5,
    });
  };

  const openExtendModal = (director: User) => {
    setSelectedDirector(director);
    setExtendYears(1);
    setExtendMode('YEARS');
    // Set default date to current end date to start with
    if (director.licenseInfo) {
        setExtendDate(director.licenseInfo.endDate);
    }
    setIsExtendModalOpen(true);
  };

  const openEditModal = (director: User) => {
      setSelectedDirector(director);
      setEditFormData({
          name: director.name,
          email: director.email,
          username: director.username || '',
          newPassword: '', // Default empty, only update if filled
          maxOffices: director.licenseInfo?.maxOffices || 1,
          maxEmployees: director.licenseInfo?.maxEmployees || 5
      });
      setIsEditModalOpen(true);
  }

  const handleEditSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedDirector && selectedDirector.licenseInfo) {
          const updatedDirector: User = {
              ...selectedDirector,
              name: editFormData.name,
              email: editFormData.email,
              username: editFormData.username,
              // Only update password if newPassword is not empty
              password: editFormData.newPassword.trim() !== '' ? editFormData.newPassword : selectedDirector.password,
              licenseInfo: {
                  ...selectedDirector.licenseInfo,
                  maxOffices: editFormData.maxOffices,
                  maxEmployees: editFormData.maxEmployees
              }
          };

          onUpdateDirector(updatedDirector);
          setIsEditModalOpen(false);
          setSelectedDirector(null);
      }
  }

  const handleExtendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDirector && selectedDirector.licenseInfo) {
      let newEndDate = '';
      
      if (extendMode === 'YEARS') {
        const currentEndDate = new Date(selectedDirector.licenseInfo.endDate);
        currentEndDate.setFullYear(currentEndDate.getFullYear() + extendYears);
        newEndDate = currentEndDate.toISOString().split('T')[0];
      } else {
        newEndDate = extendDate;
      }

      // Calculate new duration roughly
      const startDate = new Date(selectedDirector.licenseInfo.startDate);
      const end = new Date(newEndDate);
      const diffTime = end.getTime() - startDate.getTime();
      const diffYears = Number((diffTime / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1));

      const updatedDirector: User = {
        ...selectedDirector,
        licenseInfo: {
          ...selectedDirector.licenseInfo,
          endDate: newEndDate,
          durationYears: diffYears > 0 ? diffYears : selectedDirector.licenseInfo.durationYears,
          isActive: true // Re-activate if expired
        }
      };
      
      onUpdateDirector(updatedDirector);
      setIsExtendModalOpen(false);
      setSelectedDirector(null);
    }
  };

  const getDaysRemaining = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <ShieldCheck className="mr-2 text-indigo-600" /> Quản trị hệ thống (Super Admin)
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center shadow-sm"
        >
          <UserPlus size={18} className="mr-2" /> Khai báo Giám đốc mới
        </button>
      </div>

      {/* Stats / Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Tổng số Giám đốc</p>
          <p className="text-2xl font-bold text-gray-800">{directors.length}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Sắp hết hạn (≤ 30 ngày)</p>
          <p className="text-2xl font-bold text-orange-500">
            {directors.filter(d => d.licenseInfo && getDaysRemaining(d.licenseInfo.endDate) <= 30 && getDaysRemaining(d.licenseInfo.endDate) > 0).length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
           <p className="text-sm text-gray-500">Doanh thu phần mềm</p>
           <p className="text-2xl font-bold text-green-600">--</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tên Giám Đốc</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tài khoản</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-center">VP / NV</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hạn sử dụng</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {directors.map((director) => {
                const license = director.licenseInfo;
                if (!license) return null;
                const daysLeft = getDaysRemaining(license.endDate);
                const isExpiring = daysLeft <= 30 && daysLeft > 0;
                const isExpired = daysLeft <= 0;

                return (
                  <tr key={director.id} className={isExpiring ? 'bg-orange-50' : ''}>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {director.name}
                      <div className="text-xs text-gray-500">{director.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                       <div className="font-semibold">{director.username}</div>
                       <div className="text-xs text-gray-400">Pass: ******</div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-sm">
                      {license.maxOffices} / {license.maxEmployees}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium">{license.endDate}</div>
                      <div className={`text-xs ${isExpired ? 'text-red-600 font-bold' : isExpiring ? 'text-orange-600 font-bold' : 'text-gray-500'}`}>
                        {isExpired ? '(Đã hết hạn)' : `(Còn ${daysLeft} ngày)`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isExpired ? (
                        <span className="flex items-center text-red-600 text-xs font-bold px-2 py-1 bg-red-100 rounded-full w-fit">
                          <XCircle size={14} className="mr-1" /> Stopped
                        </span>
                      ) : (
                        <span className="flex items-center text-green-600 text-xs font-bold px-2 py-1 bg-green-100 rounded-full w-fit">
                          <CheckCircle size={14} className="mr-1" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => openEditModal(director)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Sửa thông tin"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => openExtendModal(director)}
                            className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium transition px-2 py-1 rounded hover:bg-indigo-50"
                            title="Gia hạn"
                          >
                            <Clock size={16} className="mr-1" /> Gia hạn
                          </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Director */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Khai báo Giám đốc & Bản quyền</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên Giám đốc</label>
                  <input required name="name" type="text" value={formData.name} onChange={handleInputChange} className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email liên hệ</label>
                  <input required name="email" type="email" value={formData.email} onChange={handleInputChange} className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500" placeholder="a@company.com" />
                </div>
              </div>

              {/* Login Info */}
              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <h4 className="font-semibold text-sm text-gray-600 mb-3 flex items-center">
                  <Key size={16} className="mr-1" /> Thông tin đăng nhập
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tài khoản (User)</label>
                    <input required name="username" type="text" value={formData.username} onChange={handleInputChange} className="mt-1 w-full border rounded p-2" placeholder="user123" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                    <input required name="password" type="password" value={formData.password} onChange={handleInputChange} className="mt-1 w-full border rounded p-2" placeholder="******" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <h4 className="font-semibold text-sm text-gray-600 mb-3 flex items-center">
                  <ShieldCheck size={16} className="mr-1" /> Cấu hình tài nguyên
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700">Số lượng VP</label>
                    <input required name="maxOffices" type="number" min="1" value={formData.maxOffices} onChange={handleInputChange} className="mt-1 w-full border rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số user nhân viên</label>
                    <input required name="maxEmployees" type="number" min="1" value={formData.maxEmployees} onChange={handleInputChange} className="mt-1 w-full border rounded p-2" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded border border-indigo-100">
                <h4 className="font-semibold text-sm text-indigo-700 mb-3 flex items-center">
                  <Calendar size={16} className="mr-1" /> Thời hạn bản quyền
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                    <input required name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} className="mt-1 w-full border rounded p-2" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700">Thời hạn (Năm)</label>
                     <input required name="durationYears" type="number" min="1" max="10" value={formData.durationYears} onChange={handleInputChange} className="mt-1 w-full border rounded p-2" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-indigo-200 flex justify-between items-center">
                   <span className="text-sm text-gray-600">Ngày hết hạn dự kiến:</span>
                   <span className="font-bold text-indigo-700">{calculateEndDate(formData.startDate, formData.durationYears)}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Lưu thiết lập</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Director */}
      {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Cập nhật thông tin Giám đốc</h3>
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Tên Giám đốc</label>
                              <input required name="name" type="text" value={editFormData.name} onChange={handleEditInputChange} className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Email liên hệ</label>
                              <input required name="email" type="email" value={editFormData.email} onChange={handleEditInputChange} className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" />
                          </div>
                      </div>

                      {/* Login Info Edit */}
                      <div className="p-4 bg-gray-50 rounded border border-gray-200">
                          <h4 className="font-semibold text-sm text-gray-600 mb-3 flex items-center">
                              <Key size={16} className="mr-1" /> Thông tin đăng nhập
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Tài khoản (User)</label>
                                  <input required name="username" type="text" value={editFormData.username} onChange={handleEditInputChange} className="mt-1 w-full border rounded p-2" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Reset Mật khẩu</label>
                                  <input 
                                    name="newPassword" 
                                    type="password" 
                                    value={editFormData.newPassword} 
                                    onChange={handleEditInputChange} 
                                    className="mt-1 w-full border rounded p-2 placeholder-gray-400" 
                                    placeholder="Để trống nếu không đổi" 
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Resources Edit */}
                      <div className="p-4 bg-gray-50 rounded border border-gray-200">
                          <h4 className="font-semibold text-sm text-gray-600 mb-3 flex items-center">
                              <ShieldCheck size={16} className="mr-1" /> Cấu hình tài nguyên
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Số lượng VP</label>
                                  <input required name="maxOffices" type="number" min="1" value={editFormData.maxOffices} onChange={handleEditInputChange} className="mt-1 w-full border rounded p-2" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Số user nhân viên</label>
                                  <input required name="maxEmployees" type="number" min="1" value={editFormData.maxEmployees} onChange={handleEditInputChange} className="mt-1 w-full border rounded p-2" />
                              </div>
                          </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4 border-t">
                          <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Hủy</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Cập nhật</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Modal Extend License */}
      {isExtendModalOpen && selectedDirector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Gia hạn bản quyền</h3>
            <div className="mb-4">
               <p className="text-sm text-gray-600">Gia hạn cho: <span className="font-bold text-gray-900">{selectedDirector.name}</span></p>
               <p className="text-sm text-gray-600">Hết hạn hiện tại: <span className="font-bold text-red-600">{selectedDirector.licenseInfo?.endDate}</span></p>
            </div>
            
            <form onSubmit={handleExtendSubmit} className="space-y-4">
              
              <div className="flex items-center space-x-4 mb-2">
                  <label className="flex items-center cursor-pointer">
                      <input 
                          type="radio" 
                          name="extendMode"
                          checked={extendMode === 'YEARS'} 
                          onChange={() => setExtendMode('YEARS')} 
                          className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Thêm số năm</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                      <input 
                          type="radio" 
                          name="extendMode"
                          checked={extendMode === 'DATE'} 
                          onChange={() => setExtendMode('DATE')} 
                          className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Đến ngày cụ thể</span>
                  </label>
              </div>

              {extendMode === 'YEARS' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gia hạn thêm (Năm)</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={extendYears} 
                    onChange={(e) => setExtendYears(parseInt(e.target.value))} 
                    className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500" 
                  />
                  <div className="mt-2 p-2 bg-green-50 text-green-800 text-xs rounded">
                     Sẽ cộng thêm {extendYears} năm vào ngày hết hạn hiện tại.
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày hết hạn mới</label>
                  <input 
                    required 
                    type="date" 
                    value={extendDate} 
                    onChange={(e) => setExtendDate(e.target.value)} 
                    className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsExtendModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Xác nhận gia hạn</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;