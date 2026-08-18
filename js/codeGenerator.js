/**
 * Dynamic Code Snippet Generator for 5 Major Languages
 */
export class CodeGenerator {
  /**
   * Generates code snippet for given language and CEP
   * @param {string} lang ('curl' | 'csharp' | 'javascript' | 'python' | 'php')
   * @param {string} cleanCep
   * @returns {string}
   */
  static generate(lang, cleanCep = '01001000') {
    switch (lang) {
      case 'curl':
        return `# Consulta direta via cURL
curl -X GET "https://viacep.com.br/ws/${cleanCep}/json/" \\
  -H "Accept: application/json" \\
  --connect-timeout 2`;

      case 'javascript':
        return `// Consulta com Polly-like Fallback e AbortController (Timeout 2s)
async function buscarCep(cep) {
  const clean = cep.replace(/\\D/g, '');
  if (clean.length !== 8) throw new Error('CEP deve ter 8 dígitos');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

  try {
    // 1. Tenta ViaCEP (Primário)
    const res = await fetch(\`https://viacep.com.br/ws/\${clean}/json/\`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    if (data.erro) throw new Error('CEP não encontrado');
    return data;
  } catch (err) {
    // 2. Fallback automático para BrasilAPI
    console.warn('ViaCEP falhou ou excedeu 2s. Ativando fallback BrasilAPI...', err.message);
    const fallbackRes = await fetch(\`https://brasilapi.com.br/api/cep/v2/\${clean}\`);
    if (!fallbackRes.ok) throw new Error('CEP não encontrado em nenhum provedor');
    return await fallbackRes.json();
  }
}

// Exemplo de execução:
buscarCep('${cleanCep}').then(console.log).catch(console.error);`;

      case 'csharp':
        return `// C# .NET 8 / ASP.NET Core com Microsoft.Extensions.Http.Resilience (Polly v8)
using System.Net.Http.Json;
using Microsoft.Extensions.Caching.Memory;
using Polly;
using Polly.Retry;
using Polly.Timeout;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddMemoryCache();

// 1. Configura HttpClient do ViaCEP com Polly Resilience Pipeline
builder.Services.AddHttpClient("ViaCep", client => {
    client.BaseAddress = new Uri("https://viacep.com.br/");
    client.Timeout = TimeSpan.FromSeconds(2); // Timeout de 2s
}).AddStandardResilienceHandler(options => {
    options.AttemptTimeout.Timeout = TimeSpan.FromSeconds(2);
    options.Retry.MaxRetryAttempts = 2; // Até 2 tentativas
    options.Retry.BackoffType = DelayBackoffType.Exponential;
});

// 2. Configura HttpClient do BrasilAPI (Fallback)
builder.Services.AddHttpClient("BrasilApi", client => {
    client.BaseAddress = new Uri("https://brasilapi.com.br/");
});

var app = builder.Build();

app.MapGet("/api/cep/{cep}", async (string cep, IHttpClientFactory factory, IMemoryCache cache) => {
    string cleanCep = new string(cep.Where(char.IsDigit).ToArray());
    if (cleanCep.Length != 8) 
        return Results.Problem(statusCode: 400, title: "CEP Inválido", detail: "O CEP deve conter 8 dígitos.");

    // 1. Verifica Cache de 24 horas
    if (cache.TryGetValue(cleanCep, out var cachedData))
        return Results.Ok(new { Data = cachedData, Source = "Cache", LatencyMs = 0 });

    // 2. Tenta ViaCEP (Primário)
    try {
        var viaCepClient = factory.CreateClient("ViaCep");
        var result = await viaCepClient.GetFromJsonAsync<object>($"ws/{cleanCep}/json/");
        cache.Set(cleanCep, result, TimeSpan.FromHours(24));
        return Results.Ok(new { Data = result, Source = "ViaCEP" });
    }
    catch {
        // 3. Fallback para BrasilAPI
        var brasilClient = factory.CreateClient("BrasilApi");
        var result = await brasilClient.GetFromJsonAsync<object>($"api/cep/v2/{cleanCep}");
        cache.Set(cleanCep, result, TimeSpan.FromHours(24));
        return Results.Ok(new { Data = result, Source = "BrasilAPI (Fallback)" });
    }
});

app.Run();`;

      case 'python':
        return `# Python 3 com requests, timeout de 2s e Fallback
import requests

def buscar_cep(cep: str):
    clean = "".join(filter(str.isdigit, cep))
    if len(clean) != 8:
        raise ValueError("O CEP deve conter 8 dígitos numéricos.")
    
    # 1. Consulta ViaCEP (com Timeout de 2 segundos)
    try:
        resp = requests.get(f"https://viacep.com.br/ws/{clean}/json/", timeout=2.0)
        resp.raise_for_status()
        data = resp.json()
        if data.get("erro"):
            raise Exception("Não encontrado no ViaCEP")
        return {"data": data, "provider": "ViaCEP"}
    except Exception as e:
        print(f"[Aviso] Falha no ViaCEP ({e}). Acionando fallback BrasilAPI...")
        
    # 2. Fallback para BrasilAPI
    resp_fallback = requests.get(f"https://brasilapi.com.br/api/cep/v2/{clean}", timeout=3.0)
    resp_fallback.raise_for_status()
    return {"data": resp_fallback.json(), "provider": "BrasilAPI (Fallback)"}

if __name__ == "__main__":
    resultado = buscar_cep("${cleanCep}")
    print(resultado)`;

      case 'php':
        return `<?php
// PHP 8 com cURL, Timeout de 2s e Fallback Automático
function buscarCep(string $cep): array {
    $clean = preg_replace('/\\D/', '', $cep);
    if (strlen($clean) !== 8) {
        throw new InvalidArgumentException("O CEP deve conter 8 dígitos.");
    }

    // 1. Tenta ViaCEP (Timeout 2s)
    $ch = curl_init("https://viacep.com.br/ws/{$clean}/json/");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 2);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        if (!isset($data['erro'])) {
            return ['data' => $data, 'provider' => 'ViaCEP'];
        }
    }

    // 2. Fallback para BrasilAPI
    $ch = curl_init("https://brasilapi.com.br/api/cep/v2/{$clean}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    $fallbackResponse = curl_exec($ch);
    curl_close($ch);

    return ['data' => json_decode($fallbackResponse, true), 'provider' => 'BrasilAPI (Fallback)'];
}

$resultado = buscarCep('${cleanCep}');
print_r($resultado);`;

      default:
        return '';
    }
  }
}
