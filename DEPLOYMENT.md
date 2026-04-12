# Deployment Guide -- Ubuntu VPS with Nginx

This guide covers deploying the KND 1151158 certificate service on a fresh Ubuntu 22.04+ VPS with Nginx, SSL via Let's Encrypt, and automated deployments from GitHub.

## Prerequisites

- A VPS running Ubuntu 22.04 or later (1 GB RAM is sufficient)
- A domain name pointing to your VPS IP (e.g., `knd.example.com`)
- A Supabase project with the database already provisioned
- SSH access to the VPS as root or a sudo user

## 1. Initial Server Setup

Connect to your VPS and update the system:

```bash
sudo apt update && sudo apt upgrade -y
```

Install required packages:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx git curl ufw
```

Install Node.js 20 LTS via NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installations:

```bash
node -v    # v20.x.x
npm -v     # 10.x.x
nginx -v   # nginx/1.x.x
```

## 2. Firewall Configuration

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 3. Create a Deploy User

Run everything under a dedicated non-root user:

```bash
sudo adduser --disabled-password deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
```

Switch to the deploy user for the remaining steps:

```bash
sudo su - deploy
```

## 4. Clone the Repository

```bash
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git knd
cd knd
```

## 5. Configure Environment Variables

Create the `.env` file with your Supabase credentials:

```bash
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
EOF
```

These are public client-side keys (the anon key is designed to be exposed in the browser). Row Level Security on the database controls what data is accessible.

## 6. Build the Application

```bash
npm ci
npm run build
```

The static files are now in `~/apps/knd/dist/`.

Verify the build:

```bash
ls -la dist/
# Should contain: index.html, assets/
```

## 7. Configure Nginx

Switch back to root/sudo for Nginx configuration:

```bash
exit  # back to root/sudo user
```

Create the Nginx site configuration:

```bash
sudo nano /etc/nginx/sites-available/knd
```

Paste the following (replace `knd.example.com` with your domain):

```nginx
server {
    listen 80;
    server_name knd.example.com;

    root /home/deploy/apps/knd/dist;
    index index.html;

    # Gzip compression for static assets
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Cache static assets aggressively (Vite hashes filenames)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback: serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny access to dotfiles
    location ~ /\. {
        deny all;
        return 404;
    }
}
```

Enable the site and test the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/knd /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

At this point, visiting `http://knd.example.com` should load the application.

## 8. SSL with Let's Encrypt

```bash
sudo certbot --nginx -d knd.example.com
```

Follow the prompts. Certbot will:
- Obtain a free SSL certificate
- Automatically modify the Nginx config to redirect HTTP to HTTPS
- Set up auto-renewal via a systemd timer

Verify auto-renewal is active:

```bash
sudo systemctl status certbot.timer
```

Test renewal:

```bash
sudo certbot renew --dry-run
```

## 9. Deploy Script

Create a simple deploy script on the server:

```bash
sudo su - deploy
cat > ~/apps/knd/deploy.sh << 'SCRIPT'
#!/bin/bash
set -e

cd ~/apps/knd
git pull origin main
npm ci --production=false
npm run build

echo "Deploy complete: $(date)"
SCRIPT

chmod +x ~/apps/knd/deploy.sh
```

To deploy updates after pushing to GitHub:

```bash
ssh deploy@your-vps-ip '~/apps/knd/deploy.sh'
```

## 10. Automated Deployments with GitHub Actions (Optional)

Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_SSH_KEY }}
          script: ~/apps/knd/deploy.sh
```

Add these GitHub repository secrets:
- `VPS_HOST` -- Your VPS IP address or hostname
- `VPS_SSH_KEY` -- The private SSH key for the `deploy` user

Generate a deploy key on your local machine:

```bash
ssh-keygen -t ed25519 -f deploy_key -N ""
```

Add `deploy_key.pub` to `/home/deploy/.ssh/authorized_keys` on the VPS.
Add the contents of `deploy_key` (private key) as the `VPS_SSH_KEY` secret in GitHub.

## Maintenance

### Viewing Logs

Nginx access and error logs:

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Manual Redeploy

```bash
ssh deploy@your-vps-ip '~/apps/knd/deploy.sh'
```

### Updating Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### SSL Certificate Renewal

Certbot handles this automatically. To manually renew:

```bash
sudo certbot renew
```

### Checking Disk Space

```bash
df -h
```

### Database

The database runs on Supabase's hosted infrastructure. No database maintenance is required on the VPS. If you ever need to inspect or modify the schema, use the Supabase Dashboard or apply migrations via the Supabase CLI.

## Troubleshooting

**Site shows Nginx default page:**
Make sure the default site is removed and your config is linked:
```bash
sudo rm /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/knd /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

**404 on page refresh:**
The `try_files $uri $uri/ /index.html` directive is missing or misconfigured. This is required for client-side routing.

**Build fails with memory errors:**
On a 1 GB VPS, add swap:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Permission denied on dist/ folder:**
Nginx needs read access:
```bash
sudo chmod 755 /home/deploy
sudo chmod -R 755 /home/deploy/apps/knd/dist
```

**Certbot fails:**
Ensure your domain's DNS A record points to the VPS IP and port 80 is open:
```bash
dig +short knd.example.com
sudo ufw status
```
