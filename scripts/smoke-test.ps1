param(
    [string]$DockerPath = "docker",
    [string]$ApiUrl = "http://localhost:8080/api",
    [string]$FrontendUrl = "http://localhost:5173"
)

$ErrorActionPreference = "Stop"
$failed = $false

function Start-Check {
    param([string]$Label)

    Write-Host ""
    Write-Host "== $Label =="
}

function Pass {
    param([string]$Message)

    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Fail {
    param([string]$Message)

    $script:failed = $true
    Write-Host "[KO] $Message" -ForegroundColor Red
}

function Run-Command {
    param(
        [string]$Label,
        [string[]]$Command
    )

    Start-Check $Label

    try {
        & $Command[0] $Command[1..($Command.Length - 1)]

        if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
            Pass $Label
        } else {
            Fail "$Label a retourné le code $LASTEXITCODE"
        }
    } catch {
        Fail $_.Exception.Message
    }
}

function Check-Http {
    param(
        [string]$Label,
        [string]$Url
    )

    Start-Check $Label

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30

        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
            Pass "$Url répond avec HTTP $($response.StatusCode)"
        } else {
            Fail "$Url répond avec HTTP $($response.StatusCode)"
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__

        if ($statusCode -ge 200 -and $statusCode -lt 500) {
            Pass "$Url répond avec HTTP $statusCode"
        } else {
            Fail "$Url ne répond pas : $($_.Exception.Message)"
        }
    }
}

Run-Command "Docker Compose services" @($DockerPath, "compose", "ps")
Run-Command "PHP syntax: Training entity" @($DockerPath, "compose", "exec", "-T", "php", "php", "-l", "src/Entity/Training.php")
Run-Command "PHP syntax: latest migration" @($DockerPath, "compose", "exec", "-T", "php", "php", "-l", "migrations/Version20260731171500.php")
Run-Command "Frontend lint" @($DockerPath, "compose", "exec", "-T", "frontend", "npm", "run", "lint")
Run-Command "Frontend build" @($DockerPath, "compose", "exec", "-T", "frontend", "npm", "run", "build")
Run-Command "Database column: training.mistake_limit" @(
    $DockerPath,
    "compose",
    "exec",
    "-T",
    "database",
    "psql",
    "-U",
    "woodpecker",
    "-d",
    "woodpecker",
    "-c",
    "SELECT column_name, column_default, is_nullable FROM information_schema.columns WHERE table_name='training' AND column_name='mistake_limit';"
)

Check-Http "API HTTP" $ApiUrl
Check-Http "Frontend HTTP" $FrontendUrl

Write-Host ""

if ($failed) {
    Write-Host "Smoke test terminé avec au moins une erreur." -ForegroundColor Red
    exit 1
}

Write-Host "Smoke test terminé avec succès." -ForegroundColor Green
