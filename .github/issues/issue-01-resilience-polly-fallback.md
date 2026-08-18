## 🛡️ Descrição da Funcionalidade
Implementar o motor de resiliência inspirado no padrão **Polly** para garantir alta disponibilidade na resolução de CEPs no território brasileiro, mesmo durante indisponibilidades parciais de serviços públicos.

### 📋 Requisitos Técnicos
1. **Timeout Estrito (2s)**: Cada chamada ao provedor primário (ViaCEP) deve ser cancelada se ultrapassar 2.000 ms via `AbortController` (ou `CancellationToken` no .NET).
2. **Retry com Backoff e Jitter**: Até 2 tentativas adicionais em caso de falhas transitórias (erros $5xx$ ou timeout de rede).
3. **Fallback Automático para BrasilAPI**: Caso o ViaCEP falhe ou expire o tempo limite, redirecionar a chamada instantaneamente para a BrasilAPI (`/api/cep/v2/{cep}`).
4. **Fallback Terciário (OpenCEP)**: Garantir rota extra caso ambos os provedores principais estejam instáveis.
5. **Circuit Breaker**: Proteção com abertura temporária de circuito caso um provedor atinja 3 falhas consecutivas.

### 🎯 Critérios de Aceite
- [x] O timeout de 2 segundos aborta a conexão pontualmente.
- [x] O fallback para a BrasilAPI é executado de forma transparente para o usuário.
- [x] A origem da resposta (`source`: "ViaCEP" ou "BrasilAPI") é identificada com clareza nos metadados da resposta.
