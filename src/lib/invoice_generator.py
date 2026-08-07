#!/usr/bin/env python3
"""
Bronze Wings — Tax Invoice PDF Generator (Python / Jinja2 / WeasyPrint)
======================================================================
Standalone module that renders a branded, FTA-compliant UAE tax invoice
to PDF bytes with perfectly aligned columns, vector-crisp text, and
WeasyPrint-native pagination.

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


# ── Stylesheet (FTA-compliant, perfectly aligned) ────────────────────────────
CSS = """
@page { size: A4 portrait; margin: 12mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

/* Outer border (critical) */
.invoice-wrapper { width: 100%; border: 1.5px solid #8B1538; padding: 6px; background: #fff; }
.invoice-inner { border: 1px solid #ddd; min-height: calc(297mm - 30mm); display: flex; flex-direction: column; }

/* Header */
.header-band { display: flex; align-items: center; padding: 12px 20px 10px 20px; border-bottom: 2px solid #8B1538; }
.logo { width: 60px; height: 60px; margin-right: 14px; }
.brand-h1 { font-family: Georgia, serif; font-size: 20pt; font-weight: 700; color: #8B1538; letter-spacing: 3px; text-transform: uppercase; }
.brand-h2 { font-family: Georgia, serif; font-size: 12pt; font-weight: 600; color: #1a3a5c; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
.tagline { font-size: 7.5pt; font-weight: 600; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
.contact-row { font-size: 8pt; color: #555; margin-top: 6px; }
.trn-line { font-size: 9pt; font-weight: 700; color: #8B1538; margin-top: 4px; letter-spacing: 1px; }

/* Tax Invoice banner (centered, light blue gradient) */
.tax-banner { background: linear-gradient(90deg, #B8D4E3 0%, #D6E4F0 50%, #B8D4E3 100%); padding: 8px 20px; display: flex; justify-content: space-between; align-items: center; position: relative; }
.tax-title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 13pt; font-weight: 800; color: #1a3a5c; text-transform: uppercase; letter-spacing: 2px; }
.invoice-meta { margin-left: auto; text-align: right; font-size: 9pt; color: #1a3a5c; font-weight: 700; }
.invoice-meta span { font-weight: 400; }

/* Billing section (two columns) */
.billing-section { display: flex; padding: 0; border-bottom: 1px solid #ccc; }
.bill-to, .invoice-details { flex: 1; padding: 10px 20px; }
.bill-to { border-right: 1px solid #e0e0e0; }
.section-label { font-size: 8.5pt; font-weight: 800; color: #8B1538; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; padding-bottom: 2px; border-bottom: 1px solid #8B1538; display: inline-block; }
.field { font-size: 8.5pt; line-height: 1.6; color: #000; }
.field strong { color: #444; font-weight: 700; }

/* Table (fixed layout, light blue header) */
.items-table { width: calc(100% - 40px); border-collapse: collapse; table-layout: fixed; font-size: 8pt; margin: 8px 20px; }
.items-table thead th { background: #D6E4F0; color: #1a3a5c; font-weight: 800; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 4px; border: 1px solid #999; text-align: center; }
.items-table thead th:nth-child(1) { width: 35px; }
.items-table thead th.desc { text-align: left; padding-left: 8px; }
.items-table thead th.qty { width: 50px; }
.items-table thead th.price { width: 75px; text-align: right; }
.items-table thead th.total { width: 75px; text-align: right; }
.items-table thead th.tax { width: 75px; text-align: right; }
.items-table thead th.vat { width: 65px; text-align: right; }
.items-table thead th.grand { width: 75px; text-align: right; }
.items-table thead th.trip-date { width: 70px; }

.items-table tbody td { padding: 6px 4px; border: 1px solid #bbb; color: #000; font-weight: 600; vertical-align: top; font-size: 8pt; }
.items-table tbody td:first-child { text-align: center; font-family: 'Courier New', monospace; }
.items-table tbody td.desc { text-align: left; padding-left: 8px; line-height: 1.4; word-wrap: break-word; }
.items-table tbody td.qty { text-align: center; font-family: 'Courier New', monospace; }
.items-table tbody td.trip-date { text-align: center; font-family: 'Courier New', monospace; font-size: 7.5pt; }
.items-table tbody td.num { text-align: right; font-family: 'Courier New', monospace; font-weight: 700; }
.items-table tbody tr:nth-child(even) { background: #fafbfc; }
.items-table tbody tr { page-break-inside: avoid; }

.total-row td { background: #D6E4F0 !important; font-weight: 800; border-top: 2px solid #1a3a5c; font-size: 8pt; }
.total-row td:first-child { text-align: right; padding-right: 8px; font-family: 'Segoe UI', Arial, sans-serif; }
.total-row td.grand { color: #8B1538; font-size: 8.5pt; }

/* Amount in words */
.amount-words { margin: 6px 20px; padding: 6px 12px; background: #F8F8F8; border-top: 1px solid #E0E0E0; border-bottom: 1px solid #E0E0E0; page-break-inside: avoid; }
.amount-words .prefix { font-size: 9pt; font-weight: 800; color: #8B1538; margin-right: 6px; }
.amount-words .words { font-size: 8.5pt; font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: 0.6px; }

/* Spacer (pushes footer to bottom) */
.spacer { flex: 1; min-height: 10px; }

/* Bottom section */
.bottom-section { display: flex; padding: 10px 20px 12px 20px; align-items: flex-start; page-break-inside: avoid; }
.bank-details { flex: 1; padding-right: 20px; }
.bank-details .section-label { margin-bottom: 6px; }
.bank-field { font-size: 8pt; line-height: 1.6; color: #000; }
.bank-field strong { color: #444; font-weight: 700; display: inline-block; min-width: 85px; }

.signature-area { flex: 1.3; display: flex; flex-direction: column; }
.sign-row { display: flex; gap: 40px; justify-content: space-between; }
.sign-company { flex: 1; display: flex; flex-direction: column; align-items: center; }
.sign-company-name { font-size: 8pt; font-weight: 700; color: #8B1538; text-align: center; margin-bottom: 12px; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.5px; min-height: 32px; }
.sign-line-box { width: 100%; max-width: 140px; height: 35px; border-bottom: 1px solid #666; margin-bottom: 4px; }
.sign-label { font-size: 7pt; color: #555; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; }
.sign-mobile { font-size: 8pt; color: #555; margin-top: 8px; text-align: center; }

/* Footer banners (anchored to bottom) */
.footer-banners { page-break-inside: avoid; }
.footer-tagline { background: #8B1538; color: rgba(255,255,255,0.95); text-align: center; padding: 6px 16px; font-size: 7.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; line-height: 1.4; }
.thanks-banner { background: #8B1538; color: #fff; text-align: center; padding: 8px; font-size: 10pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
.services-banner { background: #6B0F2A; color: #fff; text-align: center; padding: 5px; font-size: 7pt; font-weight: 600; text-transform: uppercase; letter-spacing: 3px; }
"""


# ── SVG fallback logo ────────────────────────────────────────────────────────
_LOGO_SVG = """<svg viewBox="0 0 100 100" width="60" height="60" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="46" fill="none" stroke="#8B1538" stroke-width="2"/>
  <circle cx="50" cy="50" r="40" fill="none" stroke="#8B1538" stroke-width="1" stroke-dasharray="3,2"/>
  <circle cx="50" cy="50" r="28" fill="none" stroke="#C4A35A" stroke-width="2"/>
  <path d="M50 22 Q35 35 25 50 Q35 45 50 40 Q65 45 75 50 Q65 35 50 22Z" fill="#C4A35A" opacity="0.9"/>
  <path d="M50 78 Q35 65 25 50 Q35 55 50 60 Q65 55 75 50 Q65 65 50 78Z" fill="#C4A35A" opacity="0.9"/>
  <text x="50" y="46" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="700" fill="#8B1538">BW</text>
  <text x="50" y="58" text-anchor="middle" font-family="Arial,sans-serif" font-size="6" font-weight="600" fill="#8B1538">L.L.C</text>
</svg>"""


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
  <div class="invoice-inner">

    <!-- Header -->
    <div class="header-band">
      <div class="logo">{% if data.logo_url %}<img src="{{ data.logo_url }}" alt="Logo" style="width:60px;height:60px;object-fit:contain;">{% else %}{{ logo_svg }}{% endif %}</div>
      <div class="company-info">
        <div class="brand-h1">{{ data.company.h1 }}</div>
        <div class="brand-h2">{{ data.company.h2 }}</div>
        <div class="tagline">{{ data.company.tagline }}</div>
        <div class="contact-row">Mobile: {{ data.company.phone }}{% if data.company.phone2 %} / {{ data.company.phone2 }}{% endif %} | Email: {{ data.company.email }} | Address: {{ data.company.address }}</div>
        <div class="trn-line">TRN: {{ data.company.trn }}</div>
      </div>
    </div>

    <!-- Tax Invoice Banner -->
    <div class="tax-banner">
      <div style="width: 160px;"></div>
      <div class="tax-title">TAX INVOICE</div>
      <div class="invoice-meta">
        <div>INVOICE #: <span>{{ data.invoice_no }}</span></div>
        <div>DATE: <span>{{ data.invoice_date }}</span></div>
      </div>
    </div>

    <!-- Billing -->
    <div class="billing-section">
      <div class="bill-to">
        <div class="section-label">Bill To</div>
        <div class="field"><strong>BILL TO:</strong> {{ data.bill_to.name }}</div>
        {% if data.bill_to.contact_person %}<div class="field"><strong>ATT:</strong> {{ data.bill_to.contact_person }}</div>{% endif %}
        {% if data.bill_to.address %}<div class="field"><strong>ADDRESS:</strong> {{ data.bill_to.address }}</div>{% endif %}
        {% if data.bill_to.trn %}<div class="field"><strong>TRN:</strong> {{ data.bill_to.trn }}</div>{% endif %}
        {% if data.bill_to.sub %}<div class="field"><strong>SUB:</strong> {{ data.bill_to.sub }}</div>{% endif %}
        {% if data.bill_to.reg_no %}<div class="field"><strong>REG NO:</strong> {{ data.bill_to.reg_no }}</div>{% endif %}
      </div>
      <div class="invoice-details">
        <div class="section-label">Invoice</div>
        <div class="field"><strong>INVOICE:</strong> {{ data.invoice_no }}</div>
        <div class="field"><strong>DATE:</strong> {{ data.invoice_date }}</div>
        {% if data.invoice_type == 'monthly' %}<div class="field"><strong>MONTH:</strong> {{ data.month_label }}</div>{% else %}<div class="field"><strong>WORKING DATE:</strong> {{ data.working_date }}</div>{% endif %}
      </div>
    </div>

    <!-- Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          {% if data.invoice_type == 'trip' %}<th class="trip-date">Trip Date</th>{% endif %}
          <th class="desc">Description</th>
          <th class="qty">Qty</th>
          <th class="price">Unit Price<br>(AED)</th>
          <th class="total">Total<br>Amount</th>
          <th class="tax">Tax<br>Amount</th>
          <th class="vat">VAT<br>{{ data.vat_rate }}%</th>
          <th class="grand">Total<br>Amount</th>
        </tr>
      </thead>
      <tbody>
        {% for item in data.items %}
        <tr>
          <td>{{ item.sn }}</td>
          {% if data.invoice_type == 'trip' %}<td class="trip-date">{{ item.date }}</td>{% endif %}
          <td class="desc">{{ item.description }}</td>
          <td class="qty">{{ item.qty }}</td>
          <td class="num">{{ "%.2f"|format(item.unit_price) }}</td>
          <td class="num">{{ "%.2f"|format(item.amount) }}</td>
          <td class="num">{{ "%.2f"|format(item.taxable) }}</td>
          <td class="num">{{ "%.2f"|format(item.vat) }}</td>
          <td class="num grand">{{ "%.2f"|format(item.total) }}</td>
        </tr>
        {% endfor %}
        <tr class="total-row">
          <td colspan="{{ data.total_row_label_span }}">AED.</td>
          <td class="num">{{ "%.2f"|format(data.subtotal) }}</td>
          <td class="num">{{ "%.2f"|format(data.total_taxable) }}</td>
          <td class="num">{{ "%.2f"|format(data.vat_amount) }}</td>
          <td class="num grand">{{ "%.2f"|format(data.total) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Amount Words -->
    <div class="amount-words">
      <span class="prefix">AED</span>
      <span class="words">{{ data.amount_in_words }}</span>
    </div>

    <!-- Spacer pushes footer down -->
    <div class="spacer"></div>

    <!-- Bottom Section -->
    <div class="bottom-section">
      <div class="bank-details">
        <div class="section-label">Bank Details</div>
        {% if data.bank.bank_name %}<div class="bank-field"><strong>Bank:</strong> {{ data.bank.bank_name }}</div>{% endif %}
        <div class="bank-field"><strong>Account Title:</strong> {{ data.bank.account_title }}</div>
        {% if data.bank.account_no %}<div class="bank-field"><strong>Account No:</strong> {{ data.bank.account_no }}</div>{% endif %}
        {% if data.bank.iban %}<div class="bank-field"><strong>IBAN #</strong> {{ data.bank.iban }}</div>{% endif %}
        {% if data.bank.branch %}<div class="bank-field"><strong>Branch:</strong> {{ data.bank.branch }}</div>{% endif %}
      </div>
      <div class="signature-area">
        <div class="sign-row">
          <div class="sign-company">
            <div class="sign-company-name">FOR<br>{{ data.company.h1 }}<br>{{ data.company.h2 }}</div>
            <div class="sign-line-box"></div>
            <div class="sign-label">Authorized Signature &amp; Stamp</div>
          </div>
          <div class="sign-company">
            <div class="sign-company-name">FOR<br>{{ data.bill_to.name }}</div>
            <div class="sign-line-box"></div>
            <div class="sign-label">Receiver Sign &amp; Stamp</div>
          </div>
        </div>
        <div class="sign-mobile">Mobile: {{ data.company.phone }}</div>
      </div>
    </div>

    <!-- Footer Banners -->
    <div class="footer-banners">
      <div class="footer-tagline">We Provide All Kinds of General and Refrigerated Transportation Services</div>
      <div class="thanks-banner">Thanks for Doing Business with Us!</div>
      <div class="services-banner">General Transport &middot; Heavy Equipment Rental &middot; Logistics &middot; Cold Chain Solutions</div>
    </div>

  </div>
</div>
</body>
</html>
"""


# ── Public API ───────────────────────────────────────────────────────────────
def generate_invoice_pdf(invoice_data: dict) -> bytes:
    """Render `invoice_data` into a branded, FTA-compliant tax-invoice PDF and return the bytes."""
    data = dict(invoice_data)

    # ── Company defaults ──
    comp = dict(data.get("company", {}))
    comp.setdefault("name", "Bronze Wings General Transport L.L.C")
    h1, h2 = _split_brand(comp["name"])
    comp.setdefault("h1", h1)
    comp.setdefault("h2", h2)
    comp.setdefault("tagline", "General Transport \u00b7 Heavy Equipment Rental \u00b7 Logistics Services")
    comp.setdefault("phone", "050-8655601")
    comp.setdefault("email", "hire@bronzewings.ae")
    comp.setdefault("address", "M-6, Mussafah, Abu Dhabi, UAE")
    comp.setdefault("trn", "")
    data["company"] = comp

    # ── Bill-to defaults ──
    bill = dict(data.get("bill_to", {}))
    bill.setdefault("name", "")
    data["bill_to"] = bill

    # ── Bank defaults ──
    bank = dict(data.get("bank", {}))
    bank.setdefault("account_title", comp.get("name", "Bronze Wings General Transport L.L.C"))
    data["bank"] = bank

    # ── Invoice type & dates ──
    data.setdefault("invoice_type", "standard")
    data.setdefault("invoice_date", "")
    data.setdefault("working_date", data.get("invoice_date", ""))
    data.setdefault("month_label", "")

    # ── VAT / totals ──
    vat_rate = float(data.get("vat_rate", 5))
    items = data.get("items", [])
    for item in items:
        item.setdefault("sn", items.index(item) + 1)
        item.setdefault("unit_price", 0)
        item.setdefault("qty", 1)
        item.setdefault("amount", round(float(item["unit_price"]) * float(item["qty"]), 2))
        item.setdefault("discount", 0)
        item.setdefault("taxable", round(float(item["amount"]) - float(item.get("discount", 0)), 2))
        item.setdefault("vat", round(float(item["taxable"]) * vat_rate / 100, 2))
        item.setdefault("total", round(float(item["taxable"]) + float(item["vat"]), 2))

    subtotal = round(sum(float(i["amount"]) for i in items), 2)
    total_discount = round(sum(float(i.get("discount", 0)) for i in items), 2)
    total_taxable = round(sum(float(i["taxable"]) for i in items), 2)
    vat_amount = round(sum(float(i["vat"]) for i in items), 2)
    total = round(sum(float(i["total"]) for i in items), 2)

    data.setdefault("subtotal", subtotal)
    data.setdefault("total_discount", total_discount)
    data.setdefault("total_taxable", total_taxable)
    data.setdefault("vat_amount", vat_amount)
    data.setdefault("total", total)
    data.setdefault("amount_in_words", number_to_words(data["total"]))

    # ── Total-row label span: (# + trip-date + desc) columns are merged for the "AED." label ──
    has_trip_date = data["invoice_type"] == "trip"
    data["total_row_label_span"] = 3 if has_trip_date else 2

    html = Template(TEMPLATE).render(data=data, css=CSS, logo_svg=_LOGO_SVG)
    return HTML(string=html, base_url=data.get("base_url", ".")).write_pdf()


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

    "invoice_no": "2026-0001",
    "invoice_date": "07/08/2026",
    "invoice_type": "standard",
    "working_date": "07/08/2026",

    "bill_to": {
        "name": "Emdad",
        "trn": "100XXXXXXXXXXXX",
        "address": "Abu Dhabi, UAE",
    },

    "items": [
        {
            "sn": 1,
            "description": "M-37, Mussaffah Industrial Area \u2192 Mussaffah Industrial Area (Trip # TR-2607-02)",
            "qty": 1,
            "unit_price": 685.50,
        },
    ],

    "vat_rate": 5,

    "bank": {
        "bank_name": "Abu Dhabi Commercial Bank",
        "account_no": "1234567890",
        "iban": "AE0001234567890",
        "branch": "Mussafah",
    },
}


if __name__ == "__main__":
    out = generate_invoice_pdf(SAMPLE_INVOICE)
    fname = f"tax-invoice-{SAMPLE_INVOICE['invoice_no']}.pdf"
    with open(fname, "wb") as f:
        f.write(out)
    print(f"Generated: {fname}")