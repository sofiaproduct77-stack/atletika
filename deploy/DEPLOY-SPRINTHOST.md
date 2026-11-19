# АТЛЕТИКА на Sprinthost (viperxds.ru)

## 1. Панель cp.sprinthost.ru

**Сайты** → `viperxds.ru` → **Веб-серверы** → **Node.js 22**.

## 2. Заливка с ПК

```powershell
cd C:\Users\dtro2\KACH\АТЛЕТИКА\deploy
$env:SPRINTHOST_FTP_PASSWORD = 'пароль-ftp'
.\upload-ftp.ps1
```

Скрипт удаляет файлы GORILLA и заливает АТЛЕТИКУ.

## 3. SSH

```bash
cd ~/domains/viperxds.ru/public_html
cp deploy/env.production.example .env   # если нет .env
nano .env   # SESSION_SECRET, ADMIN_PASSWORD
npm22 install --production
mkdir -p data tmp
touch tmp/restart.txt
```

## 4. Проверка

- https://viperxds.ru  
- https://viperxds.ru/admin/  
- https://viperxds.ru/api/health → `atletika`