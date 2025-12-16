import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'Missing BLOB_READ_WRITE_TOKEN' }),
      { status: 500 }
    );
  }

  // Xử lý FormData từ request (Client gửi lên dạng multipart/form-data)
  // Lưu ý: Cần đảm bảo client gửi body là FormData
  let file: File | null = null;
  try {
    const formData = await req.formData();
    file = formData.get('file') as File;
  } catch (e) {
     return new Response(
      JSON.stringify({ error: 'Invalid FormData' }),
      { status: 400 }
    );
  }

  if (!file || !(file instanceof File)) {
    return new Response(
      JSON.stringify({ error: 'No file uploaded' }),
      { status: 400 }
    );
  }

  try {
    const blob = await put(file.name, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return new Response(
      JSON.stringify({
        ok: true,
        url: blob.url,
        pathname: blob.pathname,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}