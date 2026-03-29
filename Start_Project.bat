@echo off
TITLE Blockchain Certificate Project Setup

echo ===============================================
echo 1. Starting Local Hardhat Node...
echo ===============================================
:: Start the Hardhat node in a completely separate window so it runs in the background
start "Hardhat Node Server" cmd /k "npx.cmd hardhat node"

:: Give the blockchain plenty of time to start
timeout /t 5 /nobreak > NUL

echo.
echo ===============================================
echo 2. Deploying Smart Contract...
echo ===============================================
:: Deploy the contract to that local node
call npx.cmd hardhat ignition deploy ignition/modules/CertificateRegistry.js --network localhost

echo.
echo ====================================================================
echo ATTENTION: Look at the "Deployed CertificateRegistry to:" text above.
echo If the address is different from your App.jsx, copy it now!
echo ====================================================================
echo.

echo ===============================================
echo 3. Starting React Frontend (Network Hosted)...
echo ===============================================
:: Start the frontend server, change directory properly, and run Vite
start "React Frontend" cmd /k "cd frontend && call npm.cmd run dev -- --host"

:: Give Vite enough time to compile and start serving
echo Waiting for the Vite web server to boot up (5 seconds)...
timeout /t 5 /nobreak > NUL

echo.
echo ===============================================
echo 4. Opening Website in Browser...
echo ===============================================
start http://localhost:5173/

echo.
echo Setup Complete! You can leave the black boxes running in the background.
echo.
pause
