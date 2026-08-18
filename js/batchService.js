import { AddressService } from './addressService.js';
import { Validator } from './validator.js';

/**
 * Batch CEP Processor & CSV/JSON Exporter
 */
export class BatchService {
  /**
   * Processes a list of raw CEPs with controlled concurrency
   * @param {Array<string>} rawList
   * @param {Function} onProgress (processed, total, currentItem)
   * @returns {Promise<{ results: Array<object>, stats: object }>}
   */
  static async processBatch(rawList, onProgress) {
    const uniqueCeps = Array.from(new Set(rawList.map(s => s.trim()).filter(s => s.length > 0)));
    const total = uniqueCeps.length;
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let cachedCount = 0;

    for (let i = 0; i < total; i++) {
      const item = uniqueCeps[i];
      const res = await AddressService.searchCep(item);

      if (res.success) {
        successCount++;
        if (res.source === 'cache') cachedCount++;
        results.push({
          cep: res.data.cep,
          status: 'Sucesso',
          origem: res.source,
          logradouro: res.data.logradouro,
          bairro: res.data.bairro,
          cidade: res.data.cidade,
          uf: res.data.uf,
          regiao: res.data.regiao,
          ibge: res.data.ibge,
          ddd: res.data.ddd,
          tempoMs: res.latencyMs
        });
      } else {
        errorCount++;
        results.push({
          cep: item,
          status: 'Erro',
          origem: 'N/A',
          logradouro: '-',
          bairro: '-',
          cidade: '-',
          uf: '-',
          regiao: '-',
          ibge: '-',
          ddd: '-',
          erro: res.error.detail || res.error.title,
          tempoMs: 0
        });
      }

      if (typeof onProgress === 'function') {
        onProgress(i + 1, total, results[results.length - 1]);
      }

      // Small pause between items to prevent browser thread locking
      await new Promise(r => setTimeout(r, 40));
    }

    return {
      results,
      stats: {
        total,
        successCount,
        errorCount,
        cachedCount
      }
    };
  }

  /**
   * Generates and downloads a CSV file from results
   * @param {Array<object>} results
   * @param {string} filename
   */
  static exportToCsv(results, filename = 'buscacep_export.csv') {
    if (!results || !results.length) return;

    const headers = Object.keys(results[0]);
    const csvRows = [];
    csvRows.push(headers.join(';'));

    results.forEach(row => {
      const values = headers.map(header => {
        const val = row[header] !== undefined ? String(row[header]) : '';
        // Escape quotes
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(';'));
    });

    const csvString = '\uFEFF' + csvRows.join('\r\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generates and downloads a JSON file from results
   * @param {Array<object>} results
   * @param {string} filename
   */
  static exportToJson(results, filename = 'buscacep_export.json') {
    const jsonString = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
