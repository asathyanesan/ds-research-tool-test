# GitHub Push & Secrets Setup Guide

## Part 1: Authenticating & Pushing to GitHub

### Option A: Using Personal Access Token (Recommended)

1. **Create a Personal Access Token**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Give it a name: `DS Research Tool Push Access`
   - Select scopes:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Push using the token**
   ```powershell
   # Method 1: Add token to URL (one-time push)
   git push https://<YOUR_TOKEN>@github.com/asathyanesan/ds-research-tool-test.git main
   
   # Method 2: Use Git Credential Manager (saves for future)
   git push origin main
   # When prompted, enter:
   # Username: asathyanesan
   # Password: <paste your token>
   ```

### Option B: Using GitHub CLI (Easiest)

1. **Install GitHub CLI** (if not already installed)
   ```powershell
   winget install --id GitHub.cli
   ```

2. **Authenticate**
   ```powershell
   gh auth login
   # Select: GitHub.com
   # Select: HTTPS
   # Authenticate with web browser: Y
   # Follow the browser prompts
   ```

3. **Push**
   ```powershell
   git push origin main
   ```

### Option C: Using SSH Keys

1. **Generate SSH key** (if you don't have one)
   ```powershell
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Press Enter to accept default location
   # Enter passphrase (optional)
   ```

2. **Add SSH key to GitHub**
   ```powershell
   # Copy the public key
   Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
   ```
   - Go to https://github.com/settings/keys
   - Click "New SSH key"
   - Paste the key and save

3. **Update remote URL**
   ```powershell
   git remote set-url origin git@github.com:asathyanesan/ds-research-tool-test.git
   ```

4. **Push**
   ```powershell
   git push origin main
   ```

---

## Part 2: Setting Up GitHub Secrets

GitHub Secrets allow you to securely store API keys and credentials for GitHub Actions.

### Step-by-Step: Adding Secrets to GitHub

1. **Navigate to Repository Settings**
   - Go to: https://github.com/asathyanesan/ds-research-tool-test
   - Click **"Settings"** tab (top right)
   - Look for **"Secrets and variables"** in the left sidebar
   - Click **"Actions"**

2. **Add Each Secret**

   Click **"New repository secret"** for each of the following:

#### Required Secrets for Backend Deployment

| Secret Name | Where to Get It | Example Value |
|-------------|-----------------|---------------|
| `AZURE_OPENAI_ENDPOINT` | Azure Portal → Your OpenAI Resource → Keys and Endpoint | `https://your-name.openai.azure.com/` |
| `AZURE_OPENAI_API_KEY` | Azure Portal → Your OpenAI Resource → Keys and Endpoint | `abc123def456...` |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Azure OpenAI Studio → Deployments | `gpt-51` or your deployment name |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | Azure OpenAI Studio → Deployments | `text-embedding-ada-002` |
| `AZURE_OPENAI_API_VERSION` | Use the latest stable version | `2025-04-01-preview` |
| `NCBI_API_KEY` | NCBI E-utilities (optional but recommended) | Create at: https://www.ncbi.nlm.nih.gov/account/settings/ |

#### Optional Secrets

| Secret Name | Purpose | Example |
|-------------|---------|---------|
| `ALLOWED_ORIGINS` | CORS configuration | `https://asathyanesan.github.io,http://localhost:5173` |
| `PORT` | Backend port | `3001` |

### Detailed Steps for Each Secret

#### Example: Adding AZURE_OPENAI_ENDPOINT

1. Click **"New repository secret"**
2. **Name**: `AZURE_OPENAI_ENDPOINT`
3. **Secret**: Paste your endpoint URL (e.g., `https://your-name.openai.azure.com/`)
4. Click **"Add secret"**

Repeat for all other secrets listed above.

### Finding Your Azure OpenAI Credentials

1. **Log into Azure Portal**
   - Go to: https://portal.azure.com

2. **Navigate to Your OpenAI Resource**
   - Search for "Azure OpenAI" in the top search bar
   - Select your OpenAI resource

3. **Get Endpoint and Key**
   - Click **"Keys and Endpoint"** in the left sidebar
   - Copy:
     - **Endpoint**: `https://your-name.openai.azure.com/`
     - **KEY 1** or **KEY 2**: Use either key

4. **Get Deployment Names**
   - Click **"Go to Azure OpenAI Studio"** button
   - Click **"Deployments"** in the left sidebar
   - Note your deployment names:
     - GPT model deployment (e.g., `gpt-51`, `gpt-4`)
     - Embedding model deployment (e.g., `text-embedding-ada-002`)

### Creating NCBI API Key (Optional but Recommended)

1. **Create NCBI Account**
   - Go to: https://www.ncbi.nlm.nih.gov/account/
   - Sign up or log in

2. **Generate API Key**
   - Go to Account Settings: https://www.ncbi.nlm.nih.gov/account/settings/
   - Scroll to "API Key Management"
   - Click "Create an API Key"
   - Copy the key

3. **Why Use It?**
   - Increases rate limit from 3 to 10 requests/second
   - Better for production use with multiple users

### Verifying Secrets Are Set

After adding all secrets, you should see them listed (values hidden for security):

```
✓ AZURE_OPENAI_ENDPOINT
✓ AZURE_OPENAI_API_KEY
✓ AZURE_OPENAI_DEPLOYMENT_NAME
✓ AZURE_OPENAI_EMBEDDING_DEPLOYMENT
✓ AZURE_OPENAI_API_VERSION
✓ NCBI_API_KEY
```

---

## Part 3: Testing the Deployment

### After Pushing to GitHub

1. **Check GitHub Actions**
   - Go to: https://github.com/asathyanesan/ds-research-tool-test/actions
   - You should see a workflow running (if you have `.github/workflows/` configured)
   - Click on the workflow to see logs

2. **Test Backend Endpoint** (if deployed)
   ```powershell
   # Replace with your actual deployment URL
   curl https://your-backend-url.azurewebsites.net/health
   ```

3. **Test Frontend** (if using GitHub Pages)
   - Go to: https://asathyanesan.github.io/ds-research-tool-test/
   - Test the application

### Local Testing After Pull

If someone else clones the repository:

1. **Clone the repository**
   ```powershell
   git clone https://github.com/asathyanesan/ds-research-tool-test.git
   cd ds-research-tool-test
   ```

2. **Create local .env files**
   ```powershell
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your credentials
   
   # Frontend
   cd ../react-app
   cp .env.production .env.local
   # Edit if needed
   ```

3. **Install and run**
   ```powershell
   # Backend
   cd backend
   npm install
   node server.js
   
   # Frontend (in new terminal)
   cd react-app
   npm install
   npm run dev
   ```

---

## Security Best Practices

### ✅ DO:
- Store all API keys in GitHub Secrets
- Use `.env` files locally (never commit them)
- Add `.env` to `.gitignore`
- Use `.env.example` as a template (no real values)
- Rotate API keys periodically
- Use separate keys for dev/staging/production

### ❌ DON'T:
- Commit `.env` files with real credentials
- Share API keys in code, comments, or documentation
- Use production keys in development
- Store secrets in repository files

---

## Troubleshooting

### Push Failed: "Permission denied"
- **Solution**: Follow Part 1 to authenticate with GitHub
- Make sure you're using the correct GitHub account

### Secrets Not Working in Actions
- **Solution**: Check secret names match exactly (case-sensitive)
- Verify the workflow YAML references correct secret names
- Check workflow logs for specific error messages

### NCBI Rate Limiting (429 errors)
- **Solution**: Add NCBI_API_KEY to secrets
- Implement caching for frequently accessed papers
- Add delays between requests if needed

### Azure OpenAI 401 Unauthorized
- **Solution**: Verify endpoint URL has trailing `/`
- Check API key is correct (no extra spaces)
- Ensure deployment names match exactly

---

## Current Configuration Summary

Your repository now includes:

### ✅ Code Enhancements
- Semantic content verification with embeddings
- Hybrid keyword (40%) + semantic (60%) scoring
- Graceful fallback to keyword-only mode
- UI display of semantic scores

### ✅ Documentation
- `SEMANTIC-VERIFICATION.md` - Content verification guide
- `FALLBACK-SYSTEM.md` - System architecture
- `HUGGINGFACE-DEPRECATION.md` - Deprecation notes
- `QUICKSTART.md` - Quick start guide
- `.env.example` - Configuration template

### ✅ Test Suite
- `test-content-verification.js` - Keyword testing
- `test-semantic-verification.js` - Embedding testing

### 📊 Test Results
- **Wrong citation detection**: 5% match (correctly flagged)
- **Correct citation**: 36% keyword match (above threshold)
- **Semantic scores**: 0% (fallback mode - works as designed)

---

## Next Steps

1. **Authenticate with GitHub** (Part 1)
2. **Push the code** (`git push origin main`)
3. **Add GitHub Secrets** (Part 2)
4. **Configure Azure Embedding Deployment** (if you want semantic scores >0%)
5. **Test the deployment**

Once pushed, users can:
- Use keyword-only verification (works now)
- Add embedding deployment for enhanced semantic matching
- Deploy to Azure/GitHub Pages
- Share the repository with collaborators
