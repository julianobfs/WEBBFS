import { createClient } from '@supabase/supabase-js';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function getBearerToken(req) {
  const raw = req.headers?.authorization || req.headers?.Authorization;
  if (!raw || typeof raw !== 'string') return null;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTime(value) {
  return typeof value === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(value);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'method_not_allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return json(res, 500, { error: 'missing_env', message: 'SUPABASE_URL/SUPABASE_ANON_KEY ausentes.' });
  }

  const jwt = getBearerToken(req);
  if (!jwt) {
    return json(res, 401, { error: 'missing_bearer_token' });
  }

  const body = req.body;
  if (!body || typeof body !== 'object') {
    return json(res, 400, { error: 'invalid_json' });
  }

  const codAtivEquipe = Number(body.cod_ativ_equipe);
  const dataAcao = body.data_acao;
  const horaAcao = body.hora_acao;
  const info = body.info;

  if (!Number.isInteger(codAtivEquipe) || codAtivEquipe <= 0) {
    return json(res, 400, { error: 'invalid_cod_ativ_equipe' });
  }
  if (!isIsoDate(dataAcao)) {
    return json(res, 400, { error: 'invalid_data_acao' });
  }
  if (!isTime(horaAcao)) {
    return json(res, 400, { error: 'invalid_hora_acao' });
  }
  if (!info || typeof info !== 'object' || Array.isArray(info)) {
    return json(res, 400, { error: 'invalid_info' });
  }
  if (!Object.prototype.hasOwnProperty.call(info, 'cod_ativ_equipe')) {
    return json(res, 400, { error: 'info_missing_cod_ativ_equipe' });
  }

  // Executa a inserção como o usuário do JWT (RLS aplica).
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  // Valida JWT minimamente no Supabase Auth (se inválido, retorna 401/403).
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return json(res, 403, { error: 'invalid_user_jwt' });
  }

  const { data, error } = await supabase
    .from('projeto_ativ_ia')
    .insert({
      cod_ativ_equipe: codAtivEquipe,
      data_acao: dataAcao,
      hora_acao: horaAcao.length === 5 ? `${horaAcao}:00` : horaAcao,
      info,
    })
    .select('cod_ativ_ia')
    .single();

  if (error) {
    return json(res, 400, { error: 'insert_failed', details: error.message });
  }

  return json(res, 201, { cod_ativ_ia: data.cod_ativ_ia });
}

