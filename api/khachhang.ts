
export const runtime = 'nodejs';

let customers = [
  { id: 'C1', name: 'Nguyễn Văn A', cccd: '079090123456', phone: '0909123456', email: 'nguyenvana@gmail.com', type: 'Cá nhân', address: 'TP.HCM' },
  { id: 'C2', name: 'Công ty BDS Hưng Thịnh', cccd: '', phone: '02838383838', email: 'contact@hungthinh.vn', type: 'Doanh nghiệp', address: 'TP. Thủ Đức' },
  { id: 'C3', name: 'Lê Thị C', cccd: '072195123456', phone: '0912345678', email: 'lethic@yahoo.com', type: 'Môi giới', address: 'Bình Dương' },
];

export async function GET(request: Request) {
  return new Response(JSON.stringify({
    success: true,
    data: customers
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    customers.push(body);
    return new Response(JSON.stringify({
      success: true,
      message: "Thêm khách hàng thành công",
      data: body
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: "Lỗi dữ liệu" }), { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const index = customers.findIndex(c => c.id === body.id);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...body };
      return new Response(JSON.stringify({
        success: true,
        message: "Cập nhật thông tin khách hàng thành công",
        data: customers[index]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ success: false, error: "Không tìm thấy khách hàng" }), { status: 404 });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: "Lỗi server" }), { status: 500 });
  }
}
