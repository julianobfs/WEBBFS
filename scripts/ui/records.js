import { supabase } from '../utils/supabaseClient.js';

function toIsoDate(value) {
  if (!value) return null;
  return value;
}

function toTime(value) {
  if (!value) return null;
  return value.length === 5 ? `${value}:00` : value; // HH:MM -> HH:MM:SS
}

const TZ_BR = 'America/Sao_Paulo';
const brDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ_BR,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const brTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ_BR,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export async function fetchRecords(filters) {
  let query = supabase
    .from('projeto_ativ_ia')
    .select('cod_ativ_ia,cod_ativ_equipe,received_at,data_acao_br,hora_acao_br,info')
    .order('received_at', { ascending: false })
    .limit(200);

  if (filters.cod_ativ_equipe) query = query.eq('cod_ativ_equipe', filters.cod_ativ_equipe);

  const dateFrom = toIsoDate(filters.data_acao_from);
  const dateTo = toIsoDate(filters.data_acao_to);
  if (dateFrom) query = query.gte('data_acao_br', dateFrom);
  if (dateTo) query = query.lte('data_acao_br', dateTo);

  const timeFrom = toTime(filters.hora_acao_from);
  const timeTo = toTime(filters.hora_acao_to);
  if (timeFrom) query = query.gte('hora_acao_br', timeFrom);
  if (timeTo) query = query.lte('hora_acao_br', timeTo);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export function renderRecords(tbodyEl, records) {
  tbodyEl.textContent = '';

  if (!records.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'muted';
    td.textContent = 'Nenhum registro encontrado para os filtros atuais.';
    tr.appendChild(td);
    tbodyEl.appendChild(tr);
    return;
  }

  for (const r of records) {
    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.textContent = String(r.cod_ativ_ia);

    const tdEquipe = document.createElement('td');
    tdEquipe.textContent = String(r.cod_ativ_equipe);

    const tdData = document.createElement('td');
    const receivedAt = r.received_at ? new Date(r.received_at) : null;
    tdData.textContent = receivedAt ? brDateFormatter.format(receivedAt) : '';

    const tdHora = document.createElement('td');
    tdHora.textContent = receivedAt ? brTimeFormatter.format(receivedAt) : '';

    const tdInfo = document.createElement('td');
    const pre = document.createElement('pre');
    pre.className = 'json';
    pre.textContent = JSON.stringify(r.info ?? {}, null, 2);
    tdInfo.appendChild(pre);

    tr.append(tdId, tdEquipe, tdData, tdHora, tdInfo);
    tbodyEl.appendChild(tr);
  }
}

