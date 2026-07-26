#!/usr/bin/env python3
"""
Bronze Wings — Tax Invoice PDF Generator
=========================================
A standalone Python utility that renders a branded tax invoice to PDF
using Jinja2 (HTML templating) and WeasyPrint (HTML/CSS -> PDF).

Setup
-----
    pip install Jinja2 WeasyPrint

    # WeasyPrint also needs system libraries (Cairo, Pango, GDK-PixBuf).
    #   macOS:  brew install cairo pango gdk-pixbuf libffi
    #   Ubuntu: sudo apt-get install libpango-1.0-0 libpangoft2-1.0-0
    #   Windows: see https://doc.courtbouillon.org/weasyprint/stable/first_steps.html

Run
---
    python src/lib/invoice_generator.py

The output PDF is written next to the script as `tax-invoice-<invoice_no>.pdf`.

To generate other invoices, edit the `INVOICE` dict below (or build it from
your data source) and call `generate_invoice_pdf(data, "out.pdf")`.
"""

from pathlib import Path

from jinja2 import Template
from weasyprint import HTML


# ── Invoice payload ──────────────────────────────────────────────────────────
INVOICE = {
    "company": {
        "name": "Bronze Wings General Transport L.L.C",
        "address": "M-6, Mussafah, Abu Dhabi, UAE",
        "trn": "100567890123456",
        "phone": "050-8655601",
        "email": "hire@bronzewings.ae",
    },
    # Optional: a local file path or URL to the company logo. None omits it.
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
            "description": "M 37, Mussaffah Industrial Area 24 -> Mussaffah Industrial Area (TRA-2607-02)",
            "qty": 1,
            "per_trip": 685.50,
            "amount": 685.50,
        },
    ],

    "subtotal": 685.50,
    "vat_rate": 5,
    "vat_amount": 34.28,
    "total": 719.78,
    # Pre-written amount-in-words string (edit to match the computed total).
    "amount_in_words": "DIRHAM SEVEN HUNDRED NINTEEN AND EIGHTY EIGHT FILS ONLY",
}


# ── Stylesheet ───────────────────────────────────────────────────────────────
CSS = """
@page { size: A4; margin: 12mm 15mm 15mm 15mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 10pt;
    color: #333;
    line-height: 1.4;
}
.invoice-wrapper { width: 100%; }

/* ── Header ── */
.header-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2.5px solid #8C745E;
    padding-bottom: 12px;
    margin-bottom: 18px;
}
.col-left { width: 32%; text-align: left; padding-top: 2px; }
.col-left .logo { width: 50px; height: 50px; margin-bottom: 6px; display: block; }
.col-left .comp-name {
    font-size: 12.5pt; font-weight: 700; color: #5C4A32;
    margin-bottom: 4px; line-height: 1.3;
}
.col-left .comp-detail { font-size: 8.5pt; color: #555; line-height: 1.6; }

.col-center { width: 36%; text-align: center; padding-top: 18px; }
.col-center .tax-title {
    font-size: 20pt; font-weight: 700; color: #5C4A32;
    letter-spacing: 4px; text-transform: uppercase; line-height: 1.1;
}
.col-center .ref-num {
    font-size: 11pt; color: #8C745E; margin-top: 8px;
    font-weight: 600; letter-spacing: 1px;
}
.col-center .inv-date { font-size: 9.5pt; color: #777; margin-top: 4px; }

.col-right { width: 32%; text-align: right; padding-top: 8px; }
.col-right .bill-label {
    font-size: 8pt; text-transform: uppercase; color: #8C745E;
    font-weight: 600; letter-spacing: 1.5px; margin-bottom: 6px;
}
.col-right .bill-company { font-size: 14pt; font-weight: 700; color: #333; margin-bottom: 6px; }
.col-right .bill-trn { font-size: 9pt; color: #666; }
.col-right .due-date { font-size: 9pt; color: #666; margin-top: 4px; }

/* ── Items table ── */
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
.items-table tbody td {
    padding: 10px 8px; border-bottom: 1px solid #ccc; vertical-align: top; font-size: 9pt;
}
.items-table tbody td:nth-child(1) { text-align: center; }
.items-table tbody td:nth-child(4) { text-align: center; }
.items-table tbody td:nth-child(5),
.items-table tbody td:nth-child(6) { text-align: right; }
.items-table tbody tr:last-child td { border-bottom: 2px solid #333; }

/* ── Totals ── */
.totals-wrap {
    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;
}
.amount-words { width: 55%; padding-right: 20px; }
.amount-words .words-label {
    font-size: 8pt; text-transform: uppercase; color: #8C745E;
    font-weight: 600; letter-spacing: 1px; margin-bottom: 6px;
}
.amount-words .words-text { font-size: 9.5pt; color: #333; font-weight: 600; line-height: 1.5; }
.totals-box { width: 210px; }
.t-row {
    display: flex; justify-content: space-between;
    padding: 5px 0; font-size: 9.5pt; color: #444;
}
.t-row.sub, .t-row.vat { border-bottom: 1px solid #ddd; }
.t-row.total {
    font-weight: 700; font-size: 11pt; color: #222;
    border-top: 2px solid #333; padding-top: 8px; margin-top: 3px;
}

/* ── Signatures ── */
.signatures {
    display: flex; justify-content: space-between; margin-top: 30px; padding-top: 15px;
}
.sig-box { width: 45%; text-align: center; }
.sig-box .sig-for {
    font-size: 8pt; text-transform: uppercase; color: #8C745E;
    font-weight: 600; letter-spacing: 1px; margin-bottom: 40px;
}
.sig-box .sig-line {
    border-top: 1.5px solid #555; width: 85%; margin: 0 auto;
    padding-top: 6px; font-size: 8.5pt; color: #666;
}
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
      {% if data.bill_to.trn %}<div class="bill-trn">TRN: {{ data.bill_to.trn }}</div>{% endif %}
      <div class="due-date">Due Date: {{ data.due_date }}</div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>S.No</th>
        <th>Date</th>
        <th>Description</th>
        <th>Trip Qty</th>
        <th>Per Trip</th>
        <th>Amount</th>
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


def generate_invoice_pdf(data: dict, output_path: str = "invoice.pdf") -> str:
    """Render `data` into a styled PDF and write it to `output_path`."""
    html = Template(TEMPLATE).render(data=data, css=CSS)
    HTML(string=html).write_pdf(output_path)
    return output_path


if __name__ == "__main__":
    out = f"tax-invoice-{INVOICE['invoice_no']}.pdf"
    generate_invoice_pdf(INVOICE, out)
    print(f"Generated: {Path(out).resolve()}")