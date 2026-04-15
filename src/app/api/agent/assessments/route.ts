import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/agent/assessments?engagement_id=xxx
 * Returns assessments visible to the current user (client or internal).
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const url = new URL(request.url)
    const engagementId = url.searchParams.get('engagement_id')
    if (!engagementId) return NextResponse.json({ error: 'engagement_id required' }, { status: 400 })

    // RLS will handle visibility — clients only see sent assessments
    const { data: assessments, error } = await supabase
      .from('agent_assessments')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ assessments: assessments ?? [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch assessments' },
      { status: 500 }
    )
  }
}
