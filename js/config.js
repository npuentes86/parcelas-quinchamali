/* ---------------------------------------------------------------------------
 * Credenciales de Supabase.
 *
 * Estos dos valores son PÚBLICOS por diseño — van al navegador de cada
 * visitante y es correcto tenerlos en el repositorio. Lo que protege los datos
 * son las policies de Row Level Security en supabase/schema.sql, no el secreto
 * de esta llave.
 *
 * NUNCA pongas aquí la secret key (sb_secret_…) ni la service_role: esas saltan
 * RLS y dan acceso total a la base.
 *
 * Dónde obtenerlos: Supabase Dashboard -> Project Settings -> API
 *   url     = Project URL
 *   anonKey = Publishable key (sb_publishable_…)
 *
 * Mientras estos valores sean los de ejemplo, el sitio funciona igual: los
 * lotes se muestran desde el HTML estático y el formulario avisa que hay que
 * escribir por WhatsApp.
 * ------------------------------------------------------------------------ */
window.SUPABASE_CONFIG = {
  url: 'https://qlcdgfgcxhmvchpqnmwg.supabase.co',
  anonKey: 'sb_publishable_n80lFnGQTYcdBFI5CasFqQ_BdV55Db_',
};
