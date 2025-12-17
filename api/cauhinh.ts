
export const runtime = 'nodejs';

let systemConfig = {
    // --- Cấu hình cho RA BẢN VẼ ---
    drawingCostItems: [
        { id: '1', name: 'Đo đạc hiện trạng', defaultPrice: 0 }, // Dynamic based on area
        { id: '2', name: 'Mua dữ liệu', defaultPrice: 1000000 },
        { id: '3', name: 'Kí Biên bản ở xã', defaultPrice: 1000000 },
        { id: '4', name: 'Rút cấp đổi (nếu có)', defaultPrice: 500000 },
        { id: '5', name: 'Phí kiểm tra bản vẽ (25%)', defaultPrice: 0 }, // (Đo đạc + Kí BB) * 25%
        { id: '6', name: 'Kí duyệt bản vẽ', defaultPrice: 1000000 },
        { id: '7', name: 'Xác minh lộn thửa (6tr/thửa)', defaultPrice: 6000000 },
        { id: '8', name: 'Tăng diện tích (10tr/1000m2)', defaultPrice: 10000000 },
    ],
    // --- Cấu hình cho RA GIẤY MỚI ---
    newCertCostItems: [
        { id: '9', name: 'CC + Soạn HĐ Chuyển nhượng', defaultPrice: 3000000 },
        { id: '10', name: 'Ủy quyền', defaultPrice: 3000000 },
        { id: '11', name: 'Cập nhật hạn sử dụng đất', defaultPrice: 1000000 },
        { id: '12', name: 'Xóa hộ', defaultPrice: 6000000 },
        { id: '13', name: 'Giấy mới', defaultPrice: 2000000 },
        { id: '14', name: 'Trích lục hồ gốc', defaultPrice: 1000000 },
        { id: '15', name: 'Điều chỉnh CMND sang CCCD', defaultPrice: 1000000 },
        { id: '16', name: 'Thuế Chuyển nhượng (Auto)', defaultPrice: 0 }, // Auto
        { id: '17', name: 'CC, Soạn HĐ Tặng cho', defaultPrice: 3000000 },
        { id: '18', name: 'CC, Soạn HĐ Thừa kế', defaultPrice: 8000000 },
        { id: '19', name: 'Thuế Chuyển MĐSD (Auto)', defaultPrice: 0 }, // Auto
    ],
    statusLabels: {
        'DRAFT': { label: 'Nháp', color: '#9ca3af' },
        'PENDING_APPROVAL': { label: 'Chờ duyệt', color: '#eab308' },
        'APPROVED': { label: 'Đã duyệt', color: '#16a34a' },
        'REJECTED': { label: 'Đã hủy', color: '#dc2626' },
    },
    quoteIdConfig: { prefix: 'BG', useSeparator: true, separator: '-', includeDate: true, numberLength: 4 },
    projectIdConfig: { prefix: 'HS', useSeparator: true, separator: '-', includeDate: true, numberLength: 3 },
    commissionRules: [
        { id: 'R1', minArea: 0, maxArea: 100, amount: 200000 },
        { id: 'R2', minArea: 101, maxArea: 500, amount: 350000 },
        { id: 'R3', minArea: 501, maxArea: 1000, amount: 500000 },
        { id: 'R4', minArea: 1001, maxArea: 10000, amount: 1000000 },
    ],
    projectTypes: [
      { name: 'Đo đạc hiện trạng', color: '#3b82f6' },
      { name: 'Cắm mốc ranh', color: '#f97316' },
      { name: 'Trích lục bản đồ', color: '#8b5cf6' },
      { name: 'Phân lô tách thửa', color: '#10b981' },
      { name: 'Hoàn công', color: '#ec4899' },
      { name: 'Khác', color: '#6b7280' }
    ],
    payrollConfig: {
        standardWorkDays: 26,
        leavePayPercent: 100,
        absenceFine: 200000,
        insurancePercent: 10.5,
        insuranceBase: 'BASIC'
    },
    // Updated Quote Rules based on the provided image
    quoteAreaRules: [
        { id: 'Q1', minArea: 0, maxArea: 99.9, priceUrban: 1031000, priceRural: 704000 },
        { id: 'Q2', minArea: 100, maxArea: 300, priceUrban: 1224000, priceRural: 836000 },
        { id: 'Q3', minArea: 301, maxArea: 500, priceUrban: 1297000, priceRural: 889000 },
        { id: 'Q4', minArea: 501, maxArea: 1000, priceUrban: 1589000, priceRural: 1082000 },
        { id: 'Q5', minArea: 1001, maxArea: 3000, priceUrban: 2179000, priceRural: 1482000 },
        { id: 'Q6', minArea: 3001, maxArea: 10000, priceUrban: 3347000, priceRural: 2285000 },
        { id: 'Q7', minArea: 10001, maxArea: 100000, priceUrban: 4015000, priceRural: 2741000 }, // 1ha - 10ha
        { id: 'Q8', minArea: 100001, maxArea: 500000, priceUrban: 4350000, priceRural: 2970000 }, // 10ha - 50ha
    ]
};

export async function GET(request: Request) {
  return new Response(JSON.stringify({
    success: true,
    data: systemConfig
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    systemConfig = { ...systemConfig, ...body };
    return new Response(JSON.stringify({
      success: true,
      message: "Cập nhật cấu hình hệ thống thành công",
      data: systemConfig
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Lỗi khi lưu cấu hình" }), { status: 500 });
  }
}
