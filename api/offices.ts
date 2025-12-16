
export const runtime = 'nodejs';

let offices = [
  { id: 'OFF-001', name: 'Chi nhánh Củ Chi', address: '123 TL8, Củ Chi, TP.HCM', directorId: 'DIR-003', phone: '028 3790 1234' },
  { id: 'OFF-002', name: 'Chi nhánh Quận 9', address: '456 Lê Văn Việt, TP. Thủ Đức', directorId: 'DIR-003', phone: '028 3730 5678' }
];

export async function GET(request: Request) {
  return new Response(JSON.stringify({
    success: true,
    data: offices
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: Request) {
  const body = await request.json();
  offices.push(body);
  return new Response(JSON.stringify({ success: true, message: "Thêm văn phòng thành công", data: body }), { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const index = offices.findIndex(o => o.id === body.id);
  if (index !== -1) {
    offices[index] = { ...offices[index], ...body };
    return new Response(JSON.stringify({ success: true, message: "Cập nhật văn phòng thành công", data: offices[index] }), { status: 200 });
  }
  return new Response(JSON.stringify({ success: false, error: "Không tìm thấy văn phòng" }), { status: 404 });
}
