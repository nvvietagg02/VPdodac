
export const runtime = 'nodejs';

/**
 * Handler cho endpoint: POST /api/khachhang
 * Chức năng: Tiếp nhận yêu cầu thêm mới khách hàng
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate số điện thoại
    if (!body.phone) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Vui lòng cung cấp số điện thoại khách hàng' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mock ID generation
    const mockCustomerId = `C-${Date.now().toString().slice(-6)}`;

    // Giả lập độ trễ
    await new Promise(resolve => setTimeout(resolve, 300));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thêm khách hàng thành công (API Mode)',
        data: {
          id: mockCustomerId,
          ...body,
          registeredAt: new Date().toISOString()
        }
      }),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
