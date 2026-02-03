# 点点圈 Web 版 - Vercel 部署最终检查清单

## ✅ 已完成

- [x] 项目代码开发完成
- [x] Supabase 数据库配置完成
- [x] 环境变量配置完成
- [x] 代码审查通过

---

## 🔴 部署前必须完成的 3 个步骤

### 步骤 1: 在 Supabase 执行数据库迁移（⚠️ 必须在步骤2之前！）

**登录 Supabase Dashboard:**
```
https://fwyuwmtnjkntlreixvin.supabase.co/project/default
```

**执行 SQL:**
1. 点击左侧菜单 **"SQL Editor"**
2. 点击 **"New query"**
3. 复制以下 SQL 并粘贴:

```sql
-- ===========================================
-- 点点圈数据库初始化 SQL
-- 必须在部署前执行！
-- ===========================================

-- 1. 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
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

-- 3. 创建礼包表
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 4. 创建帮助记录表
CREATE TABLE IF NOT EXISTS help_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  helped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contract_fulfilled BOOLEAN DEFAULT false,
  contract_fulfilled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(package_id, helper_id)
);

-- 5. 创建信用历史表
CREATE TABLE IF NOT EXISTS credit_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ADD', 'DEDUCT')),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reason_code TEXT,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 创建索引
CREATE INDEX IF NOT EXISTS idx_packages_creator ON packages(creator_id);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_type ON packages(type);
CREATE INDEX IF NOT EXISTS idx_packages_created ON packages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_help_records_package ON help_records(package_id);
CREATE INDEX IF NOT EXISTS idx_help_records_helper ON help_records(helper_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_user ON credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_created ON credit_history(created_at DESC);

-- 7. 启用 RLS (行级安全)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;

-- 8. 创建 RLS 策略 (允许匿名访问用于演示)
DROP POLICY IF EXISTS "Allow all" ON users;
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON packages;
CREATE POLICY "Allow all" ON packages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON help_records;
CREATE POLICY "Allow all" ON help_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON credit_history;
CREATE POLICY "Allow all" ON credit_history FOR ALL USING (true) WITH CHECK (true);

-- 9. 创建存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true) 
ON CONFLICT (id) DO NOTHING;

-- 10. 允许图片存储访问
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
CREATE POLICY "Allow public access" 
ON storage.objects FOR ALL 
USING (bucket_id = 'images');

-- 11. 创建触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. 为用户表添加触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 13. 为礼包表添加触发器
DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 初始化完成！
-- ===========================================
```

4. 点击 **"Run"** 按钮执行

**✅ 验证成功:**
- 看到 "Success. No rows returned" 表示成功
- 在左侧 **"Table Editor"** 应该能看到新创建的表

---

### 步骤 2: 本地测试运行

**打开命令行，进入项目目录:**
```bash
cd dotcircle-web

# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

**测试清单:**
- [ ] 访问 http://localhost:3000 首页正常显示
- [ ] 点击 "我的" 能看到个人中心
- [ ] 访问 http://localhost:3000/login 登录页面正常
- [ ] 访问 http://localhost:3000/register 注册页面正常
- [ ] 没有红色错误提示

**停止测试:**
按 `Ctrl + C` 停止服务器

---

### 步骤 3: 部署到 Vercel

**方法 A: 使用 Vercel CLI（推荐）**

```bash
# 1. 安装 Vercel CLI（如未安装）
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署（在项目根目录 dotcircle-web/ 下执行）
cd dotcircle-web
vercel

# 4. 配置环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
# 输入: https://fwyuwmtnjkntlreixvin.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# 输入: sb_publishable_FOKjE6UkLeM1DU0ly452qw_X3T1Ovaf

vercel env add SUPABASE_SERVICE_ROLE_KEY
# 输入: sb_secret_pS-iLXL4CQpa_bpNu1ac6w_1mc7FT13

# 5. 重新部署
vercel --prod
```

**方法 B: 使用 GitHub + Vercel Web 界面**

1. **推送代码到 GitHub**
```bash
# 在项目根目录 AI-DotCircle/ 下执行
git add dotcircle-web/
git commit -m "feat: 完整的 Next.js + Supabase Web 版本"
git push origin master
```

2. **登录 Vercel**
- 访问 https://vercel.com
- 点击 "Add New Project"
- 选择 GitHub 仓库

3. **配置项目**
- **Framework Preset**: Next.js
- **Root Directory**: `dotcircle-web` ⚠️ 必须设置为这个！
- 点击 "Deploy"

4. **添加环境变量**
在 Vercel Dashboard → Project Settings → Environment Variables 中添加:

| 变量名 | 值 |
|--------|-----|
| NEXT_PUBLIC_SUPABASE_URL | https://fwyuwmtnjkntlreixvin.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | sb_publishable_FOKjE6UkLeM1DU0ly452qw_X3T1Ovaf |
| SUPABASE_SERVICE_ROLE_KEY | sb_secret_pS-iLXL4CQpa_bpNu1ac6w_1mc7FT13 |

5. **重新部署**
- 在 Vercel Dashboard 点击 "Redeploy"

---

## 🎉 部署成功验证

**访问你的 Vercel 域名:**
```
https://你的项目名称.vercel.app
```

**验证清单:**
- [ ] 首页正常加载
- [ ] 可以注册新账号
- [ ] 可以登录
- [ ] 可以发布礼包
- [ ] 可以查看排行榜
- [ ] 移动端显示正常

---

## 🐛 常见问题

### 问题 1: "Build Failed" 或 "Module not found"
**解决**: 
```bash
cd dotcircle-web
rm -rf node_modules package-lock.json
npm install
```

### 问题 2: "Cannot find module '@/components/xxx'"
**解决**: 检查 `tsconfig.json` 中的 paths 配置:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 问题 3: "Error: Invalid Supabase URL"
**解决**: 检查环境变量是否正确设置

### 问题 4: 数据库连接失败
**解决**: 
1. 确认 SQL 已执行
2. 检查 Supabase 项目是否运行中
3. 检查网络连接

---

## 📞 需要帮助？

如果部署遇到问题:
1. 检查 Vercel 部署日志
2. 查看浏览器控制台错误
3. 检查 Supabase 数据库状态

**成功部署后，告诉我你的 Vercel 域名！** 🎊