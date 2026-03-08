# 🚀 Azure OpenAI Integration - Quick Start Guide

## ✅ Implementation Complete!

Your DS Research Assistant now uses Azure OpenAI (GPT-5.1) via a secure backend proxy.

## 📋 Next Steps

### 1. Configure Azure OpenAI Credentials (Local Development)

Edit `backend/.env` and replace the placeholder values:

```bash
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE-NAME.openai.azure.com/
AZURE_OPENAI_API_KEY=YOUR-API-KEY-FROM-AZURE-PORTAL
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-51  # Or your deployment name
```

**Where to find these values:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Azure OpenAI resource
3. Click "Keys and Endpoint" in the left sidebar
4. Copy:
   - **Endpoint URL** → `AZURE_OPENAI_ENDPOINT`
   - **Key 1 or Key 2** → `AZURE_OPENAI_API_KEY`
5. For deployment name, go to Azure OpenAI Studio → Deployments
   - Use the name of your GPT-5.1 deployment

**⚠️ This is for local development only!** For production, see [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)

### 2. Start the Backend Server

```bash
cd backend
npm start
```

You should see:
```
🚀 DS Research Assistant Backend running on port 3001
📍 Health check: http://localhost:3001/health
💬 Chat endpoint: http://localhost:3001/api/chat
✅ Azure OpenAI configuration validated
```

**Leave this terminal running!**

### 3. Start the Frontend (in a new terminal)

```bash
cd react-app
npm install  # If you haven't already
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 4. Test the Integration

1. Open [http://localhost:5173](http://localhost:5173)
2. Click the **"AI Assistant"** tab
3. Ask a question like: "What are the main phenotypes of Ts65Dn mice?"
4. You should get a response from Azure OpenAI (GPT-5.1)

## 🔧 Troubleshooting

### Backend won't start
- Check that port 3001 is available
- Verify all environment variables in `backend/.env` are set correctly
- Check for typos in Azure endpoint URL (must end with `/`)

### Frontend can't connect to backend
- Make sure backend is running on port 3001
- Check browser console (F12) for errors
- Verify Vite proxy is configured (already done in `vite.config.js`)

### Azure OpenAI errors
- **401 Unauthorized**: Check your API key is correct
- **404 Not Found**: Verify deployment name matches your Azure deployment
- **429 Rate Limit**: Wait a moment and try again (quota exceeded)

### Fallback behavior
If the backend is unavailable, the app automatically falls back to:
1. HuggingFace API (if configured)
2. Mock responses with DS research knowledge

## 📊 What Changed

### New Files Created:
- ✅ `backend/server.js` - Express server with API proxy
- ✅ `backend/services/azureOpenAI.js` - Azure OpenAI integration
- ✅ `backend/package.json` - Backend dependencies
- ✅ `backend/.env` - Your Azure credentials (gitignored)
- ✅ `backend/.env.example` - Environment template
- ✅ `.gitignore` - Protects sensitive files

### Modified Files:
- ✅ `react-app/src/App.jsx` - Updated `handleChat()` to call backend
- ✅ `react-app/vite.config.js` - Added proxy for `/api/*` requests
- ✅ `README.md` - Added setup and deployment instructions

### Removed:
- ❌ Perplexity API integration (replaced with Azure OpenAI)
- ✅ HuggingFace kept as fallback option

## 🎯 Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────────┐
│  React Frontend │ ──────► │  Express Backend│ ──────► │  Azure OpenAI    │
│  (port 5173)    │  /api   │  (port 3001)    │  HTTPS  │  API             │
│                 │ ◄────── │                 │ ◄────── │  (GPT-5.1)       │
└─────────────────┘         └─────────────────┘         └──────────────────┘
     │                             │
     │                             │
     └─────────Vite Proxy──────────┘
         (development only)
```

**Security**: API keys stored in backend `.env`, never exposed to browser

## 🌐 Production Deployment

When ready to deploy:

1. **Frontend**: Already configured for GitHub Pages (auto-deploys on push to main)
2. **Backend**: Deploys to Azure Web App via GitHub Actions
   - **Setup Guide**: See [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) for complete instructions
   - **Required**: Add 5 GitHub Secrets (Azure credentials + Web App details)
   - **Automatic**: Deploys on push to main when backend files change
   - **Update**: Edit `react-app/.env.production` with your Azure Web App URL

### Quick Production Setup Checklist

- [ ] Create Azure Web App (one-time)
- [ ] Add 5 GitHub Secrets (see [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md))
- [ ] Update `react-app/.env.production` with your Web App name
- [ ] Push to main → GitHub Actions deploys backend automatically
- [ ] Verify: `curl https://YOUR-APP.azurewebsites.net/health`

## 📚 Additional Resources

- [Azure OpenAI Documentation](https://learn.microsoft.com/azure/ai-services/openai/)
- [Express.js Documentation](https://expressjs.com/)
- [Vite Proxy Configuration](https://vitejs.dev/config/server-options.html#server-proxy)

## 💡 Tips

- Monitor Azure OpenAI usage in Azure Portal to track costs
- Adjust `temperature` in `backend/services/azureOpenAI.js` for different response styles
- Add rate limiting for production (see `backend/server.js` comments)
- Consider implementing response streaming for better UX

---

**Need help?** Check the console logs in:
- Backend: Terminal where `npm start` is running
- Frontend: Browser DevTools (F12) → Console tab
