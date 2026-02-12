# PolyLance Quick Deploy Script
# This script helps you deploy to Vercel in one command

Write-Host "🚀 PolyLance Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking for Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed!" -ForegroundColor Green
}
else {
    Write-Host "✅ Vercel CLI found!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Choose deployment option:" -ForegroundColor Cyan
Write-Host "1. Deploy to Vercel (Recommended)" -ForegroundColor White
Write-Host "2. Deploy to Netlify" -ForegroundColor White
Write-Host "3. Open deployment guide" -ForegroundColor White
Write-Host "4. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: You'll need to:" -ForegroundColor Yellow
        Write-Host "   1. Login to Vercel (browser will open)" -ForegroundColor Yellow
        Write-Host "   2. Answer setup questions (defaults are fine)" -ForegroundColor Yellow
        Write-Host "   3. Add environment variables after deployment" -ForegroundColor Yellow
        Write-Host ""
        
        $confirm = Read-Host "Ready to proceed? (y/n)"
        
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Write-Host ""
            Write-Host "Starting deployment..." -ForegroundColor Green
            
            # Navigate to project root
            Set-Location $PSScriptRoot
            
            # Deploy to Vercel
            vercel --prod
            
            Write-Host ""
            Write-Host "✅ Deployment complete!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📝 Next steps:" -ForegroundColor Cyan
            Write-Host "   1. Go to https://vercel.com/dashboard" -ForegroundColor White
            Write-Host "   2. Click on your project" -ForegroundColor White
            Write-Host "   3. Go to Settings → Environment Variables" -ForegroundColor White
            Write-Host "   4. Add the variables from frontend/.env.example" -ForegroundColor White
            Write-Host "   5. Redeploy for changes to take effect" -ForegroundColor White
            Write-Host ""
        }
        else {
            Write-Host "Deployment cancelled." -ForegroundColor Yellow
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "🌐 Deploying to Netlify..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check if Netlify CLI is installed
        $netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue
        
        if (-not $netlifyInstalled) {
            Write-Host "Installing Netlify CLI..." -ForegroundColor Yellow
            npm install -g netlify-cli
        }
        
        Write-Host "Starting deployment..." -ForegroundColor Green
        
        # Navigate to project root
        Set-Location $PSScriptRoot
        
        # Login and deploy
        netlify login
        netlify init
        netlify deploy --prod
        
        Write-Host ""
        Write-Host "✅ Deployment complete!" -ForegroundColor Green
    }
    
    "3" {
        Write-Host ""
        Write-Host "📖 Opening deployment guide..." -ForegroundColor Cyan
        Start-Process "DEPLOYMENT_GUIDE.md"
    }
    
    "4" {
        Write-Host ""
        Write-Host "👋 Goodbye!" -ForegroundColor Cyan
        exit
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
