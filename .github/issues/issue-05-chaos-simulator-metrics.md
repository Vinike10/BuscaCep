## 🧪 Descrição da Funcionalidade
Implementar um **Simulador de Caos e Painel de Resiliência** que permita aos desenvolvedores e testadores injetar falhas deliberadas no sistema para inspecionar em tempo real o comportamento das políticas de Timeout, Retry e Fallback.

### 📋 Requisitos Técnicos
1. **Chaves de Injeção de Falhas**:
   - Forçar Timeout no ViaCEP (> 2s): Injeta atraso de 3.5 segundos.
   - Forçar Erro HTTP 500 no ViaCEP: Simula falha interna do provedor primário.
   - Simular Rede Lenta (+1.2s de latência): Adiciona latência artificial.
   - Bypass Cache: Força chamada externa mesmo com dado salvo em cache.
2. **Console de Logs com Streaming**: Visualizador de eventos coloridos com timestamps e etiquetas (`INFO`, `WARN`, `ERROR`, `SUCCESS`).
3. **Pipeline Visual com Animação**: Indicador visual dinâmico com iluminação das etapas ativas da requisição.

### 🎯 Critérios de Aceite
- [x] Ao ativar o timeout forçado, a interface exibe a transição para a BrasilAPI visualmente.
- [x] O console de logs detalha cada tentativa com os milissegundos exatos decorridos.
