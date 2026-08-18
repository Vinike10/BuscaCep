import { ui } from './ui.js';
import { Validator } from './validator.js';
import { AddressService } from './addressService.js';
import { BatchService } from './batchService.js';
import { resilienceEngine } from './resilienceEngine.js';
import { cache } from './cacheManager.js';

/**
 * Main Application Orchestrator
 */
class App {
  constructor() {
    this.isSearching = false;
    this.batchItems = [];
  }

  init() {
    ui.init();
    this.bindEvents();
    console.log('🚀 BuscaCep Microservice & UI Initialized');
  }

  bindEvents() {
    // Theme Toggle
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => ui.toggleTheme());
    }

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabTarget = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const targetPanel = document.getElementById(`tab-${tabTarget}`);
        if (targetPanel) targetPanel.classList.add('active');

        if (tabTarget === 'search' && ui.map) {
          setTimeout(() => ui.map.invalidateSize(), 200);
        }
      });
    });

    // CEP Input Masking & Auto-search
    const cepInput = document.getElementById('cep-input');
    const clearBtn = document.getElementById('btn-clear-input');

    if (cepInput) {
      cepInput.addEventListener('input', (e) => {
        const raw = e.target.value;
        const formatted = Validator.formatMask(raw);
        e.target.value = formatted;

        if (clearBtn) {
          clearBtn.style.display = raw.length > 0 ? 'flex' : 'none';
        }

        // Auto trigger search on 8 digits
        const clean = Validator.sanitize(formatted);
        if (clean.length === 8 && !this.isSearching) {
          this.executeSearch(clean);
        }
      });

      cepInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.executeSearch(cepInput.value);
        }
      });
    }

    if (clearBtn && cepInput) {
      clearBtn.addEventListener('click', () => {
        cepInput.value = '';
        clearBtn.style.display = 'none';
        cepInput.focus();
      });
    }

    // Search Button
    const searchBtn = document.getElementById('btn-search');
    if (searchBtn && cepInput) {
      searchBtn.addEventListener('click', () => {
        this.executeSearch(cepInput.value);
      });
    }

    // Quick CEP Chips
    document.querySelectorAll('.chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        const cep = chip.dataset.cep;
        if (cepInput) {
          cepInput.value = Validator.formatMask(cep);
          if (clearBtn) clearBtn.style.display = 'flex';
          this.executeSearch(cep);
        }
      });
    });

    // Copy JSON Button
    const copyJsonBtn = document.getElementById('btn-copy-json');
    if (copyJsonBtn) {
      copyJsonBtn.addEventListener('click', () => {
        const jsonText = document.getElementById('json-output').textContent;
        navigator.clipboard.writeText(jsonText).then(() => {
          ui.showToast('JSON copiado para a área de transferência!', 'success');
        });
      });
    }

    // Copy Full Address Button
    const copyAddressBtn = document.getElementById('btn-copy-address');
    if (copyAddressBtn) {
      copyAddressBtn.addEventListener('click', () => {
        const logradouro = document.getElementById('result-logradouro').textContent;
        const bairroCidade = document.getElementById('result-bairro-cidade').textContent;
        const cep = document.getElementById('result-cep-text').textContent;
        const full = `${logradouro}, ${bairroCidade} - CEP: ${cep}`;
        navigator.clipboard.writeText(full).then(() => {
          ui.showToast('Endereço formatado copiado!', 'success');
        });
      });
    }

    // Language Selector for Code Generator
    document.querySelectorAll('.lang-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ui.setLang(btn.dataset.lang);
      });
    });

    // Copy Code Snippet
    const copyCodeBtn = document.getElementById('btn-copy-code');
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', () => {
        const codeText = document.getElementById('code-snippet-pre').textContent;
        navigator.clipboard.writeText(codeText).then(() => {
          ui.showToast('Código copiado com sucesso!', 'success');
        });
      });
    }

    // Chaos & Simulation Toggles
    const toggleTimeout = document.getElementById('toggle-force-timeout');
    const toggle500 = document.getElementById('toggle-force-500');
    const toggleSlow = document.getElementById('toggle-slow-network');
    const toggleBypassCache = document.getElementById('toggle-bypass-cache');

    const updateChaos = () => {
      resilienceEngine.setChaosConfig({
        forceViaCepTimeout: toggleTimeout?.checked || false,
        forceViaCep500: toggle500?.checked || false,
        simulateSlowNetwork: toggleSlow?.checked || false,
        bypassCache: toggleBypassCache?.checked || false
      });
      ui.showToast('Configurações do Simulador de Caos atualizadas.', 'info');
    };

    if (toggleTimeout) toggleTimeout.addEventListener('change', updateChaos);
    if (toggle500) toggle500.addEventListener('change', updateChaos);
    if (toggleSlow) toggleSlow.addEventListener('change', updateChaos);
    if (toggleBypassCache) toggleBypassCache.addEventListener('change', updateChaos);

    // Clear Logs Console
    const clearLogsBtn = document.getElementById('btn-clear-logs');
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', () => {
        const stream = document.getElementById('log-stream');
        if (stream) stream.innerHTML = '';
        ui.showToast('Console de logs limpo.', 'info');
      });
    }

    // Batch Search Controls
    const startBatchBtn = document.getElementById('btn-start-batch');
    const sampleBatchBtn = document.getElementById('btn-sample-batch');
    const exportCsvBtn = document.getElementById('btn-export-csv');
    const exportJsonBtn = document.getElementById('btn-export-json');
    const batchTextarea = document.getElementById('batch-ceps-input');

    if (sampleBatchBtn && batchTextarea) {
      sampleBatchBtn.addEventListener('click', () => {
        batchTextarea.value = [
          '01001-000', // Praça da Sé, SP
          '22041-001', // Copacabana, RJ
          '70150-900', // Brasília, DF
          '96010-000', // Pelotas, RS
          '69005-010', // Teatro Amazonas, AM
          '40020-000', // Pelourinho, Salvador, BA
          '30140-071', // Savassi, Belo Horizonte, MG
          '80020-310'  // Batel, Curitiba, PR
        ].join('\n');
      });
    }

    if (startBatchBtn && batchTextarea) {
      startBatchBtn.addEventListener('click', async () => {
        const lines = batchTextarea.value.split('\n');
        if (lines.length === 0 || !lines[0].trim()) {
          ui.showToast('Insira ao menos um CEP na lista.', 'warn');
          return;
        }

        startBatchBtn.disabled = true;
        startBatchBtn.textContent = 'Processando...';
        const progressBar = document.getElementById('batch-progress-bar');
        const progressText = document.getElementById('batch-progress-text');
        const tableBody = document.getElementById('batch-table-body');
        if (tableBody) tableBody.innerHTML = '';

        const { results, stats } = await BatchService.processBatch(lines, (done, total, last) => {
          const pct = Math.round((done / total) * 100);
          if (progressBar) progressBar.style.width = `${pct}%`;
          if (progressText) progressText.textContent = `${done} de ${total} processados (${pct}%)`;

          if (tableBody) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>${last.cep}</strong></td>
              <td><span class="source-badge ${last.status === 'Sucesso' ? 'brasilapi' : 'cache'}" style="font-size:0.65rem;">${last.status}</span></td>
              <td>${last.origem}</td>
              <td>${last.logradouro}</td>
              <td>${last.cidade} / ${last.uf}</td>
              <td>${last.tempoMs}ms</td>
            `;
            tableBody.appendChild(tr);
          }
        });

        this.batchResults = results;
        startBatchBtn.disabled = false;
        startBatchBtn.textContent = 'Iniciar Busca em Lote';
        ui.showToast(`Lote concluído: ${stats.successCount} sucessos, ${stats.errorCount} falhas.`, 'success');
        ui.updateCacheMetrics();
      });
    }

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        if (!this.batchResults || this.batchResults.length === 0) {
          ui.showToast('Nenhum resultado de lote para exportar.', 'warn');
          return;
        }
        BatchService.exportToCsv(this.batchResults);
        ui.showToast('Arquivo CSV baixado com sucesso!', 'success');
      });
    }

    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        if (!this.batchResults || this.batchResults.length === 0) {
          ui.showToast('Nenhum resultado de lote para exportar.', 'warn');
          return;
        }
        BatchService.exportToJson(this.batchResults);
        ui.showToast('Arquivo JSON baixado com sucesso!', 'success');
      });
    }

    // Cache Clear Button
    const clearCacheBtn = document.getElementById('btn-clear-cache');
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', () => {
        if (confirm('Deseja realmente limpar todo o cache de CEPs?')) {
          cache.clear();
          ui.updateCacheMetrics();
          ui.showToast('Cache esvaziado com sucesso!', 'success');
        }
      });
    }
  }

  async executeSearch(rawCep) {
    if (this.isSearching) return;
    this.isSearching = true;

    ui.hideError();
    ui.resetPipelineVisualizer();

    const searchBtn = document.getElementById('btn-search');
    if (searchBtn) {
      searchBtn.innerHTML = `<span>Buscando...</span>`;
      searchBtn.disabled = true;
    }

    try {
      const result = await AddressService.searchCep(rawCep);

      if (result.success) {
        ui.renderAddressResult(result);
        ui.showToast(`CEP encontrado via ${result.source}!`, 'success');
      } else {
        ui.renderErrorResult(result);
      }
    } catch (e) {
      console.error('Search error:', e);
      ui.renderErrorResult({
        error: {
          title: 'Erro Inesperado',
          detail: e.message || 'Ocorreu um erro ao processar a consulta.',
          status: 500
        }
      });
    } finally {
      this.isSearching = false;
      if (searchBtn) {
        searchBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><span>Consultar</span>`;
        searchBtn.disabled = false;
      }
    }
  }

  deleteCacheItem(cleanCep) {
    cache.delete(cleanCep);
    ui.updateCacheMetrics();
    ui.showToast(`CEP ${cleanCep} removido do cache.`, 'info');
  }
}

window.app = new App();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
