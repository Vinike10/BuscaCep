import { CONFIG } from './config.js';
import { ViaCepProvider } from './providers/viacepProvider.js';
import { BrasilApiProvider } from './providers/brasilApiProvider.js';
import { OpenCepProvider } from './providers/openCepProvider.js';

/**
 * Polly Resilience Engine for JavaScript / Web
 * Implements: Timeout, Retry with Exponential Backoff, Fallback Chain, Circuit Breaker & Chaos Simulator
 */
export class ResilienceEngine {
  constructor() {
    this.providers = [
      ViaCepProvider,
      BrasilApiProvider,
      OpenCepProvider
    ];

    // Circuit Breaker State per provider
    this.circuitBreakers = {
      viacep: { failures: 0, state: 'CLOSED', nextAttempt: 0 },
      brasilapi: { failures: 0, state: 'CLOSED', nextAttempt: 0 },
      opencep: { failures: 0, state: 'CLOSED', nextAttempt: 0 }
    };

    // Chaos & Simulation Flags
    this.chaosConfig = {
      forceViaCepTimeout: false,
      forceViaCep500: false,
      simulateSlowNetwork: false,
      bypassCache: false
    };

    // Log listeners
    this.eventListeners = [];
  }

  /**
   * Registers callback for live pipeline events
   * @param {Function} callback
   */
  onEvent(callback) {
    this.eventListeners.push(callback);
  }

  /**
   * Emits an execution event
   */
  emit(event) {
    this.eventListeners.forEach(fn => {
      try { fn(event); } catch (e) { console.error(e); }
    });
  }

