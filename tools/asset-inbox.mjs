#!/usr/bin/env node
// Hộp nhận ảnh: server nhỏ chỉ nghe trên 127.0.0.1, nhận ảnh gửi từ trang ChatGPT
// (qua Claude in Chrome) và lưu thẳng vào assets-src/, khỏi tải tay qua thư mục Downloads.
//
//   npm run inbox                      # mặc định cổng 5199
//   POST /upload?path=concepts/central/lm_nha_hat_lon_v1.png
//        body = byte ảnh (fetch/curl, trả JSON)
//        hoặc multipart/form-data có trường "file" (gửi form từ trang ChatGPT, trả HTML)
//   GET  /health
//
// An toàn:
// - Chỉ nghe 127.0.0.1, không mở ra mạng LAN hay Internet.
// - Chỉ nhận request từ các origin trong ALLOWED_ORIGINS (hoặc không có Origin, ví dụ curl).
// - Chỉ ghi vào assets-src/concepts/ và assets-src/refs/, tên file snake_case, đuôi ảnh.
// - Kiểm tra "magic bytes" để chắc là ảnh PNG/JPEG/WebP thật.
// - Không ghi đè file có sẵn, trừ khi gửi kèm ?overwrite=1.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.INBOX_PORT ?? 5199);
const HOST = '127.0.0.1';
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_ORIGINS = new Set(['https://chatgpt.com']);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets-src');
const ALLOWED_DIRS = ['concepts', 'refs'];
// <concepts|refs>/<thư mục con...>/<tên>.<png|jpg|jpeg|webp>, chỉ chữ thường, số, _ và -
const PATH_RE = /^(concepts|refs)(\/[a-z0-9][a-z0-9_-]*)*\/[a-z0-9][a-z0-9_-]*\.(png|jpe?g|webp)$/;

function detectType(buf) {
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Chrome Private Network Access: trang https công khai gọi vào localhost cần header này.
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  return !origin || ALLOWED_ORIGINS.has(origin);
}

// Gửi bằng form (trình duyệt chuyển trang sang đây) thì trả HTML để người xem đọc được;
// gửi bằng fetch/curl thì trả JSON.
function send(res, status, body, html = false) {
  if (html) {
    const msg = body.ok ? `Đã lưu ${body.saved} (${(body.bytes / 1024).toFixed(0)} KB)` : `Lỗi: ${body.error}`;
    const esc = msg.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html><meta charset="utf-8"><title>Hộp nhận ảnh</title><p id="result" data-ok="${body.ok}">${esc}</p>`);
    return;
  }
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

// Lấy byte của phần "file" trong body multipart/form-data.
// Trang ChatGPT chặn fetch tới localhost (CSP connect-src) nhưng không chặn gửi form,
// nên ảnh có thể đến theo đường này.
function extractMultipartFile(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!m) return null;
  const boundary = Buffer.from(`--${m[1] ?? m[2]}`);
  let pos = buf.indexOf(boundary);
  while (pos !== -1) {
    const headStart = pos + boundary.length + 2; // bỏ \r\n
    const headEnd = buf.indexOf('\r\n\r\n', headStart);
    if (headEnd === -1) return null;
    const headers = buf.toString('utf8', headStart, headEnd);
    const next = buf.indexOf(boundary, headEnd + 4);
    if (next === -1) return null;
    if (/name="file"/i.test(headers)) return buf.subarray(headEnd + 4, next - 2); // bỏ \r\n trước boundary
    pos = next;
  }
  return null;
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) throw Object.assign(new Error('Ảnh quá lớn (tối đa 20 MB)'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const server = http.createServer(async (req, res) => {
  try {
    const allowed = cors(req, res);
    if (!allowed) return send(res, 403, { ok: false, error: `Origin không được phép: ${req.headers.origin}` });
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

    const url = new URL(req.url ?? '/', `http://${HOST}`);
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok: true, root: ROOT });
    if (req.method !== 'POST' || url.pathname !== '/upload') return send(res, 404, { ok: false, error: 'Không có đường dẫn này' });

    const contentType = req.headers['content-type'] ?? '';
    const isForm = contentType.startsWith('multipart/form-data');
    const reply = (status, body) => send(res, status, body, isForm);

    const rel = url.searchParams.get('path') ?? '';
    if (!PATH_RE.test(rel)) {
      return reply(400, { ok: false, error: 'path không hợp lệ. Dạng: concepts/<khu>/<ten_asset>_v<N>.png (chữ thường, không dấu)' });
    }
    const target = path.resolve(ROOT, rel);
    if (!ALLOWED_DIRS.some((d) => target.startsWith(path.join(ROOT, d) + path.sep))) {
      return reply(400, { ok: false, error: 'Chỉ được ghi vào assets-src/concepts hoặc assets-src/refs' });
    }

    const raw = await readBody(req);
    const buf = isForm ? extractMultipartFile(raw, contentType) : raw;
    if (!buf) return reply(400, { ok: false, error: 'Form không có trường "file"' });
    const type = detectType(buf);
    if (!type) return reply(415, { ok: false, error: 'Không phải ảnh PNG/JPEG/WebP' });
    const ext = path.extname(rel).slice(1).replace('jpeg', 'jpg');
    if (ext !== type) return reply(415, { ok: false, error: `Đuôi .${ext} nhưng nội dung là ${type}` });

    const overwrite = url.searchParams.get('overwrite') === '1';
    await fs.mkdir(path.dirname(target), { recursive: true });
    try {
      await fs.writeFile(target, buf, { flag: overwrite ? 'w' : 'wx' });
    } catch (e) {
      if (e.code === 'EEXIST') return reply(409, { ok: false, error: `Đã có file ${rel}. Gửi kèm overwrite=1 nếu chắc chắn muốn ghi đè.` });
      throw e;
    }
    console.log(`[inbox] đã lưu assets-src/${rel} (${type}, ${(buf.length / 1024).toFixed(0)} KB)`);
    return reply(201, { ok: true, saved: `assets-src/${rel}`, bytes: buf.length, type });
  } catch (e) {
    console.error('[inbox] lỗi:', e.message);
    return send(res, e.status ?? 500, { ok: false, error: e.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[inbox] đang nghe http://${HOST}:${PORT} → ghi vào ${ROOT}`);
});
