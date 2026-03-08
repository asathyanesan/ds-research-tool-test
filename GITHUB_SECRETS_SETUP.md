# GitHub Secrets Setup Guide

This guide walks you through setting up GitHub Secrets for automated backend deployment.

## 🔐 Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### 1. Navigate to GitHub Secrets

1. Go to your repository: `https://github.com/asathyanesan/ds-research-tool-test`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### 2. Add These Secrets

#### Azure OpenAI Credentials

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `AZURE_OPENAI_ENDPOINT` | Your Azure OpenAI endpoint URL | `https://your-resource.openai.azure.com/` |
| `AZURE_OPENAI_API_KEY` | Your Azure OpenAI API key | `abc123...` (from Azure Portal) |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Your GPT deployment name | `gpt-51` |

**How to get these values:**
- Azure Portal → Your OpenAI Resource → **Keys and Endpoint**

#### Azure Web App Credentials

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `AZURE_WEBAPP_NAME` | Your Azure Web App name | The name you choose when creating the Web App |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Deployment credentials | Azure Portal → App Service → **Get publish profile** |

### 3. Create Azure Web App (One-Time Setup)

Before the GitHub Action can deploy, create an Azure Web App:

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name ds-research-rg --location eastus

# Create App Service plan (free tier for testing)
az appservice plan create \
  --name ds-research-plan \
  --resource-group ds-research-rg \
  --sku F1 \
  --is-linux

# Create Web App with Node.js runtime
az webapp create \
  --name YOUR-UNIQUE-APP-NAME \
  --resource-group ds-research-rg \
  --plan ds-research-plan \
  --runtime "NODE:18-lts"
```

**Important:** Replace `YOUR-UNIQUE-APP-NAME` with a globally unique name (e.g., `ds-research-backend-yourname`)

### 4. Download Publish Profile

1. Go to Azure Portal
2. Navigate to your App Service
3. Click **Get publish profile** (top toolbar)
4. Download the `.publishsettings` file
5. Open it in a text editor and copy the **entire contents**
6. Add as `AZURE_WEBAPP_PUBLISH_PROFILE` secret in GitHub

### 5. Update Frontend to Use Production Backend

After deployment, update your frontend to call the production backend URL:

**Option A: Environment Variable (Recommended)**

Create `react-app/.env.production`:
```env
VITE_BACKEND_URL=https://YOUR-UNIQUE-APP-NAME.azurewebsites.net
```

Update [App.jsx](react-app/src/App.jsx):
```javascript
const backendUrl = import.meta.env.DEV 
  ? '/api/chat'  // Vite proxy in dev mode
  : `${import.meta.env.VITE_BACKEND_URL}/api/chat`;  // Production backend
```

**Option B: Direct URL**

Update [App.jsx](react-app/src/App.jsx) line ~226:
```javascript
const backendUrl = import.meta.env.DEV 
  ? '/api/chat'
  : 'https://YOUR-UNIQUE-APP-NAME.azurewebsites.net/api/chat';
```

## 🚀 Deployment Workflow

Once configured, deployment is automatic:

1. **Push to main branch** with backend changes
2. GitHub Actions triggers automatically
3. Backend deploys to Azure Web App
4. Environment variables set from GitHub Secrets
5. Your app is live! 🎉

**Manual trigger:**
- Go to **Actions** tab → **Deploy Backend to Azure** → **Run workflow**

## ✅ Verify Deployment

After deployment completes:

```bash
# Test health endpoint
curl https://YOUR-UNIQUE-APP-NAME.azurewebsites.net/health

# Should return:
{
  "status": "healthy",
  "timestamp": "2026-03-05T...",
  "service": "DS Research Assistant Backend",
  "version": "1.0.0"
}
```

## 🔒 Security Best Practices

- ✅ Never commit secrets to git
- ✅ Use GitHub Secrets for CI/CD only
- ✅ Rotate API keys periodically
- ✅ Set `ALLOWED_ORIGINS` to your exact frontend URL
- ✅ Enable HTTPS only in production
- ✅ Monitor Azure costs and set budget alerts

## 📊 GitHub Secrets Summary

After setup, you should have these 5 secrets:

1. ✓ `AZURE_OPENAI_ENDPOINT`
2. ✓ `AZURE_OPENAI_API_KEY`
3. ✓ `AZURE_OPENAI_DEPLOYMENT_NAME`
4. ✓ `AZURE_WEBAPP_NAME`
5. ✓ `AZURE_WEBAPP_PUBLISH_PROFILE`

## 🐛 Troubleshooting

### Deployment fails with "Web App not found"
- Verify `AZURE_WEBAPP_NAME` secret matches your actual Web App name
- Check that the Web App exists in Azure Portal

### "Unauthorized" errors in production
- Check that GitHub Secrets match your Azure OpenAI credentials
- Verify secrets don't have trailing spaces or quotes

### CORS errors in production
- Verify `ALLOWED_ORIGINS` includes your GitHub Pages URL
- Check browser console for exact origin being blocked

### Backend works locally but not in production
- Check Azure Web App logs: Azure Portal → App Service → Log stream
- Verify all environment variables are set in App Service Configuration

## 📚 Additional Resources

- [Azure Web Apps Documentation](https://learn.microsoft.com/azure/app-service/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Azure CLI Reference](https://learn.microsoft.com/cli/azure/)

---

**Need Help?** Check the GitHub Actions logs in the **Actions** tab of your repository.
