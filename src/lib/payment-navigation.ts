type PaymentCheckoutData = {
  paymentUrl?: string;
  checkout?: {
    action: string;
    method: "POST";
    fields: Record<string, string | number | undefined>;
  };
};

export function navigateToPayment(data: PaymentCheckoutData) {
  if (data.paymentUrl) {
    window.location.assign(data.paymentUrl);
    return true;
  }

  if (!data.checkout) {
    return false;
  }

  const form = document.createElement("form");
  form.action = data.checkout.action;
  form.method = data.checkout.method;

  for (const [name, value] of Object.entries(data.checkout.fields)) {
    if (value === undefined) continue;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  return true;
}
