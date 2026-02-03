-- 点点圈数据库 Schema

-- 创建用户表
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

-- 创建礼包表
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

-- 创建帮助记录表
CREATE TABLE help_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  helped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contract_fulfilled BOOLEAN DEFAULT false,
  contract_fulfilled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(package_id, helper_id)
);

-- 创建信用历史表
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

-- 创建索引
CREATE INDEX idx_packages_creator ON packages(creator_id);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_type ON packages(type);
CREATE INDEX idx_packages_created ON packages(created_at DESC);
CREATE INDEX idx_help_records_package ON help_records(package_id);
CREATE INDEX idx_help_records_helper ON help_records(helper_id);
CREATE INDEX idx_credit_history_user ON credit_history(user_id);
CREATE INDEX idx_credit_history_created ON credit_history(created_at DESC);

-- 创建触发器函数：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为用户表添加触发器
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为礼包表添加触发器
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;

-- 用户表策略
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- 礼包表策略
CREATE POLICY "Packages are viewable by everyone" ON packages
  FOR SELECT USING (true);

CREATE POLICY "Users can create packages" ON packages
  FOR INSERT WITH CHECK (auth.uid()::text = creator_id::text);

CREATE POLICY "Users can update own packages" ON packages
  FOR UPDATE USING (auth.uid()::text = creator_id::text);

CREATE POLICY "Users can delete own packages" ON packages
  FOR DELETE USING (auth.uid()::text = creator_id::text);

-- 帮助记录策略
CREATE POLICY "Help records are viewable by everyone" ON help_records
  FOR SELECT USING (true);

CREATE POLICY "Users can create help records" ON help_records
  FOR INSERT WITH CHECK (auth.uid()::text = helper_id::text);

-- 信用历史策略
CREATE POLICY "Users can view own credit history" ON credit_history
  FOR SELECT USING (auth.uid()::text = user_id::text);