/** Browser-only receipt renderer. Pass a complete header with its saved detail rows. */
export function renderOrderReceipt(preview: Window, source: unknown, orderId?: number, brandLogoUrl = ''): void {
  // PrintOrder returns an array. Select the requested order rather than printing
  // the first result when several orders are returned.
  const selected = Array.isArray(source)
    ? (orderId !== undefined
      ? source.find(o => Number(o?.['fldOrderId'] ?? o?.['fldId']) === Number(orderId))
      : source.length === 1 ? source[0] : undefined)
    : source;
  if (!selected || typeof selected !== 'object') {
    preview.document.body.textContent = 'Receipt unavailable: select a single order or pass its order ID to renderOrderReceipt.';
    return;
  }
  const order = selected as Record<string, any>;
  const escape = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  const number = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
  const money = (v: unknown) => number(v).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  // Keep DTO-specific mapping here. Do not use today's inventory prices.
  const details = order['pendingOrderdtls'] ?? order['tblOrderDetails'] ?? order['orderDetails'] ?? order['details'] ?? order['items'];
  if (!Array.isArray(details) || !details.length) {
    preview.document.body.textContent = 'Receipt unavailable: the API did not return saved order items. Close this window and try again.';
    return;
  }
  const customer = order['tblProfileCustomerId'] ?? {};
  const vendor = order['tblProfileVendorId'] ?? {};
  const rows = details.map((d: Record<string, any>, i: number) => {
    const item = d['tblItemMaster'] ?? d['tblItemMasterId'] ?? d['tblItem'] ?? {};
    const qty = number(d['fldQuantity']);
    const rate = number(d['fldRate']);
    const amount = d['fldvalue'] ?? d['fldAmount'] ?? d['fldValue'] ?? d['value'] ?? Math.round(qty * rate * 100) / 100;
    const name = d['fldItemName'] ?? d['itemName'] ?? item['fldItemName'] ?? `Item ${d['fldFKItemId'] ?? i + 1}`;
    return `<tr><td>${i + 1}</td><td>${escape(name)}</td><td class="num">${escape(qty)} ${escape(d['fldUnit'] ?? d['fldBaseUnit'] ?? '')}</td><td class="num">${money(rate)}</td><td class="num">${money(amount)}</td></tr>`;
  }).join('');
  const deliveryAddress = order['fldDeliveryAddress'] ?? [order['fldCustomerDoorNo'], order['fldCustomerComplexOrBuildingName'], order['fldCustomerStreetName']].filter(v => v !== null && v !== undefined && String(v).trim()).join(', ');
  const vendorAddress = [
    order['fldVendorDoorNo'] ?? vendor['fldDoorNo'],
    order['fldVendorComplexOrBuildingName'] ?? vendor['fldComplexOrBuildingName'],
    order['fldVendorStreetName'] ?? vendor['fldStreetName']
  ].filter(v => v !== null && v !== undefined && String(v).trim()).join(', ');
  // Inline vector icon prints without external fonts or image downloads.
  const leafIcon = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M32 5C14 5 5 13 8 25c3 10 23 8 24-20Z" fill="currentColor"/><path d="M7 35 27 12" stroke="currentColor" stroke-width="3" fill="none"/><path d="m13 26 12-12" stroke="white" stroke-width="1.5" fill="none"/></svg>`;
  // Optional fourth argument accepts the real RelaffSol logo asset URL.
  const logoUrl = /^(https?:|data:image\/|\/)/i.test(brandLogoUrl)
    ? new URL(brandLogoUrl, window.location.href).href : '';
  const watermarkSvg = `<svg class="watermark-grid" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true"><defs><pattern id="receipt-brand-pattern" width="220" height="145" patternUnits="userSpaceOnUse"><g transform="translate(110 72) rotate(-28)" fill="#dedede"><svg x="-13" y="-44" width="26" height="26" viewBox="0 0 40 40"><path d="M32 5C14 5 5 13 8 25c3 10 23 8 24-20Z" fill="#dedede"/><path d="M7 35 27 12" stroke="#dedede" stroke-width="3" fill="none"/></svg><text x="0" y="0" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="bold">RelaffSol - Greenbasket</text></g></pattern></defs><rect width="100%" height="100%" fill="url(#receipt-brand-pattern)"/></svg>`;
  const footerLogo = logoUrl
    ? `<img class="brand-logo" src="${escape(logoUrl)}" alt="RelaffSol logo">`
    : `<span class="brand-wordmark">${leafIcon}<strong>RelaffSol</strong></span>`;
  const date = new Date(order['fldOrderGeneratedAt'] ?? order['fldOrderDate']);
  const dateText = Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-IN');
  preview.document.open();
  preview.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Order receipt ${escape(order['fldOrderNumber'])}</title>
  <style id="paper-size">@page { size: 80mm 297mm; margin: 4mm; }</style>
  <style>
  *{box-sizing:border-box}body{margin:0;background:#edf1f0;color:#111;font:14px Arial,sans-serif}.toolbar{position:sticky;top:0;background:#fff;padding:14px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;border-bottom:1px solid #ddd}.toolbar button,.toolbar select{padding:9px;border:1px solid #aaa;border-radius:5px;background:#fff}.toolbar button:first-of-type{background:#087d64;color:#fff}main{padding:20px;overflow:auto}.receipt{background:#fff;margin:auto;padding:4mm;width:80mm;font-size:11px}h1{font-size:calc(18px + 1pt);text-align:center;margin:0 0 6px}h2{text-align:center;font-size:14px;margin:0 0 14px}p{margin:5px 0;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;margin:14px 0;table-layout:fixed}th,td{padding:6px 2px;border-bottom:1px dashed #aaa;vertical-align:top;overflow-wrap:anywhere}th:first-child{width:7%}th:nth-child(2){width:32%}th:nth-child(3){width:21%}th:nth-child(4),th:nth-child(5){width:20%}.num{text-align:right}.total{display:flex;justify-content:space-between;gap:12px;margin:7px 0}.grand{border-top:1px solid;padding-top:9px;font-weight:bold;font-size:14px}.footer{text-align:center;margin-top:18px}.hint{font-size:12px;width:100%;color:#555}body.normal .receipt{width:148mm;padding:10mm;font-size:13px}body.a4 .receipt{width:210mm}body.normal h1{font-size:calc(22px + 1pt)}
  .receipt{position:relative;isolation:isolate}.receipt-content{position:relative;z-index:1}.vendor-address{text-align:center;font-size:calc(1em - 1pt);line-height:1.4;margin:0 0 10px}.watermark{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0;overflow:hidden;color:#dedede;print-color-adjust:exact;-webkit-print-color-adjust:exact}.brand-footer{border-top:1px dashed #aaa;margin-top:14px;padding-top:10px;text-align:center;break-inside:avoid;font-size:10px}.brand-wordmark{display:inline-flex;align-items:center;gap:5px;font-size:14px}.brand-wordmark svg{width:22px;height:22px}.brand-logo{display:block;max-width:100px;max-height:36px;object-fit:contain;margin:0 auto 5px}.brand-footer p{margin:5px 0 0}
  .watermark-grid{display:block;width:100%;height:100%}
  @media print{.watermark{position:fixed;inset:0;width:100%;height:100%}body{background:white}.toolbar{display:none}main{padding:0;overflow:visible}.receipt,body.normal .receipt,body.a4 .receipt{width:100%;margin:0;padding:0;box-shadow:none}thead{display:table-header-group}tr{break-inside:avoid}.totals{break-inside:avoid}}
  </style></head><body><div class="toolbar"><label>Printer <select id="mode"><option value="bill">Bill Printer</option><option value="normal">Normal Printer</option></select></label><label id="roll-label">Roll <select id="roll"><option value="80">80 mm</option><option value="58">58 mm</option></select></label><label id="size-label" hidden>Paper <select id="size"><option>A5</option><option>A4</option></select></label><button id="print" type="button">Print Receipt</button><button id="close" type="button">Close</button><div class="hint">Select the matching printer and paper in the print dialog. Disable browser headers and footers; use 100% scale. For thermal printers, select the matching roll and receipt length in the printer driver.</div></div><main><article class="receipt"><div class="watermark" aria-hidden="true">${watermarkSvg}</div><div class="receipt-content"><h1>${escape(vendor['fldShopName'] ?? order['fldVendorFullName'] ?? order['fldVendorName'] ?? vendor['fldFullName'] ?? 'Green Basket')}</h1>${vendorAddress ? `<p class="vendor-address">${escape(vendorAddress)}</p>` : ''}<h2>Order Receipt</h2><p><b>Vendor Phone:</b> ${escape(order['fldVendorContactNumber'] ?? vendor['fldContactNumber'] ?? '')}</p><p><b>Order:</b> ${escape(order['fldOrderNumber'])}</p><p><b>Date:</b> ${escape(dateText)}</p><p><b>Status:</b> ${escape(order['fldOrderStatus'])}</p><p><b>Customer:</b> ${escape(order['fldCustomerFullName'] ?? order['fldCustomerName'] ?? customer['fldFullName'])}</p><p><b>Customer Phone:</b> ${escape(order['fldCustomerContactNumber'] ?? customer['fldContactNumber'] ?? '')}</p><p><b>Delivery:</b> ${escape(deliveryAddress || customer['fldStreetName'] || '')}</p><table><thead><tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Rate ₹</th><th class="num">Amount ₹</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div class="total"><span>Item Subtotal</span><span>₹${money(order['fldItemSubTotal'])}</span></div><div class="total"><span>Delivery Charges</span><span>₹${money(order['fldDeliveryCharges'])}</span></div><div class="total grand"><span>Grand Total</span><span>₹${money(order['fldGrandTotal'])}</span></div></div><p class="footer">Thank you for your order!</p><footer class="brand-footer">${footerLogo}<p>Designed &amp; hosted by <strong>RelaffSol</strong></p></footer></div></article></main></body></html>`);
  preview.document.close();
  const doc = preview.document;
  const mode = doc.getElementById('mode') as HTMLSelectElement;
  const size = doc.getElementById('size') as HTMLSelectElement;
  const roll = doc.getElementById('roll') as HTMLSelectElement;
  const update = () => {
    const bill = mode.value === 'bill';
    doc.body.className = bill ? '' : `normal ${size.value === 'A4' ? 'a4' : ''}`;
    doc.getElementById('size-label')!.hidden = bill;
    doc.getElementById('roll-label')!.hidden = !bill;
    const receipt = doc.querySelector('.receipt') as HTMLElement;
    receipt.style.width = bill ? `${roll.value}mm` : '';
    // Inline width applies to preview only; reset it while printing.
    doc.getElementById('paper-size')!.textContent = `@page { size: ${bill ? `${roll.value}mm 297mm` : size.value}; margin: ${bill ? '4mm' : '10mm'}; } @media print { .receipt { width:100% !important; } }`;
  };
  mode.addEventListener('change', update);
  size.addEventListener('change', update);
  roll.addEventListener('change', update);
  doc.getElementById('print')!.addEventListener('click', () => { preview.focus(); const images = Array.from(doc.images); if (images.some(img => !img.complete)) { preview.alert('The logo is still loading. Please try Print again in a moment.'); return; } preview.print(); });
  doc.getElementById('close')!.addEventListener('click', () => preview.close());
  update();
}
