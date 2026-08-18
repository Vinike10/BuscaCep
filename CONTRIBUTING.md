# 🤝 Guia de Contribuição (CONTRIBUTING.md)

Obrigado pelo interesse em contribuir com o **BuscaCep**! Este guia detalha o fluxo de trabalho obrigatório para manter a integridade, resiliência e clareza do projeto.

---

## 🛠️ Fluxo de Contribuição Passo a Passo

### 1. Escolha ou Crie uma Issue
- Nenhuma alteração deve ser desenvolvida sem uma issue cadastrada em [`.github/issues/`](.github/issues/) ou no GitHub Issues.
- Se for propor uma nova ideia, utilize os templates em [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/).

### 2. Crie uma Branch a Partir da Issue
Crie uma branch seguindo o padrão:
- `feat/issue-<numero>-<slug-da-feature>`
- `fix/issue-<numero>-<slug-do-bug>`
- `refactor/issue-<numero>-<slug-da-melhoria>`

*Exemplo*: `git checkout -b feat/issue-01-resilience-polly-fallback`

### 3. Siga o Padrão de Commits (Conventional Commits)
Sempre inclua a referência à issue no commit:
- `feat(#01): implementa motor de resiliencia com timeout e fallback`
- `fix(#03): corrige sanitizacao de espacos em ceps numericos`

### 4. Abra um Pull Request (PR)
Ao abrir o PR, preencha o template em [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) e inclua a linha obrigatória:
- `Closes #1` ou `Fixes #3`

---

## 📋 Padrões de Código
- **Vanilla JavaScript**: Código modular ES6+, sem dependências externas desnecessárias no frontend.
- **CSS3 Moderno**: Utilizar as variáveis declaradas em `css/tokens.css`.
- **Resiliência Primeiro**: Não realizar chamadas HTTP externas sem timeout (`AbortController`).
