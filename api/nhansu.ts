
export const runtime = 'nodejs';

let employees = [
  { 
    id: 'E1', name: 'Trần Kỹ Thuật', role: 'TECHNICIAN', jobTitle: 'Tổ trưởng đo đạc', 
    officeId: 'OFF-001', phone: '0901001001', email: 'kythuat@gmail.com',
    salaryType: 'PRODUCT', 
    gender: 'Nam', dob: '1995-05-20', address: '123 Đường Số 1, Củ Chi',
    username: 'kythuat1', password: '123'
  },
  { 
    id: 'E2', name: 'Lê Thị Kế Toán', role: 'ACCOUNTANT', jobTitle: 'Kế toán trưởng',
    officeId: 'OFF-001', phone: '0902002002', 
    salaryType: 'MONTHLY', salaryMonthly: 10000000, 
    gender: 'Nữ', dob: '1998-10-15', address: '456 Lê Văn Việt, Thủ Đức',
    username: 'ketoan1', password: '123'
  },
  { 
    id: 'E3', name: 'Phạm Quản Lý', role: 'DIRECTOR', jobTitle: 'Giám đốc chi nhánh',
    officeId: 'OFF-001', phone: '0903003003', 
    salaryType: 'MONTHLY', salaryMonthly: 25000000,
    gender: 'Nam', dob: '1985-01-01', address: '789 Nguyễn Văn Linh, Q7',
    username: 'giamdoc1', password: '123'
  },
  { 
    id: 'E4', name: 'Nguyễn Văn Phụ Việc', role: 'TECHNICIAN', jobTitle: 'Phụ đo đạc', 
    officeId: 'OFF-001', phone: '0904004004', 
    salaryType: 'DAILY', salaryDaily: 350000, 
    gender: 'Nam', dob: '2000-01-01', address: 'Củ Chi',
  },
];

export async function GET(request: Request) {
  return new Response(JSON.stringify({
    success: true,
    data: employees
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: Request) {
  const body = await request.json();
  employees.push(body);
  return new Response(JSON.stringify({
    success: true,
    message: "Thêm nhân sự mới thành công",
    data: body
  }), { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const index = employees.findIndex(e => e.id === body.id);
  if (index !== -1) {
    employees[index] = { ...employees[index], ...body };
    return new Response(JSON.stringify({ success: true, message: "Cập nhật nhân sự thành công", data: employees[index] }), { status: 200 });
  }
  return new Response(JSON.stringify({ success: false, error: "Nhân sự không tồn tại" }), { status: 404 });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (id) {
    employees = employees.filter(e => e.id !== id);
    return new Response(JSON.stringify({ success: true, message: "Đã xóa nhân sự" }), { status: 200 });
  }
  return new Response(JSON.stringify({ success: false, error: "Thiếu ID" }), { status: 400 });
}
