import { supabase } from '../utils/supabaseClient.js';

function toIsoDate(value) {
  if (!value) return null;
  return value;
}

function toTime(value) {
  if (!value) return null;
  return value.length === 5 ? `${value}:00` : value; // HH:MM -> HH:MM:SS
}

export async function fetchRecords(filters) {
  let query = supabase
    .from('projeto_ativ_ia')
    .select('cod_ativ_ia,cod_ativ_equipe,data_acao,hora_acao,info')
    .order('data_acao', { ascending: false })
    .order('hora_acao', { ascending: false })
    .limit(200);

  if (filters.cod_ativ_equipe) query = query.eq('cod_ativ_equipe', filters.cod_ativ_equipe);

  const dateFrom = toIsoDate(filters.data_acao_from);
  const dateTo = toIsoDate(filters.data_acao_to);
  if (dateFrom) query = query.gte('data_acao', dateFrom);
  if (dateTo) query = query.lte('data_acao', dateTo);

  const timeFrom = toTime(filters.hora_acao_from);
  const timeTo = toTime(filters.hora_acao_to);
  if (timeFrom) query = query.gte('hora_acao', timeFrom);
  if (timeTo) query = query.lte('hora_acao', timeTo);

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
    tdData.textContent = r.data_acao;

    const tdHora = document.createElement('td');
    tdHora.textContent = r.hora_acao;

    const tdInfo = document.createElement('td');
    const pre = document.createElement('pre');
    pre.className = 'json';
    pre.textContent = JSON.stringify(r.info ?? {}, null, 2);
    tdInfo.appendChild(pre);

    tr.append(tdId, tdEquipe, tdData, tdHora, tdInfo);
    tbodyEl.appendChild(tr);
  }
}

