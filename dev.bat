@echo off
echo Sincronizando frontend...
xcopy /E /Y /Q "frontend\src" "C:\tutoria-frontend\src\" >nul
xcopy /Y /Q "frontend\index.html" "C:\tutoria-frontend\" >nul
echo Iniciando servidor em http://localhost:5173
cd /d "C:\tutoria-frontend"
node_modules\.bin\vite.cmd
