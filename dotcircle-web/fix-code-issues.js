/**
 * 代码质量自动修复脚本
 * 
 * 运行: node fix-code-issues.js
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 开始自动修复代码问题...\n')

// 1. 创建缺失的默认文件
function createDefaultFiles() {
  console.log('📄 创建缺失的默认文件...')

  // error.tsx
  const errorTsx = `'use client'

export default function Error({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }
  reset: () => void 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">😵</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">出错了</h2>
        <p className="text-gray-600 mb-6">{error.message || '发生未知错误'}</p>
        <button 
          onClick={reset}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  )
}
`

  // not-found.tsx
  const notFoundTsx = `import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">页面未找到</h2>
        <p className="text-gray-600 mb-6">抱歉，您访问的页面不存在</p>
        <Link 
          href="/"
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors inline-block"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
`

  // loading.tsx
  const loadingTsx = `export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>
  )
}
`

  const files = [
    { path: 'app/error.tsx', content: errorTsx },
    { path: 'app/not-found.tsx', content: notFoundTsx },
    { path: 'app/loading.tsx', content: loadingTsx },
  ]

  files.forEach(({ path: filePath, content }) => {
    const fullPath = path.join(__dirname, filePath)
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, content)
      console.log(`  ✅ 创建: ${filePath}`)
    } else {
      console.log(`  ⏭️  已存在: ${filePath}`)
    }
  })
}

// 2. 清理未使用的导入（简单检测）
function checkUnusedImports() {
  console.log('\n🔍 检查未使用的导入...')
  
  // 读取 settings 页面检查未使用的 toggle 属性
  const settingsPath = path.join(__dirname, 'app/(main)/settings/page.tsx')
  if (fs.existsSync(settingsPath)) {
    let content = fs.readFileSync(settingsPath, 'utf-8')
    
    // 检查是否有未使用的 toggle 属性
    if (content.includes('toggle: true') && !content.includes('item.toggle')) {
      console.log('  ⚠️  app/(main)/settings/page.tsx: menuItems 中定义了 toggle 但未使用')
    }
  }
}

// 3. 检查文件引用
function checkImports() {
  console.log('\n🔗 检查文件引用...')
  
  const criticalFiles = [
    'app/page.tsx',
    'app/my/page.tsx',
    'app/publish/page.tsx',
    'components/packages/package-card.tsx',
  ]
  
  criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      
      // 检查是否有 @/ 别名引用
      if (content.includes('@/')) {
        console.log(`  ✅ ${file}: 使用 @/ 别名引用`)
      }
      
      // 检查是否有相对路径引用问题
      const relativeParent = content.match(/from\s+['"]\.\.\/[^'"]+['"]/g)
      if (relativeParent) {
        console.log(`  ℹ️  ${file}: 使用相对路径引用 (${relativeParent.length} 处)`)
      }
    }
  })
}

// 4. 检查环境变量
function checkEnvFiles() {
  console.log('\n🔐 检查环境变量配置...')
  
  const envLocal = path.join(__dirname, '.env.local')
  const envExample = path.join(__dirname, '.env.example')
  
  if (fs.existsSync(envLocal)) {
    const content = fs.readFileSync(envLocal, 'utf-8')
    const hasSupabaseUrl = content.includes('SUPABASE_URL')
    const hasAnonKey = content.includes('SUPABASE_ANON_KEY')
    
    if (hasSupabaseUrl && hasAnonKey) {
      console.log('  ✅ .env.local: 已配置 Supabase')
    } else {
      console.log('  ❌ .env.local: 缺少 Supabase 配置')
    }
  } else {
    console.log('  ❌ .env.local: 文件不存在')
  }
  
  if (!fs.existsSync(envExample)) {
    console.log('  ⚠️  .env.example: 文件不存在（建议添加）')
  }
}

// 5. 检查必要的目录结构
function checkDirectoryStructure() {
  console.log('\n📁 检查目录结构...')
  
  const requiredDirs = [
    'app',
    'components',
    'lib',
    'types',
    'hooks',
    'supabase/migrations',
  ]
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir)
    if (fs.existsSync(dirPath)) {
      console.log(`  ✅ ${dir}/`)
    } else {
      console.log(`  ❌ ${dir}/: 目录缺失`)
    }
  })
}

// 主函数
function main() {
  console.log('='.repeat(60))
  console.log('点点圈 Web 版 - 代码质量修复脚本')
  console.log('='.repeat(60))
  
  try {
    createDefaultFiles()
    checkUnusedImports()
    checkImports()
    checkEnvFiles()
    checkDirectoryStructure()
    
    console.log('\n' + '='.repeat(60))
    console.log('✨ 检查完成！')
    console.log('='.repeat(60))
    console.log('\n📝 提示:')
    console.log('  1. 运行 npm install 安装依赖')
    console.log('  2. 运行 npm run dev 启动开发服务器')
    console.log('  3. 访问 http://localhost:3000 查看效果')
    console.log('\n📚 查看详细报告: CODE_REVIEW_REPORT.md')
    
  } catch (error) {
    console.error('\n❌ 修复过程出错:', error)
    process.exit(1)
  }
}

main()