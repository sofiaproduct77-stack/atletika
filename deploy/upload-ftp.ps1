param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$FtpHost = "141.8.192.192",
  [string]$FtpUser = "a1327438",
  [string]$RemoteBase = "/domains/viperxds.ru/public_html"
)

$pass = $env:SPRINTHOST_FTP_PASSWORD
if (-not $pass) { $pass = $env:SPRINTHOST_FTP_PASS }
if (-not $pass) {
  Write-Error "Задай SPRINTHOST_FTP_PASSWORD и запусти снова."
  exit 1
}

$cred = "${FtpUser}:${pass}"
$baseUri = "ftp://${FtpHost}${RemoteBase}"

function Ensure-FtpDir([string]$relDir) {
  if (-not $relDir) { return }
  $parts = $relDir -split '/'
  $acc = ""
  foreach ($p in $parts) {
    if (-not $p) { continue }
    $acc = if ($acc) { "$acc/$p" } else { $p }
    $uri = "$baseUri/$acc"
    try {
      $req = [System.Net.FtpWebRequest]::Create($uri)
      $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
      $req.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $pass)
      $req.GetResponse().Close() | Out-Null
    } catch { }
  }
}

function Upload-File([string]$local, [string]$remoteRel) {
  $dir = Split-Path $remoteRel -Parent
  if ($dir) { Ensure-FtpDir ($dir -replace '\\', '/') }
  $uri = "$baseUri/$($remoteRel -replace '\\', '/')"
  & curl.exe -s -S -T $local -u $cred $uri
  if ($LASTEXITCODE -ne 0) { throw "FTP fail: $remoteRel" }
  Write-Host "OK $remoteRel"
}

function Remove-RemoteFile([string]$remoteRel) {
  $uri = "$baseUri/$($remoteRel -replace '\\', '/')"
  try {
    $req = [System.Net.FtpWebRequest]::Create($uri)
    $req.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
    $req.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $pass)
    $req.GetResponse().Close() | Out-Null
    Write-Host "DEL $remoteRel"
  } catch {
    Write-Host "skip $remoteRel"
  }
}

# Снять файлы GORILLA с хостинга
$remove = @(
  "gorilla.png", "gorilla-mark.png", "gorilla-clear.png", "gorilla-hero.png",
  "gorilla-mascot.svg", "gorilla-mark.svg",
  "lib/bot.js", "lib/notify-admin.js", "lib/order-status.js",
  "scripts/bot-cron.js", "scripts/bot-poll.js"
)
foreach ($f in $remove) { Remove-RemoteFile $f }

$includes = @(
  "server.js", "package.json", "package-lock.json",
  "index.html", "styles.css", "script.js"
)

foreach ($f in $includes) {
  $local = Join-Path $ProjectRoot $f
  if (Test-Path $local) { Upload-File $local $f }
}

Get-ChildItem (Join-Path $ProjectRoot "lib") -File | ForEach-Object {
  Upload-File $_.FullName "lib/$($_.Name)"
}

Get-ChildItem (Join-Path $ProjectRoot "admin") -File | ForEach-Object {
  Upload-File $_.FullName "admin/$($_.Name)"
}

$ht = Join-Path $PSScriptRoot ".htaccess"
Upload-File $ht ".htaccess"

Write-Host "Готово. Дальше: SSH npm22 install и touch tmp/restart.txt (см. DEPLOY-SPRINTHOST.md)"