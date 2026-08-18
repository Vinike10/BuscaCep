## 📌 Descrição das Alterações
Descreva de forma concisa o que foi implementado, corrigido ou refatorado.

---

## 🔗 Vínculo Obrigatório com a Issue
- Closes #
- Relates to #

> ⚠️ **Atenção**: É obrigatório vincular uma issue existente. PRs sem vínculo serão rejeitados automaticamente.

---

## 🧪 Como as Alterações Foram Testadas?
- [ ] Teste de consulta de CEP válido com ViaCEP
- [ ] Teste de timeout (> 2s) e acionamento de fallback BrasilAPI
- [ ] Teste de cache de 24 horas (resposta instantânea em 0ms)
- [ ] Teste de validação e tratamento RFC 7807 para formatos incorretos
- [ ] Teste de busca em lote e exportação CSV/JSON

---

## 📋 Checklist
- [ ] Código segue os padrões definidos em `AGENTS.md` e `CONTRIBUTING.md`.
- [ ] A branch foi criada no formato `feat/issue-X-...`, `fix/issue-X-...` ou `refactor/issue-X-...`.
- [ ] Os commits seguem o padrão Conventional Commits com referência à issue (`feat(#X): ...`).
- [ ] Não há erros no console do navegador ou falhas de sintaxe.
