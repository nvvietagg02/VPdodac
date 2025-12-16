import React, { useState } from 'react';
import { Project, ProjectStatus, Customer, Office, SystemConfig, Quote, QuoteStatus, Employee, Role, Attachment } from '../types';
import { Search, Plus, MapPin, FileText, CheckCircle, Clock, AlertCircle, X, Calendar, DollarSign, Paperclip, User as UserIcon, Upload, Trash2, File as FileIcon, Image as ImageIcon, Briefcase, Phone, Filter, Eye, Loader2 } from 'lucide-react';
import { uploadFile } from '../utils';

interface ProjectsProps {
  projects: Project[];
  customers: Customer[]; 
  offices: Office[];
  quotes: Quote[]; 
  employees: Employee[]; 
  systemConfig: SystemConfig; 
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
}

const Projects: React.FC<ProjectsProps> = ({ projects, customers, offices, quotes, employees, systemConfig, onAddProject, onUpdateProject }) => {
  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  // Default year set to ALL to show full history by default
  const [yearFilter, setYearFilter] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // New Project Form State
  const [createFormData, setCreateFormData] = useState({
      customerId: '',
      customerName: '',
      customerPhone: '',
      officeId: '',
      quoteId: '',
      type: '',
      address: '',
      landArea: '',
      revenue: '',
      deposit: '',
      createdDate: new Date().toISOString().split('T')[0],
      dueDate: '',
  });

  // Edit/Assignment Form State
  const [detailFormData, setDetailFormData] = useState<{
      technicianId: string;
      drawingDueDate: string;
  }>({ technicianId: '', drawingDueDate: '' });
  
  // Attachments State for Detail Modal
  const [activeAttachments, setActiveAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false); // Loading state for uploads

  // --- Display Logic Helpers ---
  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  const calculateCommission = (area: number): number => {
     if (!area) return 0;
     const rule = systemConfig.commissionRules.find(r => area >= r.minArea && area <= r.maxArea);
     return rule ? rule.amount : 0;
  }

  const generateProjectId = () => {
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

  // --- Filter Logic ---
  const filteredProjects = projects.filter(p => {
    // 1. Status Filter
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    
    // 2. Type Filter
    const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
    
    // 3. Date Filter (Creation Date)
    const pDate = new Date(p.createdDate);
    const matchesMonth = monthFilter === 'ALL' || (pDate.getMonth() + 1).toString() === monthFilter;
    // Default ALL shows everything. If user selects year, filter by that year.
    const matchesYear = yearFilter === 'ALL' || pDate.getFullYear() === yearFilter;

    // 4. Search Filter
    const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesMonth && matchesYear && matchesSearch;
  });

  // --- Handlers ---

  const handleCustomerSelect = (custId: string) => {
      const customer = customers.find(c => c.id === custId);
      if (customer) {
          setCreateFormData(prev => ({
              ...prev,
              customerId: custId,
              customerName: customer.name,
              customerPhone: customer.phone,
              quoteId: '', // Reset quote
              revenue: ''  // Reset revenue
          }));
      } else {
           setCreateFormData(prev => ({ ...prev, customerId: '', customerName: '', customerPhone: '', quoteId: '', revenue: '' }));
      }
  }

  const handleQuoteSelect = (qId: string) => {
      const selectedQuote = quotes.find(q => q.id === qId);
      if (selectedQuote) {
          setCreateFormData(prev => ({
              ...prev,
              quoteId: qId,
              revenue: selectedQuote.totalAmount.toString()
          }));
      } else {
           setCreateFormData(prev => ({
              ...prev,
              quoteId: '',
              revenue: ''
          }));
      }
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const landArea = parseFloat(createFormData.landArea) || 0;
      
      const newProject: Project = {
          id: generateProjectId(),
          customerId: createFormData.customerId,
          customerName: createFormData.customerName || 'Unknown',
          customerPhone: createFormData.customerPhone,
          officeId: createFormData.officeId,
          quoteId: createFormData.quoteId,
          type: createFormData.type || 'Khác',
          address: createFormData.address,
          landArea: landArea,
          status: ProjectStatus.PENDING,
          revenue: parseInt(createFormData.revenue.toString().replace(/\./g, '')) || 0,
          deposit: parseInt(createFormData.deposit.toString().replace(/\./g, '')) || 0,
          createdDate: createFormData.createdDate,
          dueDate: createFormData.dueDate || undefined,
          attachments: []
      };

      onAddProject(newProject);
      setIsCreateModalOpen(false);
      
      // Reset
      setCreateFormData({ 
          customerId: '', customerName: '', customerPhone: '', officeId: '', quoteId: '', type: '', address: '', 
          landArea: '', revenue: '', deposit: '', 
          createdDate: new Date().toISOString().split('T')[0], dueDate: ''
      });
  };

  const openDetailModal = (project: Project) => {
      setSelectedProject(project);
      
      // Logic: Suggest Drawing Due Date (7 days before Due Date) if not set
      let currentDrawingDate = project.drawingDueDate || '';
      if (!currentDrawingDate && project.dueDate) {
          const dueDateObj = new Date(project.dueDate);
          const suggestion = new Date(dueDateObj);
          suggestion.setDate(suggestion.getDate() - 7); // Subtract 7 days
          currentDrawingDate = suggestion.toISOString().split('T')[0];
      }

      setDetailFormData({
          technicianId: project.technicianId || '',
          drawingDueDate: currentDrawingDate
      });
      setActiveAttachments(project.attachments || []);
      setIsDetailModalOpen(true);
  }

  // Handle actual file input for attachments with upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setIsUploading(true);
          const files = Array.from(e.target.files);
          const newAttachments: Attachment[] = [];

          try {
            for (const file of files) {
                // Use the utility function to upload (mocks or real blob)
                const url = await uploadFile(file);
                const isPdf = file.type === 'application/pdf';
                
                newAttachments.push({
                    id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: file.name,
                    type: isPdf ? 'PDF' : 'IMAGE',
                    url: url,
                    uploadDate: new Date().toISOString().split('T')[0]
                });
            }
            setActiveAttachments(prev => [...prev, ...newAttachments]);
          } catch (error) {
              alert("Lỗi khi tải file lên.");
          } finally {
              setIsUploading(false);
          }
      }
  };

  const handleRemoveAttachment = (id: string) => {
      setActiveAttachments(activeAttachments.filter(a => a.id !== id));
  }

  const handleDetailSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedProject) return;

      // Validate Date
      if (detailFormData.drawingDueDate && selectedProject.dueDate) {
          if (new Date(detailFormData.drawingDueDate) >= new Date(selectedProject.dueDate)) {
              alert('Cảnh báo: Ngày hoàn thành bản vẽ phải TRƯỚC ngày trả kết quả cho khách hàng!');
          }
      }

      const technician = employees.find(e => e.id === detailFormData.technicianId);
      const isNewAssignment = detailFormData.technicianId && detailFormData.technicianId !== selectedProject.technicianId;
      
      // Set statuses
      let newGlobalStatus = selectedProject.status;
      let newTechStatus = selectedProject.technicianStatus;

      if (isNewAssignment) {
          // If newly assigned, global is Assigned, tech is Pending Accept
          newGlobalStatus = ProjectStatus.ASSIGNED;
          newTechStatus = 'PENDING_ACCEPT';
      } else if (!detailFormData.technicianId) {
          // If unassigned
          newGlobalStatus = ProjectStatus.PENDING;
          newTechStatus = undefined;
      }

      const updatedProject: Project = {
          ...selectedProject,
          technicianId: detailFormData.technicianId,
          technicianName: technician ? technician.name : undefined,
          technicianStatus: newTechStatus,
          drawingDueDate: detailFormData.drawingDueDate,
          status: selectedProject.status === ProjectStatus.COMPLETED ? ProjectStatus.COMPLETED : newGlobalStatus,
          commission: detailFormData.technicianId ? calculateCommission(selectedProject.landArea || 0) : 0,
          attachments: activeAttachments
      };

      onUpdateProject(updatedProject);
      setIsDetailModalOpen(false);
  }

  // --- Dynamic Table Logic ---
  const getProjectStatusDisplay = (project: Project) => {
      if (project.status === ProjectStatus.COMPLETED) {
          return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Hoàn thành</span>;
      }
      if (project.status === ProjectStatus.CANCELLED) {
           return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Đã hủy</span>;
      }

      if (!project.technicianId) {
           return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-600">Chưa phân công</span>;
      } else {
           // Show granular status based on tech flow
           if (project.technicianStatus === 'PENDING_ACCEPT') {
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Đã phân công</span>;
           } else if (project.technicianStatus === 'IN_PROGRESS') {
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Đang làm</span>;
           } else if (project.technicianStatus === 'COMPLETED') {
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Xong đo đạc</span>;
           }
           return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Đã phân công</span>;
      }
  }

  const getTypeStyle = (typeName: string) => {
      const typeConfig = systemConfig.projectTypes.find(t => t.name === typeName);
      if (typeConfig) {
          return { backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }; // 20 for ~12% opacity
      }
      return { backgroundColor: '#f3f4f6', color: '#4b5563' }; // Default gray
  }

  const isDrawingOverdue = (project: Project) => {
      if (!project.drawingDueDate || project.status === ProjectStatus.COMPLETED) return false;
      const today = new Date();
      const due = new Date(project.drawingDueDate);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays <= 2; // Warning if 2 days or less (or overdue)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Hồ sơ (Projects)</h2>
        <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          <span>Thêm hồ sơ</span>
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex flex-col space-y-4">
              {/* Row 1: Search & Date */}
              <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                          type="text" 
                          placeholder="Tìm theo mã hồ sơ hoặc tên khách hàng..." 
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <div className="flex gap-2">
                      <select 
                          className="border rounded-lg px-3 py-2 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500"
                          value={monthFilter}
                          onChange={(e) => setMonthFilter(e.target.value)}
                      >
                          <option value="ALL">Cả năm</option>
                          {Array.from({length: 12}, (_, i) => (
                              <option key={i} value={(i+1).toString()}>Tháng {i+1}</option>
                          ))}
                      </select>
                      <select 
                          className="border rounded-lg px-3 py-2 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500"
                          value={yearFilter}
                          onChange={(e) => setYearFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                      >
                          <option value="ALL">Tất cả năm</option>
                          <option value={2022}>2022</option>
                          <option value={2023}>2023</option>
                          <option value={2024}>2024</option>
                          <option value={2025}>2025</option>
                      </select>
                  </div>
              </div>

              {/* Row 2: Status & Type */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                   <div className="flex items-center text-sm text-gray-600 mr-2 whitespace-nowrap">
                       <Filter size={16} className="mr-2"/> Bộ lọc:
                   </div>
                   <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select 
                            className="border rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="ALL">-- Tất cả loại hồ sơ --</option>
                            {(systemConfig.projectTypes || []).map((t, idx) => (
                                <option key={idx} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                        <select 
                            className="border rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">-- Tất cả trạng thái --</option>
                            <option value={ProjectStatus.PENDING}>Chờ xử lý</option>
                            <option value={ProjectStatus.ASSIGNED}>Đã phân công</option>
                            <option value={ProjectStatus.SURVEYING}>Đang đi đo</option>
                            <option value={ProjectStatus.OFFICE_WORK}>Nội nghiệp</option>
                            <option value={ProjectStatus.COMPLETED}>Hoàn thành</option>
                        </select>
                   </div>
              </div>
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
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái & Tiến độ</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Tài chính</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
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
                    <div className="text-xs text-gray-600 flex items-start">
                        <MapPin size={12} className="mr-1 mt-0.5 shrink-0" />
                        {project.address}
                    </div>
                    {project.landArea && (
                        <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-1 rounded w-fit">
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
                      <div className="flex flex-col space-y-1">
                          <div>{getProjectStatusDisplay(project)}</div>
                          <div className="text-xs text-gray-500 flex items-center">
                              <span className="w-10 font-medium">Hạn BV:</span> 
                              <span className={isDrawingOverdue(project) ? "text-red-600 font-bold" : ""}>{project.drawingDueDate || '--/--'}</span>
                          </div>
                          {project.technicianName && (
                              <div className="text-xs flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded w-fit">
                                 <UserIcon size={10} className="mr-1"/> {project.technicianName}
                              </div>
                          )}
                          {/* Attachments preview on mobile */}
                          {project.attachments.length > 0 && (
                              <div className="flex space-x-1 mt-1">
                                  {project.attachments.map(att => (
                                      <a 
                                        key={att.id} 
                                        href={att.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        title={att.name} 
                                        className="text-gray-400 hover:text-blue-600 cursor-pointer"
                                      >
                                          {att.type === 'PDF' ? <FileIcon size={12}/> : <ImageIcon size={12}/>}
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
                        onClick={() => openDetailModal(project)}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded text-xs font-medium transition"
                    >
                        Chi tiết
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

        {/* Modal Create Project */}
        {isCreateModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 my-8">
                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Tiếp nhận Hồ Sơ Mới</h3>
                        <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                    </div>
                    
                    <form onSubmit={handleCreateSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {/* Auto Info */}
                             <div className="bg-gray-50 p-3 rounded">
                                <label className="block text-xs font-bold text-gray-500 uppercase">Mã Hồ Sơ</label>
                                <div className="text-lg font-mono font-bold text-blue-600">{generateProjectId()}</div>
                             </div>
                             <div className="bg-gray-50 p-3 rounded">
                                <label className="block text-xs font-bold text-gray-500 uppercase">Ngày nhận</label>
                                <input 
                                    type="date" 
                                    required
                                    value={createFormData.createdDate} 
                                    onChange={(e) => setCreateFormData({...createFormData, createdDate: e.target.value})}
                                    className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 text-sm" 
                                />
                             </div>

                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Khách hàng</label>
                                <select 
                                    required 
                                    value={createFormData.customerId} 
                                    onChange={(e) => handleCustomerSelect(e.target.value)}
                                    className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- Chọn khách hàng --</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                                    ))}
                                </select>
                             </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700">Văn phòng</label>
                                <select 
                                    required 
                                    value={createFormData.officeId} 
                                    onChange={(e) => setCreateFormData({...createFormData, officeId: e.target.value})}
                                    className="mt-1 w-full border rounded p-2"
                                >
                                    <option value="">-- Chọn văn phòng --</option>
                                    {offices.map(o => (
                                        <option key={o.id} value={o.id}>{o.name}</option>
                                    ))}
                                </select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Loại hồ sơ</label>
                                <select 
                                    required 
                                    value={createFormData.type} 
                                    onChange={(e) => setCreateFormData({...createFormData, type: e.target.value})}
                                    className="mt-1 w-full border rounded p-2"
                                >
                                    <option value="">-- Chọn loại --</option>
                                    {(systemConfig.projectTypes || []).map((t, idx) => (
                                        <option key={idx} value={t.name}>{t.name}</option>
                                    ))}
                                </select>
                             </div>

                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Địa chỉ thửa đất</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={createFormData.address} 
                                    onChange={(e) => setCreateFormData({...createFormData, address: e.target.value})}
                                    className="mt-1 w-full border rounded p-2"
                                    placeholder="Ví dụ: Thửa 12, Tờ 5, Xã..."
                                />
                            </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700">Diện tích (m²)</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    required
                                    value={createFormData.landArea} 
                                    onChange={(e) => setCreateFormData({...createFormData, landArea: e.target.value})}
                                    className="mt-1 w-full border rounded p-2"
                                    placeholder="0.0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Hẹn trả Khách</label>
                                <input 
                                    type="date" 
                                    value={createFormData.dueDate} 
                                    onChange={(e) => setCreateFormData({...createFormData, dueDate: e.target.value})}
                                    className="mt-1 w-full border rounded p-2"
                                />
                            </div>

                            {/* Revenue Section */}
                            <div className="md:col-span-2 border-t pt-3 mt-2">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Tài chính (Tạm tính)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Dựa trên Báo giá (Optional)</label>
                                        <select 
                                            value={createFormData.quoteId} 
                                            onChange={(e) => handleQuoteSelect(e.target.value)}
                                            disabled={!createFormData.customerId}
                                            className="w-full border rounded p-2 bg-gray-50 text-sm"
                                        >
                                            <option value="">-- Không chọn --</option>
                                            {quotes.filter(q => q.customerId === createFormData.customerId && q.status === QuoteStatus.APPROVED).map(q => (
                                                <option key={q.id} value={q.id}>{q.id} - {formatCurrency(q.totalAmount)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Doanh thu</label>
                                            <input 
                                                type="text" 
                                                value={createFormData.revenue} 
                                                onChange={(e) => setCreateFormData({...createFormData, revenue: e.target.value})}
                                                className="mt-1 w-full border rounded p-2 text-right text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Tạm ứng</label>
                                            <input 
                                                type="text" 
                                                value={createFormData.deposit} 
                                                onChange={(e) => setCreateFormData({...createFormData, deposit: e.target.value})}
                                                className="mt-1 w-full border rounded p-2 text-right text-green-700 font-medium text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-6 mt-4 border-t">
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Hủy</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm">Lưu hồ sơ</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Modal Detail / Assignment */}
        {isDetailModalOpen && selectedProject && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 my-8">
                     <div className="flex justify-between items-center border-b pb-3 mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Chi tiết & Phân công</h3>
                            <p className="text-sm text-blue-600 font-mono">{selectedProject.id} - {selectedProject.customerName}</p>
                        </div>
                        <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                    </div>

                    <form onSubmit={handleDetailSubmit} className="space-y-6">
                        
                        {/* Assignment Section */}
                        <div className="bg-blue-50 p-4 rounded border border-blue-100">
                             <h4 className="font-bold text-blue-800 mb-3 flex items-center"><UserIcon size={18} className="mr-2"/> Phân công Kỹ thuật</h4>
                             <div className="space-y-3">
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700">Kỹ thuật viên</label>
                                     <select 
                                        value={detailFormData.technicianId}
                                        onChange={(e) => setDetailFormData({...detailFormData, technicianId: e.target.value})}
                                        className="mt-1 w-full border rounded p-2"
                                     >
                                         <option value="">-- Chưa phân công --</option>
                                         {employees.filter(e => e.role === Role.TECHNICIAN).map(e => (
                                             <option key={e.id} value={e.id}>{e.name}</option>
                                         ))}
                                     </select>
                                     {detailFormData.technicianId && (
                                         <p className="text-xs text-orange-600 mt-1 italic">
                                             * Lương khoán (DT {selectedProject.landArea}m²): {formatCurrency(calculateCommission(selectedProject.landArea || 0))}
                                         </p>
                                     )}
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700">Hạn nộp bản vẽ (Nội bộ)</label>
                                     <input 
                                        type="date" 
                                        value={detailFormData.drawingDueDate}
                                        onChange={(e) => setDetailFormData({...detailFormData, drawingDueDate: e.target.value})}
                                        className="mt-1 w-full border rounded p-2"
                                     />
                                     <p className="text-xs text-gray-500 mt-1">
                                         {selectedProject.dueDate 
                                            ? `Ngày trả kết quả cho khách: ${selectedProject.dueDate}`
                                            : 'Chưa có ngày hẹn trả khách'}
                                     </p>
                                     {/* Hint about auto-calculation */}
                                     {selectedProject.dueDate && !selectedProject.drawingDueDate && (
                                         <p className="text-xs text-blue-600 italic">
                                             (Đã tự động gợi ý ngày trước hạn trả 7 ngày)
                                         </p>
                                     )}
                                 </div>
                             </div>
                        </div>

                         {/* Attachments Section */}
                         <div>
                             <h4 className="font-bold text-gray-700 mb-2 flex items-center">
                                 <Paperclip size={18} className="mr-2"/> Tệp đính kèm
                             </h4>
                             <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                 <div className="flex gap-2 mb-3">
                                     <div className="relative flex-1">
                                         <input 
                                            type="file" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="image/*,application/pdf"
                                            multiple
                                            onChange={handleFileChange}
                                         />
                                         <div className="border rounded px-3 py-2 text-sm bg-white text-gray-500 text-center flex items-center justify-center hover:bg-gray-100 cursor-pointer">
                                             <Upload size={16} className="mr-2"/> 
                                             {isUploading ? "Đang tải lên..." : "Click để tải lên (PDF/Ảnh)"}
                                         </div>
                                     </div>
                                 </div>
                                 <div className="space-y-1">
                                     {activeAttachments.map(att => (
                                         <div key={att.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 text-sm">
                                             <div className="flex items-center overflow-hidden">
                                                 {att.type === 'PDF' ? <FileIcon size={14} className="text-red-500 mr-2 shrink-0"/> : <ImageIcon size={14} className="text-blue-500 mr-2 shrink-0"/>}
                                                 <a href={att.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center truncate">
                                                     {att.name}
                                                     <Eye size={12} className="ml-2 text-gray-400 hover:text-blue-600"/>
                                                 </a>
                                             </div>
                                             <button type="button" onClick={() => handleRemoveAttachment(att.id)} className="text-gray-400 hover:text-red-500">
                                                 <Trash2 size={14}/>
                                             </button>
                                         </div>
                                     ))}
                                     {isUploading && (
                                         <div className="text-xs text-blue-600 flex items-center animate-pulse">
                                             <Loader2 size={12} className="mr-1 animate-spin" /> Đang xử lý file...
                                         </div>
                                     )}
                                     {!isUploading && activeAttachments.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có file.</p>}
                                 </div>
                             </div>
                         </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Đóng</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm">Cập nhật</button>
                        </div>

                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Projects;