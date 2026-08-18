<#
.SYNOPSIS
    Script automatizado para criar as Issues do projeto BuscaCep no GitHub via GitHub CLI (gh).
.DESCRIPTION
    Le o catalogo de issues em .github/issues/ e as publica no repositorio remoto com suas respectivas labels.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .github/create_issues.ps1
#>

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " [*] BuscaCep - Criador Automatico de GitHub Issues" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# Garante que os caminhos padrao do GitHub CLI e Git estejam no PATH desta sessao
$extraPaths = @("C:\Program Files\GitHub CLI", "C:\Program Files\Git\cmd", "C:\Program Files\Git\bin", "$env:LOCALAPPDATA\Programs\GitHub CLI")
foreach ($p in $extraPaths) {
    if ((Test-Path $p) -and ($env:PATH -notlike "*$p*")) {
        $env:PATH = "$p;$env:PATH"
    }
}

# Verifica se o GitHub CLI (gh) esta instalado
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "[-] GitHub CLI (gh) nao foi encontrado no PATH." -ForegroundColor Yellow
    exit 0
}

# Verifica se esta autenticado no GitHub
& gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Voce precisa conectar sua conta do GitHub primeiro." -ForegroundColor Yellow
    Write-Host "[>] Execute: gh auth login" -ForegroundColor Cyan
    exit 1
}

# 1. Cria labels se nao existirem
Write-Host "`n[+] Criando e verificando labels do repositorio..." -ForegroundColor Yellow
& gh label create "resilience" --color "8b5cf6" --description "Polly resilience, retry and fallback policies" --force 2>$null
& gh label create "performance" --color "f59e0b" --description "Caching and performance metrics" --force 2>$null
& gh label create "validation" --color "ef4444" --description "Input validation and error handling" --force 2>$null
& gh label create "ui" --color "06b6d4" --description "User interface improvements" --force 2>$null
& gh label create "testing" --color "10b981" --description "Testing and chaos simulation" --force 2>$null

# 2. Issues catalogadas
$issues = @(
    @{
        Title = "[Resiliencia] Motor Polly com Timeout de 2s, Retry e Fallback ViaCEP para BrasilAPI (#01)"
        BodyFile = ".github/issues/issue-01-resilience-polly-fallback.md"
        Labels = "resilience,enhancement"
    },
    @{
        Title = "[Performance] Sistema de Caching de 24 Horas com Metricas e L1/L2 Storage (#02)"
        BodyFile = ".github/issues/issue-02-cache-system-24h.md"
        Labels = "performance,enhancement"
    },
    @{
        Title = "[Validacao] Validacao Estrita de CEPs e Respostas Padronizadas RFC 7807 (#03)"
        BodyFile = ".github/issues/issue-03-validation-rfc7807.md"
        Labels = "validation"
    },
    @{
        Title = "[Feature] Processamento de CEPs em Lote com Barra de Progresso e Exportacao CSV/JSON (#04)"
        BodyFile = ".github/issues/issue-04-batch-search-export.md"
        Labels = "ui,enhancement"
    },
    @{
        Title = "[Resiliencia] Simulador de Caos e Console de Logs em Tempo Real (#05)"
        BodyFile = ".github/issues/issue-05-chaos-simulator-metrics.md"
        Labels = "resilience,testing"
    }
)

foreach ($item in $issues) {
    Write-Host "Publicando Issue: $($item.Title)..." -ForegroundColor Green
    if (Test-Path $item.BodyFile) {
        & gh issue create --title $item.Title --body-file $item.BodyFile --label $item.Labels
    } else {
        & gh issue create --title $item.Title --body "Consulte a documentacao em $($item.BodyFile)" --label $item.Labels
    }
}

Write-Host "[OK] Todas as issues do BuscaCep foram processadas com sucesso!" -ForegroundColor Green
