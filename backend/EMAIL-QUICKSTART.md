# 邮箱验证系统快速启动指南

本文档确保 D&D 项目的邮箱验证系统能快速、正确地启动。

## 核心依赖

邮箱验证需要两个后端服务：

1. **Resend** - 发送验证邮件
2. **Postgres (Neon)** - 存储用户和验证码

## 快速启动步骤

### 1. 获取 Resend API Key

1. 访问 https://resend.com 注册账号
2. 进入 **API Keys** → 创建新 key（以 `re_` 开头）
3. 保存 key（不要分享给他人）

### 2. 获取 Neon 数据库连接

1. 访问 https://console.neon.tech
2. 选择你的项目 → **Branch** → **main**
3. 点击 **Connect** → 选择 **Pooled connection**
4. 复制连接字符串（以 `postgres://` 开头）

### 3. 部署到 Cloud Run

```bash
cd backend

gcloud run deploy dnd-gemini-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars \
    GEMINI_API_KEY=你的GeminiKey,\
    RESEND_API_KEY=re_xxx,\
    DATABASE_URL="postgres://...",\
    CLOUD_RUN_REGION=us-central1
```

### 4. 验证

```bash
curl -X POST https://你的服务url/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

返回 `{"ok":true,"verificationSent":true,"emailDelivery":"resend"}` 即成功。

## 环境变量清单

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `RESEND_API_KEY` | ✅ | Resend API Key (re_xxx) |
| `DATABASE_URL` | ✅ | Neon Postgres 连接字符串 |
| `GEMINI_API_KEY` | ✅ | Gemini AI Key |
| `CLOUD_RUN_REGION` | ✅ | us-central1 |
| `PORT` | - | 8080 (默认) |

## 本地开发

```bash
cd backend
cp .env.example .env
# 编辑 .env 填入上述变量
npm run dev
```

## 常见问题

**Q: 提示 "DATABASE_URL not configured"**
A: 需要配置 Neon Postgres，参考步骤 2。

**Q: 提示 "RESEND_API_KEY" 相关错误**
A: Resend API Key 未配置或已失效。

**Q: 邮件发不出去**
A: 
1. 检查 Resend 是否验证了域名（未验证域名只能发到自己账号邮箱）
2. 查看后端日志 `[EMAIL-FALLBACK]`

## 一键部署脚本

项目已提供 `deploy-cloud-run.sh`，可自动化部署：

```bash
PROJECT_ID=你的GCP项目 \
GEMINI_API_KEY=xxx \
RESEND_API_KEY=re_xxx \
DATABASE_URL="postgres://..." \
./deploy-cloud-run.sh
```
