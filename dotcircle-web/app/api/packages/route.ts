// @ts-nocheck
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/packages - 获取礼包列表
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'active'
  const type = searchParams.get('type')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  
  let query = supabase
    .from('packages')
    .select('*, creator:users(*)', { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)
  
  if (type && type !== 'all') {
    query = query.eq('type', type.toUpperCase())
  }
  
  const { data, error, count } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({
    data,
    total: count,
    page,
    limit,
    hasMore: count ? count > page * limit : false,
  })
}

// POST /api/packages - 创建礼包
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const { type, gift_url, image_url, contract_enabled } = body
  
  // 检查今日任务是否完成
  const { data: userData } = await supabase
    .from('users')
    .select('daily_helped, daily_published, daily_quota')
    .eq('id', user.id)
    .single()
  
  if (!userData || userData.daily_helped < 2) {
    return NextResponse.json({ error: '请先完成互助任务' }, { status: 400 })
  }
  
  if (userData.daily_published >= userData.daily_quota) {
    return NextResponse.json({ error: '今日发布额度已用完' }, { status: 400 })
  }
  
  // 创建礼包
  const { data, error } = await supabase
    .from('packages')
    .insert({
      creator_id: user.id,
      type,
      gift_url,
      image_url,
      contract_enabled: contract_enabled ?? true,
      status: 'active',
      help_count: 0,
      max_help: 10,
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // 更新用户发布统计
  await supabase
    .from('users')
    .update({
      daily_published: userData.daily_published + 1,
      total_published: supabase.rpc('increment', { x: 1 }),
    })
    .eq('id', user.id)
  
  return NextResponse.json(data, { status: 201 })
}