# Script to check for the 8 agent commits
# Run this after pushing from all 8 agent chats

Write-Host "Checking for 8 agent commits..." -ForegroundColor Cyan
Write-Host ""

# Fetch latest from GitHub
git fetch origin

# Check for commits matching the 8 features
$commits = @(
    "crowdsourced",
    "QR",
    "security",
    "onboarding",
    "quality",
    "teacher",
    "premium",
    "backend"
)

$found = 0
foreach ($keyword in $commits) {
    $result = git log --oneline --all --since="24 hours ago" | Select-String -Pattern $keyword -CaseSensitive:$false
    if ($result) {
        Write-Host "✓ Found: $keyword" -ForegroundColor Green
        $found++
    } else {
        Write-Host "✗ Missing: $keyword" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Found $found out of 8 commits" -ForegroundColor $(if ($found -eq 8) { "Green" } else { "Yellow" })

# Show recent commits
Write-Host ""
Write-Host "Recent commits (last 24 hours):" -ForegroundColor Cyan
git log --oneline --since="24 hours ago" --all | Select-Object -First 10

