
Write-Host "Stopping all Node processes..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Node processes stopped."

Write-Host "Cleaning backend dist..."
Remove-Item -Path "backend/dist" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Dist cleaned."

Write-Host "Starting Qote System..."
npm run dev:all
