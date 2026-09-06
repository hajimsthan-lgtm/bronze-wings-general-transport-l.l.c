import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const SUPABASE_API = 'https://api.supabase.com/v1';

async function getProjectRef(accessToken) {
  const res = await fetch(`${SUPABASE_API}/projects`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to list Supabase projects: ${res.status}`);
  const data = await res.json();
  const project = (data.items || data || []).find(p => p.status === 'ACTIVE') || (data.items || data || [])[0];
  if (!project) throw new Error('No Supabase projects found in your account');
  return project.ref;
}

async function ensureInvoicesTable(accessToken, projectRef) {
  const sql = `
    CREATE TABLE IF NOT EXISTS public.invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT,
      client_name TEXT,
      contact_person TEXT,
      client_email TEXT,
      client_phone TEXT,
      client_address TEXT,
      client_trn TEXT,
      sub TEXT,
      reg_no TEXT,
      lpo_ref TEXT,
      status TEXT DEFAULT 'draft',
      issue_date DATE,
      due_date DATE,
      subtotal NUMERIC DEFAULT 0,
      vat_rate NUMERIC DEFAULT 5,
      vat_amount NUMERIC DEFAULT 0,
      total_amount NUMERIC DEFAULT 0,
      paid_amount NUMERIC DEFAULT 0,
      currency TEXT DEFAULT 'AED',
      line_items JSONB DEFAULT '[]',
      notes TEXT,
      payment_terms TEXT,
      trip_id TEXT,
      voided BOOLEAN DEFAULT false,
      void_reason TEXT,
      signed_invoice_url TEXT,
      signed_date DATE,
      signed_uploaded_by TEXT,
      sent_for_signature_date DATE,
      signature_skipped BOOLEAN DEFAULT false,
      custom_template_id TEXT,
      custom_layout JSONB,
      created_date TIMESTAMPTZ,
      updated_date TIMESTAMPTZ,
      created_by_id TEXT
    );
  `;
  const res = await fetch(`${SUPABASE_API}/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create invoices table: ${err}`);
  }
}

async function getServiceRoleKey(accessToken, projectRef) {
  const res = await fetch(`${SUPABASE_API}/projects/${projectRef}/api-keys`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to get API keys: ${res.status}`);
  const keys = await res.json();
  const serviceKey = (Array.isArray(keys) ? keys : []).find(k => k.name === 'service_role');
  if (!serviceKey) throw new Error('service_role key not found');
  return serviceKey.api_key;
}

function clean(v) {
  return v === '' || v === undefined ? null : v;
}

function mapInvoice(inv) {
  return {
    id: inv.id,
    invoice_number: inv.invoice_number,
    client_name: inv.client_name,
    contact_person: inv.contact_person,
    client_email: inv.client_email,
    client_phone: inv.client_phone,
    client_address: inv.client_address,
    client_trn: inv.client_trn,
    sub: inv.sub,
    reg_no: inv.reg_no,
    lpo_ref: inv.lpo_ref,
    status: inv.status,
    issue_date: clean(inv.issue_date),
    due_date: clean(inv.due_date),
    subtotal: inv.subtotal,
    vat_rate: inv.vat_rate,
    vat_amount: inv.vat_amount,
    total_amount: inv.total_amount,
    paid_amount: inv.paid_amount,
    currency: inv.currency,
    line_items: inv.line_items || [],
    notes: inv.notes,
    payment_terms: inv.payment_terms,
    trip_id: inv.trip_id,
    voided: inv.voided,
    void_reason: inv.void_reason,
    signed_invoice_url: inv.signed_invoice_url,
    signed_date: clean(inv.signed_date),
    signed_uploaded_by: inv.signed_uploaded_by,
    sent_for_signature_date: clean(inv.sent_for_signature_date),
    signature_skipped: inv.signature_skipped,
    custom_template_id: inv.custom_template_id,
    custom_layout: inv.custom_layout,
    created_date: inv.created_date,
    updated_date: inv.updated_date,
    created_by_id: inv.created_by_id,
  };
}

async function upsertInvoices(projectRef, serviceKey, invoices) {
  const rows = invoices.map(mapInvoice);
  const res = await fetch(`https://${projectRef}.supabase.co/rest/v1/invoices`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upsert invoices: ${err}`);
  }
  return rows.length;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { invoice_id } = body;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');

    const projectRef = await getProjectRef(accessToken);
    await ensureInvoicesTable(accessToken, projectRef);
    const serviceKey = await getServiceRoleKey(accessToken, projectRef);

    let invoices;
    if (invoice_id) {
      const inv = await base44.entities.Invoice.get(invoice_id);
      invoices = [inv];
    } else {
      invoices = await base44.asServiceRole.entities.Invoice.list('-created_date', 500);
    }

    const syncedCount = await upsertInvoices(projectRef, serviceKey, invoices);

    return Response.json({
      success: true,
      project_ref: projectRef,
      synced: syncedCount,
      mode: invoice_id ? 'single' : 'all',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}