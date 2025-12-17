
export const runtime = 'nodejs';

let directors = [
  { id: 'DIR-001', name: 'Nguyễn Giám Đốc A', email: 'giamdoc.a@gmail.com', username: 'admin_a', password: '123', role: 'DIRECTOR', licenseInfo: { startDate: '2023-01-01', durationYears: 1, endDate: '2024-01-01', maxOffices: 2, maxEmployees: 10, isActive: true } },
  { id: 'DIR-002', name: 'Trần Giám Đốc B', email: 'giamdoc.b@yahoo.com', username: 'admin_b', password: '456', role: 'DIRECTOR', licenseInfo: { startDate: '2023-06-01', durationYears: 2, endDate: '2025-06-01', maxOffices: 1, maxEmployees: 5, isActive: true } },
  { id: 'DIR-003', name: 'Lê Giám Đốc C (Expiring)', email: 'giamdoc.c@company.vn', username: 'admin_c', password: '789', role: 'DIRECTOR', licenseInfo: { startDate: '2022-11-01', durationYears: 1, endDate: '2023-11-01', maxOffices: 3, maxEmployees: 20, isActive: true } },
];

export async function GET(request: Request) {
  return new Response(JSON.stringify({
    success: true,
    data: directors
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    directors.push(body);
    return new Response(JSON.stringify({ success: true, message: "Thêm Giám đốc mới thành công", data: body }), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: "Lỗi thêm mới" }), { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const index = directors.findIndex(d => d.id === body.id);
    if (index !== -1) {
      directors[index] = { ...directors[index], ...body };
      return new Response(JSON.stringify({ success: true, message: "Cập nhật thông tin Giám đốc thành công", data: directors[index] }), { status: 200 });
    }
    return new Response(JSON.stringify({ success: false, error: "Không tìm thấy người dùng" }), { status: 404 });
  } catch (e) {
     return new Response(JSON.stringify({ success: false, error: "Lỗi cập nhật" }), { status: 500 });
  }
}
