import React, { useState } from 'react';
import { Customer, Project, Quote } from '../types';
import { User, Phone, Briefcase, History, Plus, Mail, Edit, X, FolderOpen, FileText, Search, Eye, File as FileIcon, Image as ImageIcon } from 'lucide-react';

interface CRMProps {
  customers: Customer[];
  projects: Project[];
  quotes: Quote[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
}

const CRM: React.FC<CRMProps> = ({ customers, projects, quotes, onAddCustomer, onUpdateCustomer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // Search state
  
  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<Customer | null>(null);
  const [historyTab, setHistoryTab] = useState<'QUOTES' | 'PROJECTS'>('QUOTES');

  const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
    name: '',
    phone: '',
    email: '',
    type: 'Cá nhân',
    address: ''
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', type: 'Cá nhân', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      type: customer.type,
      address: customer.address
    });
    setIsModalOpen(true);
  };

  const openHistoryModal = (customer: Customer) => {
    setSelectedHistoryCustomer(customer);
    setHistoryTab('QUOTES');
    setHistoryModalOpen(true);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      // Edit
      const updatedCustomer: Customer = {
        ...editingCustomer,
        ...formData
      };
      onUpdateCustomer(updatedCustomer);
    } else {
      // Add
      const newCustomer: Customer = {
        id: `C${Date.now()}`,
        ...formData
      };
      onAddCustomer(newCustomer);
    }
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Filter Customers Logic
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter history data
  const customerProjects = selectedHistoryCustomer 
    ? projects.filter(p => p.customerId === selectedHistoryCustomer.id) 
    : [];
  const customerQuotes = selectedHistoryCustomer
    ? quotes.filter(q => q.customerId === selectedHistoryCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Khách hàng (CRM)</h2>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Tìm tên, SĐT..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
            </div>
            <button 
              onClick={openAddModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center shrink-0"
            >
              <Plus size={18} className="mr-2" /> <span className="hidden sm:inline">Khách hàng mới</span><span className="sm:hidden">Thêm</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition relative group">
            <button 
              onClick={() => openEditModal(customer)}
              className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
              title="Chỉnh sửa thông tin"
            >
              <Edit size={16} />
            </button>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${customer.type === 'Doanh nghiệp' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                    {customer.type}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Phone size={16} className="mr-2 text-gray-400" />
                {customer.phone}
              </div>
              {customer.email && (
                <div className="flex items-center">
                  <Mail size={16} className="mr-2 text-gray-400" />
                  {customer.email}
                </div>
              )}
              <div className="flex items-center">
                <Briefcase size={16} className="mr-2 text-gray-400" />
                {customer.address}
              </div>
              <div 
                onClick={() => openHistoryModal(customer)}
                className="flex items-center pt-3 border-t border-gray-100 mt-3 text-indigo-600 cursor-pointer hover:underline"
              >
                <History size={16} className="mr-2" />
                Xem lịch sử giao dịch
              </div>
            </div>
          </div>
        ))}
        
        {filteredCustomers.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500 italic">
                Không tìm thấy khách hàng nào phù hợp.
            </div>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              {editingCustomer ? 'Cập nhật thông tin khách hàng' : 'Thêm Khách hàng mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên khách hàng</label>
                <input 
                  required 
                  name="name" 
                  type="text" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" 
                  placeholder="Nguyễn Văn A" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                  <input 
                    required 
                    name="phone" 
                    type="text" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" 
                    placeholder="090..." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phân loại</label>
                  <select 
                    name="type" 
                    value={formData.type} 
                    onChange={handleInputChange} 
                    className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cá nhân">Cá nhân</option>
                    <option value="Doanh nghiệp">Doanh nghiệp</option>
                    <option value="Môi giới">Môi giới</option>
                  </select>
                </div>
              </div>
              
              {/* Email field - Especially for personal or business */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email {formData.type === 'Cá nhân' ? '(Gmail)' : ''}</label>
                <input 
                  name="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" 
                  placeholder="example@gmail.com" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                <input 
                  name="address" 
                  type="text" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                  className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" 
                  placeholder="Địa chỉ liên hệ..." 
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingCustomer ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && selectedHistoryCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Lịch sử giao dịch</h3>
                <p className="text-sm text-gray-500">Khách hàng: <span className="font-semibold">{selectedHistoryCustomer.name}</span></p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex border-b border-gray-200 px-6 pt-2">
              <button
                onClick={() => setHistoryTab('QUOTES')}
                className={`pb-3 px-4 text-sm font-medium border-b-2 transition ${historyTab === 'QUOTES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <FileText className="inline mr-2" size={16}/> Báo giá (Quotations)
              </button>
              <button
                onClick={() => setHistoryTab('PROJECTS')}
                className={`pb-3 px-4 text-sm font-medium border-b-2 transition ${historyTab === 'PROJECTS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <FolderOpen className="inline mr-2" size={16}/> Hồ sơ (Projects)
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {historyTab === 'PROJECTS' && (
                <div>
                   {customerProjects.length > 0 ? (
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 font-medium">Mã HS</th>
                            <th className="px-4 py-2 font-medium">Địa chỉ thửa đất</th>
                            <th className="px-4 py-2 font-medium">Ngày nhận</th>
                            <th className="px-4 py-2 font-medium">Trạng thái</th>
                            <th className="px-4 py-2 font-medium text-center">Tài liệu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {customerProjects.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-blue-600">{p.id}</td>
                              <td className="px-4 py-3">{p.address}</td>
                              <td className="px-4 py-3 text-gray-500">{p.createdDate}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">{p.status}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                  {p.attachments && p.attachments.length > 0 ? (
                                      <div className="flex justify-center space-x-1">
                                          {p.attachments.map(att => (
                                              <a 
                                                key={att.id} 
                                                href={att.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                title={att.name}
                                                className="text-gray-400 hover:text-blue-600"
                                              >
                                                  <Eye size={16} />
                                              </a>
                                          ))}
                                      </div>
                                  ) : <span className="text-gray-300">-</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   ) : (
                     <div className="text-center py-8 text-gray-500 italic">Chưa có hồ sơ nào.</div>
                   )}
                </div>
              )}

              {historyTab === 'QUOTES' && (
                <div>
                   {customerQuotes.length > 0 ? (
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 font-medium">Mã BG</th>
                            <th className="px-4 py-2 font-medium">Ngày tạo</th>
                            <th className="px-4 py-2 font-medium text-right">Tổng tiền</th>
                            <th className="px-4 py-2 font-medium">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {customerQuotes.map(q => (
                            <tr key={q.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-blue-600">{q.id}</td>
                              <td className="px-4 py-3 text-gray-500">{q.createdDate}</td>
                              <td className="px-4 py-3 text-right">{q.totalAmount.toLocaleString()} đ</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">{q.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   ) : (
                     <div className="text-center py-8 text-gray-500 italic">Chưa có báo giá nào.</div>
                   )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setHistoryModalOpen(false)} 
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

export default CRM;