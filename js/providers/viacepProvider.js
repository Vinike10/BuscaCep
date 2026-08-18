import { CONFIG } from '../config.js';

/**
 * Adapter for ViaCEP API
 */
export class ViaCepProvider {
  static name = 'viacep';
  static displayName = 'ViaCEP';

  /**
   * Executes fetch to ViaCEP with timeout
   * @param {string} cleanCep
   * @param {AbortSignal} signal
   * @returns {Promise<object>}
   */
  static async fetchAddress(cleanCep, signal) {
    const url = CONFIG.providers.viacep.url(cleanCep);
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`ViaCEP retornou status HTTP ${response.status}`);
    }

    const data = await response.json();

    // ViaCEP returns { erro: "true" } or { erro: true } for not found
    if (data.erro === true || data.erro === 'true') {
      const err = new Error(`CEP '${cleanCep}' não foi encontrado no ViaCEP`);
      err.status = 404;
      throw err;
    }

    return {
      cep: cleanCep,
      logradouro: data.logradouro || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      cidade: data.localidade || '',
      uf: (data.uf || '').toUpperCase(),
      ibge: data.ibge || '',
      gia: data.gia || '',
      ddd: data.ddd || '',
      siafi: data.siafi || '',
      coordinates: null,
      provider: this.displayName
    };
  }
}
