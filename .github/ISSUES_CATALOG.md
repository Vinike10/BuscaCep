# 📚 Catálogo de Issues do Projeto BuscaCep

Este catálogo consolida as especificações de todas as issues do projeto **BuscaCep**, servindo de guia para desenvolvimento, revisão e rastreabilidade por humanos e Agentes de IA.

---

## 📑 Lista de Issues

| # | Título da Issue | Rótulos (Labels) | Arquivo de Especificação |
|---|---|---|---|
| **#01** | `[Resiliência] Motor Polly com Timeout de 2s, Retry e Fallback ViaCEP ➔ BrasilAPI` | `resilience`, `enhancement` | [`.github/issues/issue-01-resilience-polly-fallback.md`](issues/issue-01-resilience-polly-fallback.md) |
| **#02** | `[Performance] Sistema de Caching de 24 Horas com Métricas e L1/L2 Storage` | `performance`, `enhancement` | [`.github/issues/issue-02-cache-system-24h.md`](issues/issue-02-cache-system-24h.md) |
| **#03** | `[Validação] Validação Estrita de CEPs e Respostas Padronizadas RFC 7807` | `validation`, `security` | [`.github/issues/issue-03-validation-rfc7807.md`](issues/issue-03-validation-rfc7807.md) |
| **#04** | `[Feature] Processamento de CEPs em Lote com Barra de Progresso e Exportação CSV/JSON` | `enhancement`, `ui` | [`.github/issues/issue-04-batch-search-export.md`](issues/issue-04-batch-search-export.md) |
| **#05** | `[Resiliência] Simulador de Caos e Console de Logs em Tempo Real` | `resilience`, `testing` | [`.github/issues/issue-05-chaos-simulator-metrics.md`](issues/issue-05-chaos-simulator-metrics.md) |

---

## 🤖 Regras de Governança para Agentes
Consulte o arquivo [`AGENTS.md`](../AGENTS.md) para regras obrigatórias de abertura de branches (`feat/issue-X-...`), commits convencionais (`feat(#X): ...`) e menção compulsória da issue no Pull Request (`Closes #X`).
