
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FolderKanban, Users, FileText, Settings as SettingsIcon, LogOut, Briefcase, ShieldCheck, Bell, HardHat, User as UserIcon, Camera, Save, X, Menu, Loader2 } from 'lucide-react';
import { Project, Customer, Employee, Quote, ProjectStatus, QuoteStatus, Role, User, Office, SystemConfig, Notification } from './types';
import { uploadFile } from './utils';

// Importing Views
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import CRM from './components/CRM';
import HRM from './components/HRM';
import Quotations from './components/Quotations';
import AdminPortal from './components/AdminPortal';
import SettingsView from './components/Settings'; 
import TechnicianDashboard from './components/TechnicianDashboard'; 

// --- MOCK DATA ---
const MOCK_OFFICES: Office[] = [
  { id: 'OFF-001', name: 'Chi nhánh Củ Chi', address: '123 TL8, Củ Chi, TP.HCM', directorId: 'DIR-003', phone: '028 3790 1234' },
  { id: 'OFF-002', name: 'Chi nhánh Quận 9', address: '456 Lê Văn Việt, TP. Thủ Đức', directorId: 'DIR-003', phone: '028 3730 5678' }
];

const MOCK_PROJECTS: Project[] = [
  { 
    id: 'HS-23-001', customerId: 'C1', customerName: 'Nguyễn Văn A', customerPhone: '0909123456', officeId: 'OFF-001', type: 'Đo đạc hiện trạng',
    address: 'Thửa 12, Củ Chi, TP.HCM', landArea: 150.5, status: ProjectStatus.SURVEYING, 
    revenue: 5000000, deposit: 2000000, createdDate: '2023-10-01', 
    technicianId: 'E1', technicianName: 'Trần Kỹ Thuật', technicianStatus: 'IN_PROGRESS', commission: 250000,
    coords: { x: 123456.78, y: 567890.12 }, drawingDueDate: '2023-10-12', dueDate: '2023-10-15',
    attachments: [
        { id: 'A1', name: 'So_do_scan.pdf', type: 'PDF', url: '#', uploadDate: '2023-10-01' }
    ]
  },
  { 
    id: 'HS-23-002', customerId: 'C2', customerName: 'Công ty BDS Hưng Thịnh', customerPhone: '02838383838', officeId: 'OFF-002', type: 'Phân lô tách thửa',
    address: 'Dự án KDC Long Hậu', landArea: 5000, status: ProjectStatus.PENDING, 
    revenue: 15000000, deposit: 5000000, createdDate: '2023-10-05', dueDate: '2023-10-10',
    attachments: [],
    commission: 0
  },
  { 
    id: 'HS-23-003', customerId: 'C3', customerName: 'Lê Thị C', customerPhone: '0912345678', officeId: 'OFF-002', type: 'Cắm mốc ranh',
    address: 'Quận 9, TP.HCM', landArea: 80, status: ProjectStatus.COMPLETED, 
    revenue: 3000000, deposit: 3000000, createdDate: '2023-09-20', 
    technicianId: 'E1', technicianName: 'Trần Kỹ Thuật', technicianStatus: 'COMPLETED', commission: 200000,
    coords: { x: 123123.00, y: 567567.00 }, drawingDueDate: '2023-09-23', dueDate: '2023-09-25',
    attachments: [] 
  },
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'C1', name: 'Nguyễn Văn A', cccd: '079090123456', phone: '0909123456', email: 'nguyenvana@gmail.com', type: 'Cá nhân', address: 'TP.HCM' },
  { id: 'C2', name: 'Công ty BDS Hưng Thịnh', cccd: '', phone: '02838383838', email: 'contact@hungthinh.vn', type: 'Doanh nghiệp', address: 'TP. Thủ Đức' },
  { id: 'C3', name: 'Lê Thị C', cccd: '072195123456', phone: '0912345678', email: 'lethic@yahoo.com', type: 'Môi giới', address: 'Bình Dương' },
];

