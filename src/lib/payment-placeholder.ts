function escapeHtml(value: string) {
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
