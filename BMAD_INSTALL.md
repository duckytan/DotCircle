# BMad-Method 安装指南

## 📦 安装脚本

项目已提供以下安装脚本：

| 脚本 | 说明 | 使用方法 |
|------|------|----------|
| `install-bmad.bat` | 基础安装脚本 | 双击运行或 `call install-bmad.bat` |
| `install-bmad-auto.bat` | 自动化安装脚本 | 双击运行 |
| `install-bmad.ps1` | PowerShell 脚本 | `pwsh install-bmad.ps1` |

## 🚀 快速安装（推荐）

### 方法 1: 使用脚本（自动）

```bash
# CMD
install-bmad-auto.bat

# PowerShell
pwsh install-bmad.ps1
```

### 方法 2: 手动安装

```bash
cd D:\AI-Project\AI-DotCircle
npx bmad-method install
```

**安装提示：**
```
What would you like to do?
→ 输入 1 (Install BMAD Core)

How would you like to proceed?
→ 输入 1 (Backup and overwrite modified files)
```

## ✅ 安装验证

```bash
npx bmad-method status
```

## 🔧 使用 BMad

**安装完成后必须重启 Claude Code！**

然后运行：

```
/BMad:agents:bmad-orchestrator *help
```

## 📋 常用命令

| 命令 | 功能 |
|------|------|
| `/BMad:agents:bmad-orchestrator *help` | 工作流引导系统 |
| `/BMad:agents:*explore` | 代码探索代理 |
| `/BMad:agents:*architect` | 架构分析代理 |
| `/BMad:agents:*debug` | 调试助手 |
| `/BMad:agents:*test` | 测试生成 |

## 🐛 故障排除

### 问题: 安装卡住
**解决**: 按 `Ctrl+C` 中断，然后重新运行安装命令

### 问题: 命令未找到
**解决**:
1. 确保已重启 Claude Code
2. 检查 `_bmad` 目录是否存在

### 问题: 权限错误
**解决**: 以管理员身份运行终端

## 📚 更多信息

- BMad 文档: http://docs.bmad-method.org/
- GitHub: https://github.com/bmad-code-org/BMAD-METHOD/
