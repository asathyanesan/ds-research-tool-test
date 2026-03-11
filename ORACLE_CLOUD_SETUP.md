# Oracle Cloud Always Free Setup Guide

This guide will help you deploy your DS Research Tool backend to Oracle Cloud's Always Free tier.

## Prerequisites
- GitHub account (you have this)
- Email address for Oracle Cloud account
- Your Azure OpenAI credentials (you have these)

---

## Step 1: Create Oracle Cloud Account

1. Go to: https://www.oracle.com/cloud/free/
2. Click "Start for free"
3. Fill in:
   - Email address
   - Country: United States
   - Cloud Account Name (choose any name, e.g., "ds-research")
4. **Choose Region: US East (Ashburn)** ← Important! Closest to your Azure
5. Complete verification (phone/email)
6. **Skip credit card** - it's optional for Always Free tier

---

## Step 2: Create a Compute Instance (VM)

1. Log in to Oracle Cloud Console: https://cloud.oracle.com
2. Click **hamburger menu (☰)** → **Compute** → **Instances**
3. Click **"Create Instance"**

### Instance Configuration:
- **Name**: `ds-research-backend`
- **Compartment**: (root) - leave default
- **Placement**: Leave default (Availability Domain AD-1)

### Image and Shape:
- **Image**: Click "Change Image"
  - Select **"Canonical Ubuntu 22.04"** (recommended)
  - Click "Select Image"
  
- **Shape**: Click "Change Shape"
  - Select **"Ampere"** (ARM-based)
  - Click **"VM.Standard.A1.Flex"**
  - Set OCPUs: **4** (maximum free)
  - Set Memory: **24 GB** (maximum free)
  - Click "Select Shape"

### Networking:
- **Virtual Cloud Network**: Leave "Create new virtual cloud network"
- **Subnet**: Leave "Create new public subnet"
- **Public IP**: Select **"Assign a public IPv4 address"** ← Critical!

### SSH Keys:
- Select **"Generate a key pair for me"**
- Click **"Save Private Key"** → Save as `oracle-ssh-key.key`
- Click **"Save Public Key"** → Save as `oracle-ssh-key.pub`
- **IMPORTANT**: Store these safely! You'll need them to access your server

### Boot Volume:
- Leave default (47-50 GB is fine)

4. Click **"Create"** at the bottom

**Wait 2-3 minutes** for the instance to provision. Status will change from "PROVISIONING" to "RUNNING" (green).

---

## Step 3: Configure Firewall (Security List)

Your instance is running but ports are blocked. Let's open them:

1. On your instance page, under **"Instance Details"**:
   - Find **"Primary VNIC"** section
   - Click the **Subnet name** (e.g., "subnet-...")
   
2. Under **"Security Lists"**, click the security list name (e.g., "Default Security List...")

3. Click **"Add Ingress Rules"**

4. Add Rule #1 (HTTP):
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: TCP
   - **Destination Port Range**: `80`
   - **Description**: `HTTP traffic`
   - Click **"Add Ingress Rules"**

5. Click **"Add Ingress Rules"** again

6. Add Rule #2 (HTTPS):
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: TCP
   - **Destination Port Range**: `443`
   - **Description**: `HTTPS traffic`
   - Click **"Add Ingress Rules"**

7. Click **"Add Ingress Rules"** again

8. Add Rule #3 (Backend API):
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: TCP
   - **Destination Port Range**: `3003`
   - **Description**: `Backend API`
   - Click **"Add Ingress Rules"**

---

## Step 4: Connect to Your Instance

### Copy Your Public IP:
1. Go back to **Compute** → **Instances**
2. Find your public IP address (e.g., `123.45.67.89`)
3. **Copy this IP** - you'll need it throughout

### Connect via SSH:

**Windows (PowerShell):**
```powershell
# Navigate to where you saved the SSH key
cd C:\Users\YourUsername\Downloads

# Set correct permissions (Windows)
icacls oracle-ssh-key.key /inheritance:r
icacls oracle-ssh-key.key /grant:r "$($env:USERNAME):(R)"

# Connect (replace with YOUR public IP)
ssh -i oracle-ssh-key.key ubuntu@YOUR_PUBLIC_IP
```

