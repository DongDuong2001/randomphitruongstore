export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return replacements[character];
  });
}

export function paymentPlaceholderResponse(request: Request, gateway: string) {
  const url = new URL(request.url);
  const orderId = escapeHtml(url.searchParams.get("orderId") ?? "Unknown");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${gateway} payment placeholder</title>
  <style>
    body{margin:0;background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;display:grid;min-height:100vh;place-items:center;padding:24px}
    main{max-width:560px;border:1px solid #444;padding:40px;background:#111}
    p{color:#aaa;line-height:1.6} a{display:inline-block;margin-top:20px;background:#fff;color:#000;padding:14px 18px;text-decoration:none;font-weight:700}
  </style>
</head>
<body><main><small>PAYMENT PLACEHOLDER</small><h1>${gateway}</h1>
<p>Order: ${orderId}</p>
<p>No payment was collected. This route is the integration boundary for a future signed ${gateway} payment request and webhook flow.</p>
<a href="/">Return to random.phitruong</a></main></body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

export function paymentSandboxResponse({
  gateway,
  orderNumber,
  amount,
  successUrl,
  cancelUrl,
  contactUrl
}: {
  gateway: string;
  orderNumber: string;
  amount: string;
  successUrl: string;
  cancelUrl: string;
  contactUrl: string;
}) {
  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(gateway)} sandbox</title>
  <style>
    :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;display:grid;min-height:100vh;place-items:center;padding:24px}
    main{width:min(620px,100%);border:1px solid #3f3f46;background:#111;padding:32px}
    small{letter-spacing:.18em;color:#a1a1aa;font-weight:700}h1{margin:12px 0 0;font-size:42px;line-height:1}p{color:#c4c4c4;line-height:1.6}.box{margin:24px 0;border:1px solid #3f3f46;background:#18181b;padding:18px}.row{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #27272a;padding:10px 0}.row:last-child{border-bottom:0}.label{color:#a1a1aa}.value{font-weight:800;text-align:right}.actions{display:grid;gap:12px;margin-top:24px}.btn{display:inline-flex;justify-content:center;align-items:center;min-height:48px;padding:0 18px;text-decoration:none;font-weight:800}.primary{background:#fff;color:#000}.secondary{border:1px solid #52525b;color:#fff}.danger{color:#fca5a5;border:1px solid #7f1d1d}@media(min-width:560px){.actions{grid-template-columns:1fr 1fr}.actions .full{grid-column:1/-1}}
  </style>
</head>
<body>
  <main>
    <small>PAYMENT SANDBOX</small>
    <h1>${escapeHtml(gateway)}</h1>
    <p>Đây là màn hình giả lập để test UI/UX và redirect trước khi bật cổng thanh toán production. Không có khoản tiền thật nào được thu ở bước này.</p>
    <div class="box">
      <div class="row"><span class="label">Mã đơn</span><span class="value">${escapeHtml(orderNumber)}</span></div>
      <div class="row"><span class="label">Số tiền</span><span class="value">${escapeHtml(amount)}</span></div>
      <div class="row"><span class="label">Môi trường</span><span class="value">Sandbox</span></div>
    </div>
    <div class="actions">
      <a class="btn primary" href="${escapeHtml(successUrl)}">Giả lập thanh toán thành công</a>
      <a class="btn danger" href="${escapeHtml(cancelUrl)}">Giả lập hủy thanh toán</a>
      <a class="btn secondary full" href="${escapeHtml(contactUrl)}">Liên hệ Zalo nếu cần hỗ trợ</a>
    </div>
  </main>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

export function paymentResultResponse({
  gateway,
  title,
  body,
  orderNumber,
  primaryHref = "/shop",
  primaryLabel = "Quay lại cửa hàng"
}: {
  gateway: string;
  title: string;
  body: string;
  orderNumber: string;
  primaryHref?: string;
  primaryLabel?: string;
}) {
  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(gateway)} result</title>
  <style>
    body{margin:0;background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;display:grid;min-height:100vh;place-items:center;padding:24px}
    main{width:min(560px,100%);border:1px solid #444;padding:40px;background:#111}small{letter-spacing:.18em;color:#a1a1aa;font-weight:700}p{color:#aaa;line-height:1.6}.order{font-weight:800;color:#fff}a{display:inline-flex;margin-top:20px;background:#fff;color:#000;padding:14px 18px;text-decoration:none;font-weight:800}
  </style>
</head>
<body><main><small>${escapeHtml(gateway)}</small><h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(body)}</p>
<p>Mã đơn: <span class="order">${escapeHtml(orderNumber)}</span></p>
<a href="${escapeHtml(primaryHref)}">${escapeHtml(primaryLabel)}</a></main></body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