const MOCK_EMPLOYEES: Employee[] = [
  { 
    id: 'E1', name: 'Trần Kỹ Thuật', role: Role.TECHNICIAN, jobTitle: 'Tổ trưởng đo đạc', 
    officeId: 'OFF-001', phone: '0901001001', email: 'kythuat@gmail.com',
    salaryType: 'PRODUCT', // Lương sản phẩm
    gender: 'Nam', dob: '1995-05-20', address: '123 Đường Số 1, Củ Chi',
    username: 'kythuat1', password: '123'
  },
  { 
    id: 'E2', name: 'Lê Thị Kế Toán', role: Role.ACCOUNTANT, jobTitle: 'Kế toán trưởng',
    officeId: 'OFF-001', phone: '0902002002', 
    salaryType: 'MONTHLY', salaryMonthly: 10000000, // Lương tháng
    gender: 'Nữ', dob: '1998-10-15', address: '456 Lê Văn Việt, Thủ Đức',
    username: 'ketoan1', password: '123'
  },
  { 
    id: 'E3', name: 'Phạm Quản Lý', role: Role.DIRECTOR, jobTitle: 'Giám đốc chi nhánh',
    officeId: 'OFF-001', phone: '0903003003', 
    salaryType: 'MONTHLY', salaryMonthly: 25000000,
    gender: 'Nam', dob: '1985-01-01', address: '789 Nguyễn Văn Linh, Q7',
    username: 'giamdoc1', password: '123'
  },
  { 
    id: 'E4', name: 'Nguyễn Văn Phụ Việc', role: Role.TECHNICIAN, jobTitle: 'Phụ đo đạc', 
    officeId: 'OFF-001', phone: '0904004004', 
    salaryType: 'DAILY', salaryDaily: 350000, // Lương ngày
    gender: 'Nam', dob: '2000-01-01', address: 'Củ Chi',
  },
];

