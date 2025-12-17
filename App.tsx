
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FolderKanban, Users, FileText, Settings as SettingsIcon, LogOut, Briefcase, ShieldCheck, Bell, HardHat, User as UserIcon, Camera, Save, X, Menu, Loader2, Map } from 'lucide-react';
import { Project, Customer, Employee, Quote, ProjectStatus, QuoteStatus, Role, User, Office, SystemConfig, Notification, CadastralMap } from './types';
import { uploadFile } from './utils';

// Importing Views (Renamed to Vietnamese)
import TongQuan from './components/TongQuan';
import HoSo from './components/HoSo';
import KhachHang from './components/KhachHang';
import NhanSu from './components/NhanSu';
import BaoGia from './components/BaoGia';
import QuanTri from './components/QuanTri';
import CauHinh from './components/CauHinh'; 
import KyThuat from './components/KyThuat'; 
import TraCuu from './components/TraCuu';

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
    ],
    plotNumber: '10', plotPage: '25' // Mock duplicate data
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

const INITIAL_MAPS: CadastralMap[] = [
  { id: '1', commune: 'An Bình', newMap: '1-56', oldMap: '1,3,4,5,8', lucDate: '19/5/2015', ontDate: '25/12/2002' },
  { id: '2', commune: 'Bình Thành', newMap: '1-33', oldMap: '4-8', lucDate: '19/5/2015', ontDate: '12/11/2003' },
  { id: '3', commune: 'Định Mỹ', newMap: '1-56', oldMap: '1-7', lucDate: '16/9/2020', ontDate: '25/04/2001' },
  { id: '4', commune: 'Định Thành', newMap: '1-74', oldMap: '1-6', lucDate: '16/9/2020', ontDate: '13/08/2004' },
  { id: '5', commune: 'Mỹ Phú Đông', newMap: '1-36', oldMap: '1-9', lucDate: '27/4/2009', ontDate: '25/12/2003' },
  { id: '6', commune: 'Núi Sập', newMap: '1-106', oldMap: '1', lucDate: '14/8/2012', ontDate: '13/11/2004' },
  { id: '7', commune: 'Óc Eo', newMap: '1-65', oldMap: '2-4,7', lucDate: '15/6/2021', ontDate: '13/11/2004' },
  { id: '8', commune: 'Phú Hoà', newMap: '1-86', oldMap: '1,3', lucDate: '11/04/2015', ontDate: '15/02/2005' },
  { id: '9', commune: 'Phú Thuận', newMap: '1-65', oldMap: '2-7', lucDate: '16/4/2019', ontDate: '18/02/2003' },
  { id: '10', commune: 'Tây Phú', newMap: '1-41', oldMap: '1,2,5,6,9,10', lucDate: '24/4/2019', ontDate: '25/12/2003' },
  { id: '11', commune: 'Thoại Giang', newMap: '1-43', oldMap: '1-5', lucDate: '16/9/2020', ontDate: '12/11/2003' },
  { id: '12', commune: 'Vĩnh Chánh', newMap: '1-59', oldMap: '1-4', lucDate: '12/04/2018', ontDate: '25/12/2003' },
  { id: '13', commune: 'Vĩnh Khánh', newMap: '1-66', oldMap: '1-6', lucDate: '12/04/2018', ontDate: '25/12/2003' },
  { id: '14', commune: 'Vĩnh Phú', newMap: '1-70', oldMap: '1-5', lucDate: '11/04/2015', ontDate: '03/04/2003' },
  { id: '15', commune: 'Vĩnh Trạch', newMap: '1-101', oldMap: '1-4', lucDate: '15/9/2021', ontDate: '13/08/2004' },
  { id: '16', commune: 'Vọng Đông', newMap: '1-55', oldMap: '2-4,6-9', lucDate: '11/04/2015', ontDate: '25/12/2002' },
  { id: '17', commune: 'Vọng Thê', newMap: '1-34', oldMap: '1-3,6', lucDate: '16/9/2020', ontDate: '24/12/2003' },
];

