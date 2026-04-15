import { createClient } from '@/lib/supabase/server'
import { runGlassboxAgent } from '@/lib/agent/run-agent'
import { NextResponse } from 'next/server'

/**
 * Client-triggered on-demand agent assessment.
 * POST /api/agent/on-demand
 * Body: { engagement_id: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { engagement_id } = body

    if (!engagement_id) {
      return NextResponse.json({ error: 'engagement_id is required' }, { status: 400 })
    }

    // Verify the user has access to this engagement
    const { data: engagement } = await supabase
      .from('engagements')
      .select('id')
      .eq('id', engagement_id)
      .single()

    if (!engagement) {
      return NextResponse.json({ error: 'Engagement not found or access denied' }, { status: 404 })
    }

    // Check agent config exists
    const { data: agentConfig } = await supabase
      .from('agent_configs')
      .select('id, on_demand_enabled')
      .eq('engagement_id', engagement_id)
      .single()

    if (!agentConfig) {
      return NextResponse.json({ error: 'No Glassbox Agent configured for this engagement' }, { status: 404 })
    }

    if (!agentConfig.on_demand_enabled) {
      return NextResponse.json({ error: 'On-demand assessments are disabled for this engagement' }, { status: 403 })
    }

    // Run the agent
    const result = await runGlassboxAgent(engagement_id, 'on_demand', user.id, supabase)

    return NextResponse.json({
      success: true,
      assessment_id: result.assessmentId,
      status: result.status,
    })

  } catch (error) {
    console.error('[Agent On-Demand] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Agent assessment failed' },
      { status: 500 }
    )
  }
}
