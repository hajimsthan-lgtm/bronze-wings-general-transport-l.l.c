#!/usr/bin/env python3
"""
Bronze Wings — Tax Invoice PDF Generator (Python / Jinja2 / WeasyPrint)
======================================================================
Standalone module that renders a branded UAE tax invoice to PDF bytes.

    pip install Jinja2 WeasyPrint

Public API
----------
    generate_invoice_pdf(invoice_data: dict) -> bytes

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


def _split_brand(name: str):
    """'Bronze Wings General Transport L.L.C' -> ('Bronze Wings', 'General Transport L.L.C')."""
    gidx = name.lower().find("general")
    if gidx >= 0:
        return name[:gidx].strip(), name[gidx:].strip()
    return name, ""


# ── Stylesheet ───────────────────────────────────────────────────────────────
CSS = """
@page { size: A4; margin: 15mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 10pt; color: #1F2937; line-height: 1.4; }
.invoice-wrapper { width: 100%; }

/* Header band */
.header-band { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.brand-block { display: flex; align-items: center; gap: 10px; }
.brand-block .logo { height: 62px; width: 62px; border-radius: 50%; object-fit: cover; }
.brand-block .brand-h1 { font-size: 20pt; font-weight: 800; color: #333; letter-spacing: 1.5px; text-transform: uppercase; line-height: 1.1; }
.brand-block .brand-h2 { font-size: 9pt; font-weight: 500; color: #555; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
.contact-col { text-align: right; font-size: 9pt; color: #333; line-height: 1.6; }
.header-rule { border-bottom: 1.5px solid #8C745E; margin-bottom: 14px; }

/* Title */
.title-block { text-align: center; margin-bottom: 14px; }
.title-block .tax-title { font-size: 18pt; font-weight: 700; color: #333; letter-spacing: 3px; text-transform: uppercase; line-height: 1.1; }
.title-block .ref-num { font-size: 11pt; color: #8C745E; font-weight: 700; margin-top: 4px; }

/* Meta row */
.meta-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.from-label { font-size: 8pt; text-transform: uppercase; color: #777; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 5px; }
.from-name { font-size: 9.5pt; font-weight: 700; color: #333; margin-bottom: 2px; }
.from-detail { font-size: 9pt; color: #333; line-height: 1.6; }
.meta-row .col-left { flex: 1; text-align: left; }
.meta-row .col-right { flex: 1; text-align: right; }
.inv-date { font-size: 9pt; color: #333; margin-bottom: 5px; }
.bill-label { font-size: 8pt; text-transform: uppercase; color: #777; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 5px; }
.bill-company { font-size: 9.5pt; font-weight: 700; color: #333; margin-bottom: 2px; }
.bill-detail { font-size: 9pt; color: #333; line-height: 1.6; }

/* Items table */
.items-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 9pt; }
.items-table thead th { background-color: #8C745E; color: #fff; padding: 9px 8px; text-align: left; font-weight: 600; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.5px; }
.items-table thead th:nth-child(1) { width: 4%;  text-align: center; }
.items-table thead th:nth-child(2) { width: 9%; }
.items-table thead th:nth-child(3) { width: 44%; }
.items-table thead th:nth-child(4) { width: 7%;  text-align: center; }
.items-table thead th:nth-child(5) { width: 11%; text-align: right; }
.items-table thead th:nth-child(6) { width: 12%; text-align: right; }
.items-table thead th:nth-child(7) { width: 13%; text-align: right; }
.items-table tbody td { padding: 10px 8px; border-bottom: 1px solid #E5E7EB; vertical-align: top; font-size: 9pt; color: #1F2937; }
.items-table tbody td:nth-child(1) { text-align: center; }
.items-table tbody td:nth-child(4) { text-align: center; }
.items-table tbody td:nth-child(5), .items-table tbody td:nth-child(6), .items-table tbody td:nth-child(7) { text-align: right; }
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

  <div class="header-band">
    <div class="brand-block">
      {% if data.logo_url %}<img src="{{ data.logo_url }}" alt="Logo" class="logo">{% endif %}
      <div>
        <div class="brand-h1">{{ data.company.h1 }}</div>
        {% if data.company.h2 %}<div class="brand-h2">{{ data.company.h2 }}</div>{% endif %}
      </div>
    </div>
    <div class="contact-col">
      {{ data.company.phone }}<br>
      {% if data.company.phone2 %}{{ data.company.phone2 }}<br>{% endif %}
      {% if data.company.email %}{{ data.company.email }}<br>{% endif %}
      {{ data.company.address }}
    </div>
  </div>
  <div class="header-rule"></div>

  <div class="title-block">
    <div class="tax-title">Tax Invoice</div>
    <div class="ref-num">{{ data.invoice_no }}</div>
  </div>

  <div class="meta-row">
    <div class="col-left">
      <div class="from-label">From</div>
      <div class="from-name">{{ data.company.name }}</div>
      <div class="from-detail">
        {{ data.company.address }}<br>
        TRN: {{ data.company.trn }}
      </div>
    </div>

    <div class="col-right">
      <div class="inv-date">Date: {{ data.invoice_date }}</div>
      <div class="bill-label">Bill To</div>
      <div class="bill-company">{{ data.bill_to.name }}</div>
      <div class="bill-detail">
        {% if data.bill_to.address %}{{ data.bill_to.address }}<br>{% endif %}
        {% if data.bill_to.trn %}TRN: {{ data.bill_to.trn }}<br>{% endif %}
        Due Date: {{ data.due_date }}
      </div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>S.No</th><th>Date</th><th>Description</th><th>Trip Qty</th><th>Per Trip</th><th>Amount</th><th>VAT %</th>
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
        <td>{{ data.vat_rate }}%</td>
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
    """Render `invoice_data` into a branded tax-invoice PDF and return the bytes."""
    data = dict(invoice_data)
    data.setdefault("amount_in_words", number_to_words(data.get("total", 0)))
    comp = dict(data.get("company", {}))
    h1, h2 = _split_brand(comp.get("name", "Bronze Wings General Transport L.L.C"))
    comp.setdefault("h1", h1)
    comp.setdefault("h2", h2)
    data["company"] = comp
    bill = dict(data.get("bill_to", {}))
    bill.setdefault("contact", " | ".join(p for p in (bill.get("phone"), bill.get("email")) if p))
    data["bill_to"] = bill
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
    "logo_url": None,

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