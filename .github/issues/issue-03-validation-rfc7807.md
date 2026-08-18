## 🛡️ Descrição da Funcionalidade
Implementar camada estrita de sanitização, formatação de máscara e validação prévia de CEPs, além de tratamento de erro padronizado conforme o padrão internacional **RFC 7807 (Problem Details for HTTP APIs)**.

### 📋 Requisitos Técnicos
1. **Sanitização Automática**: Remoção de caracteres não numéricos (espaços, traços, pontos, letras).
2. **Validação de Formato**: O CEP deve possuir estritamente 8 dígitos (`^\d{8}$`).
3. **Bloqueio de Sequências Conhecidas**: Rejeição prévia de CEPs repetidos (`00000000`, `11111111`, etc.) sem disparar requisições para a internet.
4. **Respostas de Erro RFC 7807**:
   - `type`: URI de documentação do erro.
   - `title`: Título legível do erro.
   - `status`: Código HTTP (400, 404, 502).
   - `detail`: Explicação humana com instrução de correção.
   - `instance`: Rota/Endpoint consultado.
   - `traceId`: Identificador único da requisição.

### 🎯 Critérios de Aceite
- [x] Entradas com letras ou menos de 8 dígitos são bloqueadas na hora.
- [x] Os erros retornam o payload RFC 7807 padronizado.
- [x] O usuário recebe feedback visual claro e amigável.
