## 📦 Descrição da Funcionalidade
Implementar motor de processamento de múltiplos CEPs em lote (Batch Search) com controle de vazão (rate limiting preventivo), barra de progresso em tempo real e exportação para formatos corporativos (CSV e JSON).

### 📋 Requisitos Técnicos
1. **Entrada Multi-linhas / CSV**: Campo de texto ou upload aceitando múltiplos CEPs.
2. **Processador com Throttling**: Execução sequencial/controlada para evitar sobrecarga de rede e respeitar limites de APIs públicas.
3. **Barra de Progresso Visual**: Atualização dinâmica da porcentagem concluída e contagem de sucessos/erros.
4. **Exportação CSV & JSON**:
   - Geração de arquivo CSV com delimitador `;` e codificação UTF-8 com BOM para compatibilidade com Microsoft Excel.
   - Geração de JSON estruturado com todos os metadados enriquecidos.

### 🎯 Critérios de Aceite
- [x] O usuário pode colar uma lista de CEPs e processá-los com 1 clique.
- [x] A tabela exibe os resultados parciais conforme são concluídos.
- [x] A exportação para CSV e JSON faz o download imediato no navegador.
