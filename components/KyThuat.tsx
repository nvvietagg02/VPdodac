
import React, { useState } from 'react';
import { Project, User, TechnicianStatus, ProjectStatus, Attachment } from '../types';
import { Briefcase, Clock, CheckCircle, MapPin, Phone, Upload, FileText, Check, AlertCircle, Calendar, X, Paperclip, File as FileIcon, Image as ImageIcon, Filter, Edit, Eye, Loader2 } from 'lucide-react';
import { uploadFile } from '../utils';

interface KyThuatProps {
  currentUser: User;
  projects: Project[];
  onUpdateProject: (project: Project) => void;
}

const getDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return null;
    const due = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diff;
}

interface ProjectCardProps {
    project: Project;
    showActions?: boolean;
    isCompleted?: boolean;
    onAccept: (project: Project) => void;
    onReport: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, showActions = false, isCompleted = false, onAccept, onReport }) => {
    const daysLeft = getDaysRemaining(project.drawingDueDate);
    const isUrgent = daysLeft !== null && daysLeft <= 2 && !isCompleted;

    return (
        <div className={`bg-white rounded-lg shadow-sm border p-4 mb-4 relative ${isUrgent && showActions ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="font-mono text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">{project.id}</span>
                    <h4 className="font-bold text-gray-800 mt-1">{project.customerName}</h4>
                </div>
                {project.customerPhone && (
                    <div className="flex items-center text-green-700 bg-green-50 px-2 py-1 rounded text-sm font-medium border border-green-100" title="Bôi đen để sao chép">
                        <Phone size={14} className="mr-1" />
                        <span>{project.customerPhone}</span>
                    </div>
                )}
            </div>
            
            <div className="text-sm text-gray-600 space-y-1 mb-3">
                <div className="flex items-start">
                    <MapPin size={14} className="mr-2 mt-1 shrink-0 text-gray-400"/>
                    {project.address}
                </div>
                {project.drawingDueDate && (
                    <div className={`flex items-center ${isUrgent ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        <Clock size={14} className="mr-2"/>
                        Hạn bản vẽ: {project.drawingDueDate} 
                        {isUrgent && <span className="ml-2 text-xs bg-red-100 px-1 rounded">Gấp</span>}
                    </div>
                )}
                <div className="flex items-center text-gray-500">
                    <FileText size={14} className="mr-2"/>
                    Loại: {project.type} ({project.landArea} m²)
                </div>
            </div>

            {(showActions || isCompleted) && (
                <div className="border-t pt-3 flex justify-end space-x-2">
                    {project.technicianStatus === 'PENDING_ACCEPT' && (
                        <button 
                            onClick={() => onAccept(project)}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 flex items-center"
                        >
                            <CheckCircle size={16} className="mr-2"/> Nhận việc
                        </button>
                    )}
                    {project.technicianStatus === 'IN_PROGRESS' && (
                        <button 
                            onClick={() => onReport(project)}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 flex items-center"
                        >
                            <Upload size={16} className="mr-2"/> Hoàn thành & Up file
                        </button>
                    )}
                    {isCompleted && (
                         <button 
                            onClick={() => onReport(project)}
                            className="bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded text-sm font-medium hover:bg-white flex items-center"
                        >
                            <Edit size={16} className="mr-2"/> Cập nhật
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

const KyThuat: React.FC<KyThuatProps> = ({ currentUser, projects, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState<TechnicianStatus>('PENDING_ACCEPT');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // File Upload State
  const [reportFiles, setReportFiles] = useState<Attachment[]>([]);
  // Use state for tracking upload status visual only
  const [isUploading, setIsUploading] = useState(false);

  // Filters
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [filterMonth, setFilterMonth] = useState<number | 'ALL'>(currentMonth);
  const [filterYear, setFilterYear] = useState<number>(currentYear);

  // Filter projects for this technician & date
  const myProjects = projects.filter(p => {
      if (p.technicianId !== currentUser.id) return false;
      
      // Filter logic: use surveyDate (date start) or createdDate
      const dateToCheck = p.surveyDate || p.createdDate;
      const d = new Date(dateToCheck);
      
      const monthMatch = filterMonth === 'ALL' || (d.getMonth() + 1) === filterMonth;
      const yearMatch = d.getFullYear() === filterYear;
      
      return monthMatch && yearMatch;
  });

  const pendingProjects = myProjects.filter(p => !p.technicianStatus || p.technicianStatus === 'PENDING_ACCEPT');
  const inProgressProjects = myProjects.filter(p => p.technicianStatus === 'IN_PROGRESS');
  const completedProjects = myProjects.filter(p => p.technicianStatus === 'COMPLETED');

  // Handlers
  const handleAcceptProject = (project: Project) => {
      const updated: Project = {
          ...project,
          technicianStatus: 'IN_PROGRESS',
          status: ProjectStatus.SURVEYING, // Update global status
          surveyDate: new Date().toISOString().split('T')[0] // Record start date
      };
      onUpdateProject(updated);
  };

  const openReportModal = (project: Project) => {
      setSelectedProject(project);
      setReportFiles([]); 
      setIsReportModalOpen(true);
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setIsUploading(true);
          const files = Array.from(e.target.files);
          const newAttachments: Attachment[] = [];

          try {
              for (const file of files) {
                  const url = await uploadFile(file);
                  const isPdf = file.type === 'application/pdf';
                  newAttachments.push({
                      id: `F-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                      name: file.name,
                      type: isPdf ? 'PDF' : 'IMAGE',
                      url: url,
                      uploadDate: new Date().toISOString().split('T')[0]
                  });
              }
              setReportFiles(prev => [...prev, ...newAttachments]);
          } catch (err) {
              alert('Lỗi upload file!');
          } finally {
              setIsUploading(false);
          }
      }
  };

  const handleCompleteProject = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedProject) return;

      const updated: Project = {
          ...selectedProject,
          technicianStatus: 'COMPLETED',
          status: ProjectStatus.OFFICE_WORK, // Update global status to Office Work
          attachments: [...selectedProject.attachments, ...reportFiles]
      };
      onUpdateProject(updated);
      setIsReportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => setActiveTab('PENDING_ACCEPT')}
            className={`cursor-pointer p-4 rounded-lg border-2 transition ${activeTab === 'PENDING_ACCEPT' ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white shadow-sm'}`}
          >
              <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm text-gray-500">Mới phân công</p>
                      <p className="text-2xl font-bold text-blue-600">{pendingProjects.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full text-blue-600"><AlertCircle size={24}/></div>
              </div>
          </div>
          
          <div 
            onClick={() => setActiveTab('IN_PROGRESS')}
            className={`cursor-pointer p-4 rounded-lg border-2 transition ${activeTab === 'IN_PROGRESS' ? 'border-yellow-500 bg-yellow-50' : 'border-transparent bg-white shadow-sm'}`}
          >
              <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm text-gray-500">Đang thực hiện</p>
                      <p className="text-2xl font-bold text-yellow-600">{inProgressProjects.length}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full text-yellow-600"><Briefcase size={24}/></div>
              </div>
          </div>

          <div 
            onClick={() => setActiveTab('COMPLETED')}
            className={`cursor-pointer p-4 rounded-lg border-2 transition ${activeTab === 'COMPLETED' ? 'border-green-500 bg-green-50' : 'border-transparent bg-white shadow-sm'}`}
          >
              <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm text-gray-500">Đã hoàn thành</p>
                      <p className="text-2xl font-bold text-green-600">{completedProjects.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full text-green-600"><CheckCircle size={24}/></div>
              </div>
          </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center space-x-4 bg-white p-3 rounded-lg border border-gray-200 overflow-x-auto">
           <div className="flex items-center text-sm font-medium text-gray-600 whitespace-nowrap">
               <Filter size={16} className="mr-2"/> Bộ lọc thời gian:
           </div>
           <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
              className="border rounded px-2 py-1 text-sm bg-gray-50"
           >
               <option value="ALL">Cả năm</option>
               {Array.from({length: 12}, (_, i) => <option key={i} value={i+1}>Tháng {i+1}</option>)}
           </select>
           <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="border rounded px-2 py-1 text-sm bg-gray-50"
           >
               <option value={2023}>2023</option>
               <option value={2024}>2024</option>
               <option value={2025}>2025</option>
           </select>
      </div>

      {/* Main List */}
      <div className="bg-gray-50 rounded-lg p-1">
          <h3 className="text-lg font-bold text-gray-800 mb-4 px-2 pt-2">
              {activeTab === 'PENDING_ACCEPT' ? 'Hồ sơ chờ nhận' : 
               activeTab === 'IN_PROGRESS' ? 'Hồ sơ đang đo đạc/xử lý' : 'Lịch sử hoàn thành'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTab === 'PENDING_ACCEPT' && pendingProjects.map(p => (
                  <ProjectCard 
                    key={p.id} 
                    project={p} 
                    showActions={true} 
                    onAccept={handleAcceptProject}
                    onReport={openReportModal}
                  />
              ))}
              {activeTab === 'IN_PROGRESS' && inProgressProjects.map(p => (
                  <ProjectCard 
                    key={p.id} 
                    project={p} 
                    showActions={true} 
                    onAccept={handleAcceptProject}
                    onReport={openReportModal}
                  />
              ))}
              {activeTab === 'COMPLETED' && completedProjects.map(p => (
                  <ProjectCard 
                    key={p.id} 
                    project={p} 
                    isCompleted={true} 
                    onAccept={handleAcceptProject}
                    onReport={openReportModal}
                  />
              ))}
              
              {/* Empty States */}
              {activeTab === 'PENDING_ACCEPT' && pendingProjects.length === 0 && <p className="col-span-full text-center py-10 text-gray-400 italic">Không có hồ sơ mới.</p>}
              {activeTab === 'IN_PROGRESS' && inProgressProjects.length === 0 && <p className="col-span-full text-center py-10 text-gray-400 italic">Bạn đang rảnh rỗi.</p>}
              {activeTab === 'COMPLETED' && completedProjects.length === 0 && <p className="col-span-full text-center py-10 text-gray-400 italic">Chưa có hồ sơ hoàn thành trong khoảng thời gian này.</p>}
          </div>
      </div>

      {/* Report Modal */}
      {isReportModalOpen && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center border-b pb-3 mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                          {selectedProject.technicianStatus === 'COMPLETED' ? 'Cập nhật hồ sơ' : 'Báo cáo hoàn thành'}
                      </h3>
                      <button onClick={() => setIsReportModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                  </div>
                  
                  <div className="mb-4 bg-gray-50 p-3 rounded">
                      <p className="font-bold text-blue-600">{selectedProject.id}</p>
                      <p className="text-sm">{selectedProject.address}</p>
                  </div>

                  <form onSubmit={handleCompleteProject}>
                      <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tải lên file kết quả (PDF/Ảnh)</label>
                          <div className="flex items-center justify-center w-full mb-2">
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <Upload className="w-8 h-8 mb-3 text-gray-500" />
                                      <p className="text-sm text-gray-500"><span className="font-semibold">Click để tải lên</span> hoặc kéo thả</p>
                                      <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 10MB)</p>
                                  </div>
                                  <input type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileChange} />
                              </label>
                          </div>
                          
                          {isUploading && (
                                <div className="text-xs text-blue-600 flex items-center justify-center animate-pulse mb-2">
                                    <Loader2 size={12} className="mr-1 animate-spin" /> Đang tải file lên server...
                                </div>
                          )}

                          <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                              {[...selectedProject.attachments, ...reportFiles].length === 0 && <p className="text-xs text-gray-400 italic">Chưa có file nào.</p>}
                              {[...selectedProject.attachments, ...reportFiles].map((f, i) => (
                                  <div key={i} className="flex justify-between items-center text-sm p-1 bg-white rounded shadow-sm">
                                      <div className="flex items-center overflow-hidden">
                                          {f.type === 'PDF' ? <FileIcon size={14} className="mr-2 text-red-500 shrink-0"/> : <ImageIcon size={14} className="mr-2 text-blue-500 shrink-0"/>} 
                                          <a href={f.url} target="_blank" rel="noopener noreferrer" className="truncate hover:text-blue-600 hover:underline">{f.name}</a>
                                          {f.id.startsWith('F-') && <span className="ml-2 text-xs text-green-600 font-bold shrink-0">(Mới)</span>}
                                      </div>
                                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 ml-2">
                                          <Eye size={14} />
                                      </a>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4 border-t">
                          <button type="button" onClick={() => setIsReportModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Hủy</button>
                          <button type="submit" disabled={isUploading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed">
                              <Check size={16} className="mr-2"/> Lưu Cập Nhật
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default KyThuat;
