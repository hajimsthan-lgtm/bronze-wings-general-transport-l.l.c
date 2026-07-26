#!/usr/bin/env python3
"""
Bronze Wings — Tax Invoice PDF Generator (Python / Jinja2 / WeasyPrint)
======================================================================
Standalone module that renders a branded UAE tax invoice to PDF bytes.

    pip install Jinja2 WeasyPrint

Public API
----------
    generate_invoice_pdf(invoice_data: dict) -> bytes

The returned bytes can be streamed to a browser (Flask/FastAPI `Response`) or
written straight to disk:

    pdf = generate_invoice_pdf(data)
    open("invoice.pdf", "wb").write(pdf)

Run as a script to emit a sample invoice:
    python src/lib/invoice_generator.py
"""

from jinja2 import Template
from weasyprint import HTML


# ── Number → UAE English words ────────────────────────────────────────────────
_ONES = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
]
_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]


def _two_digits(n):
    if n < 20:
        return _ONES[n]
    return _TENS[n // 10] + (" " + _ONES[n % 10] if n % 10 else "")


def _three_digits(n):
    h, r = divmod(n, 100)
    s = ""
    if h:
        s += _ONES[h] + " Hundred"
    if r:
        s += (" " if h else "") + _two_digits(r)
    return s


def _convert_integer(num):
    if num == 0:
        return "Zero"
    parts = []
    for unit, name in ((1_000_000_000, "Billion"), (1_000_000, "Million"), (1_000, "Thousand")):
        v, num = divmod(num, unit)
        if v:
            parts.append(_three_digits(v) + " " + name)
    if num:
        parts.append(_three_digits(num))
    return " ".join(parts)


def number_to_words(num) -> str:
    """UAE-style amount in words, e.g. 719.78 → 'DIRHAMS SEVEN HUNDRED NINETEEN AND EIGHTY EIGHT FILS ONLY'."""
    num = round(float(num or 0), 2)
    integer = int(num)
    decimal = round((num - integer) * 100)
    words = "Dirhams " + _convert_integer(integer)
    if decimal > 0:
        words += " and " + _two_digits(decimal) + " Fils"
    return (words + " Only").upper()


# ── Stylesheet ───────────────────────────────────────────────────────────────
CSS = """
@page { size: A4; margin: 15mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-size: 10pt;
    color: #1F2937;
    line-height: 1.4;
}
.invoice-wrapper { width: 100%; }

/* Header */
.header-main {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 2.5px solid #8C745E; padding-bottom: 12px; margin-bottom: 18px;
}
.col-left { width: 32%; text-align: left; padding-top: 2px; }
.col-left .logo { max-height: 75px; width: auto; object-fit: contain; margin-bottom: 8px; display: block; }
.col-left .comp-name { font-size: 12.5pt; font-weight: 700; color: #5C4A32; margin-bottom: 4px; line-height: 1.3; }
.col-left .comp-detail { font-size: 8.5pt; color: #555; line-height: 1.6; }

.col-center { width: 36%; text-align: center; padding-top: 18px; }
.col-center .tax-title { font-size: 20pt; font-weight: 700; color: #5C4A32; letter-spacing: 4px; text-transform: uppercase; line-height: 1.1; }
.col-center .ref-num { font-size: 11pt; color: #8C745E; margin-top: 8px; font-weight: 600; letter-spacing: 1px; }
.col-center .inv-date { font-size: 9.5pt; color: #6B7280; margin-top: 4px; }

.col-right { width: 32%; text-align: right; padding-top: 8px; }
.col-right .bill-label { font-size: 8pt; text-transform: uppercase; color: #8C745E; font-weight: 600; letter-spacing: 1.5px; margin-bottom: 6px; }
.col-right .bill-company { font-size: 14pt; font-weight: 700; color: #1F2937; margin-bottom: 6px; }
.col-right .bill-trn { font-size: 9pt; color: #6B7280; }
.col-right .due-date { font-size: 9pt; color: #6B7280; margin-top: 4px; }

/* Items table */
.items-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 9pt; }
.items-table thead th {
    background-color: #8C745E; color: #fff; padding: 9px 8px; text-align: left;
    font-weight: 600; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.5px;
}
.items-table thead th:nth-child(1) { width: 5%;  text-align: center; }
.items-table thead th:nth-child(2) { width: 11%; }
.items-table thead th:nth-child(3) { width: 47%; }
.items-table thead th:nth-child(4) { width: 9%;  text-align: center; }
.items-table thead th:nth-child(5) { width: 13%; text-align: right; }
.items-table thead th:nth-child(6) { width: 15%; text-align: right; }
.items-table tbody td { padding: 10px 8px; border-bottom: 1px solid #E5E7EB; vertical-align: top; font-size: 9pt; color: #1F2937; }
.items-table tbody td:nth-child(1) { text-align: center; }
.items-table tbody td:nth-child(4) { text-align: center; }
.items-table tbody td:nth-child(5), .items-table tbody td:nth-child(6) { text-align: right; }
.items-table tbody tr:last-child td { border-bottom: 2px solid #1F2937; }

/* Totals */
.totals-wrap { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
.amount-words { width: 55%; padding-right: 20px; }
.amount-words .words-label { font-size: 8pt; text-transform: uppercase; color: #8C745E; font-weight: 600; letter-spacing: 1px; margin-bottom: 6px; }
.amount-words .words-text { font-size: 9.5pt; color: #1F2937; font-weight: 600; line-height: 1.5; }
.totals-box { width: 210px; }
.t-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 9.5pt; color: #374151; }
.t-row.sub, .t-row.vat { border-bottom: 1px solid #E5E7EB; }
.t-row.total { font-weight: 700; font-size: 11pt; color: #1F2937; border-top: 2px solid #1F2937; padding-top: 8px; margin-top: 3px; }

/* Signatures */
.signatures { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 15px; }
.sig-box { width: 45%; text-align: center; }
.sig-box .sig-for { font-size: 8pt; text-transform: uppercase; color: #8C745E; font-weight: 600; letter-spacing: 1px; margin-bottom: 40px; }
.sig-box .sig-line { border-top: 1.5px solid #555; width: 85%; margin: 0 auto; padding-top: 6px; font-size: 8.5pt; color: #6B7280; }
"""


# ── Jinja2 template ──────────────────────────────────────────────────────────
TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Tax Invoice - {{ data.invoice_no }}</title>
<style>{{ css }}</style>
</head>
<body>
<div class="invoice-wrapper">

  <div class="header-main">
    <div class="col-left">
      {% if data.logo_url %}<img src="{{ data.logo_url }}" alt="Logo" class="logo">{% endif %}
      <div class="comp-name">{{ data.company.name }}</div>
      <div class="comp-detail">
        {{ data.company.address }}<br>
        TRN: {{ data.company.trn }}<br>
        {{ data.company.phone }} | {{ data.company.email }}
      </div>
    </div>

    <div class="col-center">
      <div class="tax-title">Tax Invoice</div>
      <div class="ref-num">{{ data.invoice_no }}</div>
      <div class="inv-date">{{ data.invoice_date }}</div>
    </div>

    <div class="col-right">
      <div class="bill-label">Bill To</div>
      <div class="bill-company">{{ data.bill_to.name }}</div>
      {% if data.bill_to.trn %}<div class="bill-trn">Customer TRN: {{ data.bill_to.trn }}</div>{% endif %}
      <div class="due-date">Due Date: {{ data.due_date }}</div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>S.No</th><th>Date</th><th>Description</th><th>Trip Qty</th><th>Per Trip</th><th>Amount</th>
      </tr>
    </thead>
    <tbody>
      {% for item in data.items %}
      <tr>
        <td>{{ item.sn }}</td>
        <td>{{ item.date }}</td>
        <td>{{ item.description }}</td>
        <td>{{ item.qty }}</td>
        <td>{{ "%.2f"|format(item.per_trip) }}</td>
        <td>{{ "%.2f"|format(item.amount) }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>

  <div class="totals-wrap">
    <div class="amount-words">
      <div class="words-label">Amount in Words</div>
      <div class="words-text">{{ data.amount_in_words }}</div>
    </div>
    <div class="totals-box">
      <div class="t-row sub"><span>Sub Total</span><span>{{ "%.2f"|format(data.subtotal) }} AED</span></div>
      <div class="t-row vat"><span>VAT {{ data.vat_rate }}%</span><span>{{ "%.2f"|format(data.vat_amount) }} AED</span></div>
      <div class="t-row total"><span>Total</span><span>{{ "%.2f"|format(data.total) }} AED</span></div>
    </div>
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-for">For {{ data.company.name }}</div>
      <div class="sig-line">Authorized Signature &amp; Stamp</div>
    </div>
    <div class="sig-box">
      <div class="sig-for">For {{ data.bill_to.name }}</div>
      <div class="sig-line">Authorized Signature &amp; Stamp</div>
    </div>
  </div>

</div>
</body>
</html>
"""


# ── Public API ───────────────────────────────────────────────────────────────
def generate_invoice_pdf(invoice_data: dict) -> bytes:
    """Render `invoice_data` into a branded tax-invoice PDF and return the bytes.

    Streams cleanly to a browser from any web framework, e.g. (FastAPI):
        return Response(generate_invoice_pdf(data), media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=invoice.pdf"})
    """
    data = dict(invoice_data)
    data.setdefault("amount_in_words", number_to_words(data.get("total", 0)))
    html = Template(TEMPLATE).render(data=data, css=CSS)
    return HTML(string=html).write_pdf()


# ── Sample payload ───────────────────────────────────────────────────────────
SAMPLE_INVOICE = {
    "company": {
        "name": "Bronze Wings General Transport L.L.C",
        "address": "M-6, Mussafah, Abu Dhabi, UAE",
        "trn": "100567890123456",
        "phone": "050-8655601",
        "email": "hire@bronzewings.ae",
    },
    "logo_url": None,  # path or URL to logo; None omits it

    "invoice_no": "BW-2026-0012",
    "invoice_date": "26/07/2026",
    "due_date": "25/08/2026",

    "bill_to": {
        "name": "Emdad",
        "trn": "100XXXXXXXXXXXX",
    },

    "items": [
        {
            "sn": 1,
            "date": "26/07/2026",
            "description": "M-37, Mussaffah Industrial Area \u2192 Mussaffah Industrial Area (Trip # TR-2607-02)",
            "qty": 1,
            "per_trip": 685.50,
            "amount": 685.50,
        },
    ],

    "subtotal": 685.50,
    "vat_rate": 5,
    "vat_amount": 34.28,
    "total": 719.78,
}


if __name__ == "__main__":
    out = generate_invoice_pdf(SAMPLE_INVOICE)
    fname = f"tax-invoice-{SAMPLE_INVOICE['invoice_no']}.pdf"
    with open(fname, "wb") as f:
        f.write(out)
    print(f"Generated: {fname}")