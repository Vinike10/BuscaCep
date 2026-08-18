using System.Diagnostics;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using BuscaCep.Api.Models;
using Microsoft.Extensions.Caching.Memory;

namespace BuscaCep.Api.Services;

public class CepResilienceService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CepResilienceService> _logger;

    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(24);

    public CepResilienceService(
        IHttpClientFactory httpClientFactory, 
        IMemoryCache cache,
        ILogger<CepResilienceService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _cache = cache;
        _logger = logger;
    }

    public async Task<(bool Success, AddressResponse? Address, string? ErrorMessage)> GetAddressAsync(string rawCep, CancellationToken cancellationToken = default)
    {
        // 1. Validação Estrita (sem caracteres especiais, apenas 8 dígitos)
        string cleanCep = Regex.Replace(rawCep ?? string.Empty, @"\D", "");
        if (cleanCep.Length != 8 || Regex.IsMatch(cleanCep, @"^(\d)\1{7}$"))
        {
            return (false, null, $"O CEP '{rawCep}' é inválido. Informe exatamente 8 dígitos válidos.");
        }

        // 2. Caching de 24 horas (Cache Hit Instantâneo / 0ms)
        string cacheKey = $"cep_{cleanCep}";
        if (_cache.TryGetValue(cacheKey, out AddressResponse? cachedAddress) && cachedAddress != null)
        {
            _logger.LogInformation("Cache Hit para CEP {Cep}", cleanCep);
            return (true, cachedAddress with { EmCache = true, LatenciaMs = 0 }, null);
        }

        var sw = Stopwatch.StartNew();

        // 3. Consulta Primária: ViaCEP com Polly Timeout (2s) e Retry
        try
        {
            var viaCepClient = _httpClientFactory.CreateClient("ViaCep");
            var viaCepResult = await viaCepClient.GetFromJsonAsync<ViaCepDto>($"ws/{cleanCep}/json/", cancellationToken);

            if (viaCepResult != null && viaCepResult.Erro == null)
            {
                sw.Stop();
                var enriched = new AddressResponse
                {
                    Cep = $"{cleanCep.Substring(0, 5)}-{cleanCep.Substring(5)}",
                    Logradouro = viaCepResult.Logradouro ?? string.Empty,
                    Complemento = viaCepResult.Complemento ?? string.Empty,
                    Bairro = viaCepResult.Bairro ?? string.Empty,
                    Cidade = viaCepResult.Localidade ?? string.Empty,
                    Uf = viaCepResult.Uf?.ToUpper() ?? string.Empty,
                    Ibge = viaCepResult.Ibge ?? string.Empty,
                    Ddd = viaCepResult.Ddd ?? string.Empty,
                    Provedor = "ViaCEP",
                    EmCache = false,
                    LatenciaMs = sw.ElapsedMilliseconds
                };

                _cache.Set(cacheKey, enriched, CacheDuration);
                return (true, enriched, null);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ou Timeout no ViaCEP para CEP {Cep}. Ativando Fallback BrasilAPI...", cleanCep);
        }

        // 4. Fallback Automático: BrasilAPI
        try
        {
            var brasilApiClient = _httpClientFactory.CreateClient("BrasilApi");
            var brasilApiResult = await brasilApiClient.GetFromJsonAsync<BrasilApiDto>($"api/cep/v2/{cleanCep}", cancellationToken);

            if (brasilApiResult != null)
            {
                sw.Stop();
                var enriched = new AddressResponse
                {
                    Cep = $"{cleanCep.Substring(0, 5)}-{cleanCep.Substring(5)}",
                    Logradouro = brasilApiResult.Street ?? string.Empty,
                    Complemento = string.Empty,
                    Bairro = brasilApiResult.Neighborhood ?? string.Empty,
                    Cidade = brasilApiResult.City ?? string.Empty,
                    Uf = brasilApiResult.State?.ToUpper() ?? string.Empty,
                    Provedor = "BrasilAPI (Fallback)",
                    EmCache = false,
                    LatenciaMs = sw.ElapsedMilliseconds
                };

                _cache.Set(cacheKey, enriched, CacheDuration);
                return (true, enriched, null);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fallback BrasilAPI também falhou para CEP {Cep}.", cleanCep);
        }

        sw.Stop();
        return (false, null, $"Não foi possível localizar o CEP '{cleanCep}' nos serviços integrados.");
    }
}
