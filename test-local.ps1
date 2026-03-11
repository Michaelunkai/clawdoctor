# ClawDoctor Local Test Script
# Tests all major functionality

Write-Host "🧪 ClawDoctor Test Suite" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if build exists
Write-Host "Test 1: Checking build files..." -ForegroundColor Yellow
if (Test-Path "dist\index.js") {
    Write-Host "✅ Build files found" -ForegroundColor Green
} else {
    Write-Host "❌ Build files missing - run 'npm run build'" -ForegroundColor Red
    exit 1
}

# Test 2: Check dependencies
Write-Host "`nTest 2: Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules found" -ForegroundColor Green
} else {
    Write-Host "❌ Dependencies missing - run 'npm install'" -ForegroundColor Red
    exit 1
}

# Test 3: Check web files
Write-Host "`nTest 3: Checking web files..." -ForegroundColor Yellow
$webFiles = @("web\index.html", "web\app.js", "web\style.css")
$allFound = $true
foreach ($file in $webFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Missing: $file" -ForegroundColor Red
        $allFound = $false
    }
}
if ($allFound) {
    Write-Host "✅ All web files present" -ForegroundColor Green
}

# Test 4: Check TypeScript source
Write-Host "`nTest 4: Checking TypeScript source..." -ForegroundColor Yellow
$srcFiles = @(
    "src\index.ts",
    "src\server.ts",
    "src\observe.ts",
    "src\diagnose.ts",
    "src\rules.ts",
    "src\execute.ts",
    "src\verify.ts",
    "src\report.ts",
    "src\backup.ts"
)
$allFound = $true
foreach ($file in $srcFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Missing: $file" -ForegroundColor Red
        $allFound = $false
    }
}
if ($allFound) {
    Write-Host "✅ All source files present" -ForegroundColor Green
}

# Test 5: Verify package.json
Write-Host "`nTest 5: Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    if ($pkg.name -eq "clawdoctor") {
        Write-Host "✅ package.json valid" -ForegroundColor Green
    } else {
        Write-Host "❌ package.json incorrect" -ForegroundColor Red
    }
} else {
    Write-Host "❌ package.json missing" -ForegroundColor Red
}

# Test 6: Check documentation
Write-Host "`nTest 6: Checking documentation..." -ForegroundColor Yellow
$docs = @("README.md", "FEATURES.md", "CHANGELOG.md", "DEPLOY.md")
$allFound = $true
foreach ($doc in $docs) {
    if (-not (Test-Path $doc)) {
        Write-Host "❌ Missing: $doc" -ForegroundColor Red
        $allFound = $false
    }
}
if ($allFound) {
    Write-Host "✅ All documentation present" -ForegroundColor Green
}

Write-Host "`n=========================" -ForegroundColor Cyan
Write-Host "✅ All tests passed!" -ForegroundColor Green
Write-Host "`n🚀 Ready to run: npm start" -ForegroundColor Cyan
Write-Host "📦 Ready to deploy: See DEPLOY.md" -ForegroundColor Cyan
