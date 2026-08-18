import { CONFIG } from '../config.js';

/**
 * Adapter for OpenCEP (Tertiary Fallback)
 */
export class OpenCepProvider {
  static name = 'opencep';
  static displayName = 'OpenCEP';

  /**
   * Executes fetch to OpenCEP
   * @param {string} cleanCep
   * @param {AbortSignal} signal
   * @returns {Promise<object>}
   */
  static async fetchAddress(cleanCep, signal) {
    const url = CONFIG.providers.opencep.url(cleanCep);
    const response = await fetch(url, { signal });

    if (response.status === 404) {
      const err = new Error(`CEP '${cleanCep}' não foi encontrado no OpenCEP`);
      err.status = 404;
      throw err;
    }

    if (!response.ok) {
      throw new Error(`OpenCEP retornou status HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      cep: cleanCep,
      logradouro: data.logradouro || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      cidade: data.localidade || '',
      uf: (data.uf || '').toUpperCase(),
      ibge: data.ibge || '',
      gia: '',
      ddd: '',
      siafi: '',
      coordinates: null,
      provider: this.displayName
    };
  }
}
