$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Py = "C:\Users\nitza\AppData\Local\Python\pythoncore-3.14-64\python.exe"
if (-not (Test-Path $Py)) { $Py = "python" }

Write-Host "Starting Spawn.gg Backend (:8000) in detached window..." -ForegroundColor Cyan
Start-Process -FilePath $Py -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000" -WorkingDirectory (Join-Path $Root "backend")

Write-Host "Starting Spawn.gg Frontend (:5173) in detached window..." -ForegroundColor Cyan
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "npm run dev -- --host 0.0.0.0 --port 5173" -WorkingDirectory (Join-Path $Root "frontend")

Write-Host "Both servers launched! Backend: http://localhost:8000 | Frontend: http://localhost:5173" -ForegroundColor Green
