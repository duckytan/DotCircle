// @ts-nocheck
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST /api/help - 帮助礼包
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const { package_id } = body
  
  // 获取礼包信息
  const { data: pkg, error: pkgError } = await supabase
    .from('packages')
    .select('*')
    .eq('id', package_id)
    .single()
  
  if (pkgError || !pkg) {
    return NextResponse.json({ error: '礼包不存在' }, { status: 404 })
  }
  
  if (pkg.status !== 'active') {
    return NextResponse.json({ error: '礼包已结束' }, { status: 400 })
  }
  
  if (pkg.help_count >= pkg.max_help) {
    return NextResponse.json({ error: '礼包已满' }, { status: 400 })
  }
  
  // 检查是否已经帮助过
  const { data: existingHelp } = await supabase
    .from('help_records')
    .select('*')
    .eq('package_id', package_id)
    .eq('helper_id', user.id)
    .single()
  
  if (existingHelp) {
    return NextResponse.json({ error: '已经帮助过了' }, { status: 400 })
  }
  
  // 创建帮助记录
  const { error: helpError } = await supabase
    .from('help_records')
    .insert({
      package_id,
      helper_id: user.id,
    })
  
  if (helpError) {
    return NextResponse.json({ error: helpError.message }, { status: 500 })
  }
  
  // 更新礼包帮助数
  const newHelpCount = pkg.help_count + 1
  const newStatus = newHelpCount >= pkg.max_help ? 'completed' : 'active'
  
  const { error: updateError } = await supabase
    .from('packages')
    .update({
      help_count: newHelpCount,
      status: newStatus,
      helpers: [...(pkg.helpers || []), { user_id: user.id, helped_at: new Date().toISOString() }],
    })
    .eq('id', package_id)
  
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }
  
  // 更新用户统计
  const { data: userData } = await supabase
    .from('users')
    .select('daily_helped, total_helped, credit_score')
    .eq('id', user.id)
    .single()
  
  if (userData) {
    await supabase
      .from('users')
      .update({
        daily_helped: userData.daily_helped + 1,
        total_helped: userData.total_helped + 1,
        credit_score: userData.credit_score + 1, // 每日互助+1分
      })
      .eq('id', user.id)
    
    // 记录信用历史
    await supabase
      .from('credit_history')
      .insert({
        user_id: user.id,
        type: 'ADD',
        amount: 1,
        reason: '每日互助',
        reason_code: 'DAILY_HELP',
        balance_before: userData.credit_score,
        balance_after: userData.credit_score + 1,
      })
  }
  
  return NextResponse.json({ success: true, help_count: newHelpCount })
}