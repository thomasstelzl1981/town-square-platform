import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    if (req.method === 'GET') {
      // Fetch scheduler settings
      const { data: settings } = await supabase
        .from('automation_settings')
        .select('*')
        .eq('setting_key', 'discovery_scheduler')
        .single()

      // Fetch last 5 runs from discovery_run_log
      const { data: recentRuns } = await supabase
        .from('discovery_run_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      // Today's cost aggregate
      const today = new Date().toISOString().split('T')[0]
      const { data: todayRuns } = await supabase
        .from('discovery_run_log')
        .select('credits_used, cost_eur')
        .gte('created_at', today + 'T00:00:00Z')

      const todayCost = (todayRuns || []).reduce((sum: number, r: any) => sum + (r.cost_eur || 0), 0)
      const todayCredits = (todayRuns || []).reduce((sum: number, r: any) => sum + (r.credits_used || 0), 0)

      // Ledger stats
      const { count: totalLedger } = await supabase
        .from('contact_strategy_ledger')
        .select('*', { count: 'exact', head: true })

      const { count: completedLedger } = await supabase
        .from('contact_strategy_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      const { count: inProgressLedger } = await supabase
        .from('contact_strategy_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress')

      const { count: pendingLedger } = await supabase
        .from('contact_strategy_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      return new Response(JSON.stringify({
        settings: settings?.setting_value || { active: false, cron_schedule: '0 6 * * *', target_per_day: 500, max_credits_per_day: 200 },
        recentRuns: recentRuns || [],
        todayCost,
        todayCredits,
        ledger: {
          total: totalLedger || 0,
          completed: completedLedger || 0,
          inProgress: inProgressLedger || 0,
          pending: pendingLedger || 0,
        },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (req.method === 'POST') {
      const { action, config } = await req.json()

      if (action === 'activate' || action === 'deactivate') {
        const isActive = action === 'activate'
        const currentConfig = config || {}
        
        const newValue = {
          active: isActive,
          cron_schedule: currentConfig.cron_schedule || '0 6 * * *',
          target_per_day: currentConfig.target_per_day || 500,
          max_credits_per_day: currentConfig.max_credits_per_day || 200,
          updated_at: new Date().toISOString(),
        }

        await supabase
          .from('automation_settings')
          .update({ 
            setting_value: newValue, 
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq('setting_key', 'discovery_scheduler')

        return new Response(JSON.stringify({ success: true, active: isActive, config: newValue }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (action === 'update_config') {
        const { data: current } = await supabase
          .from('automation_settings')
          .select('setting_value')
          .eq('setting_key', 'discovery_scheduler')
          .single()

        const merged = { ...(current?.setting_value as any || {}), ...config, updated_at: new Date().toISOString() }
        
        await supabase
          .from('automation_settings')
          .update({ setting_value: merged, updated_at: new Date().toISOString(), updated_by: user.id })
          .eq('setting_key', 'discovery_scheduler')

        return new Response(JSON.stringify({ success: true, config: merged }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
