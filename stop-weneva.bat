@echo off
title WENEVA - Stop
color 0C

echo ===================================
echo   Menghentikan semua proses WENEVA
echo ===================================
echo.

taskkill /F /IM node.exe >nul 2>&1

if %errorlevel%==0 (
    echo Semua proses backend & frontend berhasil dihentikan.
) else (
    echo Tidak ada proses yang sedang jalan ^(sudah mati semua^).
)

echo.
pause
