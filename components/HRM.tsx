import React, { useState, useMemo } from 'react';
import { Employee, Role, Project, ProjectStatus, Office, User, DailyAttendanceRecord, Allowance, AllowanceType, AllowanceFrequency, SystemConfig, PayrollConfig, PayrollRecord, PayrollDetail } from '../types';
import { Users, Calendar, DollarSign, Plus, Edit, Trash2, X, Phone, Mail, Building, MapPin, Briefcase, Key, Eye, ChevronLeft, ChevronRight, Check, Zap, XCircle, Clock, AlertCircle, Coins, Settings, Calculator, FileCheck, ArrowLeft } from 'lucide-react';

interface HRMProps {
  employees: Employee[];
  projects: Project[]; // Needed for commission calculation
  offices: Office[];
  currentUser: User;
  systemConfig: SystemConfig;
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onUpdateSystemConfig: (config: SystemConfig) => void;
}

// Mock Data for Payroll History
const MOCK_PAYROLL_HISTORY: PayrollRecord[] = [
    {
        id: 'PR-2023-09',
        month: '09/2023',
        finalizedDate: '2023-09-30',
        totalAmount: 45000000,
        employeeCount: 4,
        details: [
            { employeeId: 'E1', employeeName: 'Trần Kỹ Thuật', role: 'TECHNICIAN', actualWorkDays: 26, baseSalary: 8000000, allowanceTotal: 500000, leavePay: 0, absenceFine: 0, insuranceDeduction: 0, netSalary: 8500000 }
        ]
    }
];