// Renamed View Enum to Vietnamese to match file structure
enum View {
  TONG_QUAN = 'TONG_QUAN',
  HO_SO = 'HO_SO',
  KHACH_HANG = 'KHACH_HANG',
  BAO_GIA = 'BAO_GIA',
  NHAN_SU = 'NHAN_SU',
  CAU_HINH = 'CAU_HINH',
  QUAN_TRI = 'QUAN_TRI',
  KY_THUAT = 'KY_THUAT',
  TRA_CUU = 'TRA_CUU', // New View
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.TONG_QUAN);
  const [currentUserRole, setCurrentUserRole] = useState<Role>(Role.SUPER_ADMIN); 
  const [directors, setDirectors] = useState<User[]>(INITIAL_DIRECTORS);
  const [offices, setOffices] = useState<Office[]>(MOCK_OFFICES);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [quotes, setQuotes] = useState<Quote[]>(MOCK_QUOTES);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES); 
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(INITIAL_CONFIG);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

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

  const getDaysRemaining = (endDateStr?: string) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  // --- ACTIONS ---
  const addNotification = (userId: string, title: string, message: string) => {
      const newNotif: Notification = {
          id: `NOT-${Date.now()}-${Math.random()}`,
          userId,
          title,
          message,
          isRead: false,
          createdAt: new Date().toISOString(),
          type: 'SYSTEM'
      };
      setNotifications(prev => [newNotif, ...prev]);
  };

  // --- SYSTEM CHECKS (EFFECT) ---
  useEffect(() => {
      // 1. Check License Expiry (Only if Director)
      if (currentLoggedInDirector && currentLoggedInDirector.licenseInfo) {
          const days = getDaysRemaining(currentLoggedInDirector.licenseInfo.endDate);
          if (days > 0 && days <= 30) {
              // Simple check to avoid spamming notification on every render (in a real app this would be more robust)
              const hasNotified = notifications.some(n => n.type === 'SYSTEM' && n.title.includes('Bản quyền'));
              if (!hasNotified) {
                  addNotification(
                      currentLoggedInDirector.id, 
                      'Cảnh báo Bản quyền', 
                      `Gói phần mềm sắp hết hạn trong ${days} ngày. Vui lòng liên hệ Admin để gia hạn.`
                  );
              }
          }
      }

      // 2. Check Overdue Projects
      // Filter projects that are NOT completed and due date is close
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      projects.forEach(p => {
          if (p.status !== ProjectStatus.COMPLETED && p.status !== ProjectStatus.CANCELLED && p.dueDate) {
              const due = new Date(p.dueDate);
              const diffTime = due.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays <= 3 && diffDays >= 0) { // Due in 3 days or less (but not passed too long ago for this specific alert type)
                   // Notify Director
                   if (currentLoggedInDirector) {
                        const exists = notifications.some(n => n.message.includes(p.id));
                        if(!exists) {
                            addNotification(currentLoggedInDirector.id, 'Hồ sơ sắp đến hạn', `Hồ sơ ${p.id} (${p.customerName}) cần trả kết quả trong ${diffDays} ngày.`);
                        }
                   }
                   // Notify Technician
                   if (p.technicianId) {
                        const exists = notifications.some(n => n.message.includes(p.id) && n.userId === p.technicianId);
                        if (!exists) {
                            addNotification(p.technicianId, 'Hồ sơ sắp đến hạn', `Hồ sơ ${p.id} của bạn cần hoàn thành trong ${diffDays} ngày.`);
                        }
                   }
              }
          }
      });

  }, [currentLoggedInDirector, projects]); // Run when director or projects change (basic dependency)


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

  const handleUpdateProject = (updatedProject: Project) => {
    const oldProject = projects.find(p => p.id === updatedProject.id);
    
    // Check Assignment Notification (Director -> Technician)
    // Trigger if technicianId changes OR if newly assigned
    if (updatedProject.technicianId && updatedProject.technicianId !== oldProject?.technicianId) {
        // Find technician info
        const tech = employees.find(e => e.id === updatedProject.technicianId);
        if (tech) {
            console.log(`[NOTIFY] Sending assignment notification to ${tech.name}`);
            addNotification(tech.id, 'Phân công mới', `Giám đốc đã phân công hồ sơ ${updatedProject.id} cho bạn.`);
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

  const renderContent = () => {
    // Route Technician immediately to their dashboard
    if (currentUserRole === Role.TECHNICIAN) {
        return (
            <KyThuat 
                currentUser={currentUserMock} 
                projects={projects} 
                onUpdateProject={handleUpdateProject} 
                onNotify={addNotification}
                directors={directors}
            />
        );
    }

    switch (currentView) {
      case View.TONG_QUAN:
        return (
          <TongQuan 
            projects={projects} 
            offices={offices} 
            currentUser={currentUserMock}
            onAddOffice={handleAddOffice}
            onUpdateOffice={handleUpdateOffice}
          />
        );
      case View.HO_SO:
        return (
          <HoSo 
            projects={projects} 
            customers={customers}
            offices={offices}
            quotes={quotes}
            employees={employees}
            currentUser={currentUserMock}
            systemConfig={systemConfig}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onNotify={addNotification}
          />
        );
      case View.KHACH_HANG:
        return <KhachHang customers={customers} projects={projects} quotes={quotes} systemConfig={systemConfig} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} />;
      case View.NHAN_SU:
        return (
            <NhanSu 
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
      case View.BAO_GIA:
        return (
            <BaoGia 
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
      case View.QUAN_TRI:
        return <QuanTri directors={directors} onAddDirector={handleAddDirector} onUpdateDirector={handleUpdateDirector} />;
      case View.CAU_HINH:
        return <CauHinh config={systemConfig} onUpdateConfig={setSystemConfig} />;
      case View.KY_THUAT: 
        return (
            <KyThuat 
                currentUser={currentUserMock} 
                projects={projects} 
                onUpdateProject={handleUpdateProject}
                onNotify={addNotification}
                directors={directors} 
            />
        );
      case View.TRA_CUU:
        return <TraCuu initialMaps={INITIAL_MAPS} currentUser={currentUserMock} />;
      default:
        return <TongQuan projects={projects} offices={offices} currentUser={currentUserMock} onAddOffice={handleAddOffice} onUpdateOffice={handleUpdateOffice} />;
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
              <span className="ml-1 text-xs text-gray-400 font-normal">V25.02</span>
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
                <NavItem view={View.QUAN_TRI} icon={ShieldCheck} label="Quản trị hệ thống" />
             </div>
          )}
          
          {currentUserRole === Role.TECHNICIAN ? (
              <div>
                   <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">Kỹ Thuật Viên</div>
                   <NavItem view={View.KY_THUAT} icon={HardHat} label="Cổng Kỹ thuật" />
              </div>
          ) : (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">Văn phòng</div>
                <NavItem view={View.TONG_QUAN} icon={LayoutDashboard} label="Tổng quan" />
                <NavItem view={View.HO_SO} icon={FolderKanban} label="Hồ sơ & Đo đạc" />
                <NavItem view={View.BAO_GIA} icon={FileText} label="Báo giá" />
                <NavItem view={View.KHACH_HANG} icon={Briefcase} label="Khách hàng" />
                <NavItem view={View.NHAN_SU} icon={Users} label="Nhân sự & Lương" />
                <NavItem view={View.TRA_CUU} icon={Map} label="Tra cứu bản đồ" />
                <div className="pt-4 mt-4 border-t border-gray-100">
                    <NavItem view={View.CAU_HINH} icon={SettingsIcon} label="Cấu hình" />
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
                {currentView === View.QUAN_TRI ? (
                  <span className="font-bold text-indigo-700">PORTAL QUẢN TRỊ VIÊN</span>
                ) : currentView === View.KY_THUAT ? (
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
                if (newRole === Role.SUPER_ADMIN) setCurrentView(View.QUAN_TRI);
                else if (newRole === Role.TECHNICIAN) setCurrentView(View.KY_THUAT);
                else setCurrentView(View.TONG_QUAN);
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
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 border-b font-bold text-gray-700">Thông báo</div>
                      <div className="max-h-60 overflow-y-auto">
                          {myNotifications.length === 0 ? (
                              <p className="text-sm text-gray-500 p-4 text-center">Không có thông báo mới.</p>
                          ) : (
                              myNotifications.map(n => (
                                  <div key={n.id} className="p-3 border-b hover:bg-gray-50 text-sm">
                                      <p className="font-bold text-blue-600 mb-1">{n.title}</p>
                                      <p className="text-gray-600">{n.message}</p>
                                      <p className="text-xs text-gray-400 mt-2 text-right">{n.createdAt.split('T')[0]}</p>
                                  </div>
                              ))
                          )}
                      </div>
                      <div className="p-2 bg-gray-50 text-center border-t">
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
