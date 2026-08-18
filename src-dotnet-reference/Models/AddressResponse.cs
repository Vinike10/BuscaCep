using System.Text.Json.Serialization;

namespace BuscaCep.Api.Models;

public record AddressResponse
{
    [JsonPropertyName("cep")]
    public string Cep { get; init; } = string.Empty;

    [JsonPropertyName("logradouro")]
    public string Logradouro { get; init; } = string.Empty;

    [JsonPropertyName("complemento")]
    public string Complemento { get; init; } = string.Empty;

    [JsonPropertyName("bairro")]
    public string Bairro { get; init; } = string.Empty;

    [JsonPropertyName("cidade")]
    public string Cidade { get; init; } = string.Empty;

    [JsonPropertyName("uf")]
    public string Uf { get; init; } = string.Empty;

    [JsonPropertyName("estado")]
    public string Estado { get; init; } = string.Empty;

    [JsonPropertyName("regiao")]
    public string Regiao { get; init; } = string.Empty;

    [JsonPropertyName("ibge")]
    public string Ibge { get; init; } = string.Empty;

    [JsonPropertyName("ddd")]
    public string Ddd { get; init; } = string.Empty;

    [JsonPropertyName("provedor")]
    public string Provedor { get; init; } = string.Empty;

    [JsonPropertyName("emCache")]
    public bool EmCache { get; init; } = false;

    [JsonPropertyName("latenciaMs")]
    public long LatenciaMs { get; init; } = 0;
}

public record ViaCepDto
{
    [JsonPropertyName("cep")] public string? Cep { get; init; }
    [JsonPropertyName("logradouro")] public string? Logradouro { get; init; }
    [JsonPropertyName("complemento")] public string? Complemento { get; init; }
    [JsonPropertyName("bairro")] public string? Bairro { get; init; }
    [JsonPropertyName("localidade")] public string? Localidade { get; init; }
    [JsonPropertyName("uf")] public string? Uf { get; init; }
    [JsonPropertyName("ibge")] public string? Ibge { get; init; }
    [JsonPropertyName("ddd")] public string? Ddd { get; init; }
    [JsonPropertyName("erro")] public object? Erro { get; init; }
}

public record BrasilApiDto
{
    [JsonPropertyName("cep")] public string? Cep { get; init; }
    [JsonPropertyName("state")] public string? State { get; init; }
    [JsonPropertyName("city")] public string? City { get; init; }
    [JsonPropertyName("neighborhood")] public string? Neighborhood { get; init; }
    [JsonPropertyName("street")] public string? Street { get; init; }
    [JsonPropertyName("service")] public string? Service { get; init; }
}
