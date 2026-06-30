import { supabase } from './supabaseClient.js'

function toIsoDate(value) {
  const date = new Date(value || Date.now())

  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function quoteRowToModel(row) {
  return {
    ...(row.payload || {}),
    id: row.id,
    quotationNumber: row.quotation_number,
    status: row.status,
    createdAt: toIsoDate(row.created_at || row.payload?.createdAt),
    updatedAt: toIsoDate(row.updated_at || row.payload?.updatedAt),
  }
}

function serviceRowToModel(row) {
  return {
    ...(row.payload || {}),
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price || 0),
    createdAt: toIsoDate(row.created_at || row.payload?.createdAt),
    updatedAt: toIsoDate(row.updated_at || row.payload?.updatedAt),
  }
}

function quoteToRow(accountId, quote) {
  const now = toIsoDate(quote.updatedAt)

  return {
    user_id: accountId,
    id: quote.id,
    quotation_number: quote.quotationNumber,
    status: quote.status || 'Draft',
    payload: quote,
    created_at: toIsoDate(quote.createdAt),
    updated_at: now,
  }
}

function serviceToRow(accountId, service) {
  const now = toIsoDate(service.updatedAt)

  return {
    user_id: accountId,
    id: service.id,
    name: service.name,
    description: service.description || '',
    price: Number(service.price || 0),
    payload: service,
    created_at: toIsoDate(service.createdAt),
    updated_at: now,
  }
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  return supabase
}

export async function loadWorkspaceData(accountId) {
  const client = requireSupabase()

  const [
    quotationsResponse,
    servicesResponse,
    businessSettingsResponse,
    profileSettingsResponse,
  ] = await Promise.all([
    client
      .from('quotely_quotations')
      .select('*')
      .eq('user_id', accountId)
      .order('updated_at', { ascending: false }),
    client
      .from('quotely_service_templates')
      .select('*')
      .eq('user_id', accountId)
      .order('updated_at', { ascending: false }),
    client
      .from('quotely_business_settings')
      .select('settings')
      .eq('user_id', accountId)
      .maybeSingle(),
    client
      .from('quotely_profile_settings')
      .select('profile_image')
      .eq('user_id', accountId)
      .maybeSingle(),
  ])

  const error =
    quotationsResponse.error
    || servicesResponse.error
    || businessSettingsResponse.error
    || profileSettingsResponse.error

  if (error) {
    throw error
  }

  return {
    quotes: (quotationsResponse.data || []).map(quoteRowToModel),
    serviceTemplates: (servicesResponse.data || []).map(serviceRowToModel),
    settings: businessSettingsResponse.data?.settings || null,
    profileImage: profileSettingsResponse.data?.profile_image || null,
  }
}

export async function saveWorkspaceQuotations(accountId, quotes) {
  const client = requireSupabase()

  if (!quotes.length) {
    const { error } = await client.from('quotely_quotations').delete().eq('user_id', accountId)

    if (error) {
      throw error
    }

    return
  }

  const rows = quotes.map((quote) => quoteToRow(accountId, quote))
  const { error } = await client
    .from('quotely_quotations')
    .upsert(rows, { onConflict: 'user_id,id' })

  if (error) {
    throw error
  }
}

export async function deleteWorkspaceQuotation(accountId, quoteId) {
  const client = requireSupabase()
  const { error } = await client
    .from('quotely_quotations')
    .delete()
    .eq('user_id', accountId)
    .eq('id', quoteId)

  if (error) {
    throw error
  }
}

export async function saveWorkspaceServiceTemplates(accountId, serviceTemplates) {
  const client = requireSupabase()

  if (!serviceTemplates.length) {
    const { error } = await client.from('quotely_service_templates').delete().eq('user_id', accountId)

    if (error) {
      throw error
    }

    return
  }

  const rows = serviceTemplates.map((service) => serviceToRow(accountId, service))
  const { error } = await client
    .from('quotely_service_templates')
    .upsert(rows, { onConflict: 'user_id,id' })

  if (error) {
    throw error
  }
}

export async function deleteWorkspaceServiceTemplate(accountId, serviceId) {
  const client = requireSupabase()
  const { error } = await client
    .from('quotely_service_templates')
    .delete()
    .eq('user_id', accountId)
    .eq('id', serviceId)

  if (error) {
    throw error
  }
}

export async function saveWorkspaceSettings(accountId, settings) {
  const client = requireSupabase()
  const { error } = await client.from('quotely_business_settings').upsert(
    {
      user_id: accountId,
      settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    throw error
  }
}

export async function saveWorkspaceProfileImage(accountId, profileImage) {
  const client = requireSupabase()
  const { error } = await client.from('quotely_profile_settings').upsert(
    {
      user_id: accountId,
      profile_image: profileImage || '',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    throw error
  }
}
