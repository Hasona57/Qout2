@echo off
cd /d "%~dp0"
ts-node src/database/seeds/run-seeds.ts
pause
