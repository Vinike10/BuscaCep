import { CodeGenerator } from './codeGenerator.js';
import { cache } from './cacheManager.js';
import { Validator } from './validator.js';
import { BatchService } from './batchService.js';
import { resilienceEngine } from './resilienceEngine.js';

/**
 * UI Controller & DOM Handler for BuscaCep
 */
export class UI {
  constructor() {
    this.map = null;
    this.mapMarker = null;
    this.currentTheme = localStorage.getItem('buscacep_theme') || 'dark';
    this.selectedLang = 'javascript';
    this.lastSearchedCep = '01001000';
    this.batchResults = [];
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.initMap();
    this.updateCacheMetrics();
    this.renderCodeSnippet();
    this.setupChaosListeners();
  }

  // Theme Management
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(this.currentTheme);
    localStorage.setItem('buscacep_theme', this.currentTheme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) {
      themeIcon.innerHTML = theme === 'dark' 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }
  }

  // Toast System
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warn') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Leaflet Map Initialization
  initMap() {
    const mapEl = document.getElementById('map-container');
    if (!mapEl || typeof L === 'undefined') return;

    try {
      // Default: Center of Brazil (Brasília)
      this.map = L.map('map-container', {
        zoomControl: false,
        attributionControl: false
      }).setView([-15.793889, -47.882778], 4);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(this.map);

      L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    } catch (e) {
      console.warn('Map initialization:', e);
    }
  }

  updateMapLocation(addressData) {
    if (!this.map || typeof L === 'undefined') return;

    // Use actual coordinates if provider returned them
    if (addressData.coordinates && addressData.coordinates.latitude && addressData.coordinates.longitude) {
      const { latitude, longitude } = addressData.coordinates;
      this.setMarker(latitude, longitude, addressData.fullAddress, 16);
      return;
    }

    // Geocoding fallback via Nominatim OpenStreetMap API
    const query = encodeURIComponent(`${addressData.logradouro}, ${addressData.cidade}, ${addressData.uf}, Brasil`);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          this.setMarker(lat, lon, addressData.fullAddress, 16);
        } else {
          // If street level not found, fallback to city/state
          this.fallbackCityGeocode(addressData);
        }
      })
      .catch(() => this.fallbackCityGeocode(addressData));
  }

  fallbackCityGeocode(addressData) {
    const cityQuery = encodeURIComponent(`${addressData.cidade}, ${addressData.uf}, Brasil`);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${cityQuery}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          this.setMarker(lat, lon, `${addressData.cidade} - ${addressData.uf}`, 12);
        }
      })
      .catch(console.warn);
  }

  setMarker(lat, lng, popupText, zoom = 15) {
    if (this.mapMarker) {
      this.map.removeLayer(this.mapMarker);
    }
    this.mapMarker = L.marker([lat, lng]).addTo(this.map);
    this.mapMarker.bindPopup(`<b>${popupText}</b>`).openPopup();
    this.map.setView([lat, lng], zoom);
    
    // Invalidate map size to prevent gray tiles
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }

  // Polly Pipeline Visualizer Updates
  resetPipelineVisualizer() {
    const steps = ['step-cache', 'step-viacep', 'step-brasilapi', 'step-enrichment'];
    steps.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.className = 'pipeline-step';
        const statusEl = el.querySelector('.step-status');
        if (statusEl) statusEl.textContent = 'Aguardando...';
      }
    });
  }

  updatePipelineStep(stepId, state, statusText) {
    const el = document.getElementById(stepId);
    if (el) {
      el.className = `pipeline-step ${state}`;
      const statusEl = el.querySelector('.step-status');
      if (statusEl) statusEl.textContent = statusText;
    }
  }

  // Render Address Details Card
  renderAddressResult(result) {
    const resultsContainer = document.getElementById('result-section');
    if (!resultsContainer) return;
    resultsContainer.style.display = 'block';

    const data = result.data;
    this.lastSearchedCep = data.cepClean;

    // Badge configuration
    const badgeEl = document.getElementById('result-source-badge');
    const badgeClass = result.source.toLowerCase().includes('cache') ? 'cache' 
      : result.source.toLowerCase().includes('via') ? 'viacep'
      : result.source.toLowerCase().includes('brasil') ? 'brasilapi' : 'opencep';
    
    const badgeIcon = result.source === 'cache' ? '⚡' : '🌐';
    badgeEl.className = `source-badge ${badgeClass}`;
    badgeEl.innerHTML = `${badgeIcon} ${result.source.toUpperCase()} (${result.latencyMs}ms)`;

    // Fields
    document.getElementById('result-cep-text').textContent = data.cep;
    document.getElementById('result-logradouro').textContent = data.logradouro;
    document.getElementById('result-bairro-cidade').textContent = `${data.bairro} • ${data.cidade} - ${data.uf}`;
    document.getElementById('result-estado').textContent = `${data.estado} (${data.regiao})`;
    document.getElementById('result-ibge').textContent = data.ibge || '-';
    document.getElementById('result-ddd').textContent = data.ddd ? `(${data.ddd})` : '-';
    document.getElementById('result-siafi').textContent = data.siafi || '-';

    // External Maps links
    document.getElementById('btn-google-maps').href = data.links.googleMaps;
    document.getElementById('btn-waze').href = data.links.waze;

    // JSON Viewer
    const jsonPre = document.getElementById('json-output');
    if (jsonPre) {
      jsonPre.textContent = JSON.stringify(result, null, 2);
    }

    // Update map
    this.updateMapLocation(data);

    // Update code snippet for this CEP
    this.renderCodeSnippet();
    this.updateCacheMetrics();
  }

  // Render Error Response (RFC 7807)
  renderErrorResult(errResult) {
    const resultsContainer = document.getElementById('result-section');
    if (resultsContainer) resultsContainer.style.display = 'none';

    const errorSection = document.getElementById('error-section');
    if (errorSection) {
      errorSection.style.display = 'block';
      document.getElementById('error-title').textContent = errResult.error.title;
      document.getElementById('error-detail').textContent = errResult.error.detail;
      document.getElementById('error-json-output').textContent = JSON.stringify(errResult.error, null, 2);
    }

    this.showToast(errResult.error.detail || errResult.error.title, 'error');
  }

  hideError() {
    const errorSection = document.getElementById('error-section');
    if (errorSection) errorSection.style.display = 'none';
  }

  // Code Snippet Generator
  setLang(lang) {
    this.selectedLang = lang;
    document.querySelectorAll('.lang-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    this.renderCodeSnippet();
  }

  renderCodeSnippet() {
    const pre = document.getElementById('code-snippet-pre');
    if (pre) {
      pre.textContent = CodeGenerator.generate(this.selectedLang, this.lastSearchedCep);
    }
  }

  // Cache Metrics & Explorer
  updateCacheMetrics() {
    const stats = cache.getStats();
    const hitRateEl = document.getElementById('metric-hit-rate');
    const totalQueriesEl = document.getElementById('metric-total-queries');
    const savedTimeEl = document.getElementById('metric-saved-time');
    const cachedItemsEl = document.getElementById('metric-cached-items');

    if (hitRateEl) hitRateEl.textContent = stats.hitRatio;
    if (totalQueriesEl) totalQueriesEl.textContent = stats.totalQueries;
    if (savedTimeEl) savedTimeEl.textContent = `${stats.timeSavedSeconds}s`;
    if (cachedItemsEl) cachedItemsEl.textContent = stats.itemsCount;

    this.renderCacheTable();
  }

  renderCacheTable() {
    const tableBody = document.getElementById('cache-table-body');
    if (!tableBody) return;

    const items = cache.getAll();
    if (items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:1.5rem;">Nenhum CEP armazenado no cache no momento.</td></tr>`;
      return;
    }

    tableBody.innerHTML = items.map(item => {
      const remainingMinutes = Math.round(item.ttlRemainingMs / (1000 * 60));
      return `
        <tr>
          <td><strong>${item.cep}</strong></td>
          <td>${item.logradouro}</td>
          <td>${item.cidade} / ${item.uf}</td>
          <td>${remainingMinutes} min restante</td>
          <td>
            <button class="btn-action" style="padding:0.25rem 0.5rem;font-size:0.7rem;" onclick="window.app.deleteCacheItem('${item.cepClean}')">
              Excluir
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Chaos Log Stream & Event Handlers
  setupChaosListeners() {
    resilienceEngine.onEvent(event => {
      this.logToConsole(event);
      this.handlePipelineAnimation(event);
    });
  }

  logToConsole(event) {
    const stream = document.getElementById('log-stream');
    if (!stream) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const time = new Date().toLocaleTimeString();

    let tagClass = 'info';
    let tagText = event.type;

    if (event.type.includes('SUCCESS') || event.type === 'CACHE_HIT') {
      tagClass = 'success';
    } else if (event.type.includes('FAILURE') || event.type.includes('CIRCUIT_OPEN')) {
      tagClass = 'error';
    } else if (event.type.includes('RETRY') || event.type.includes('FALLBACK') || event.type.includes('CHAOS')) {
      tagClass = 'warn';
    }

    let message = '';
    if (event.type === 'PROVIDER_CALL_START') {
      message = `Iniciando tentativa #${event.attempt} em ${event.provider} para CEP ${event.cleanCep}...`;
    } else if (event.type === 'PROVIDER_CALL_SUCCESS') {
      message = `${event.provider} respondeu com SUCESSO em ${event.durationMs}ms.`;
    } else if (event.type === 'PROVIDER_CALL_FAILURE') {
      message = `Falha na tentativa #${event.attempt} de ${event.provider} (${event.error}) [${event.durationMs}ms]`;
    } else if (event.type === 'RETRY_WAIT') {
      message = `[Polly Retry] Aguardando backoff de ${event.backoffMs}ms antes da tentativa #${event.attempt + 1} em ${event.provider}...`;
    } else if (event.type === 'FALLBACK_TRIGGERED') {
      message = `[Polly Fallback] ⚠️ Redirecionando requisição de ${event.from} ➔ ${event.to} (Motivo: ${event.reason})`;
    } else if (event.type === 'CACHE_HIT') {
      message = `[Cache 24h] ⚡ CEP ${event.cleanCep} recuperado da memória (0ms)!`;
    } else if (event.type === 'CACHE_MISS') {
      message = `[Cache 24h] CEP ${event.cleanCep} não encontrado em cache. Consultando provedores externos...`;
    } else {
      message = event.message || JSON.stringify(event);
    }

    entry.innerHTML = `
      <span class="log-time">[${time}]</span>
      <span class="log-tag ${tagClass}">${tagText}</span>
      <span>${message}</span>
    `;

    stream.appendChild(entry);
    stream.scrollTop = stream.scrollHeight;
  }

  handlePipelineAnimation(event) {
    if (event.type === 'CACHE_HIT') {
      this.updatePipelineStep('step-cache', 'success', '⚡ Hit (0ms)');
      this.updatePipelineStep('step-viacep', 'skipped', 'Pulado');
      this.updatePipelineStep('step-brasilapi', 'skipped', 'Pulado');
      this.updatePipelineStep('step-enrichment', 'success', 'Concluído');
    } else if (event.type === 'CACHE_MISS') {
      this.updatePipelineStep('step-cache', 'skipped', 'Miss (Não em cache)');
      this.updatePipelineStep('step-viacep', 'active', 'Consultando...');
    } else if (event.type === 'PROVIDER_CALL_SUCCESS' && event.providerKey === 'viacep') {
      this.updatePipelineStep('step-viacep', 'success', `Sucesso (${event.durationMs}ms)`);
      this.updatePipelineStep('step-brasilapi', 'skipped', 'Desnecessário');
      this.updatePipelineStep('step-enrichment', 'success', 'Formatado');
    } else if (event.type === 'PROVIDER_CALL_FAILURE' && event.providerKey === 'viacep') {
      this.updatePipelineStep('step-viacep', 'failed', 'Falha / Timeout');
      this.updatePipelineStep('step-brasilapi', 'active', 'Ativando Fallback...');
    } else if (event.type === 'PROVIDER_CALL_SUCCESS' && event.providerKey === 'brasilapi') {
      this.updatePipelineStep('step-brasilapi', 'success', `Sucesso (${event.durationMs}ms)`);
      this.updatePipelineStep('step-enrichment', 'success', 'Formatado');
    }
  }
}

export const ui = new UI();