const INITIAL_CONFIG: SystemConfig = {
    drawingCostItems: [
        { id: '1', name: 'Đo đạc hiện trạng', defaultPrice: 0 }, 
        { id: '2', name: 'Mua dữ liệu', defaultPrice: 1000000 },
        { id: '3', name: 'Kí Biên bản ở xã', defaultPrice: 1000000 },
        { id: '4', name: 'Rút cấp đổi (nếu có)', defaultPrice: 500000 },
        { id: '5', name: 'Phí kiểm tra bản vẽ (25%)', defaultPrice: 0 }, 
        { id: '6', name: 'Kí duyệt bản vẽ', defaultPrice: 1000000 },
        { id: '7', name: 'Xác minh lộn thửa (6tr/thửa)', defaultPrice: 6000000 },
        { id: '8', name: 'Tăng diện tích (10tr/1000m2)', defaultPrice: 10000000 },
    ],
    newCertCostItems: [
        { id: '9', name: 'CC + Soạn HĐ Chuyển nhượng', defaultPrice: 3000000 },
        { id: '10', name: 'Ủy quyền', defaultPrice: 3000000 },
        { id: '11', name: 'Cập nhật hạn sử dụng đất', defaultPrice: 1000000 },
        { id: '12', name: 'Xóa hộ', defaultPrice: 6000000 },
        { id: '13', name: 'Giấy mới', defaultPrice: 2000000 },
        { id: '14', name: 'Trích lục hồ gốc', defaultPrice: 1000000 },
        { id: '15', name: 'Điều chỉnh CMND sang CCCD', defaultPrice: 1000000 },
        { id: '16', name: 'Thuế Chuyển nhượng (Auto)', defaultPrice: 0 }, 
        { id: '17', name: 'CC, Soạn HĐ Tặng cho', defaultPrice: 3000000 },
        { id: '18', name: 'CC, Soạn HĐ Thừa kế', defaultPrice: 8000000 },
        { id: '19', name: 'Thuế Chuyển MĐSD (Auto)', defaultPrice: 0 }, 
    ],
    statusLabels: {
        [QuoteStatus.DRAFT]: { label: 'Nháp', color: '#9ca3af' },
        [QuoteStatus.PENDING_APPROVAL]: { label: 'Chờ duyệt', color: '#eab308' },
        [QuoteStatus.APPROVED]: { label: 'Đã duyệt', color: '#16a34a' },
        [QuoteStatus.REJECTED]: { label: 'Đã hủy', color: '#dc2626' },
    },
    quoteIdConfig: { prefix: 'BG', useSeparator: true, separator: '-', includeDate: true, numberLength: 4 },
    projectIdConfig: { prefix: 'HS', useSeparator: true, separator: '-', includeDate: true, numberLength: 3 },
    commissionRules: [
        { id: 'R1', minArea: 0, maxArea: 100, amount: 200000 },
        { id: 'R2', minArea: 101, maxArea: 500, amount: 350000 },
        { id: 'R3', minArea: 501, maxArea: 1000, amount: 500000 },
        { id: 'R4', minArea: 1001, maxArea: 10000, amount: 1000000 },
    ],
    projectTypes: [
      { name: 'Đo đạc hiện trạng', color: '#3b82f6' },
      { name: 'Cắm mốc ranh', color: '#f97316' },
      { name: 'Trích lục bản đồ', color: '#8b5cf6' },
      { name: 'Phân lô tách thửa', color: '#10b981' },
      { name: 'Hoàn công', color: '#ec4899' },
      { name: 'Khác', color: '#6b7280' }
    ],
    payrollConfig: {
        standardWorkDays: 26,
        leavePayPercent: 100,
        absenceFine: 200000,
        insurancePercent: 10.5,
        insuranceBase: 'BASIC'
    },
    quoteAreaRules: [
        { id: 'Q1', minArea: 0, maxArea: 99.9, priceUrban: 1031000, priceRural: 704000 },
        { id: 'Q2', minArea: 100, maxArea: 300, priceUrban: 1224000, priceRural: 836000 },
        { id: 'Q3', minArea: 301, maxArea: 500, priceUrban: 1297000, priceRural: 889000 },
        { id: 'Q4', minArea: 501, maxArea: 1000, priceUrban: 1589000, priceRural: 1082000 },
        { id: 'Q5', minArea: 1001, maxArea: 3000, priceUrban: 2179000, priceRural: 1482000 },
        { id: 'Q6', minArea: 3001, maxArea: 10000, priceUrban: 3347000, priceRural: 2285000 },
        { id: 'Q7', minArea: 10001, maxArea: 100000, priceUrban: 4015000, priceRural: 2741000 }, // 1ha - 10ha
        { id: 'Q8', minArea: 100001, maxArea: 500000, priceUrban: 4350000, priceRural: 2970000 }, // 10ha - 50ha
    ]
}

const MOCK_QUOTES: Quote[] = [
  { 
    id: 'BG-23-112', customerId: 'C2', customerName: 'Công ty BDS Hưng Thịnh', totalAmount: 1500000, status: QuoteStatus.PENDING_APPROVAL, createdDate: '2023-10-04', type: 'DRAWING',
    items: [{ id: '1', name: 'Phí đo đạc hiện trạng', price: 500000, isEnabled: true, isCustom: false }, { id: '4', name: 'Rút cấp đổi (nếu có)', price: 1000000, isEnabled: true, isCustom: false }],
    attachments: []
  },
  { 
    id: 'BG-23-110', customerId: 'C1', customerName: 'Nguyễn Văn A', totalAmount: 2000000, status: QuoteStatus.APPROVED, createdDate: '2024-01-14', type: 'DRAWING',
    items: [{ id: '1', name: 'Phí đo đạc hiện trạng', price: 2000000, isEnabled: true, isCustom: false }],
    attachments: []
  },
];

