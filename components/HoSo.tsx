
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Project, Customer, Office, Quote, Employee, SystemConfig, 
  ProjectStatus, Attachment, User, Role
} from '../types';
import { 
  Search, Plus, Filter, Clock, MapPin, AlertTriangle, File as FileIcon, 
  Image as ImageIcon, CheckCircle, Eye, Edit, Trash2, X, Upload, 
  Phone, Calendar, User as UserIcon, Save, DollarSign
} from 'lucide-react';
import { uploadFile } from '../utils';

interface HoSoProps {
  projects: Project[];
  customers: Customer[];
  offices: Office[];
  quotes: Quote[];
  employees: Employee[];
  currentUser: User;
  systemConfig: SystemConfig;
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onNotify: (userId: string, title: string, message: string) => void;
}

const HoSo: React.FC<HoSoProps> = ({ 
  projects, customers, offices, quotes, employees, currentUser, systemConfig, 
  onAddProject, onUpdateProject, onNotify
}) => {
  // State for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // State for Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  
  // State for Form
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Permissions Logic
  // Chỉ Giám đốc hoặc Super Admin mới được quyền chỉnh sửa (Edit Mode)
  const canEditProject = currentUser.role === Role.DIRECTOR || currentUser.role === Role.SUPER_ADMIN;
  
  // Kế toán và các vai trò khác chỉ được xem (Read Only)
  const isReadOnly = !canEditProject;

  // Helpers
  const formatCurrency = (val: number) => val.toLocaleString('vi-VN') + ' đ';
  
  const getTypeStyle = (type: string) => {
    const config = systemConfig.projectTypes.find(t => t.name === type);
    if (config) {
      return { backgroundColor: `${config.color}20`, color: config.color, borderColor: `${config.color}40` };
    }
    return { backgroundColor: '#f3f4f6', color: '#4b5563' };
  };

  const isDrawingOverdue = (project: Project) => {
    if (!project.drawingDueDate) return false;
    const due = new Date(project.drawingDueDate);
    const now = new Date();
    // Reset hours for fair comparison
    now.setHours(0,0,0,0);
    // If status is completed or cancelled, not overdue
    if (project.status === ProjectStatus.COMPLETED || project.status === ProjectStatus.CANCELLED) return false;
    return due < now;
  };

  const getProjectStatusDisplay = (project: Project) => {
     let colorClass = 'bg-gray-100 text-gray-800';
     const status = project.status;
     
     if (status === ProjectStatus.PENDING) colorClass = 'bg-yellow-100 text-yellow-800';
     else if (status === ProjectStatus.ASSIGNED) colorClass = 'bg-indigo-100 text-indigo-800';
     else if (status === ProjectStatus.SURVEYING) colorClass = 'bg-blue-100 text-blue-800';
     else if (status === ProjectStatus.OFFICE_WORK) colorClass = 'bg-purple-100 text-purple-800';
     else if (status === ProjectStatus.COMPLETED) colorClass = 'bg-green-100 text-green-800';
     else if (status === ProjectStatus.CANCELLED) colorClass = 'bg-red-100 text-red-800';
     
     return (
         <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
             {status}
         </span>
     );
  };

  // Filter Logic - UPDATED: Added Plot Number, Plot Page, Land Owner
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            p.customerName.toLowerCase().includes(term) || 
            p.id.toLowerCase().includes(term) ||
            p.address.toLowerCase().includes(term) ||
            (p.plotNumber && p.plotNumber.includes(term)) || // Tìm theo Số tờ
            (p.plotPage && p.plotPage.includes(term)) ||     // Tìm theo Số thửa
            (p.landOwner && p.landOwner.toLowerCase().includes(term)); // Tìm theo Chủ đất
        
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  // Modal Handlers
  const openAddModal = () => {
      setEditingProject(null);
      const today = new Date();
      
      // Logic: Default Drawing Due Date = Today + 3 days
      const drawingDate = new Date(today);
      drawingDate.setDate(today.getDate() + 3);
      
      // Logic: Default Result Due Date = Drawing Date + 7 days (1 week)
      const nextWeek = new Date(drawingDate);
      nextWeek.setDate(drawingDate.getDate() + 7);

      setFormData({
          customerId: '',
          officeId: offices.length > 0 ? offices[0].id : '',
          type: systemConfig.projectTypes[0]?.name || '',
          status: ProjectStatus.PENDING,
          createdDate: today.toISOString().split('T')[0],
          dueDate: nextWeek.toISOString().split('T')[0], // Result Date
          drawingDueDate: drawingDate.toISOString().split('T')[0], // Drawing Date
          address: '',
          plotNumber: '',
          plotPage: '',
          landOwner: '',
          landArea: 0,
          revenue: 0,
          deposit: 0,
          commission: 0,
          attachments: []
      });
      setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
      setEditingProject(project);
      setFormData({ ...project });
      setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingProject(null);
  }

  // Handle Drawing Date Change to auto-update Result Date
  const handleDrawingDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDrawingDate = e.target.value;
      const updates: Partial<Project> = { drawingDueDate: newDrawingDate };

      // Calculate Result Date = Drawing Date + 7 days
      if (newDrawingDate) {
          const d = new Date(newDrawingDate);
          if (!isNaN(d.getTime())) {
              d.setDate(d.getDate() + 7);
              updates.dueDate = d.toISOString().split('T')[0];
          }
      }
      setFormData(prev => ({ ...prev, ...updates }));
  };

  // Generate ID logic
  const generateNewId = () => {
    const conf = systemConfig.projectIdConfig;
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const sep = conf.useSeparator ? conf.separator : '';
    const dateStr = conf.includeDate ? `${sep}${month}${year}` : '';
    const seqNum = projects.length + 1; 
    const seqStr = String(seqNum).padStart(conf.numberLength, '0');
    return `${conf.prefix}${dateStr}${sep}${seqStr}`;
  }

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // CHECK DUPLICATE PLOT
      if (formData.plotNumber && formData.plotPage) {
          const duplicate = projects.find(p => 
              p.id !== (editingProject?.id || '') && 
              p.plotNumber === formData.plotNumber && 
              p.plotPage === formData.plotPage
          );

          if (duplicate) {
              const confirmAdd = window.confirm(
                  `CẢNH BÁO: Số tờ ${formData.plotNumber}, Số thửa ${formData.plotPage} đã tồn tại trong hồ sơ ${duplicate.id} (${duplicate.customerName}).\n\nBạn có chắc chắn muốn tiếp tục không?`
              );
              if (!confirmAdd) return;
          }
      }

      const customer = customers.find(c => c.id === formData.customerId);
      const technician = employees.find(e => e.id === formData.technicianId);

      const projectData: Project = {
          id: editingProject ? editingProject.id : generateNewId(),
          customerId: formData.customerId || '',
          customerName: customer?.name || 'Khách vãng lai',
          customerPhone: customer?.phone,
          officeId: formData.officeId || '',
          type: formData.type,
          address: formData.address || '',
          plotNumber: formData.plotNumber,
          plotPage: formData.plotPage,
          landOwner: formData.landOwner,
          ownerBirthYear: formData.ownerBirthYear,
          landArea: formData.landArea || 0,
          status: formData.status as ProjectStatus,
          
          createdDate: formData.createdDate || new Date().toISOString().split('T')[0],
          dueDate: formData.dueDate,
          drawingDueDate: formData.drawingDueDate,
          
          revenue: formData.revenue || 0,
          deposit: formData.deposit || 0,
          commission: formData.commission || 0,
          
          technicianId: formData.technicianId,
          technicianName: technician?.name,
          // Only change technician status if newly assigned
          technicianStatus: (formData.technicianId && !editingProject?.technicianId) ? 'PENDING_ACCEPT' : (formData.technicianStatus || 'PENDING_ACCEPT'),
          
          errorNote: formData.errorNote,
          attachments: formData.attachments || []
      };

      if (editingProject) {
          onUpdateProject(projectData);
      } else {
          onAddProject(projectData);
      }
      handleCloseModal();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setIsUploading(true);
          const files = Array.from(e.target.files);
          const newAttachments: Attachment[] = [];
          try {
            for (const file of files) {
                const url = await uploadFile(file);
                newAttachments.push({
                    id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: file.name,
                    type: file.type === 'application/pdf' ? 'PDF' : 'IMAGE',
                    url: url,
                    uploadDate: new Date().toISOString().split('T')[0]
                });
            }
            setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...newAttachments] }));
          } catch (error) {
              alert("Lỗi upload file");
          } finally {
              setIsUploading(false);
          }
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Hồ sơ & Đo đạc</h2>
        <div className="flex gap-2 w-full sm:w-auto">
             <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Tìm mã HS, khách, địa chỉ, số tờ/thửa, chủ đất..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                />
            </div>
             <select 
                className="border rounded-lg px-3 py-2 bg-white shadow-sm text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'ALL')}
             >
                 <option value="ALL">Tất cả trạng thái</option>
                 <option value={ProjectStatus.PENDING}>{ProjectStatus.PENDING}</option>
                 <option value={ProjectStatus.ASSIGNED}>{ProjectStatus.ASSIGNED}</option>
                 <option value={ProjectStatus.SURVEYING}>{ProjectStatus.SURVEYING}</option>
                 <option value={ProjectStatus.OFFICE_WORK}>{ProjectStatus.OFFICE_WORK}</option>
                 <option value={ProjectStatus.COMPLETED}>{ProjectStatus.COMPLETED}</option>
                 <option value={ProjectStatus.CANCELLED}>{ProjectStatus.CANCELLED}</option>
             </select>

            {canEditProject && (
              <button 
                onClick={openAddModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center shrink-0"
              >
                <Plus size={18} className="mr-2" /> Thêm hồ sơ
              </button>
            )}
        </div>
      </div>

      {/* Table - Responsive optimized */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Hồ sơ / Khách</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Chi tiết Đất</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[280px]">Tiến độ & Ghi chú</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Tài chính</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                      <div className="flex flex-col">
                          <span className="font-medium text-blue-600 text-sm">{project.id}</span>
                          <span className="text-sm font-bold text-gray-900 mt-1">{project.customerName}</span>
                          <span className="text-xs text-gray-500 flex items-center mt-1">
                              <Clock size={10} className="mr-1"/> {project.createdDate}
                          </span>
                          <div 
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded w-fit mt-1 border border-transparent md:hidden"
                            style={getTypeStyle(project.type || '')}
                          >
                              {project.type}
                          </div>
                      </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded w-fit mb-1">
                        <span>Tờ: {project.plotNumber || '?'}</span>
                        <span className="text-gray-400">|</span>
                        <span>Thửa: {project.plotPage || '?'}</span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-start mb-1">
                        <MapPin size={12} className="mr-1 mt-0.5 shrink-0" />
                        {project.address}
                    </div>
                    {project.landOwner && (
                        <div className="text-xs text-indigo-600 mb-1">
                            Chủ đất: {project.landOwner} {project.ownerBirthYear ? `(${project.ownerBirthYear})` : ''}
                        </div>
                    )}
                    {project.landArea && (
                        <div className="text-xs text-gray-500 font-mono">
                            DT: {project.landArea} m²
                        </div>
                    )}
                    <div 
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded w-fit mt-1 border border-transparent"
                        style={getTypeStyle(project.type || '')}
                    >
                        {project.type}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                              {getProjectStatusDisplay(project)}
                              {project.technicianName && <span className="text-xs text-gray-500 flex items-center"><UserIcon size={10} className="mr-1"/> {project.technicianName}</span>}
                          </div>
                          
                          <div className="text-xs text-gray-500 flex items-center space-x-3">
                              <span className={isDrawingOverdue(project) ? "text-red-600 font-bold" : ""}>Hạn BV: {project.drawingDueDate || '--'}</span>
                              <span>Trả KQ: {project.dueDate || '--'}</span>
                          </div>

                          {/* Error Note Display */}
                          {project.errorNote && (
                              <div className="text-xs text-red-700 bg-red-100 p-2 rounded border border-red-200 flex items-start animate-pulse" title="Có lỗi / Yêu cầu chỉnh sửa">
                                  <AlertTriangle size={14} className="mr-1.5 mt-0.5 shrink-0 text-red-600" />
                                  <span className="font-semibold">{project.errorNote}</span>
                              </div>
                          )}

                          {project.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                  {project.attachments.map(att => (
                                      <a 
                                        key={att.id} 
                                        href={att.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        title={att.name} 
                                        className="flex items-center text-xs bg-white border border-gray-300 px-2 py-1.5 rounded shadow-sm hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition group"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                          {att.type === 'PDF' ? <FileIcon size={14} className="text-red-500 mr-1.5 group-hover:scale-110 transition-transform"/> : <ImageIcon size={14} className="text-blue-500 mr-1.5 group-hover:scale-110 transition-transform"/>}
                                          <span className="truncate max-w-[100px] font-medium">{att.name}</span>
                                      </a>
                                  ))}
                              </div>
                          )}
                      </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800">{formatCurrency(project.revenue)}</div>
                    {project.deposit > 0 && (
                        <div className="text-xs text-green-600 mt-1 flex items-center">
                            <CheckCircle size={10} className="mr-1" />
                            Đã cọc: {formatCurrency(project.deposit)}
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                        onClick={() => openEditModal(project)}
                        className={`p-2 rounded-full transition ${canEditProject ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}
                        title={canEditProject ? "Chỉnh sửa hồ sơ" : "Xem chi tiết hồ sơ"}
                    >
                        {canEditProject ? <Edit size={20} /> : <Eye size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                          Không tìm thấy hồ sơ nào phù hợp với bộ lọc.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Modal */}
       {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                  <div className="flex justify-between items-center p-6 border-b bg-gray-50 rounded-t-lg">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                            {editingProject ? (isReadOnly ? `Chi tiết Hồ sơ: ${editingProject.id}` : `Cập nhật Hồ sơ: ${editingProject.id}`) : 'Thêm hồ sơ mới'}
                            {isReadOnly && <span className="ml-3 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-normal">Chế độ xem</span>}
                        </h3>
                        {editingProject && <p className="text-sm text-gray-500">Ngày tạo: {editingProject.createdDate}</p>}
                      </div>
                      <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                      
                      {/* Section 1: Customer & Location */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng <span className="text-red-500">*</span></label>
                              <select 
                                required
                                disabled={isReadOnly}
                                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                                value={formData.customerId || ''}
                                onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                              >
                                  <option value="">-- Chọn khách hàng --</option>
                                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Văn phòng</label>
                              <select 
                                disabled={isReadOnly}
                                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                                value={formData.officeId || ''}
                                onChange={(e) => setFormData({...formData, officeId: e.target.value})}
                              >
                                  {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                              </select>
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ thửa đất <span className="text-red-500">*</span></label>
                              <input 
                                required
                                disabled={isReadOnly}
                                type="text" 
                                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                                value={formData.address || ''}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                placeholder="Số nhà, đường, xã/phường, quận/huyện..."
                              />
                          </div>
                      </div>

                      <hr className="border-gray-100"/>

                      {/* Section 2: Technical Info */}
                      <div>
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center"><MapPin size={18} className="mr-2 text-blue-600"/> Thông tin Đất & Loại hình</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Số Tờ</label>
                                  <input type="text" disabled={isReadOnly} className="w-full border rounded p-2 disabled:bg-gray-100" value={formData.plotNumber || ''} onChange={(e) => setFormData({...formData, plotNumber: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Số Thửa</label>
                                  <input type="text" disabled={isReadOnly} className="w-full border rounded p-2 disabled:bg-gray-100" value={formData.plotPage || ''} onChange={(e) => setFormData({...formData, plotPage: e.target.value})} />
                              </div>
                              <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đất trên sổ</label>
                                  <input type="text" disabled={isReadOnly} className="w-full border rounded p-2 disabled:bg-gray-100" placeholder="Tên chủ đất" value={formData.landOwner || ''} onChange={(e) => setFormData({...formData, landOwner: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Diện tích (m²)</label>
                                  <input type="number" step="0.1" disabled={isReadOnly} className="w-full border rounded p-2 disabled:bg-gray-100" value={formData.landArea || 0} onChange={(e) => setFormData({...formData, landArea: parseFloat(e.target.value)})} />
                              </div>
                              <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại hồ sơ</label>
                                  <select disabled={isReadOnly} className="w-full border rounded p-2 disabled:bg-gray-100" value={formData.type || ''} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                                      {systemConfig.projectTypes.map((t, idx) => <option key={idx} value={t.name}>{t.name}</option>)}
                                  </select>
                              </div>
                          </div>
                      </div>

                      <hr className="border-gray-100"/>

                      {/* Section 3: Dates & Assignment */}
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                           <h4 className="font-semibold text-indigo-800 mb-3 flex items-center"><UserIcon size={18} className="mr-2"/> Phân công & Thời gian</h4>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên đo đạc</label>
                                   <select 
                                     disabled={!canEditProject} // Only Admin/Director can assign
                                     className="w-full border rounded p-2 bg-white disabled:bg-gray-100"
                                     value={formData.technicianId || ''}
                                     onChange={(e) => setFormData({...formData, technicianId: e.target.value})}
                                   >
                                       <option value="">-- Chưa phân công --</option>
                                       {employees.filter(e => e.role === Role.TECHNICIAN).map(e => (
                                           <option key={e.id} value={e.id}>{e.name}</option>
                                       ))}
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp bản vẽ</label>
                                   <input 
                                     type="date" 
                                     disabled={!canEditProject}
                                     className="w-full border rounded p-2 bg-white disabled:bg-gray-100"
                                     value={formData.drawingDueDate || ''}
                                     onChange={handleDrawingDateChange}
                                   />
                               </div>
                               <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">Hẹn trả kết quả (Sau 1 tuần)</label>
                                   <input 
                                     type="date" 
                                     disabled={!canEditProject}
                                     className="w-full border rounded p-2 bg-white disabled:bg-gray-100"
                                     value={formData.dueDate || ''}
                                     onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                                   />
                               </div>
                           </div>
                      </div>

                      {/* Section 4: Status & Notes */}
                      <div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái hồ sơ</label>
                                  <select 
                                    className="w-full border rounded p-2 bg-white disabled:bg-gray-100"
                                    disabled={!canEditProject}
                                    value={formData.status || ProjectStatus.PENDING}
                                    onChange={(e) => setFormData({...formData, status: e.target.value as ProjectStatus})}
                                  >
                                      {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                              </div>
                              {/* Error Note - Director Only Write */}
                              <div>
                                  <label className="block text-sm font-bold text-red-600 mb-1 flex items-center">
                                      <AlertTriangle size={14} className="mr-1"/> Ghi chú lỗi / Yêu cầu sửa
                                  </label>
                                  <input 
                                    type="text" 
                                    disabled={!canEditProject}
                                    className="w-full border border-red-200 rounded p-2 bg-red-50 text-red-700 disabled:bg-gray-100 disabled:text-gray-500 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                                    placeholder={canEditProject ? "Nhập nội dung cần chỉnh sửa..." : "Không có ghi chú"}
                                    value={formData.errorNote || ''}
                                    onChange={(e) => setFormData({...formData, errorNote: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Section 5: Financials & Files */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="bg-gray-50 p-4 rounded border border-gray-200">
                               <h4 className="font-semibold text-gray-700 mb-3 flex items-center"><DollarSign size={16} className="mr-1"/> Tài chính</h4>
                               <div className="space-y-3">
                                   <div>
                                       <label className="block text-xs font-medium text-gray-500">Doanh thu dự kiến</label>
                                       <input disabled={isReadOnly} type="number" className="w-full border rounded p-1.5 text-right font-medium disabled:bg-gray-100" value={formData.revenue || 0} onChange={(e) => setFormData({...formData, revenue: parseFloat(e.target.value)})} />
                                   </div>
                                   <div>
                                       <label className="block text-xs font-medium text-gray-500">Đã tạm ứng (Cọc)</label>
                                       <input disabled={isReadOnly} type="number" className="w-full border rounded p-1.5 text-right font-medium disabled:bg-gray-100" value={formData.deposit || 0} onChange={(e) => setFormData({...formData, deposit: parseFloat(e.target.value)})} />
                                   </div>
                               </div>
                           </div>

                           <div>
                               <h4 className="font-semibold text-gray-700 mb-3 flex items-center"><Upload size={16} className="mr-1"/> Tài liệu đính kèm</h4>
                               {!isReadOnly && (
                                   <div className="mb-2">
                                       <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100 flex items-center justify-center border border-blue-200 border-dashed">
                                           <Plus size={16} className="mr-1"/> Thêm file (Sổ đỏ, CMND...)
                                           <input type="file" className="hidden" multiple onChange={handleFileChange} accept="image/*,application/pdf" />
                                       </label>
                                   </div>
                               )}
                               <div className="space-y-1 max-h-32 overflow-y-auto">
                                   {(formData.attachments || []).map((f, idx) => (
                                       <div key={idx} className="flex justify-between items-center text-sm p-1.5 bg-gray-50 rounded border">
                                           <div className="flex items-center overflow-hidden">
                                                {f.type === 'PDF' ? <FileIcon size={14} className="text-red-500 mr-2 shrink-0"/> : <ImageIcon size={14} className="text-blue-500 mr-2 shrink-0"/>}
                                                <a href={f.url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[150px] hover:text-blue-600 hover:underline">{f.name}</a>
                                           </div>
                                           {!isReadOnly && (
                                                <button type="button" onClick={() => setFormData({...formData, attachments: formData.attachments?.filter((_, i) => i !== idx)})} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                                           )}
                                       </div>
                                   ))}
                                   {formData.attachments?.length === 0 && <p className="text-xs text-gray-400 italic text-center">Chưa có tài liệu.</p>}
                               </div>
                           </div>
                      </div>

                  </form>
                  
                  <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                      <button onClick={handleCloseModal} className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100">Đóng</button>
                      {!isReadOnly && (
                          <button onClick={handleSubmit} disabled={isUploading} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center shadow-sm disabled:bg-gray-400">
                              <Save size={18} className="mr-2"/> {editingProject ? 'Lưu thay đổi' : 'Tạo hồ sơ'}
                          </button>
                      )}
                  </div>
              </div>
          </div>
       )}
    </div>
  );
};

export default HoSo;