  /**
   * Updates chaos settings
   */
  setChaosConfig(newConfig) {
    this.chaosConfig = { ...this.chaosConfig, ...newConfig };
    this.emit({
      type: 'CHAOS_UPDATED',
      config: this.chaosConfig,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Checks if provider circuit breaker is open
   */
  isCircuitOpen(providerKey) {
    const cb = this.circuitBreakers[providerKey];
    if (!cb) return false;

    if (cb.state === 'OPEN') {
      if (Date.now() > cb.nextAttempt) {
        cb.state = 'HALF_OPEN';
        this.emit({
          type: 'CIRCUIT_HALF_OPEN',
          provider: providerKey,
          message: `Circuit Breaker para ${providerKey} mudou para HALF-OPEN.`
        });
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(providerKey) {
    const cb = this.circuitBreakers[providerKey];
    if (cb) {
      cb.failures = 0;
      if (cb.state !== 'CLOSED') {
        cb.state = 'CLOSED';
        this.emit({
          type: 'CIRCUIT_CLOSED',
          provider: providerKey,
          message: `Circuit Breaker para ${providerKey} restaurado para CLOSED (Saudável).`
        });
      }
    }
  }

  recordFailure(providerKey) {
    const cb = this.circuitBreakers[providerKey];
    if (cb) {
      cb.failures++;
      if (cb.failures >= CONFIG.circuitBreakerThreshold && cb.state !== 'OPEN') {
        cb.state = 'OPEN';
        cb.nextAttempt = Date.now() + CONFIG.circuitBreakerResetMs;
        this.emit({
          type: 'CIRCUIT_OPEN',
          provider: providerKey,
          message: `Circuit Breaker ativado para ${providerKey} (Aberto por ${CONFIG.circuitBreakerResetMs / 1000}s).`
        });
      }
    }
  }

  /**
   * Executes a single provider fetch with Timeout and Chaos injection
   */
  async executeWithTimeout(provider, cleanCep) {
    const providerKey = provider.name;
    const timeoutMs = CONFIG.providerTimeoutMs; // 2000ms

    // Check circuit breaker
    if (this.isCircuitOpen(providerKey)) {
      throw new Error(`Circuit Breaker aberto para ${provider.displayName}`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort(new Error(`Timeout excedido (> ${timeoutMs}ms) na chamada ao ${provider.displayName}`));
    }, timeoutMs);

    try {
      // Chaos Injection: Simulate slow network delay
      if (this.chaosConfig.simulateSlowNetwork) {
        await new Promise(r => setTimeout(r, 1200));
      }

      // Chaos Injection: Force ViaCEP Timeout
      if (providerKey === 'viacep' && this.chaosConfig.forceViaCepTimeout) {
        this.emit({
          type: 'CHAOS_INJECTED',
          message: `[Simulação] Injetando latência forçada de 3.5s no ViaCEP para estourar o limite de 2s...`
        });
        await new Promise(r => setTimeout(r, 3500));
      }

      // Chaos Injection: Force ViaCEP HTTP 500 Error
      if (providerKey === 'viacep' && this.chaosConfig.forceViaCep500) {
        this.emit({
          type: 'CHAOS_INJECTED',
          message: `[Simulação] Injetando erro HTTP 500 Internal Server Error no ViaCEP...`
        });
        const err = new Error('ViaCEP simulou falha 500 Internal Server Error');
        err.status = 500;
        throw err;
      }

      const result = await provider.fetchAddress(cleanCep, controller.signal);
      clearTimeout(timer);
      this.recordSuccess(providerKey);
      return result;
    } catch (err) {
      clearTimeout(timer);
      this.recordFailure(providerKey);
      throw err;
    }
  }

  /**
   * Executes provider call with Polly-style Retry Policy (up to 2 retries on transient errors)
   */
  async executeWithRetry(provider, cleanCep) {
    let attempts = 0;
    const maxRetries = CONFIG.maxRetries;

    while (attempts <= maxRetries) {
      attempts++;
      const startTime = performance.now();

      try {
        this.emit({
          type: 'PROVIDER_CALL_START',
          provider: provider.displayName,
          providerKey: provider.name,
          attempt: attempts,
          cleanCep
        });

        const result = await this.executeWithTimeout(provider, cleanCep);
        const duration = Math.round(performance.now() - startTime);

        this.emit({
          type: 'PROVIDER_CALL_SUCCESS',
          provider: provider.displayName,
          providerKey: provider.name,
          attempt: attempts,
          durationMs: duration
        });

        return { ...result, latencyMs: duration, attemptsUsed: attempts };
      } catch (error) {
        const duration = Math.round(performance.now() - startTime);
        const isTransient = error.name === 'AbortError' || (error.status && error.status >= 500) || error.message.includes('Timeout');

        this.emit({
          type: 'PROVIDER_CALL_FAILURE',
          provider: provider.displayName,
          providerKey: provider.name,
          attempt: attempts,
          durationMs: duration,
          error: error.message,
          isTransient
        });

        // If it's a 404 (not found), do not retry the same provider, try next fallback
        if (error.status === 404) {
          throw error;
        }

        // If attempts reached max or not transient, throw to trigger fallback
        if (attempts > maxRetries || !isTransient) {
          throw error;
        }

        // Backoff with Jitter: delay = base * 2^(attempt-1) + jitter
        const backoff = CONFIG.retryDelayMs * Math.pow(2, attempts - 1) + Math.random() * 100;
        this.emit({
          type: 'RETRY_WAIT',
          provider: provider.displayName,
          attempt: attempts,
          backoffMs: Math.round(backoff)
        });

        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }

  /**
   * Executes full Polly Resilience pipeline with Fallback Chain
   * Primary: ViaCEP -> Fallback 1: BrasilAPI -> Fallback 2: OpenCEP
   */
  async fetchWithResilience(cleanCep) {
    const startTime = performance.now();
    const errorsEncountered = [];

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const isFallback = i > 0;

      if (isFallback) {
        this.emit({
          type: 'FALLBACK_TRIGGERED',
          from: this.providers[i - 1].displayName,
          to: provider.displayName,
          reason: errorsEncountered[errorsEncountered.length - 1]?.message
        });
      }

      try {
        const result = await this.executeWithRetry(provider, cleanCep);
        const totalDuration = Math.round(performance.now() - startTime);

        return {
          ...result,
          totalPipelineDurationMs: totalDuration,
          fallbacksUsed: i,
          errorsEncountered
        };
      } catch (err) {
        errorsEncountered.push({
          provider: provider.displayName,
          message: err.message,
          status: err.status || 500
        });
        // Continue loop to next fallback provider
      }
    }

    // If all providers failed
    const totalDuration = Math.round(performance.now() - startTime);
    const finalError = new Error(`Todos os serviços de CEP (ViaCEP, BrasilAPI e OpenCEP) falharam ou o CEP '${cleanCep}' é inexistente.`);
    finalError.status = 502;
    finalError.errorsEncountered = errorsEncountered;
    finalError.totalPipelineDurationMs = totalDuration;
    throw finalError;
  }
}

export const resilienceEngine = new ResilienceEngine();
