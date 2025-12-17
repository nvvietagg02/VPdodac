
export const runtime = 'nodejs';

let quotes = [
  { 
    id: 'BG-23-112', customerId: 'C2', customerName: 'Công ty BDS Hưng Thịnh', totalAmount: 1500000, status: 'PENDING_APPROVAL', createdDate: '2023-10-04', 
    items: [{ id: '1', name: 'Phí đo đạc hiện trạng', price: 500000, isEnabled: true, isCustom: false }, { id: '4', name: 'Phí cắm mốc ranh giới', price: 1000000, isEnabled: true, isCustom: false }],
    attachments: []
  },
  { 
    id: 'BG-23-110', customerId: 'C1', customerName: 'Nguyễn Văn A', totalAmount: 2000000, status: 'APPROVED', createdDate: '2024-01-14', 
    items: [{ id: '1', name: 'Phí đo đạc hiện trạng', price: 2000000, isEnabled: true, isCustom: false }],
    attachments: []
  },
];

export async function GET(request: Request) {
  return new Response(JSON.stringify({
    success: true,
    data: quotes
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: Request) {
  const body = await request.json();
  quotes.push(body);
  return new Response(JSON.stringify({ success: true, message: "Tạo báo giá thành công", data: body }), { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const index = quotes.findIndex(q => q.id === body.id);
  if (index !== -1) {
    quotes[index] = { ...quotes[index], ...body };
    return new Response(JSON.stringify({ success: true, message: "Cập nhật báo giá thành công", data: quotes[index] }), { status: 200 });
  }
  return new Response(JSON.stringify({ success: false, error: "Không tìm thấy báo giá" }), { status: 404 });
}
