## ⚡ Descrição da Funcionalidade
Como os dados de endereçamento nacional são estáticos e mudam raramente, implementar um sistema de **Caching Multi-camada** com tempo de expiração (TTL) de 24 horas.

### 📋 Requisitos Técnicos
1. **L1 (In-Memory)**: Estrutura em memória (`Map` / `IMemoryCache`) para recuperação imediata (0ms).
2. **L2 (Persistent Storage)**: Persistência no navegador (`localStorage` / `Redis-ready`) para sobreviver a recarregamentos de página ou reinicializações.
3. **TTL de 24 Horas**: Cada registro deve ter um carimbo de expiração (`expiresAt = Date.now() + 86400000`).
4. **Métricas de Performance**: Contabilização de Cache Hits, Cache Misses, Taxa de Acerto (%) e Tempo Total de Rede Economizado.
5. **Gerenciador de Cache**: Interface para inspecionar itens armazenados, verificar tempo restante e expurgar registros.

### 🎯 Critérios de Aceite
- [x] A segunda consulta ao mesmo CEP responde em 0ms marcando `source: "cache"`.
- [x] O painel de métricas exibe a taxa de acertos e tempo economizado em tempo real.
- [x] É possível excluir um item específico ou limpar todo o cache.
