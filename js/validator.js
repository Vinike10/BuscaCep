/**
 * Strict CEP Validator & RFC 7807 Error Builder
 */
export class Validator {
  /**
   * Sanitizes input, removing everything except numeric digits
   * @param {string} rawCep
   * @returns {string} 8-digit numeric string
   */
  static sanitize(rawCep) {
    if (!rawCep || typeof rawCep !== 'string') return '';
    return rawCep.replace(/\D/g, '');
  }

  /**
   * Formats 8 digits as '00000-000'
   * @param {string} cleanCep
   * @returns {string}
   */
  static formatMask(cleanCep) {
    const digits = this.sanitize(cleanCep);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
  }

  /**
   * Validates if CEP is strictly 8 digits and not a known invalid pattern
   * @param {string} rawCep
   * @returns {{ isValid: boolean, error?: object, cleanCep?: string }}
   */
  static validate(rawCep) {
    const clean = this.sanitize(rawCep);

    if (!rawCep || String(rawCep).trim() === '') {
      return {
        isValid: false,
        error: this.createProblemDetails({
          status: 400,
          title: 'CEP Não Informado',
          detail: 'Informe um CEP para realizar a consulta.',
          instance: `/api/cep/`
        })
      };
    }

    if (clean.length !== 8) {
      return {
        isValid: false,
        error: this.createProblemDetails({
          status: 400,
          title: 'Formato de CEP Inválido',
          detail: `O CEP '${rawCep}' deve conter exatamente 8 dígitos numéricos (recebido: ${clean.length}).`,
          instance: `/api/cep/${rawCep}`
        })
      };
    }

    // Check dummy repeated digits (e.g. 00000000, 11111111, etc.)
    if (/^(\d)\1{7}$/.test(clean)) {
      return {
        isValid: false,
        error: this.createProblemDetails({
          status: 400,
          title: 'CEP Inválido ou Sequencial',
          detail: `O CEP '${clean}' é uma sequência inválida e não existe no cadastro nacional.`,
          instance: `/api/cep/${clean}`
        })
      };
    }

    return {
      isValid: true,
      cleanCep: clean
    };
  }

  /**
   * Creates standard RFC 7807 Problem Details object
   * @param {object} params
   * @returns {object}
   */
  static createProblemDetails({ status = 400, title, detail, instance, extensions = {} }) {
    return {
      type: `https://buscacep.dev/errors/${status}`,
      title,
      status,
      detail,
      instance: instance || '/api/cep',
      traceId: `trace-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...extensions
    };
  }
}
