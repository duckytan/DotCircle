# 点点圈 Web 部署指南

## 🚀 快速开始

### 1. 安装依赖

```bash
cd dotcircle-web
npm install
```

### 2. 配置环境变量

已自动配置 `.env.local` 文件：
- Supabase URL: https://fwyuwmtnjkntlreixvin.supabase.co
- Supabase Anon Key: sb_publishable_FOKjE6UkLeM1DU0ly452qw_X3T1Ovaf
- Supabase Service Role Key: sb_secret_pS-iLXL4CQpa_bpNu1ac6w_1mc7FT13

### 3. 设置 Supabase 数据库

访问 Supabase 控制台: https://fwyuwmtnjkntlreixvin.supabase.co/project/default

执行以下 SQL:

```sql
-- 1. 创建用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  nick_name TEXT NOT NULL DEFAULT '用户',
  avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  credit_score INTEGER DEFAULT 60,
  credit_level TEXT DEFAULT 'NORMAL',
  daily_helped INTEGER DEFAULT 0,
  daily_published INTEGER DEFAULT 0,
  daily_quota INTEGER DEFAULT 2,
  total_helped INTEGER DEFAULT 0,
  total_published INTEGER DEFAULT 0,
  total_received INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建礼包表
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('LINK', 'IMAGE')),
  gift_url TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'pending')),
  help_count INTEGER DEFAULT 0,
  max_help INTEGER DEFAULT 10,
  helpers JSONB DEFAULT '[]',
  exposure_score INTEGER DEFAULT 50,
  contract_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建帮助记录表
CREATE TABLE help_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  helped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contract_fulfilled BOOLEAN DEFAULT false,
  contract_fulfilled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(package_id, helper_id)
);

-- 4. 创建信用历史表
CREATE TABLE credit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ADD', 'DEDUCT')),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reason_code TEXT,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;

-- 6. 创建策略（允许匿名访问用于演示）
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON packages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON help_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON credit_history FOR ALL USING (true) WITH CHECK (true);

-- 7. 创建存储桶用于图片上传
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- 8. 允许图片存储访问
CREATE POLICY "Allow public access" ON storage.objects FOR ALL USING (bucket_id = 'images');
```

在 Supabase Dashboard 执行：
1. 进入 SQL Editor
2. 粘贴上述 SQL
3. 点击 Run

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

---

## 📦 部署到 Vercel

### 方法 1: 通过 Vercel CLI

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 设置环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 5. 重新部署
vercel --prod
```

### 方法 2: 通过 GitHub

1. 推送代码到 GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/dotcircle-web.git
git push -u origin main
```

2. 在 Vercel 导入项目
- 访问 vercel.com
- 点击 "Add New Project"
- 选择 GitHub 仓库
- 点击 Deploy

3. 配置环境变量
在 Vercel Project Settings → Environment Variables 中添加：
- `NEXT_PUBLIC_SUPABASE_URL`: https://fwyuwmtnjkntlreixvin.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: sb_publishable_FOKjE6UkLeM1DU0ly452qw_X3T1Ovaf
- `SUPABASE_SERVICE_ROLE_KEY`: sb_secret_pS-iLXL4CQpa_bpNu1ac6w_1mc7FT13

4. 重新部署

---

## 🔧 项目结构

```
dotcircle-web/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首页
│   ├── publish/           # 发布页
│   ├── my/                # 个人中心
│   ├── leaderboard/       # 排行榜
│   ├── rules/             # 规则
│   └── api/               # API 路由
├── components/            # React 组件
├── lib/                   # 工具函数
├── types/                 # TypeScript 类型
└── supabase/             # 数据库迁移
```

---

## 📱 功能清单

### 已实现
- ✅ 响应式 UI 设计
- ✅ 礼包列表展示
- ✅ 类型筛选
- ✅ 礼包发布（链接/图片）
- ✅ 用户中心
- ✅ 排行榜
- ✅ Supabase 数据库连接

### 待完善
- ⚠️ 用户认证系统
- ⚠️ 信用分完整逻辑
- ⚠️ 排行榜实时计算
- ⚠️ 图片上传优化
- ⚠️ 实时通知

---

## 💰 成本

- **Vercel**: $0 (Hobby Plan)
- **Supabase**: $0 (Free Tier)
- **总计**: $0/月

---

## 🆘 故障排除

### 问题 1: "无法连接数据库"
- 检查 `.env.local` 文件是否存在且配置正确
- 确认 Supabase 项目是否运行中

### 问题 2: "RLS 错误"
- 在 Supabase SQL Editor 中重新执行 RLS 策略

### 问题 3: "图片上传失败"
- 检查 storage 桶是否创建
- 检查 storage 策略是否正确

---

## 📞 联系方式

遇到问题？查看：
- Supabase 文档: https://supabase.com/docs
- Next.js 文档: https://nextjs.org/docs
- Vercel 文档: https://vercel.com/docs

---

**🎉 准备就绪，开始部署吧！**