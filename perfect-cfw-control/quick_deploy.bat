@echo off
echo === 𝐏𝐞𝐫𝐟𝐞𝐜𝐭 𝐂𝐅𝐖 - Quick Deploy Script ===
echo.

echo [1] GitHub Pages (مجاني)
echo [2] Netlify (مجاني)
echo [3] Vercel (مجاني)
echo [4] Hostinger (مدفوع)
echo [5] Bluehost (مدفوع)
echo [6] SiteGround (مدفوع)
echo.

set /p choice="اختر رقم المنصة (1-6): "

if "%choice%"=="1" goto github
if "%choice%"=="2" goto netlify
if "%choice%"=="3" goto vercel
if "%choice%"=="4" goto hostinger
if "%choice%"=="5" goto bluehost
if "%choice%"=="6" goto siteground
goto invalid

:github
echo.
echo === GitHub Pages Deploy ===
echo 1. اذهب إلى github.com
echo 2. أنشئ repository جديد
echo 3. ارفع الملفات التالية:
echo    - index.html
echo    - callback.html
echo    - css/style.css
echo    - js/script.js
echo 4. اذهب إلى Settings > Pages
echo 5. فعل GitHub Pages
echo 6. اختر Branch: main
echo.
echo رابط الموقع سيكون: https://username.github.io/perfect-cfw-control
echo.
pause
goto end

:netlify
echo.
echo === Netlify Deploy ===
echo 1. اذهب إلى netlify.com
echo 2. سجل حساب جديد
echo 3. اضغط "New site from Git"
echo 4. اختر GitHub واربط repository
echo 5. ارفع الملفات مباشرة
echo.
echo رابط الموقع سيكون: random-name.netlify.app
echo.
pause
goto end

:vercel
echo.
echo === Vercel Deploy ===
echo 1. اذهب إلى vercel.com
echo 2. سجل حساب جديد
echo 3. اضغط "New Project"
echo 4. اختر GitHub repository
echo 5. ارفع الملفات
echo.
echo رابط الموقع سيكون: project-name.vercel.app
echo.
pause
goto end

:hostinger
echo.
echo === Hostinger Deploy ===
echo 1. اذهب إلى hostinger.com
echo 2. اشترك في خطة استضافة
echo 3. اذهب إلى hPanel
echo 4. اضغط File Manager
echo 5. ارفع مجلد المشروع كاملاً
echo.
echo رابط الموقع سيكون: your-domain.com
echo.
pause
goto end

:bluehost
echo.
echo === Bluehost Deploy ===
echo 1. اذهب إلى bluehost.com
echo 2. اشترك في خطة استضافة
echo 3. اذهب إلى cPanel
echo 4. اضغط File Manager
echo 5. ارفع مجلد المشروع
echo.
echo رابط الموقع سيكون: your-domain.com
echo.
pause
goto end

:siteground
echo.
echo === SiteGround Deploy ===
echo 1. اذهب إلى siteground.com
echo 2. اشترك في خطة استضافة
echo 3. اذهب إلى Site Tools
echo 4. اضغط File Manager
echo 5. ارفع مجلد المشروع
echo.
echo رابط الموقع سيكون: your-domain.com
echo.
pause
goto end

:invalid
echo.
echo خيار غير صحيح! اختر من 1 إلى 6
echo.
pause
goto start

:end
echo.
echo === بعد الرفع ===
echo 1. اذهب إلى Discord Developer Portal
echo 2. حدث Redirect URI إلى: https://your-domain.com/callback
echo 3. اختبر الموقع بالكامل
echo 4. تأكد من تسجيل الدخول يعمل
echo.
echo === انتهى ===
