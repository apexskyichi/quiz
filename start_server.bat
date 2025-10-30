@echo off
echo ====================================
echo かわいいクイズアプリ - 起動ツール
echo ====================================
echo.

REM Pythonがインストールされているか確認
python --version >nul 2>&1
if errorlevel 1 (
    echo エラー: Pythonがインストールされていません
    echo https://www.python.org/ からインストールしてください
    pause
    exit /b
)

echo サーバーを起動しています...
echo.
echo ブラウザで以下のURLにアクセスしてください:
echo.
echo   http://localhost:8000
echo.
echo iPhoneからアクセスする場合:
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%j in ('echo %%i') do (
        echo   http://%%j:8000
    )
)
echo.
echo 終了するには Ctrl+C を押してください
echo ====================================
echo.

REM サーバーを起動
python -m http.server 8000

pause
