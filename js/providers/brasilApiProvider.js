import { CONFIG } from '../config.js';

/**
 * Adapter for BrasilAPI (CEP v2)
 */
export class BrasilApiProvider {
  static name = 'brasilapi';
  static displayName = 'BrasilAPI';

  /**
   * Executes fetch to BrasilAPI
   * @param {string} cleanCep
   * @param {AbortSignal} signal
   * @returns {Promise<object>}
   */
  static async fetchAddress(cleanCep, signal) {
    const url = CONFIG.providers.brasilapi.url(cleanCep);
    const response = await fetch(url, { signal });

    if (response.status === 404) {
      const err = new Error(`CEP '${cleanCep}' não foi encontrado na BrasilAPI`);
      err.status = 404;
      throw err;
    }

    if (!response.ok) {
      throw new Error(`BrasilAPI retornou status HTTP ${response.status}`);
    }

    const data = await response.json();

    // Extract coordinates if present in v2 response
    let coordinates = null;
    if (data.location && data.location.coordinates) {
      const { longitude, latitude } = data.location.coordinates;
      if (longitude && latitude) {
        coordinates = {
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude)
        };
      }
    }

    return {
      cep: cleanCep,
      logradouro: data.street || '',
      complemento: '',
      bairro: data.neighborhood || '',
      localidade: data.city || '',
      cidade: data.city || '',
      uf: (data.state || '').toUpperCase(),
      ibge: data.ibge || '',
      gia: '',
      ddd: '',
      siafi: '',
      coordinates: coordinates,
      provider: this.displayName
    };
  }
}
