import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json();

    // 验证手机号
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: '请输入正确的手机号' },
        { status: 400 }
      );
    }

    // 验证密码
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码至少6位' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 检查手机号是否已注册
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该手机号已注册' },
        { status: 400 }
      );
    }

    // 生成用户ID
    const userId = randomUUID();

    // 创建用户（直接存储明文密码，实际项目中应加密）
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        phone,
        password,
        nickname: `用户${phone.slice(-4)}`,
        role: 'user',
      });

    if (insertError) {
      console.error('创建用户失败:', insertError);
      return NextResponse.json(
        { success: false, error: '注册失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        id: userId,
        phone,
        nickname: `用户${phone.slice(-4)}`,
        role: 'user',
      }
    });

  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { success: false, error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