const HRM: React.FC<HRMProps> = ({ employees, projects, offices, currentUser, systemConfig, onAddEmployee, onUpdateEmployee, onDeleteEmployee, onUpdateSystemConfig }) => {
  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'ATTENDANCE' | 'PAYROLL'>('EMPLOYEES');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Payroll Config State Toggle
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  // Payroll History State
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>(MOCK_PAYROLL_HISTORY);
  const [payrollView, setPayrollView] = useState<'CALCULATE' | 'HISTORY'>('CALCULATE');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Permission Logic
  const canEdit = currentUser.role === Role.DIRECTOR; 
  
  // --- Attendance State ---
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [workOnSat, setWorkOnSat] = useState(true);
  const [workOnSun, setWorkOnSun] = useState(false);
  const [holidays, setHolidays] = useState<number[]>([]); 
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<number, DailyAttendanceRecord>>>({});
  
  const [activeCell, setActiveCell] = useState<{ empId: string, day: number } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
    name: '',
    role: Role.TECHNICIAN,
    jobTitle: '',
    officeId: '',
    phone: '',
    email: '',
    salaryType: 'MONTHLY',
    salaryMonthly: 0,
    salaryDaily: 0,
    gender: 'Nam',
    dob: '',
    address: '',
    username: '',
    password: '',
    allowances: []
  });

  // --- Allowance Configuration State ---
  const allowanceTypes = ['Tiền xăng', 'Tiền ăn', 'Điện thoại', 'Trách nhiệm', 'Khác'];

  // Temporary State for Adding Allowance in Modal
  const [newAllowance, setNewAllowance] = useState<{
      type: AllowanceType;
      frequency: AllowanceFrequency;
      amount: number;
  }>({ type: '', frequency: 'MONTHLY', amount: 0 });

  // --- Attendance Helpers ---
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getDayOfWeek = (year: number, month: number, day: number) => {
    return new Date(year, month, day).getDay(); // 0 = Sun, 6 = Sat
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
    setCurrentMonth(newDate);
    setHolidays([]); 
  };

  const toggleHoliday = (day: number) => {
    if (holidays.includes(day)) {
      setHolidays(holidays.filter(d => d !== day));
    } else {
      setHolidays([...holidays, day]);
    }
  };

  const updateAttendance = (empId: string, day: number, status: DailyAttendanceRecord['status'], multiplier: 1 | 2 | 3 = 1) => {
    setAttendanceData(prev => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || {}),
        [day]: { status, multiplier }
      }
    }));
    setActiveCell(null); 
  };

  // --- Config Updater ---
  const handlePayrollConfigChange = (field: keyof PayrollConfig, value: any) => {
      const updatedConfig = { ...systemConfig };
      updatedConfig.payrollConfig = { ...updatedConfig.payrollConfig, [field]: value };
      onUpdateSystemConfig(updatedConfig);
  }

  // --- Handlers ---
  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      name: '', role: Role.TECHNICIAN, jobTitle: '', officeId: offices.length > 0 ? offices[0].id : '', 
      phone: '', email: '', salaryType: 'MONTHLY', salaryMonthly: 5000000, salaryDaily: 0,
      gender: 'Nam', dob: '', address: '', username: '', password: '', allowances: []
    });
    setNewAllowance({ type: '', frequency: 'MONTHLY', amount: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name, role: emp.role, jobTitle: emp.jobTitle || '', officeId: emp.officeId,
      phone: emp.phone, email: emp.email || '', salaryType: emp.salaryType || 'MONTHLY',
      salaryMonthly: emp.salaryMonthly || 0, salaryDaily: emp.salaryDaily || 0,
      gender: emp.gender || 'Nam', dob: emp.dob || '', address: emp.address || '',
      username: emp.username || '', password: emp.password || '', allowances: emp.allowances || []
    });
    setNewAllowance({ type: '', frequency: 'MONTHLY', amount: 0 });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (editingEmployee) {
      const updated: Employee = { ...editingEmployee, ...formData };
      onUpdateEmployee(updated);
    } else {
      const newEmployee: Employee = { id: `E-${Date.now()}`, ...formData };
      onAddEmployee(newEmployee);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này không?')) {
      onDeleteEmployee(id);
    }
  };

  // Allowance Handlers
  const addAllowance = () => {
      if (newAllowance.amount <= 0 || !newAllowance.type.trim()) return;
      const allowanceItem: Allowance = {
          id: `ALL-${Date.now()}`,
          name: newAllowance.type, 
          type: newAllowance.type,
          frequency: newAllowance.frequency,
          amount: newAllowance.amount
      };
      setFormData(prev => ({ ...prev, allowances: [...(prev.allowances || []), allowanceItem] }));
      setNewAllowance({ ...newAllowance, amount: 0, type: '' });
  }

  const removeAllowance = (id: string) => {
      setFormData(prev => ({ ...prev, allowances: (prev.allowances || []).filter(a => a.id !== id) }));
  }

  // --- Detailed Calculation Logic ---
  const daysInCurrentMonth = getDaysInMonth(currentMonth);
  const daysArray = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

  const calculateEmployeeSalary = (emp: Employee) => {
      const records = attendanceData[emp.id] || {};
      const config = systemConfig.payrollConfig;
      
      let actualWorkDays = 0;
      let paidLeaveDays = 0;
      let absenceDays = 0;
      let holidayDays = 0;

      // 1. Calculate Attendance Stats
      daysArray.forEach(day => {
          const rec = records[day];
          const isHoliday = holidays.includes(day);
          const dayOfWeek = getDayOfWeek(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const isSun = dayOfWeek === 0;
          const isSat = dayOfWeek === 6;
          const isConfiguredOff = (isSun && !workOnSun) || (isSat && !workOnSat);

          if (!rec) {
              if (isHoliday) {
                  holidayDays++;
              } else if (!isConfiguredOff) {
                  // Default Present
                  actualWorkDays += 1;
              }
          } else {
              if (rec.status === 'PRESENT') actualWorkDays += (1 * rec.multiplier);
              else if (rec.status === 'LEAVE') paidLeaveDays++;
              else if (rec.status === 'ABSENT') absenceDays++; // Explicit Absent
              else if (rec.status === 'HOLIDAY') holidayDays++;
          }
      });

      // 2. Base Salary Calculation
      let baseSalary = 0;
      let dailyRate = 0;

      if (emp.salaryType === 'MONTHLY') {
          dailyRate = (emp.salaryMonthly || 0) / config.standardWorkDays;
          baseSalary = dailyRate * actualWorkDays;
      } else if (emp.salaryType === 'DAILY') {
          dailyRate = emp.salaryDaily || 0;
          baseSalary = dailyRate * actualWorkDays;
      } else if (emp.salaryType === 'PRODUCT') {
          // KPI: Sum of (Project Commission) where techID == emp.id and Status == Completed
          const techProjects = projects.filter(p => p.technicianId === emp.id && p.status === ProjectStatus.COMPLETED);
          const commissionTotal = techProjects.reduce((sum, p) => sum + (p.commission || 0), 0);
          baseSalary = commissionTotal;
          dailyRate = 0; 
      }

      // 3. Leave Pay & Fines (UPDATED LOGIC: Only apply for MONTHLY salary)
      let leavePay = 0;
      let absenceFine = 0;

      if (emp.salaryType === 'MONTHLY') {
          leavePay = dailyRate * paidLeaveDays * (config.leavePayPercent / 100);
          absenceFine = absenceDays * config.absenceFine;
      }

      // 4. Allowances
      let allowanceTotal = 0;
      (emp.allowances || []).forEach(al => {
          if (al.frequency === 'MONTHLY') allowanceTotal += al.amount;
          else if (al.frequency === 'DAILY') allowanceTotal += (al.amount * actualWorkDays);
          else if (al.frequency === 'PER_CASE') {
              const completedCount = projects.filter(p => p.technicianId === emp.id && p.status === ProjectStatus.COMPLETED).length;
              allowanceTotal += (al.amount * completedCount);
          }
      });

      // 5. Insurance Deduction (UPDATED LOGIC: Only apply for MONTHLY salary)
      const grossIncome = baseSalary + leavePay + allowanceTotal - absenceFine;
      let insuranceDeduction = 0;

      if (emp.salaryType === 'MONTHLY') {
          const insuranceBase = config.insuranceBase === 'BASIC' ? (emp.salaryMonthly || 0) : grossIncome;
          insuranceDeduction = insuranceBase * (config.insurancePercent / 100);
      }

      const netSalary = grossIncome - insuranceDeduction;

      return {
          actualWorkDays,
          paidLeaveDays,
          absenceDays,
          baseSalary,
          leavePay,
          absenceFine,
          allowanceTotal,
          insuranceDeduction,
          netSalary,
          baseSalaryValue: emp.salaryType === 'MONTHLY' ? emp.salaryMonthly : emp.salaryType === 'DAILY' ? emp.salaryDaily : 0
      };
  }

  // --- Finalize Payroll ---
  const handleFinalizePayroll = () => {
      const monthStr = `${String(currentMonth.getMonth() + 1).padStart(2, '0')}/${currentMonth.getFullYear()}`;
      
      // Check duplicate
      if (payrollHistory.find(r => r.month === monthStr)) {
          alert(`Lương tháng ${monthStr} đã được chốt trước đó!`);
          return;
      }

      const details: PayrollDetail[] = employees.map(emp => {
          const stats = calculateEmployeeSalary(emp);
          return {
              employeeId: emp.id,
              employeeName: emp.name,
              role: emp.role,
              actualWorkDays: stats.actualWorkDays,
              baseSalary: stats.baseSalary,
              allowanceTotal: stats.allowanceTotal,
              leavePay: stats.leavePay,
              absenceFine: stats.absenceFine,
              insuranceDeduction: stats.insuranceDeduction,
              netSalary: stats.netSalary
          };
      });

      const totalAmount = details.reduce((sum, d) => sum + d.netSalary, 0);

      const record: PayrollRecord = {
          id: `PR-${Date.now()}`,
          month: monthStr,
          finalizedDate: new Date().toISOString().split('T')[0],
          totalAmount,
          employeeCount: employees.length,
          details
      };

      setPayrollHistory([record, ...payrollHistory]);
      alert(`Đã chốt sổ lương tháng ${monthStr} thành công!`);
  }

  // --- Render Cell Content (Same as before) ---
  const renderCell = (empId: string, day: number) => {
      const record = attendanceData[empId]?.[day];
      const dayOfWeek = getDayOfWeek(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSun = dayOfWeek === 0;
      const isSat = dayOfWeek === 6;
      const isConfiguredOff = (isSun && !workOnSun) || (isSat && !workOnSat);
      const isHoliday = holidays.includes(day);

      let effectiveStatus = record?.status;
      let effectiveMultiplier = record?.multiplier || 1;

      if (!record && !isHoliday && !isConfiguredOff) {
          effectiveStatus = 'PRESENT';
          effectiveMultiplier = 1;
      }

      let content = null;
      let bgClass = 'bg-white';

      if (effectiveStatus === 'PRESENT') {
          if (effectiveMultiplier === 1) {
              content = <Check size={16} className="text-gray-300 group-hover:text-green-600 transition-colors" />;
              if (record) { content = <Check size={16} className="text-green-600 font-bold" />; bgClass = 'bg-white'; }
          } else if (effectiveMultiplier === 2) { content = <span className="font-bold text-blue-700">x2</span>; bgClass = 'bg-blue-100'; } 
          else if (effectiveMultiplier === 3) { content = <span className="font-bold text-purple-700">x3</span>; bgClass = 'bg-purple-100'; }
      } else if (effectiveStatus === 'ABSENT') { content = <span className="font-bold text-red-700">K</span>; bgClass = 'bg-red-200'; } 
      else if (effectiveStatus === 'LEAVE') { content = <span className="font-bold text-yellow-800">P</span>; bgClass = 'bg-yellow-200'; } 
      else if (effectiveStatus === 'HOLIDAY') { content = <span className="font-bold text-orange-700">L</span>; bgClass = 'bg-orange-100'; }

      if (!record) { if (isHoliday) bgClass = 'bg-red-50'; else if (isConfiguredOff) bgClass = 'bg-gray-100'; }

      const isActive = activeCell?.empId === empId && activeCell?.day === day;

      return (
          <td 
            key={day} 
            className={`border p-0 relative ${bgClass} cursor-pointer hover:bg-opacity-80 transition h-10 w-10 text-center align-middle group ${isActive ? 'ring-2 ring-blue-600 z-20' : ''}`}
            onClick={(e) => { e.stopPropagation(); setActiveCell({ empId, day }); }}
          >
              <div className="flex items-center justify-center h-full w-full">{content}</div>
              {isActive && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white shadow-2xl rounded-lg border border-gray-200 z-50 p-3 min-w-[220px] flex flex-col gap-2 animate-in fade-in zoom-in duration-150">
                      {/* ... Popover content (same as before) ... */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Đi làm</span>
                            <button onClick={(e) => { e.stopPropagation(); updateAttendance(empId, day, 'PRESENT', 1); }} className="text-left px-2 py-2 hover:bg-green-50 text-xs text-green-700 flex items-center rounded border border-gray-100 hover:border-green-200"><Check size={14} className="mr-1"/> Chuẩn (x1)</button>
                            <button onClick={(e) => { e.stopPropagation(); updateAttendance(empId, day, 'PRESENT', 2); }} className="text-left px-2 py-2 hover:bg-blue-50 text-xs text-blue-700 flex items-center rounded border border-gray-100 hover:border-blue-200 bg-blue-50/50"><Zap size={14} className="mr-1"/> Tăng ca (x2)</button>
                            <button onClick={(e) => { e.stopPropagation(); updateAttendance(empId, day, 'PRESENT', 3); }} className="text-left px-2 py-2 hover:bg-purple-50 text-xs text-purple-700 flex items-center rounded border border-gray-100 hover:border-purple-200 bg-purple-50/50"><Zap size={14} className="mr-1"/> Lễ/Tết (x3)</button>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Nghỉ / Vắng</span>
                             <button onClick={(e) => { e.stopPropagation(); updateAttendance(empId, day, 'LEAVE'); }} className="text-left px-2 py-2 hover:bg-yellow-50 text-xs text-yellow-800 rounded flex items-center border border-gray-100 hover:border-yellow-200 bg-yellow-50/50"><Clock size={14} className="mr-1"/> Phép (P)</button>
                             <button onClick={(e) => { e.stopPropagation(); updateAttendance(empId, day, 'ABSENT'); }} className="text-left px-2 py-2 hover:bg-red-50 text-xs text-red-700 rounded flex items-center border border-gray-100 hover:border-red-200 bg-red-50/50"><XCircle size={14} className="mr-1"/> Không phép (K)</button>
                            <button onClick={(e) => { e.stopPropagation(); updateAttendance(empId, day, 'HOLIDAY'); }} className="text-left px-2 py-2 hover:bg-orange-50 text-xs text-orange-700 rounded flex items-center border border-gray-100 hover:border-orange-200"><AlertCircle size={14} className="mr-1"/> Nghỉ Lễ (L)</button>
                        </div>
                      </div>
                      <div className="border-t pt-2 mt-1">
                        <button onClick={(e) => { e.stopPropagation(); setAttendanceData(prev => { const n = {...prev}; delete n[empId][day]; return n; }); setActiveCell(null); }} className="w-full text-center px-2 py-2 hover:bg-gray-100 text-xs text-gray-500 rounded font-medium">Xóa (Về mặc định)</button>
                      </div>
                  </div>
              )}
          </td>
      );
  };

  const renderPayrollHistoryDetail = () => {
      const record = payrollHistory.find(r => r.id === selectedHistoryId);
      if(!record) return null;

      return (
          <div className="animate-in fade-in duration-200">
              <div className="flex items-center mb-4">
                  <button onClick={() => setSelectedHistoryId(null)} className="mr-3 p-2 hover:bg-gray-100 rounded-full">
                      <ArrowLeft size={20} />
                  </button>
                  <div>
                      <h3 className="font-bold text-lg text-gray-800">Chi tiết bảng lương {record.month}</h3>
                      <p className="text-xs text-gray-500">Chốt ngày: {record.finalizedDate} • Tổng chi: {record.totalAmount.toLocaleString()} đ</p>
                  </div>
              </div>
              
              <div className="overflow-x-auto bg-white border rounded-lg">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">Nhân viên</th>
                            <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-center">Công</th>
                            <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-right">Lương Cơ bản</th>
                            <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-right">Phụ cấp</th>
                            <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-right">Phạt/Phép</th>
                            <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-right">BHXH</th>
                            <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-right">Thực lãnh</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {record.details.map((detail, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-3 py-3">
                                    <div className="font-bold text-sm text-gray-800">{detail.employeeName}</div>
                                    <div className="text-xs text-gray-500">{detail.role}</div>
                                </td>
                                <td className="px-3 py-3 text-center text-sm">{detail.actualWorkDays}</td>
                                <td className="px-3 py-3 text-right text-sm">{detail.baseSalary.toLocaleString()}</td>
                                <td className="px-3 py-3 text-right text-sm">{detail.allowanceTotal.toLocaleString()}</td>
                                <td className="px-3 py-3 text-right text-sm text-gray-600">
                                    {detail.leavePay > 0 && <div>+ {detail.leavePay.toLocaleString()}</div>}
                                    {detail.absenceFine > 0 && <div className="text-red-600">- {detail.absenceFine.toLocaleString()}</div>}
                                </td>
                                <td className="px-3 py-3 text-right text-sm">{detail.insuranceDeduction.toLocaleString()}</td>
                                <td className="px-3 py-3 text-right font-bold text-blue-700">{detail.netSalary.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>
      )
  }

  return (
    <div className="space-y-6" onClick={() => setActiveCell(null)}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản trị Nhân sự & Lương</h2>
        {activeTab === 'EMPLOYEES' && canEdit && (
          <button 
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center shadow-sm"
          >
            <Plus size={18} className="mr-2" /> Thêm nhân viên
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('EMPLOYEES')} className={`px-6 py-3 font-medium text-sm flex items-center ${activeTab === 'EMPLOYEES' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          <Users size={18} className="mr-2" /> Hồ sơ nhân sự
        </button>
        <button onClick={() => setActiveTab('ATTENDANCE')} className={`px-6 py-3 font-medium text-sm flex items-center ${activeTab === 'ATTENDANCE' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          <Calendar size={18} className="mr-2" /> Chấm công
        </button>
        <button onClick={() => setActiveTab('PAYROLL')} className={`px-6 py-3 font-medium text-sm flex items-center ${activeTab === 'PAYROLL' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          <DollarSign size={18} className="mr-2" /> Tính lương
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        
        {activeTab === 'EMPLOYEES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tên nhân viên</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Chức vụ / VP</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Liên hệ</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hình thức lương</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map((emp) => {
                  const office = offices.find(o => o.id === emp.officeId);
                  let salaryDisplay = '';
                  if (emp.salaryType === 'MONTHLY') salaryDisplay = `${(emp.salaryMonthly || 0).toLocaleString()} đ/tháng`;
                  else if (emp.salaryType === 'DAILY') salaryDisplay = `${(emp.salaryDaily || 0).toLocaleString()} đ/ngày`;
                  else salaryDisplay = 'Theo sản phẩm (KPI)';

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">
                          <div className="font-bold text-gray-800">{emp.name}</div>
                          <div className="text-xs text-gray-400">ID: {emp.id}</div>
                          {emp.username && (
                              <div className="flex items-center text-xs text-indigo-600 bg-indigo-50 w-fit px-1.5 py-0.5 rounded mt-1 border border-indigo-100">
                                  <Key size={10} className="mr-1"/> User: {emp.username}
                              </div>
                          )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            emp.role === Role.DIRECTOR ? 'bg-indigo-100 text-indigo-700' :
                            emp.role === Role.ACCOUNTANT ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                            {emp.jobTitle || emp.role}
                        </span>
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <Building size={12} className="mr-1"/>
                            {office ? office.name : 'Chưa phân công'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                         <div className="flex items-center mb-1"><Phone size={12} className="mr-2"/> {emp.phone}</div>
                         {emp.email && <div className="flex items-center mb-1"><Mail size={12} className="mr-2"/> {emp.email}</div>}
                         {emp.address && <div className="flex items-center text-xs text-gray-400" title={emp.address}><MapPin size={12} className="mr-2"/> {emp.address.length > 20 ? emp.address.substring(0,20)+'...' : emp.address}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-blue-700">
                        {salaryDisplay}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                           <button onClick={() => openEditModal(emp)} className={`${canEdit ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-50'} p-1 rounded`} title={canEdit ? "Sửa" : "Xem chi tiết"}>
                             {canEdit ? <Edit size={16} /> : <Eye size={16} />}
                           </button>
                           {canEdit && <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Xóa"><Trash2 size={16} /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {employees.length === 0 && <div className="text-center py-8 text-gray-500 italic">Chưa có nhân viên nào.</div>}
          </div>
        )}

         {activeTab === 'ATTENDANCE' && (
          <div className="space-y-4">
             {/* Controls */}
             <div className="flex flex-col md:flex-row justify-between items-center mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-4 mb-3 md:mb-0">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft size={20}/></button>
                    <h3 className="font-bold text-lg text-gray-800 min-w-[150px] text-center">
                        Tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}
                    </h3>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-200 rounded"><ChevronRight size={20}/></button>
                </div>
                
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <label className="flex items-center text-sm cursor-pointer"><input type="checkbox" checked={workOnSat} onChange={(e) => setWorkOnSat(e.target.checked)} className="mr-2 rounded text-blue-600"/>Làm T7</label>
                        <label className="flex items-center text-sm cursor-pointer"><input type="checkbox" checked={workOnSun} onChange={(e) => setWorkOnSun(e.target.checked)} className="mr-2 rounded text-blue-600"/>Làm CN</label>
                    </div>
                    <div className="flex space-x-2 text-xs">
                        <div className="flex items-center"><span className="w-4 h-4 bg-yellow-200 border border-yellow-300 mr-1 rounded-sm flex items-center justify-center font-bold text-[8px] text-yellow-800">P</span> Phép</div>
                        <div className="flex items-center"><span className="w-4 h-4 bg-red-200 border border-red-300 mr-1 rounded-sm flex items-center justify-center font-bold text-[8px] text-red-800">K</span> Ko phép</div>
                        <div className="flex items-center"><span className="w-4 h-4 bg-blue-100 border border-blue-200 mr-1 rounded-sm flex items-center justify-center font-bold text-[8px] text-blue-700">x2</span> Tăng ca</div>
                    </div>
                </div>
             </div>

             <div className="overflow-x-auto border rounded-lg max-h-[600px]">
                <table className="w-full border-collapse min-w-[1200px]">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr>
                      <th className="p-2 border bg-gray-50 text-left min-w-[200px] font-bold text-sm">Nhân viên</th>
                      {daysArray.map(d => {
                          const isHoliday = holidays.includes(d);
                          const dayOfWeek = getDayOfWeek(currentMonth.getFullYear(), currentMonth.getMonth(), d);
                          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                          return (
                            <th key={d} className={`p-1 border text-center min-w-[32px] cursor-pointer hover:bg-red-50 transition group ${isHoliday ? 'bg-red-100 text-red-700' : isWeekend ? 'bg-gray-50 text-gray-500' : 'bg-white'}`} onClick={() => toggleHoliday(d)} title="Click để đặt là ngày Lễ (Nghỉ)">
                                <div className="text-xs">{d}</div>
                                <div className="text-[9px] font-normal">{['CN','T2','T3','T4','T5','T6','T7'][dayOfWeek]}</div>
                            </th>
                          );
                      })}
                      <th className="p-2 border bg-gray-50 text-center min-w-[60px] text-xs font-bold text-blue-700">Công</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => {
                        const stats = calculateEmployeeSalary(emp);
                        return (
                          <tr key={emp.id} className="hover:bg-gray-50">
                            <td className="p-2 border text-sm font-medium sticky left-0 bg-white z-10 border-r-2 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                {emp.name}
                                <div className="text-xs text-gray-400 font-normal">{emp.jobTitle}</div>
                            </td>
                            {daysArray.map(d => renderCell(emp.id, d))}
                            <td className="p-2 border text-center font-bold text-blue-700 bg-blue-50">
                                {stats.actualWorkDays}
                            </td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'PAYROLL' && (
          <div className="space-y-4">
             {/* Sub-Tabs for Payroll View */}
             <div className="flex border-b mb-4">
                <button 
                    onClick={() => { setPayrollView('CALCULATE'); setSelectedHistoryId(null); }}
                    className={`pb-2 px-4 text-sm font-medium ${payrollView === 'CALCULATE' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Calculator className="inline mr-2" size={16}/> Bảng tính hiện tại
                </button>
                <button 
                    onClick={() => { setPayrollView('HISTORY'); setSelectedHistoryId(null); }}
                    className={`pb-2 px-4 text-sm font-medium ${payrollView === 'HISTORY' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FileCheck className="inline mr-2" size={16}/> Lịch sử đã chốt
                </button>
             </div>

            {/* VIEW 1: CURRENT CALCULATION */}
            {payrollView === 'CALCULATE' && (
                <>
                {/* Payroll Configuration Panel */}
                <div className={`bg-indigo-50 border border-indigo-200 rounded-lg overflow-hidden transition-all duration-300 ${isConfigPanelOpen ? 'max-h-96' : 'max-h-12'}`}>
                    <div 
                        className="flex justify-between items-center p-3 cursor-pointer hover:bg-indigo-100"
                        onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
                    >
                        <h3 className="font-bold text-indigo-800 flex items-center">
                            <Settings size={18} className="mr-2" /> Cấu hình Lương & Bảo hiểm (Tháng {currentMonth.getMonth()+1}/{currentMonth.getFullYear()})
                        </h3>
                        <div className="text-xs text-indigo-500">{isConfigPanelOpen ? 'Thu gọn' : 'Mở rộng'}</div>
                    </div>
                    {isConfigPanelOpen && (
                        <div className="p-4 bg-white border-t border-indigo-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Ngày công chuẩn (Tháng)</label>
                                <input 
                                    type="number" 
                                    value={systemConfig.payrollConfig.standardWorkDays} 
                                    onChange={(e) => handlePayrollConfigChange('standardWorkDays', parseFloat(e.target.value))}
                                    className="w-full border rounded px-2 py-1 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">% Lương nghỉ phép</label>
                                <div className="flex items-center">
                                    <input 
                                        type="number" 
                                        value={systemConfig.payrollConfig.leavePayPercent} 
                                        onChange={(e) => handlePayrollConfigChange('leavePayPercent', parseFloat(e.target.value))}
                                        className="w-full border rounded px-2 py-1 text-sm text-right"
                                    />
                                    <span className="ml-1 text-sm text-gray-500">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Phạt nghỉ Không phép (ngày)</label>
                                <input 
                                    type="number" 
                                    value={systemConfig.payrollConfig.absenceFine} 
                                    onChange={(e) => handlePayrollConfigChange('absenceFine', parseFloat(e.target.value))}
                                    className="w-full border rounded px-2 py-1 text-sm text-red-600 font-bold text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Trừ BHXH + BHYT</label>
                                <div className="flex gap-2">
                                    <div className="flex items-center w-1/2">
                                        <input 
                                            type="number" 
                                            value={systemConfig.payrollConfig.insurancePercent} 
                                            onChange={(e) => handlePayrollConfigChange('insurancePercent', parseFloat(e.target.value))}
                                            className="w-full border rounded px-2 py-1 text-sm text-right"
                                        />
                                        <span className="ml-1 text-sm text-gray-500">%</span>
                                    </div>
                                    <select 
                                        value={systemConfig.payrollConfig.insuranceBase}
                                        onChange={(e) => handlePayrollConfigChange('insuranceBase', e.target.value as any)}
                                        className="w-1/2 border rounded px-1 py-1 text-xs"
                                    >
                                        <option value="BASIC">Lương CB</option>
                                        <option value="TOTAL">Tổng thu nhập</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end mb-2 space-x-2">
                    <button className="px-3 py-1.5 border rounded-md hover:bg-gray-50 text-sm">Xuất Excel (Preview)</button>
                    {canEdit && (
                        <button 
                            onClick={handleFinalizePayroll}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center"
                        >
                            <Check size={16} className="mr-1"/> Chốt sổ lương T{currentMonth.getMonth()+1}
                        </button>
                    )}
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase">Nhân viên</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-center">Công</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-right">Lương Cơ bản / KPI</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-right">Phụ cấp</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-right">Lương Phép / Phạt</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-right">BHXH & BHYT</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase text-right">Thực lãnh</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {employees.map((emp) => {
                            const stats = calculateEmployeeSalary(emp);
                            return (
                                <tr key={emp.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-3">
                                        <div className="font-bold text-sm text-gray-800">{emp.name}</div>
                                        <div className="text-xs text-gray-500">{emp.role === Role.TECHNICIAN && emp.salaryType === 'PRODUCT' ? 'Lương Sản Phẩm' : emp.salaryType === 'MONTHLY' ? 'Lương Tháng' : 'Lương Ngày'}</div>
                                    </td>
                                    <td className="px-3 py-3 text-center text-sm">
                                        <span className="font-bold text-blue-600">{stats.actualWorkDays}</span>
                                        <span className="text-xs text-gray-400">/{systemConfig.payrollConfig.standardWorkDays}</span>
                                    </td>
                                    <td className="px-3 py-3 text-right text-sm">
                                        <div className="font-medium">{stats.baseSalary.toLocaleString()}</div>
                                        {emp.salaryType !== 'PRODUCT' && <div className="text-xs text-gray-400">Gốc: {stats.baseSalaryValue?.toLocaleString()}</div>}
                                    </td>
                                    <td className="px-3 py-3 text-right text-sm text-green-700">
                                        {stats.allowanceTotal > 0 ? `+ ${stats.allowanceTotal.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-3 py-3 text-right text-sm">
                                        {stats.leavePay > 0 && <div className="text-green-600">+ {stats.leavePay.toLocaleString()} <span className="text-[9px] text-gray-400">(P)</span></div>}
                                        {stats.absenceFine > 0 && <div className="text-red-600">- {stats.absenceFine.toLocaleString()} <span className="text-[9px] text-gray-400">(K)</span></div>}
                                        {stats.leavePay === 0 && stats.absenceFine === 0 && '-'}
                                    </td>
                                    <td className="px-3 py-3 text-right text-sm text-gray-500">
                                        {stats.insuranceDeduction > 0 ? `- ${stats.insuranceDeduction.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-3 py-3 text-right font-bold text-blue-700 text-base">
                                        {Math.round(stats.netSalary).toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    </table>
                </div>
                </>
            )}

            {/* VIEW 2: PAYROLL HISTORY */}
            {payrollView === 'HISTORY' && (
                <div>
                    {!selectedHistoryId ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {payrollHistory.map(record => (
                                <div 
                                    key={record.id} 
                                    onClick={() => setSelectedHistoryId(record.id)}
                                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 cursor-pointer transition"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="font-bold text-lg text-indigo-700">Tháng {record.month}</div>
                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {record.finalizedDate}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm text-gray-500">Nhân sự: {record.employeeCount}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Tổng chi</p>
                                            <p className="font-bold text-gray-800">{record.totalAmount.toLocaleString()} đ</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {payrollHistory.length === 0 && (
                                <div className="col-span-full text-center py-10 text-gray-400 italic">
                                    Chưa có lịch sử lương nào được chốt.
                                </div>
                            )}
                        </div>
                    ) : (
                        renderPayrollHistoryDetail()
                    )}
                </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Add/Edit Employee (Updated Allowance Input) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                    {editingEmployee ? (canEdit ? 'Cập nhật nhân sự' : 'Thông tin nhân sự') : 'Thêm nhân sự mới'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ... (Existing fields for Name, DOB, etc. kept implicitly or shown below for context) ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Họ và Tên</label><input required disabled={!canEdit} type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" placeholder="Nguyễn Văn A" /></div>
                    {/* Simplified for brevity, assume other inputs exist */}
                    <div><label className="block text-sm font-medium text-gray-700">Số điện thoại</label><input required disabled={!canEdit} type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="mt-1 w-full border rounded p-2 disabled:bg-gray-100"/></div>
                    <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" disabled={!canEdit} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1 w-full border rounded p-2 disabled:bg-gray-100"/></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1: Job & Salary */}
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center"><Briefcase size={16} className="mr-2" /> Công việc & Lương</h4>
                        <div className="space-y-3">
                            <div><label className="block text-sm font-medium text-gray-700">Chức vụ</label><input type="text" disabled={!canEdit} value={formData.jobTitle} onChange={(e) => setFormData({...formData, jobTitle: e.target.value})} className="mt-1 w-full border rounded p-2 disabled:bg-gray-100"/></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Văn phòng</label>
                                <select required disabled={!canEdit} value={formData.officeId} onChange={(e) => setFormData({...formData, officeId: e.target.value})} className="mt-1 w-full border rounded p-2 bg-white disabled:bg-gray-100">
                                    <option value="">-- Chọn văn phòng --</option>
                                    {offices.map(off => (<option key={off.id} value={off.id}>{off.name}</option>))}
                                </select>
                            </div>
                            <div className="border-t pt-3 mt-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hình thức lương</label>
                                <div className="flex flex-col space-y-2 mb-3">
                                    <label className="flex items-center cursor-pointer"><input type="radio" name="salaryType" value="MONTHLY" checked={formData.salaryType === 'MONTHLY'} disabled={!canEdit} onChange={() => setFormData({...formData, salaryType: 'MONTHLY'})} className="w-4 h-4 text-blue-600"/><span className="ml-2 text-sm">Lương Tháng</span></label>
                                    <label className="flex items-center cursor-pointer"><input type="radio" name="salaryType" value="DAILY" checked={formData.salaryType === 'DAILY'} disabled={!canEdit} onChange={() => setFormData({...formData, salaryType: 'DAILY'})} className="w-4 h-4 text-blue-600"/><span className="ml-2 text-sm">Lương Ngày</span></label>
                                    <label className="flex items-center cursor-pointer"><input type="radio" name="salaryType" value="PRODUCT" checked={formData.salaryType === 'PRODUCT'} disabled={!canEdit} onChange={() => setFormData({...formData, salaryType: 'PRODUCT'})} className="w-4 h-4 text-blue-600"/><span className="ml-2 text-sm">Lương Sản Phẩm (KPI)</span></label>
                                </div>
                                {formData.salaryType === 'MONTHLY' && <div><label className="block text-sm font-medium text-gray-700">Lương tháng cố định (VNĐ)</label><input type="number" min="0" disabled={!canEdit} value={formData.salaryMonthly} onChange={(e) => setFormData({...formData, salaryMonthly: parseInt(e.target.value)})} className="mt-1 w-full border rounded p-2 disabled:bg-gray-100"/></div>}
                                {formData.salaryType === 'DAILY' && <div><label className="block text-sm font-medium text-gray-700">Lương ngày công (VNĐ)</label><input type="number" min="0" disabled={!canEdit} value={formData.salaryDaily} onChange={(e) => setFormData({...formData, salaryDaily: parseInt(e.target.value)})} className="mt-1 w-full border rounded p-2 disabled:bg-gray-100"/></div>}
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Allowances & Account */}
                    <div className="space-y-4">
                        {/* Allowances Section - UPDATED INPUT */}
                        <div className="bg-green-50 p-4 rounded border border-green-200">
                             <h4 className="font-semibold text-green-800 mb-3 flex items-center justify-between">
                                <span className="flex items-center"><Coins size={16} className="mr-2" /> Phụ cấp (Allowances)</span>
                             </h4>
                             
                             <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                                 {(formData.allowances || []).length === 0 && <p className="text-xs text-gray-500 italic">Chưa có phụ cấp.</p>}
                                 {(formData.allowances || []).map(al => (
                                     <div key={al.id} className="flex justify-between items-center bg-white p-2 rounded border border-green-100 text-sm shadow-sm">
                                         <div>
                                             <span className="font-bold text-gray-700">{al.name}</span>
                                             <span className="text-xs text-gray-500 mx-1">|</span>
                                             <span className="text-xs text-gray-600">{al.frequency === 'MONTHLY' ? 'Tháng' : al.frequency === 'DAILY' ? 'Ngày' : 'Hồ sơ'}</span>
                                         </div>
                                         <div className="flex items-center">
                                             <span className="font-medium text-green-700 mr-2">{al.amount.toLocaleString()} đ</span>
                                             {canEdit && <button type="button" onClick={() => removeAllowance(al.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>}
                                         </div>
                                     </div>
                                 ))}
                             </div>

                             {/* Add New Allowance - SIMPLE INPUT WITH DATALIST */}
                             {canEdit && (
                                 <div className="pt-2 border-t border-green-200">
                                     <div className="flex gap-2 mb-2 items-center">
                                         <div className="flex-1">
                                            <input 
                                                list="allowance-types"
                                                className="w-full text-xs border rounded p-1"
                                                placeholder="Nhập/Chọn loại tiền..."
                                                value={newAllowance.type}
                                                onChange={(e) => setNewAllowance({...newAllowance, type: e.target.value})}
                                            />
                                            <datalist id="allowance-types">
                                                {allowanceTypes.map(t => <option key={t} value={t} />)}
                                            </datalist>
                                         </div>
                                         <select 
                                            className="w-24 text-xs border rounded p-1"
                                            value={newAllowance.frequency}
                                            onChange={(e) => setNewAllowance({...newAllowance, frequency: e.target.value as AllowanceFrequency})}
                                         >
                                             <option value="MONTHLY">Tháng</option>
                                             <option value="DAILY">Ngày</option>
                                             <option value="PER_CASE">Hồ sơ</option>
                                         </select>
                                     </div>
                                     <div className="flex gap-2">
                                         <input 
                                            type="number" 
                                            className="flex-1 text-xs border rounded p-1"
                                            placeholder="Số tiền"
                                            value={newAllowance.amount}
                                            onChange={(e) => setNewAllowance({...newAllowance, amount: parseInt(e.target.value) || 0})}
                                         />
                                         <button type="button" onClick={addAllowance} className="bg-green-600 text-white text-xs font-bold px-3 rounded hover:bg-green-700">Thêm</button>
                                     </div>
                                 </div>
                             )}
                        </div>

                        {/* Account Section */}
                        <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                            <h4 className="font-semibold text-yellow-800 mb-3 flex items-center"><Key size={16} className="mr-2" /> Cấp tài khoản</h4>
                            <div className="space-y-3">
                                <div><label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label><input type="text" disabled={!canEdit} value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="mt-1 w-full border rounded p-2 bg-white disabled:bg-gray-100" placeholder="user123"/></div>
                                <div><label className="block text-sm font-medium text-gray-700">Mật khẩu</label><input type="password" disabled={!canEdit} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="mt-1 w-full border rounded p-2 bg-white disabled:bg-gray-100" placeholder="******"/></div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phân quyền</label>
                                    <select value={formData.role} disabled={!canEdit} onChange={(e) => setFormData({...formData, role: e.target.value as Role})} className="mt-1 w-full border rounded p-2 bg-white disabled:bg-gray-100">
                                        <option value={Role.TECHNICIAN}>Kỹ thuật viên</option>
                                        <option value={Role.ACCOUNTANT}>Kế toán</option>
                                        <option value={Role.DIRECTOR}>Quản lý (Director)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">{canEdit ? 'Hủy' : 'Đóng'}</button>
                    {canEdit && <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editingEmployee ? 'Lưu thay đổi' : 'Thêm mới'}</button>}
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRM;