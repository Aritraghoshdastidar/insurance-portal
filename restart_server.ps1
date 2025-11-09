# PowerShell script to restart the backend server

Write-Host "🔍 Finding Node.js processes..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es):" -ForegroundColor Cyan
    $nodeProcesses | ForEach-Object {
        Write-Host "  PID: $($_.Id) - Started: $($_.StartTime)" -ForegroundColor Gray
    }
    
    Write-Host "`n⚠️  Stopping Node.js processes..." -ForegroundColor Red
    Stop-Process -Name "node" -Force
    Write-Host "✅ All Node.js processes stopped" -ForegroundColor Green
    
    Start-Sleep -Seconds 2
} else {
    Write-Host "ℹ️  No Node.js processes running" -ForegroundColor Gray
}

Write-Host "`n🚀 Starting backend server..." -ForegroundColor Yellow
Write-Host "   Location: C:\Users\aritr\all_features_combined" -ForegroundColor Gray
Write-Host "   Command: node server.js" -ForegroundColor Gray

# Start the server in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\aritr\all_features_combined; Write-Host '🟢 Backend Server Starting...' -ForegroundColor Green; node server.js"

Write-Host "`n✅ Server restart initiated!" -ForegroundColor Green
Write-Host "   A new window has opened with the server running" -ForegroundColor Gray
Write-Host "   Check that window for server logs" -ForegroundColor Gray
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Wait for 'Server listening on port 3001' message" -ForegroundColor White
Write-Host "   2. Refresh your browser (F5 or Ctrl+F5)" -ForegroundColor White
Write-Host "   3. Test buying a new policy" -ForegroundColor White
Write-Host "   4. It should go to PENDING_INITIAL_APPROVAL (not ACTIVE)" -ForegroundColor White
