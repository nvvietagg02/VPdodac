
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DIRECTOR = 'DIRECTOR',
  ACCOUNTANT = 'ACCOUNTANT',
  TECHNICIAN = 'TECHNICIAN',
}

export enum ProjectStatus {
  PENDING = 'Chờ xử lý',
  ASSIGNED = 'Đã phân công', // New status for transition
  SURVEYING = 'Đang đi đo',
  OFFICE_WORK = 'Nội nghiệp',
  COMPLETED = 'Hoàn thành',
  CANCELLED = 'Hủy',
}

export type TechnicianStatus = 'PENDING_ACCEPT' | 'IN_PROGRESS' | 'COMPLETED';

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED', // Only Director
  REJECTED = 'REJECTED',
}

export interface LicenseInfo {
  startDate: string;
  durationYears: number;
  endDate: string;
  maxOffices: number;
  maxEmployees: number;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  username?: string; 
  password?: string; 
  avatarUrl?: string; // Added Avatar URL
  role: Role;
  email: string;
  officeId?: string; 
  licenseInfo?: LicenseInfo; 
}

export interface Office {
  id: string;
  name: string;
  address: string;
  directorId: string;
  phone?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string; 
  type: 'Cá nhân' | 'Doanh nghiệp' | 'Môi giới';
  address: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'IMAGE' | 'PDF' | 'CAD'; // Added CAD for tech
  url: string; 
  uploadDate: string;
}

export interface Project {
  id: string; 
  customerId: string;
  customerName: string; 
  customerPhone?: string; 
  officeId: string; 
  quoteId?: string; 
  
  type?: string; 
  address: string;
  landArea?: number; 
  status: ProjectStatus;
  
  // Technician Assignment
  technicianId?: string;
  technicianName?: string;
  technicianStatus?: TechnicianStatus; // New: Tech specific status
  commission?: number; 
  
  // Dates
  createdDate: string; 
  surveyDate?: string;
  drawingDueDate?: string; 
  dueDate?: string; 
  
  coords?: { x: number; y: number }; 
  revenue: number; 
  deposit: number; 
  
  attachments: Attachment[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'ASSIGNMENT' | 'REMINDER' | 'SYSTEM';
}

export interface QuoteItem {
  id: string;
  name: string;
  price: number;
  isEnabled: boolean;
  isCustom: boolean; 
}

export interface Quote {
  id: string;
  customerId: string;
  customerName: string; 
  totalAmount: number;
  status: QuoteStatus;
  createdDate: string;
  items: QuoteItem[];
}

export type SalaryType = 'MONTHLY' | 'DAILY' | 'PRODUCT';

// --- ALLOWANCE TYPES ---
export type AllowanceFrequency = 'MONTHLY' | 'DAILY' | 'PER_CASE';
// Changed to string to allow dynamic types
export type AllowanceType = string; 

export interface Allowance {
    id: string;
    name: string; // Tên hiển thị (VD: Xăng xe, Cơm trưa)
    type: AllowanceType;
    frequency: AllowanceFrequency;
    amount: number;
}

export interface Employee {
  id: string;
  name: string;
  role: Role; // System Role for permissions
  jobTitle?: string; // Display Title (e.g. Trưởng phòng, Tổ trưởng)
  gender?: 'Nam' | 'Nữ' | 'Khác';
  dob?: string;
  address?: string;
  officeId: string;
  phone: string;
  email?: string; 
  
  // Salary Config
  salaryType: SalaryType;
  salaryMonthly?: number; // Used if type is MONTHLY
  salaryDaily?: number;   // Used if type is DAILY
  // PRODUCT type uses commission calculation logic

  // Allowances
  allowances?: Allowance[];

  // Login credentials
  username?: string;
  password?: string;
}

export interface DailyAttendanceRecord {
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY';
  multiplier: 1 | 2 | 3;
  note?: string;
}

// Map: { [employeeId]: { [day]: DailyAttendanceRecord } }
export interface MonthlyAttendance {
  month: string; // YYYY-MM
  records: { [employeeId: string]: { [day: number]: DailyAttendanceRecord } };
  holidays: number[]; // Array of days in month that are holidays
}

export interface Attendance {
  employeeId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY';
  notes?: string;
}

// --- PAYROLL HISTORY TYPES ---
export interface PayrollDetail {
    employeeId: string;
    employeeName: string;
    role: string;
    actualWorkDays: number;
    baseSalary: number;
    allowanceTotal: number;
    leavePay: number;
    absenceFine: number;
    insuranceDeduction: number;
    netSalary: number;
}

export interface PayrollRecord {
    id: string;
    month: string; // "MM/YYYY"
    finalizedDate: string;
    totalAmount: number;
    employeeCount: number;
    details: PayrollDetail[];
}

// --- CONFIG TYPES ---
export interface CostConfigItem {
  id: string;
  name: string;
  defaultPrice: number;
}

export interface CommissionRule {
  id: string;
  minArea: number;
  maxArea: number;
  amount: number;
}

export interface StatusLabel {
    label: string;
    color: string; // Hex code
}

export interface StatusConfig {
  [key: string]: StatusLabel; 
}

export interface ProjectTypeConfig {
    name: string;
    color: string; // Hex code
}

export interface IdConfig {
  prefix: string;
  useSeparator: boolean;
  separator: string;
  includeDate: boolean; 
  numberLength: number;
}

export interface PayrollConfig {
    standardWorkDays: number; // Ngày công chuẩn (vd: 26)
    leavePayPercent: number; // % Lương được hưởng khi nghỉ phép (vd: 100% hoặc 50%)
    absenceFine: number; // Số tiền phạt 1 ngày nghỉ không phép (vd: 200000)
    insurancePercent: number; // Tổng % BHXH + BHYT trừ vào lương
    insuranceBase: 'BASIC' | 'TOTAL'; // Trừ trên lương cơ bản hay tổng thu nhập
}

export interface SystemConfig {
  costItems: CostConfigItem[];
  statusLabels: StatusConfig;
  quoteIdConfig: IdConfig;
  projectIdConfig: IdConfig;
  commissionRules: CommissionRule[]; 
  projectTypes: ProjectTypeConfig[];
  payrollConfig: PayrollConfig; // Added Payroll Config
}