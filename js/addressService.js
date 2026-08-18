import { CONFIG } from './config.js';
import { Validator } from './validator.js';
import { cache } from './cacheManager.js';
import { resilienceEngine } from './resilienceEngine.js';

/**
 * Address Aggregator & Enrichment Service
 */
export class AddressService {
  /**
   * Main query method: Validates -> Checks Cache -> Executes Polly Resilience Engine -> Enriches Data -> Saves Cache
   * @param {string} rawCep
   * @param {object} options
   * @returns {Promise<object>}
   */
  static async searchCep(rawCep, options = {}) {
    // 1. Strict Validation
    const validation = Validator.validate(rawCep);
    if (!validation.isValid) {
      return {
        success: false,
        isValidationError: true,
        error: validation.error
      };
    }

    const cleanCep = validation.cleanCep;
    const bypassCache = options.bypassCache || resilienceEngine.chaosConfig.bypassCache;

    // 2. Check 24-Hour Cache
    if (!bypassCache) {
      const cached = cache.get(cleanCep);
      if (cached) {
        resilienceEngine.emit({
          type: 'CACHE_HIT',
          cleanCep,
          cachedAt: cached.cachedAt
        });
        return {
          success: true,
          data: this.enrichAddress(cached),
          source: 'cache',
          latencyMs: 0
        };
      }
    }

    resilienceEngine.emit({
      type: 'CACHE_MISS',
      cleanCep
    });

    // 3. Execute Polly Resilience Pipeline
    try {
      const result = await resilienceEngine.fetchWithResilience(cleanCep);
      const enriched = this.enrichAddress(result);

      // 4. Save into Cache for 24 hours
      cache.set(cleanCep, enriched);

      return {
        success: true,
        data: enriched,
        source: result.provider,
        latencyMs: result.latencyMs,
        pipelineDurationMs: result.totalPipelineDurationMs,
        fallbacksUsed: result.fallbacksUsed
      };
    } catch (err) {
      const problemDetails = Validator.createProblemDetails({
        status: err.status || 502,
        title: err.status === 404 ? 'CEP Não Localizado' : 'Falha na Consulta de CEP',
        detail: err.message,
        instance: `/api/cep/${cleanCep}`,
        extensions: {
          errorsEncountered: err.errorsEncountered || []
        }
      });

      return {
        success: false,
        isValidationError: false,
        error: problemDetails
      };
    }
  }

  /**
   * Enriches raw address data with state details, geographic region, formatted strings and links
   * @param {object} raw
   * @returns {object}
   */
  static enrichAddress(raw) {
    const ufInfo = CONFIG.ufMap[raw.uf] || { name: raw.uf || '', region: 'Nacional', capital: '' };
    const formattedCep = Validator.formatMask(raw.cep);

    // Build full formatted address line
    const parts = [
      raw.logradouro,
      raw.bairro,
      raw.localidade || raw.cidade,
      raw.uf
    ].filter(p => !!p && p.trim().length > 0);

    const fullAddress = parts.join(', ');

    // External Maps URLs
    const queryEncoded = encodeURIComponent(`${fullAddress}, Brasil`);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${queryEncoded}`;
    const wazeUrl = `https://waze.com/ul?q=${queryEncoded}&navigate=yes`;
    const openStreetMapUrl = `https://www.openstreetmap.org/search?query=${queryEncoded}`;

    return {
      cep: formattedCep,
      cepClean: raw.cep,
      logradouro: raw.logradouro || 'Não informado',
      complemento: raw.complemento || '',
      bairro: raw.bairro || 'Centro / Geral',
      cidade: raw.localidade || raw.cidade || '',
      uf: raw.uf,
      estado: ufInfo.name,
      regiao: ufInfo.region,
      capital: ufInfo.capital,
      ibge: raw.ibge || '',
      ddd: raw.ddd || '',
      siafi: raw.siafi || '',
      coordinates: raw.coordinates || null,
      provider: raw.provider || 'API',
      fullAddress,
      links: {
        googleMaps: googleMapsUrl,
        waze: wazeUrl,
        openStreetMap: openStreetMapUrl
      }
    };
  }
}
