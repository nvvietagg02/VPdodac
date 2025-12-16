/**
 * Hàm xử lý upload file lên Vercel Blob Storage.
 * 
 * CƠ CHẾ: SERVER-SIDE UPLOAD (Sử dụng put())
 * 1. Client gửi file qua API Route /api/upload/blob bằng FormData.
 * 2. Server (Node.js) nhận FormData và đẩy lên Blob Storage.
 */
export const uploadFile = async (file: File): Promise<string> => {
  const USE_REAL_BLOB = true; 

  if (USE_REAL_BLOB) {
    try {
      // Đóng gói file vào FormData
      const formData = new FormData();
      formData.append('file', file);

      // Gửi FormData đến API (không cần query param filename nữa vì đã có trong file object)
      const response = await fetch(`/api/upload/blob`, {
        method: 'POST',
        body: formData, 
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }

      const blob = await response.json();
      return blob.url; // Trả về URL thật của Vercel
    } catch (error) {
      console.error('Lỗi upload:', error);
      throw new Error('Lỗi upload. Có thể do file quá lớn (giới hạn 4.5MB) hoặc thiếu Token.');
    }
  } else {
    // MOCK: Giả lập upload (chỉ dùng khi test local không có mạng/server)
    return new Promise((resolve) => {
      console.log(`[MOCK UPLOAD] Đang tải lên ${file.name}...`);
      setTimeout(() => {
        resolve(URL.createObjectURL(file));
      }, 1000);
    });
  }
};