**First connection will ask**: `Are you sure you want to continue connecting?`
- Type: `yes` and press Enter

You should now see: `ubuntu@ds-research-backend:~$`

---

## Step 5: Install Node.js and Dependencies

**Copy and paste these commands** (one block at a time):

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Verify installations
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
pm2 --version   # Should show 5.x.x
```

---

## Step 6: Clone and Setup Your Backend

```bash
# Clone your repository
git clone https://github.com/asathyanesan/ds-research-tool-test.git
cd ds-research-tool-test/backend

# Install dependencies
npm install

# Create .env file
nano .env
```

**Paste this content** (press `Ctrl+Shift+V` to paste in terminal):

```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://apim-n1ai-use2-flyer.azure-api.net/
AZURE_OPENAI_API_KEY=385f01a292c24c888ad849e3f9465be8
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-5.1
AZURE_OPENAI_API_VERSION=2025-04-01-preview

# Server Configuration
PORT=3003
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,https://asathyanesan.github.io

# NCBI API Configuration
NCBI_API_KEY=aec8233c969aebce9f7689d47d00d1967508
```

**Save the file:**
- Press `Ctrl+X`
- Press `Y`
- Press `Enter`

---

## Step 7: Configure Ubuntu Firewall

```bash
# Allow necessary ports
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow 3003/tcp comment 'Backend API'

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

---

## Step 8: Start the Backend with PM2

```bash
# Make sure you're in the backend directory
cd ~/ds-research-tool-test/backend

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it outputs (starts with 'sudo env...')

# Check status
pm2 status
```

You should see:
```
┌─────┬────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name           │ mode        │ status  │ cpu     │ memory   │
├─────┼────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ ds-research    │ fork        │ online  │ 0%      │ 50.0mb   │
└─────┴────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

---

## Step 9: Test Your Backend

```bash
# Test health endpoint
curl http://localhost:3003/health

# Should return: {"status":"healthy","message":"DS Research Assistant Backend is running"}
```

**Test from your Windows machine:**
```powershell
# Replace YOUR_PUBLIC_IP with your actual IP
Invoke-WebRequest -Uri "http://YOUR_PUBLIC_IP:3003/health" -UseBasicParsing
```

---

## Step 10: Update Frontend to Use Oracle Backend

1. Go to your GitHub repository settings:
   - https://github.com/asathyanesan/ds-research-tool-test/settings/secrets/actions

2. Click **"New repository secret"**

3. Add secret:
   - **Name**: `VITE_BACKEND_URL`
   - **Value**: `http://YOUR_PUBLIC_IP:3003` (replace with your actual IP)
   - Click **"Add secret"**

4. The next time you push code, GitHub Actions will automatically deploy with the new backend URL.

---

## Useful PM2 Commands

```bash
# View logs
pm2 logs

# Restart backend
pm2 restart ds-research

# Stop backend
pm2 stop ds-research

# Monitor in real-time
pm2 monit

# View detailed info
pm2 info ds-research
```

---

## Troubleshooting

### Backend not responding:
```bash
# Check if PM2 is running
pm2 status

# Check logs for errors
pm2 logs ds-research --lines 50

# Restart if needed
pm2 restart ds-research
```

### Port still blocked:
```bash
# Check Ubuntu firewall
sudo ufw status

# Check if port is listening
sudo netstat -tlnp | grep 3003
```

### Update backend code:
```bash
cd ~/ds-research-tool-test
git pull
cd backend
npm install
pm2 restart ds-research
```

---

## Security Notes

- Your Azure OpenAI key is stored on the server (not exposed to browsers)
- The `.env` file is only readable by the `ubuntu` user
- Always keep your SSH private key secure
- Oracle Cloud Always Free never expires (no credit card sleep)

---

## Next Steps

Once your backend is running on Oracle Cloud:
1. Update GitHub secret `VITE_BACKEND_URL` with your Oracle IP
2. Push any code change to trigger frontend deployment
3. Your app will automatically use the Oracle backend for Azure OpenAI (with RAG + citations)

**Your deployed app will be at**: https://asathyanesan.github.io/ds-research-tool-test/
