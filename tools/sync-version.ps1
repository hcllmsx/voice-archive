# ============================================================
#  sync-version.ps1
#  Read the version from VERSION (x.y.z or x.y.z.n), then make these
#  two files agree with it. Idempotent: re-running with the SAME
#  VERSION changes nothing.
#    1) content.js  -> version: '<ver>'
#    2) sw.js       -> cache bucket voice-archive-<ver>
#  Normally invoked by sync-version.bat in the project root.
# ============================================================
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot   # tools/ 的上一级 = 项目根

$verFile = Join-Path $root 'VERSION'
if (-not (Test-Path $verFile)) {
  Write-Host 'VERSION file not found in project root.' -ForegroundColor Red
  exit 1
}
$ver = ([IO.File]::ReadAllText($verFile)).Trim()
# 版本号允许 3 段（26.9.6）或 4 段（26.9.6.21，末位是当天发版序号）
if ($ver -notmatch '^\d+\.\d+\.\d+(\.\d+)?$') {
  Write-Host ('Invalid version (expected x.y.z or x.y.z.n): ' + $ver) -ForegroundColor Red
  exit 1
}

Write-Host ('Version from VERSION: ' + $ver)
$enc = New-Object System.Text.UTF8Encoding($false)
$changed = $false

# --- content.js: 同步 version 字段 ---
$cPath = Join-Path $root 'content.js'
$cText = [IO.File]::ReadAllText($cPath)
$cNeedle = "version: '$ver'"
if ($cText.Contains($cNeedle)) {
  Write-Host 'content.js  -> already up to date.'
} else {
  $cNew = [regex]::Replace($cText, "version: '\d+\.\d+\.\d+(\.\d+)?'", $cNeedle, 1)
  if ($cNew -ceq $cText) {
    Write-Host 'WARNING: version field not found in content.js, skipped.' -ForegroundColor Yellow
  } else {
    [IO.File]::WriteAllText($cPath, $cNew, $enc)
    $changed = $true
    Write-Host 'content.js  -> version synced.'
  }
}

# --- sw.js: 缓存桶名 = voice-archive-<版本号> ---
$sPath = Join-Path $root 'sw.js'
$sText = [IO.File]::ReadAllText($sPath)
$sBucket = 'voice-archive-' + $ver
$sNeedle = "CACHE = '$sBucket'"
if ($sText.Contains($sNeedle)) {
  Write-Host ('sw.js      -> cache bucket already up to date: ' + $sBucket)
} elseif ($sText -notmatch "CACHE = 'voice-archive-[^']*'") {
  Write-Host 'WARNING: cache bucket not found in sw.js, skipped.' -ForegroundColor Yellow
} else {
  $sNew = [regex]::Replace($sText, "CACHE = 'voice-archive-[^']*'", "CACHE = '$sBucket'", 1)
  [IO.File]::WriteAllText($sPath, $sNew, $enc)
  $changed = $true
  Write-Host ('sw.js      -> cache bucket set to ' + $sBucket)
}

if ($changed) { Write-Host 'Done.' } else { Write-Host 'Nothing to change - already in sync.' }
