/**
 * Global Configuration for BuscaCep Microservice
 */
export const CONFIG = {
  appName: 'BuscaCep',
  version: '1.0.0',
  
  // Timeout settings
  providerTimeoutMs: 2000, // 2 seconds timeout as requested
  maxRetries: 2,           // Retry up to 2 times
  retryDelayMs: 300,       // Base retry delay (backoff)
  
  // Cache settings
  cacheTtlMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  cacheStorageKey: 'buscacep_cache_v1',
  metricsStorageKey: 'buscacep_metrics_v1',
  
  // Circuit Breaker settings
  circuitBreakerThreshold: 3, // 3 consecutive failures to open circuit
  circuitBreakerResetMs: 30000, // 30 seconds to try half-open
  
  // Endpoints for free public Brazilian address providers
  providers: {
    viacep: {
      name: 'ViaCEP',
      url: (cep) => `https://viacep.com.br/ws/${cep}/json/`,
      primary: true
    },
    brasilapi: {
      name: 'BrasilAPI',
      url: (cep) => `https://brasilapi.com.br/api/cep/v2/${cep}`,
      fallback: true
    },
    opencep: {
      name: 'OpenCEP',
      url: (cep) => `https://opencep.com/v1/${cep}`,
      fallback: true
    }
  },

  // Brazilian state names map
  ufMap: {
    'AC': { name: 'Acre', region: 'Norte', capital: 'Rio Branco' },
    'AL': { name: 'Alagoas', region: 'Nordeste', capital: 'Maceió' },
    'AP': { name: 'Amapá', region: 'Norte', capital: 'Macapá' },
    'AM': { name: 'Amazonas', region: 'Norte', capital: 'Manaus' },
    'BA': { name: 'Bahia', region: 'Nordeste', capital: 'Salvador' },
    'CE': { name: 'Ceará', region: 'Nordeste', capital: 'Fortaleza' },
    'DF': { name: 'Distrito Federal', region: 'Centro-Oeste', capital: 'Brasília' },
    'ES': { name: 'Espírito Santo', region: 'Sudeste', capital: 'Vitória' },
    'GO': { name: 'Goiás', region: 'Centro-Oeste', capital: 'Goiânia' },
    'MA': { name: 'Maranhão', region: 'Nordeste', capital: 'São Luís' },
    'MT': { name: 'Mato Grosso', region: 'Centro-Oeste', capital: 'Cuiabá' },
    'MS': { name: 'Mato Grosso do Sul', region: 'Centro-Oeste', capital: 'Campo Grande' },
    'MG': { name: 'Minas Gerais', region: 'Sudeste', capital: 'Belo Horizonte' },
    'PA': { name: 'Pará', region: 'Norte', capital: 'Belém' },
    'PB': { name: 'Paraíba', region: 'Nordeste', capital: 'João Pessoa' },
    'PR': { name: 'Paraná', region: 'Sul', capital: 'Curitiba' },
    'PE': { name: 'Pernambuco', region: 'Nordeste', capital: 'Recife' },
    'PI': { name: 'Piauí', region: 'Nordeste', capital: 'Teresina' },
    'RJ': { name: 'Rio de Janeiro', region: 'Sudeste', capital: 'Rio de Janeiro' },
    'RN': { name: 'Rio Grande do Norte', region: 'Nordeste', capital: 'Natal' },
    'RS': { name: 'Rio Grande do Sul', region: 'Sul', capital: 'Porto Alegre' },
    'RO': { name: 'Rondônia', region: 'Norte', capital: 'Porto Velho' },
    'RR': { name: 'Roraima', region: 'Norte', capital: 'Boa Vista' },
    'SC': { name: 'Santa Catarina', region: 'Sul', capital: 'Florianópolis' },
    'SP': { name: 'São Paulo', region: 'Sudeste', capital: 'São Paulo' },
    'SE': { name: 'Sergipe', region: 'Nordeste', capital: 'Aracaju' },
    'TO': { name: 'Tocantins', region: 'Norte', capital: 'Palmas' }
  }
};
