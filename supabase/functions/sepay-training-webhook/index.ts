// Supabase Edge Function: sepay-training-webhook
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function sendTelegramText(text: string) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!botToken || !chatId) return;
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => {});
}

async function sendTelegramNotification(order: Record<string, unknown>) {
  const name = (order.customer_name as string) || 'Ẩn danh';
  const email = (order.customer_email as string) || 'N/A';
  const ref = (order.order_code as string) || '';
  const price = Number(order.amount || 686000).toLocaleString('vi-VN');
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  await sendTelegramText(`━━━━━━━━━━━━━━━━\n✅ ĐÃ THANH TOÁN · Mật Mã Tự Do\n━━━━━━━━━━━━━━━━\nKhách:   ${name}\nEmail:   ${email}\nSố tiền: ${price}đ\nMã đơn:  ${ref}\nLúc:     ${now}\n━━━━━━━━━━━━━━━━`);
}

async function sendWelcomeEmail(order: Record<string, unknown>) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey || !order.customer_email) return;

  const name = (order.customer_name as string) || 'bạn';
  const ref = order.order_code as string;

  const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg,#0a0a0a,#1a1200);padding:40px 40px 32px;text-align:center">
    <div style="font-size:36px;margin-bottom:8px">🔐</div>
    <div style="font-size:24px;font-weight:900;color:#FFD700;letter-spacing:1px">MẬT MÃ TỰ DO</div>
    <div style="font-size:13px;color:#A1A1AA;margin-top:6px">Phong Menly AI System</div>
  </td></tr>

  <!-- BODY -->
  <tr><td style="padding:40px">
    <p style="font-size:18px;font-weight:700;color:#111;margin:0 0 16px">Chào ${name}! 🎉</p>
    <p style="font-size:15px;color:#444;line-height:1.8;margin:0 0 20px">
      Thanh toán của bạn đã được xác nhận. <strong>Mật Mã Tự Do</strong> đã mở khóa trên thiết bị bạn vừa đặt hàng.
    </p>

    <div style="background:#fffbef;border:1.5px solid #FFD700;border-radius:12px;padding:20px 24px;margin:0 0 28px">
      <p style="font-size:13px;font-weight:700;color:#b45309;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px">Truy cập ngay</p>
      <p style="font-size:14px;color:#555;margin:0 0 16px;line-height:1.7">Bấm nút bên dưới để truy cập — link tự động mở khóa trên bất kỳ thiết bị nào:</p>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0">
          <a href="https://phongmenlyai.com/hoc-vien.html?unlock=${ref}" style="display:inline-block;background:linear-gradient(135deg,#FFD700,#FF7B00);color:#000;text-decoration:none;font-weight:800;font-size:14px;padding:12px 24px;border-radius:10px">
            📚 Vào Học Viện →
          </a>
        </td></tr>
        <tr><td style="padding:6px 0">
          <a href="https://phongmenlyai.com/doc-sach.html" style="display:inline-block;background:#f0f0f0;color:#111;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px">
            📖 Đọc Sách Mật Mã Tự Do →
          </a>
        </td></tr>
      </table>
    </div>

    <div style="background:#f8f8f8;border-radius:10px;padding:16px 20px;margin:0 0 28px">
      <p style="font-size:13px;font-weight:700;color:#333;margin:0 0 8px">Bạn có trong tay:</p>
      <ul style="font-size:13.5px;color:#555;line-height:2;margin:0;padding-left:20px">
        <li>📗 Ebook <strong>Mật Mã Tự Do</strong> (toàn bộ)</li>
        <li>🎓 5 khóa học thực chiến AI × Affiliate</li>
        <li>♾️ Truy cập trọn đời, cập nhật miễn phí</li>
      </ul>
    </div>

    <div style="border-top:1px solid #eee;padding-top:20px">
      <p style="font-size:13px;color:#888;line-height:1.8;margin:0">
        Mã đơn hàng: <strong style="color:#333">${ref}</strong><br>
        Cần hỗ trợ? Nhắn tin Zalo: <a href="https://zalo.me/phongmenly" style="color:#FF7B00;text-decoration:none">Phong Menly</a>
      </p>
    </div>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #eee">
    <p style="font-size:12px;color:#aaa;margin:0">
      © 2026 Phong Menly · phongmenlyai.com<br>
      Bạn nhận email này vì đã mua Mật Mã Tự Do
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Phong Menly <phongmenly@kolaisystem.com>',
      to: [order.customer_email as string],
      subject: '🔐 Mật Mã Tự Do đã mở — Chào mừng bạn!',
      html,
    }),
  }).catch(() => {});
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // GET ?ref=ORDER_CODE — client poll kiểm tra trạng thái thanh toán
  if (req.method === 'GET' && url.searchParams.has('ref')) {
    const ref = url.searchParams.get('ref')!;
    const { data } = await supabase
      .from('orders')
      .select('status')
      .eq('order_code', ref)
      .single();
    return json({ paid: data?.status === 'paid' });
  }

  // GET ?aff_stats=CODE — affiliate stats
  if (req.method === 'GET' && url.searchParams.has('aff_stats')) {
    const code = url.searchParams.get('aff_stats')!;
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_code, amount, status, created_at')
      .eq('ref_slug', code)
      .eq('status', 'paid');
    if (error) return json({ clicks: 0, orders: 0, commission: 0 });
    const orderCount = orders?.length ?? 0;
    const commission = orderCount * 205800;
    return json({ clicks: null, orders: orderCount, commission });
  }

  // GET ?paid_email=EMAIL — kiểm tra quyền sách/khóa học theo email
  if (req.method === 'GET' && url.searchParams.has('paid_email')) {
    const email = url.searchParams.get('paid_email')!.toLowerCase().trim();
    const { data: orders } = await supabase
      .from('orders')
      .select('order_code, status, ref_slug')
      .eq('customer_email', email)
      .eq('status', 'paid');

    if (!orders || orders.length === 0) {
      return json({ book: false, codes: [], refs: [] });
    }

    const refs: string[] = (orders as {order_code:string}[]).map(o => o.order_code).filter(Boolean);
    // Tất cả đơn paid trong hệ thống này đều là sách — book luôn = true
    return json({ book: true, codes: [], refs });
  }

  // GET ?content=COURSE_ID — nội dung khóa học
  if (req.method === 'GET' && url.searchParams.has('content')) {
    const cid = url.searchParams.get('content')!;
    const { data } = await supabase
      .from('course_content')
      .select('lessons')
      .eq('course_id', cid)
      .single();
    return json(data ?? {});
  }

  // POST — xử lý các actions
  if (req.method === 'POST') {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }

    const action = body.action as string;

    // Cấp quyền thủ công từ admin (quan-ly.html)
    if (action === 'grant_access') {
      const { email, name, admin_key } = body;
      const expectedKey = Deno.env.get('ADMIN_KEY');
      if (!expectedKey || admin_key !== expectedKey) {
        return json({ error: 'unauthorized' }, 401);
      }
      const emailNorm = String(email || '').toLowerCase().trim();
      if (!emailNorm || !emailNorm.includes('@')) {
        return json({ error: 'invalid email' }, 400);
      }
      const ref = 'ADMINGRANT' + Date.now().toString(36).toUpperCase();
      const { error: insertErr } = await supabase.from('orders').insert({
        order_code: ref,
        customer_email: emailNorm,
        customer_name: String(name || emailNorm),
        customer_phone: '',
        product: 'Mật Mã Tự Do',
        amount: 0,
        status: 'paid',
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
      if (insertErr) return json({ error: insertErr.message }, 500);
      return json({ ok: true, ref });
    }

    // Khách bấm "tôi đã chuyển khoản" — chỉ alert admin
    if (action === 'notify_paid') {
      const { ref, name, email } = body;
      const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      await sendTelegramText(`🔔 KHÁCH BÁO ĐÃ CHUYỂN KHOẢN\n──────────────────\nKhách: ${name || 'Ẩn danh'}\nEmail: ${email || 'N/A'}\nMã đơn: ${ref || 'N/A'}\nLúc: ${now}\n→ Kiểm tra SePay và duyệt tại quan-ly.html nếu cần`);
      return json({ ok: true });
    }

    // Lead capture
    if (action === 'lead_capture') {
      const { email, source, aff } = body;
      await supabase.from('leads').upsert({
        email, source: source || 'unknown', aff_code: aff || null,
        created_at: new Date().toISOString(),
      }, { onConflict: 'email' }).catch(() => {});
      const makeWebhook = Deno.env.get('MAKE_WEBHOOK_URL');
      if (makeWebhook) {
        await fetch(makeWebhook, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'lead_captured', email, source, aff }),
        }).catch(() => {});
      }
      return json({ ok: true });
    }

    // Khách mở QR checkout — tạo đơn hàng pending
    if (action === 'register') {
      const { ref, aff, product, name, phone, email, price } = body;
      const { error: insertErr } = await supabase.from('orders').insert({
        order_code: ref,
        customer_name: String(name || email || 'Khách'),
        customer_email: email || null,
        customer_phone: String(phone || ''),
        product: product || 'Mật Mã Tự Do',
        amount: Number(price) || 686000,
        ref_slug: aff || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      // Nếu đơn đã tồn tại (trùng order_code), bỏ qua lỗi
      if (insertErr && !insertErr.message.includes('duplicate')) {
        return json({ ok: false, error: insertErr.message });
      }
      // Báo admin ngay khi có đơn mới
      const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      await sendTelegramText(`🛒 ĐƠN MỚI · Chờ thanh toán\n──────────────────\nKhách: ${name || 'Ẩn danh'}\nEmail: ${email || 'N/A'}\nMã đơn: ${ref}\nLúc: ${now}`);
      return json({ ok: true });
    }

    // Fallback: client phát hiện paid=true qua poll → xác nhận nếu SePay chưa fire
    if (action === 'order_confirmed') {
      const { ref } = body;
      const { data: order } = await supabase.from('orders').select('*').eq('order_code', ref).single();
      if (!order || order.status === 'paid') return json({ ok: true });
      await supabase.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('order_code', ref);
      await Promise.all([sendWelcomeEmail(order), sendTelegramNotification(order)]);
      return json({ ok: true });
    }

    // SePay payment webhook — tự động duyệt khi nhận tiền
    if (body.transferAmount || body.content || body.transferContent) {
      const content = String(body.content || body.transferContent || body.code || '');
      const amount = Number(body.transferAmount || body.amount || 0);

      // Khớp mã đơn trong nội dung chuyển khoản
      const refMatch = content.match(/SEVQR\s*(\S+)/i) || content.match(/(BOOK[A-Z0-9]+)/i);

      if (refMatch) {
        const ref = refMatch[1];
        const { data: order } = await supabase.from('orders').select('*').eq('order_code', ref).single();
        if (order && order.status !== 'paid') {
          await supabase.from('orders').update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            seepay_data: body,
          }).eq('order_code', ref);
          await Promise.all([sendWelcomeEmail(order), sendTelegramNotification(order)]);
        }
      } else if (amount >= 680000) {
        // Fallback: không khớp mã → tìm đơn pending gần nhất theo số tiền
        const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const { data: pending } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'pending')
          .gte('created_at', cutoff)
          .order('created_at', { ascending: false })
          .limit(5);

        if (pending && pending.length === 1) {
          await supabase.from('orders').update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            seepay_data: body,
          }).eq('order_code', pending[0].order_code);
          await Promise.all([sendWelcomeEmail(pending[0]), sendTelegramNotification(pending[0])]);
        } else {
          const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
          await sendTelegramText(`⚠️ NHẬN TIỀN KHÔNG KHỚP ĐƠN\n──────────────────\nSố tiền: ${amount.toLocaleString('vi-VN')}đ\nNội dung: ${content || '(trống)'}\nSố đơn pending: ${pending?.length ?? 0}\nLúc: ${now}\n→ Vào quan-ly.html để xét thủ công`);
        }
      }
      return json({ success: true });
    }

    return json({ error: 'unknown action' }, 400);
  }

  return json({ error: 'not found' }, 404);
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
