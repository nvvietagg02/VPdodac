
export const runtime = 'nodejs';

/**
 * Handler cho endpoint: POST /api/hoso
 * Chức năng: Tiếp nhận yêu cầu tạo mới hồ sơ đo đạc
 */
export async function POST(request: Request) {
  try {
    // 1. Parse dữ liệu từ frontend gửi lên
    const body = await request.json();

    // 2. Validate cơ bản (Ví dụ: Kiểm tra tên khách hàng)
    if (!body.customerName || !body.address) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Thiếu thông tin bắt buộc: Tên khách hàng hoặc Địa chỉ' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // 3. Giả lập xử lý Logic (Mocking Database Save)
    // Tại đây sau này bạn sẽ kết nối Database (Postgres/Mongo)
    const mockId = `HS-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Giả lập độ trễ mạng (Network latency)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Trả về kết quả thành công
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Đã tiếp nhận hồ sơ thành công (API Mode)',
        data: {
          id: mockId,
          status: 'PENDING', // Mặc định trạng thái chờ
          ...body,
          createdAt: new Date().toISOString()
        }
      }),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Lỗi xử lý dữ liệu máy chủ' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
