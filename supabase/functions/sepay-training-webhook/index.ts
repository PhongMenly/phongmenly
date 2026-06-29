// Supabase Edge Function: sepay-training-webhook
// Deploy: supabase functions deploy sepay-training-webhook
//
// Handles:
//   GET  ?ref=CODE         → check if order is paid
//   GET  ?aff_stats=CODE   → affiliate click/order stats
//   GET  ?content=COURSE   → course lesson content
//   POST action=register   → log new pending order
//   POST action=order_confirmed → mark order paid + trigger welcome email

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── GET ?ref=CODE — check payment status ──
  if (req.method === 'GET' && url.searchParams.has('ref')) {
    const ref = url.searchParams.get('ref')!;
    const { data } = await supabase
      .from('orders')
      .select('paid')
      .eq('ref', ref)
      .single();
    return json({ paid: data?.paid === true });
  }

  // ── GET ?aff_stats=CODE — affiliate stats ──
  if (req.method === 'GET' && url.searchParams.has('aff_stats')) {
    const code = url.searchParams.get('aff_stats')!;
    const { data: orders, error } = await supabase
      .from('orders')
      .select('ref, amount, paid, created_at')
      .eq('aff_code', code)
      .eq('paid', true);

    if (error) return json({ clicks: 0, orders: 0, commission: 0 });

    const orderCount = orders?.length ?? 0;
    const commission = orderCount * 205800; // 30% of 686,000
    // Clicks are tracked client-side; we return what we have server-side
    return json({ clicks: null, orders: orderCount, commission });
  }

  // ── GET ?content=COURSE_ID — course lessons ──
  if (req.method === 'GET' && url.searchParams.has('content')) {
    const cid = url.searchParams.get('content')!;
    const { data } = await supabase
      .from('course_content')
      .select('lessons')
      .eq('course_id', cid)
      .single();
    return json(data ?? {});
  }

  // ── POST — handle actions ──
  if (req.method === 'POST') {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }

    const action = body.action as string;

    if (action === 'register') {
      const { ref, aff, product, pkg, name, phone, email, price, referrer } = body;
      await supabase.from('orders').upsert({
        ref,
        aff_code: aff || null,
        product,
        pkg,
        name,
        phone,
        email,
        price,
        referrer,
        paid: false,
        created_at: new Date().toISOString(),
      }, { onConflict: 'ref' });
      return json({ ok: true });
    }

    if (action === 'order_confirmed') {
      const { ref } = body;
      await supabase.from('orders').update({ paid: true, paid_at: new Date().toISOString() }).eq('ref', ref);

      // Trigger welcome email via Make.com webhook (optional)
      const makeWebhook = Deno.env.get('MAKE_WEBHOOK_URL');
      if (makeWebhook) {
        const { data: order } = await supabase.from('orders').select('*').eq('ref', ref).single();
        if (order) {
          await fetch(makeWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'order_paid', ...order }),
          }).catch(() => {});
        }
      }
      return json({ ok: true });
    }

    // SePay payment notification webhook
    if (body.transferAmount || body.content) {
      const content = String(body.content || body.transferContent || '');
      const refMatch = content.match(/SEVQR\s+(\S+)/i);
      if (refMatch) {
        const ref = refMatch[1];
        const { data: order } = await supabase.from('orders').select('paid').eq('ref', ref).single();
        if (order && !order.paid) {
          await supabase.from('orders').update({ paid: true, paid_at: new Date().toISOString() }).eq('ref', ref);
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
