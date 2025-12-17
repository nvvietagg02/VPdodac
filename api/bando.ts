
export const runtime = 'nodejs';

let maps = [
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

export async function GET(request: Request) {
  return new Response(JSON.stringify({
    success: true,
    data: maps
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newItem = { id: `${Date.now()}`, ...body };
    maps.push(newItem);
    return new Response(JSON.stringify({
      success: true,
      message: "Thêm mới thành công",
      data: newItem
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: "Lỗi dữ liệu" }), { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const index = maps.findIndex(m => m.id === body.id);
    if (index !== -1) {
      maps[index] = { ...maps[index], ...body };
      return new Response(JSON.stringify({
        success: true,
        message: "Cập nhật thành công",
        data: maps[index]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ success: false, error: "Không tìm thấy" }), { status: 404 });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: "Lỗi server" }), { status: 500 });
  }
}
