
export const runtime = 'nodejs';

// Dữ liệu mẫu Hồ sơ
let projects = [
  { 
    id: 'HS-23-001', customerId: 'C1', customerName: 'Nguyễn Văn A', customerPhone: '0909123456', officeId: 'OFF-001', type: 'Đo đạc hiện trạng',
    address: 'Thửa 12, Củ Chi, TP.HCM', landArea: 150.5, status: 'Đang đi đo', 
    revenue: 5000000, deposit: 2000000, createdDate: '2023-10-01', 
    technicianId: 'E1', technicianName: 'Trần Kỹ Thuật', technicianStatus: 'IN_PROGRESS', commission: 250000,
    coords: { x: 123456.78, y: 567890.12 }, drawingDueDate: '2023-10-12', dueDate: '2023-10-15',
    attachments: [
        { id: 'A1', name: 'So_do_scan.pdf', type: 'PDF', url: '#', uploadDate: '2023-10-01' }
    ]
  },
  { 
    id: 'HS-23-002', customerId: 'C2', customerName: 'Công ty BDS Hưng Thịnh', customerPhone: '02838383838', officeId: 'OFF-002', type: 'Phân lô tách thửa',
    address: 'Dự án KDC Long Hậu', landArea: 5000, status: 'Chờ xử lý', 
    revenue: 15000000, deposit: 5000000, createdDate: '2023-10-05', dueDate: '2023-10-10',
    attachments: [],
    commission: 0
  },
  { 
    id: 'HS-23-003', customerId: 'C3', customerName: 'Lê Thị C', customerPhone: '0912345678', officeId: 'OFF-002', type: 'Cắm mốc ranh',
    address: 'Quận 9, TP.HCM', landArea: 80, status: 'Hoàn thành', 
    revenue: 3000000, deposit: 3000000, createdDate: '2023-09-20', 
    technicianId: 'E1', technicianName: 'Trần Kỹ Thuật', technicianStatus: 'COMPLETED', commission: 200000,
    coords: { x: 123123.00, y: 567567.00 }, drawingDueDate: '2023-09-23', dueDate: '2023-09-25',
    attachments: [] 
  },
];

// Lấy danh sách hồ sơ
export async function GET(request: Request) {
  return new Response(JSON.stringify({
    success: true,
    message: "Lấy danh sách hồ sơ thành công",
    data: projects
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// Tạo mới hồ sơ
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newProject = {
      ...body,
      createdDate: body.createdDate || new Date().toISOString().split('T')[0]
    };
    projects.push(newProject);
    
    return new Response(JSON.stringify({
      success: true,
      message: "Tạo hồ sơ mới thành công",
      data: newProject
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Dữ liệu không hợp lệ" }), { status: 400 });
  }
}

// Cập nhật hồ sơ
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const index = projects.findIndex(p => p.id === body.id);
    
    if (index === -1) {
      return new Response(JSON.stringify({ success: false, error: "Không tìm thấy hồ sơ" }), { status: 404 });
    }

    projects[index] = { ...projects[index], ...body };
    
    return new Response(JSON.stringify({
      success: true,
      message: "Cập nhật hồ sơ thành công",
      data: projects[index]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Lỗi hệ thống" }), { status: 500 });
  }
}