const INITIAL_DIRECTORS: User[] = [
  { id: 'DIR-001', name: 'Nguyễn Giám Đốc A', email: 'giamdoc.a@gmail.com', username: 'admin_a', password: '123', role: Role.DIRECTOR, licenseInfo: { startDate: '2023-01-01', durationYears: 1, endDate: '2024-01-01', maxOffices: 2, maxEmployees: 10, isActive: true } },
  { id: 'DIR-002', name: 'Trần Giám Đốc B', email: 'giamdoc.b@yahoo.com', username: 'admin_b', password: '456', role: Role.DIRECTOR, licenseInfo: { startDate: '2023-06-01', durationYears: 2, endDate: '2025-06-01', maxOffices: 1, maxEmployees: 5, isActive: true } },
  { id: 'DIR-003', name: 'Lê Giám Đốc C (Expiring)', email: 'giamdoc.c@company.vn', username: 'admin_c', password: '789', role: Role.DIRECTOR, licenseInfo: { startDate: '2022-11-01', durationYears: 1, endDate: '2023-11-01', maxOffices: 3, maxEmployees: 20, isActive: true } },
];

enum View {
  DASHBOARD = 'DASHBOARD',
  PROJECTS = 'PROJECTS',
  CRM = 'CRM',
  QUOTATIONS = 'QUOTATIONS',
  HRM = 'HRM',
  SETTINGS = 'SETTINGS',
  ADMIN_PORTAL = 'ADMIN_PORTAL',
  TECHNICIAN_DASHBOARD = 'TECHNICIAN_DASHBOARD', // New View
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [currentUserRole, setCurrentUserRole] = useState<Role>(Role.SUPER_ADMIN); 
  const [directors, setDirectors] = useState<User[]>(INITIAL_DIRECTORS);
  const [offices, setOffices] = useState<Office[]>(MOCK_OFFICES);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [quotes, setQuotes] = useState<Quote[]>(MOCK_QUOTES);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES); // Converted to state
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(INITIAL_CONFIG);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  // User Profile Mock Data State
  const [customAvatar, setCustomAvatar] = useState<string>('');
  const [customPassword, setCustomPassword] = useState<string>('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // User Mocking Logic
  const currentLoggedInDirector = currentUserRole === Role.DIRECTOR ? directors[2] : null; 
  const currentTechnicianMock = currentUserRole === Role.TECHNICIAN 
      ? { id: 'E1', name: 'Trần Kỹ Thuật', email: 'kythuat@gmail.com', role: Role.TECHNICIAN } as User 
      : null;

  const currentUserMock: User = {
    ...(currentLoggedInDirector || currentTechnicianMock || {
      id: 'USR-MOCK',
      name: 'Super Admin',
      email: 'admin@vp.com',
      role: Role.SUPER_ADMIN,
      username: 'vadmin', 
      password: customPassword || 'Viet@123' 
    }),
    avatarUrl: customAvatar
  };

  // Profile Update Handler
  const handleUpdateProfile = (newAvatarUrl: string, newPass: string) => {
    setCustomAvatar(newAvatarUrl);
    if(newPass) setCustomPassword(newPass);
    setIsProfileModalOpen(false);
    alert('Cập nhật thông tin cá nhân thành công!');
  }

  // Handle Avatar File Selection
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setIsUploadingAvatar(true);
          try {
              const file = e.target.files[0];
              const imageUrl = await uploadFile(file);
              setCustomAvatar(imageUrl);
          } catch (err) {
              alert('Lỗi khi tải ảnh đại diện');
          } finally {
              setIsUploadingAvatar(false);
          }
      }
  };

  // --- Actions ---
  const addNotification = (userId: string, title: string, message: string) => {
      const newNotif: Notification = {
          id: `NOT-${Date.now()}`,
          userId,
          title,
          message,
          isRead: false,
          createdAt: new Date().toISOString(),
          type: 'ASSIGNMENT'
      };
      setNotifications(prev => [newNotif, ...prev]);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    // Check if new assignment (technician changed or newly assigned)
    const oldProject = projects.find(p => p.id === updatedProject.id);
    if (updatedProject.technicianId && updatedProject.technicianId !== oldProject?.technicianId) {
        // Find technician email
        const tech = employees.find(e => e.id === updatedProject.technicianId);
        if (tech) {
            console.log(`[EMAIL SYSTEM] Sending email to ${tech.email}: You have been assigned to project ${updatedProject.id}`);
            addNotification(tech.id, 'Phân công mới', `Bạn được phân công hồ sơ ${updatedProject.id}`);
        }
    }

    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  // State Updaters
  const handleAddDirector = (newDirector: User) => setDirectors([...directors, newDirector]);
  const handleUpdateDirector = (updatedDirector: User) => setDirectors(directors.map(d => d.id === updatedDirector.id ? updatedDirector : d));
  const handleAddOffice = (newOffice: Office) => setOffices([...offices, newOffice]);
  const handleUpdateOffice = (updatedOffice: Office) => setOffices(offices.map(o => o.id === updatedOffice.id ? updatedOffice : o));
  const handleAddCustomer = (newCustomer: Customer) => setCustomers([...customers, newCustomer]);
  const handleUpdateCustomer = (updatedCustomer: Customer) => setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  const handleAddQuote = (newQuote: Quote) => setQuotes([...quotes, newQuote]);
  const handleUpdateQuote = (updatedQuote: Quote) => setQuotes(quotes.map(q => q.id === updatedQuote.id ? updatedQuote : q));
  const handleAddProject = (newProject: Project) => setProjects([...projects, newProject]);
  
  // Employee Handlers
  const handleAddEmployee = (newEmployee: Employee) => setEmployees([...employees, newEmployee]);
  const handleUpdateEmployee = (updatedEmployee: Employee) => setEmployees(employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
  const handleDeleteEmployee = (id: string) => setEmployees(employees.filter(e => e.id !== id));


  const getDaysRemaining = (endDateStr?: string) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  const renderContent = () => {
    // Route Technician immediately to their dashboard
    if (currentUserRole === Role.TECHNICIAN) {
        return <TechnicianDashboard currentUser={currentUserMock} projects={projects} onUpdateProject={handleUpdateProject} />;
    }

    switch (currentView) {
      case View.DASHBOARD:
        return (
          <Dashboard 
            projects={projects} 
            offices={offices} 
            currentUser={currentUserMock}
            onAddOffice={handleAddOffice}
            onUpdateOffice={handleUpdateOffice}
          />
        );
      case View.PROJECTS:
        return (
          <Projects 
            projects={projects} 
            customers={customers}
            offices={offices}
            quotes={quotes}
            employees={employees}
            currentUser={currentUserMock}
            systemConfig={systemConfig}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
          />
        );
      case View.CRM:
        return <CRM customers={customers} projects={projects} quotes={quotes} systemConfig={systemConfig} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} />;
      case View.HRM:
        return (
            <HRM 
                employees={employees} 
                projects={projects} 
                offices={offices}
                currentUser={currentUserMock}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                systemConfig={systemConfig} // Pass config
                onUpdateSystemConfig={setSystemConfig} // Pass updater
            />
        );
      case View.QUOTATIONS:
        return (
            <Quotations 
                quotes={quotes} 
                customers={customers} 
                currentUser={currentUserMock} 
                systemConfig={systemConfig} 
                directors={directors}
                onAddQuote={handleAddQuote} 
                onUpdateQuote={handleUpdateQuote}
                onNotify={addNotification} // Pass notification handler
            />
        );
      case View.ADMIN_PORTAL:
        return <AdminPortal directors={directors} onAddDirector={handleAddDirector} onUpdateDirector={handleUpdateDirector} />;
      case View.SETTINGS:
        return <SettingsView config={systemConfig} onUpdateConfig={setSystemConfig} />;
      case View.TECHNICIAN_DASHBOARD: // Fallback if switched manually
        return <TechnicianDashboard currentUser={currentUserMock} projects={projects} onUpdateProject={handleUpdateProject} />;
      default:
        return <Dashboard projects={projects} offices={offices} currentUser={currentUserMock} onAddOffice={handleAddOffice} onUpdateOffice={handleUpdateOffice} />;
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: React.ElementType; label: string }) => (
    <button
      onClick={() => { setCurrentView(view); setIsSidebarOpen(false); }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
        currentView === view ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const daysLeft = currentLoggedInDirector ? getDaysRemaining(currentLoggedInDirector.licenseInfo?.endDate) : 0;
  const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;
  const isExpired = daysLeft <= 0;

  // Filter notifications for current user
  const myNotifications = notifications.filter(n => n.userId === currentUserMock.id && !n.isRead);

  // Profile Modal Component
  const UserProfileModal = () => {
      const [newPass, setNewPass] = useState('');
      
      return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="text-lg font-bold text-gray-800">Thông tin tài khoản</h3>
                      <button onClick={() => setIsProfileModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  
                  <div className="flex flex-col items-center mb-6">
                      <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl mb-2 overflow-hidden border-2 border-blue-500 relative group">
                           {isUploadingAvatar ? (
                               <Loader2 size={24} className="animate-spin" />
                           ) : customAvatar ? (
                               <img src={customAvatar} alt="Avatar" className="h-full w-full object-cover"/>
                           ) : (
                               currentUserMock.name.charAt(0)
                           )}
                           <label className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                               <Camera size={24} />
                               <input type="file" className="hidden" accept="image/*" onChange={handleAvatarFileChange} />
                           </label>
                      </div>
                      <div className="text-sm font-bold">{currentUserMock.name}</div>
                      <div className="text-xs text-gray-500">{currentUserMock.role} | {currentUserMock.username || 'N/A'}</div>
                  </div>

                  <div className="space-y-3">
                      <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Đổi mật khẩu mới</label>
                          <input 
                            type="password" 
                            className="w-full border rounded px-2 py-1 text-sm"
                            placeholder="Nhập mật khẩu mới..."
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                          />
                      </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                      <button onClick={() => handleUpdateProfile(customAvatar, newPass)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center">
                          <Save size={16} className="mr-2"/> Lưu thay đổi
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100 justify-between">
          <div className="flex items-center space-x-2 text-blue-700">
            <ShieldCheck className={currentUserRole === Role.SUPER_ADMIN ? 'text-indigo-600' : 'text-blue-700'} />
            <div className="flex items-baseline">
              <span className="text-xl font-bold tracking-tight">VPdodac</span>
              <span className="ml-1 text-xs text-gray-400 font-normal">V25.01</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500">
              <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {currentUserRole === Role.SUPER_ADMIN && (
             <div className="mb-6">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">Super Admin</div>
                <NavItem view={View.ADMIN_PORTAL} icon={ShieldCheck} label="Quản trị hệ thống" />
             </div>
          )}
          
          {currentUserRole === Role.TECHNICIAN ? (
              <div>
                   <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">Kỹ Thuật Viên</div>
                   <NavItem view={View.TECHNICIAN_DASHBOARD} icon={HardHat} label="Cổng Kỹ thuật" />
              </div>
          ) : (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">Văn phòng</div>
                <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Tổng quan" />
                <NavItem view={View.PROJECTS} icon={FolderKanban} label="Hồ sơ & Đo đạc" />
                <NavItem view={View.QUOTATIONS} icon={FileText} label="Báo giá" />
                <NavItem view={View.CRM} icon={Briefcase} label="Khách hàng" />
                <NavItem view={View.HRM} icon={Users} label="Nhân sự & Lương" />
                <div className="pt-4 mt-4 border-t border-gray-100">
                    <NavItem view={View.SETTINGS} icon={SettingsIcon} label="Cấu hình" />
                </div>
              </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex items-center p-3 rounded-lg space-x-3 cursor-pointer hover:shadow-md transition ${currentUserRole === Role.SUPER_ADMIN ? 'bg-indigo-50 hover:bg-indigo-100' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold overflow-hidden border ${currentUserRole === Role.SUPER_ADMIN ? 'bg-indigo-200 text-indigo-700 border-indigo-300' : 'bg-blue-200 text-blue-700 border-blue-300'}`}>
              {isUploadingAvatar ? <Loader2 size={16} className="animate-spin"/> : (customAvatar ? <img src={customAvatar} alt="Avatar" className="h-full w-full object-cover"/> : (currentUserRole === Role.SUPER_ADMIN ? 'SA' : (currentUserRole === Role.TECHNICIAN ? 'KT' : 'GD')))}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {currentUserMock.name}
              </p>
              <p className="text-xs text-gray-500">
                {currentUserRole}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="flex-none h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10 relative">
          <div className="flex items-center">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="mr-3 md:hidden text-gray-600 hover:text-blue-600"
              >
                  <Menu size={24} />
              </button>
              <h1 className="text-lg font-medium text-gray-700 truncate max-w-[200px] md:max-w-none">
                {currentView === View.ADMIN_PORTAL ? (
                  <span className="font-bold text-indigo-700">PORTAL QUẢN TRỊ VIÊN</span>
                ) : currentView === View.TECHNICIAN_DASHBOARD ? (
                  <span className="font-bold text-blue-700">CỔNG THÔNG TIN KỸ THUẬT</span>
                ) : (
                  <span>Văn phòng: <span className="font-bold text-gray-900">Chi nhánh Củ Chi</span></span>
                )}
              </h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
             {/* Role Switcher for Demo - Hidden on very small screens or abbreviated */}
             <select 
              className="text-xs border rounded p-1 bg-gray-50 max-w-[120px] md:max-w-none" 
              value={currentUserRole}
              onChange={(e) => {
                const newRole = e.target.value as Role;
                setCurrentUserRole(newRole);
                if (newRole === Role.SUPER_ADMIN) setCurrentView(View.ADMIN_PORTAL);
                else if (newRole === Role.TECHNICIAN) setCurrentView(View.TECHNICIAN_DASHBOARD);
                else setCurrentView(View.DASHBOARD);
              }}
            >
              <option value={Role.SUPER_ADMIN}>Super Admin</option>
              <option value={Role.DIRECTOR}>Giám Đốc</option>
              <option value={Role.ACCOUNTANT}>Kế Toán</option>
              <option value={Role.TECHNICIAN}>Kỹ Thuật</option>
            </select>
            
            {/* Notification Bell */}
            <div className="relative group">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 ${myNotifications.length > 0 ? 'text-blue-600' : 'text-gray-400'} hover:text-gray-600`}
              >
                {myNotifications.length > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
                <Bell size={24} />
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 border-b font-bold text-gray-700">Thông báo</div>
                      <div className="max-h-60 overflow-y-auto">
                          {myNotifications.length === 0 ? (
                              <p className="text-sm text-gray-500 p-4 text-center">Không có thông báo mới.</p>
                          ) : (
                              myNotifications.map(n => (
                                  <div key={n.id} className="p-3 border-b hover:bg-gray-50 text-sm">
                                      <p className="font-bold text-blue-600">{n.title}</p>
                                      <p className="text-gray-600">{n.message}</p>
                                      <p className="text-xs text-gray-400 mt-1">{n.createdAt.split('T')[0]}</p>
                                  </div>
                              ))
                          )}
                      </div>
                      <div className="p-2 bg-gray-50 text-center">
                          <button 
                            onClick={() => { setNotifications(prev => prev.map(n => ({...n, isRead: true}))); setShowNotifications(false); }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                              Đánh dấu đã đọc tất cả
                          </button>
                      </div>
                  </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto pb-10">
            {renderContent()}
          </div>
        </div>

        {isProfileModalOpen && <UserProfileModal />}
      </main>
    </div>
  );
};

export default App;
