using BuscaCep.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Polly;

var builder = WebApplication.CreateBuilder(args);

// Adiciona Memory Cache para suporte a 24h TTL
builder.Services.AddMemoryCache();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configura HttpClient do ViaCEP com Polly Resilience Pipeline (Timeout de 2s e Retry)
builder.Services.AddHttpClient("ViaCep", client =>
{
    client.BaseAddress = new Uri("https://viacep.com.br/");
    client.Timeout = TimeSpan.FromSeconds(2); // Timeout máximo de 2 segundos
})
.AddStandardResilienceHandler(options =>
{
    options.AttemptTimeout.Timeout = TimeSpan.FromSeconds(2);
    options.Retry.MaxRetryAttempts = 2; // Até 2 tentativas
    options.Retry.BackoffType = DelayBackoffType.Exponential;
    options.Retry.UseJitter = true;
});

// Configura HttpClient do BrasilAPI (Fallback)
builder.Services.AddHttpClient("BrasilApi", client =>
{
    client.BaseAddress = new Uri("https://brasilapi.com.br/");
    client.Timeout = TimeSpan.FromSeconds(3);
});

// Registra Serviço de Resiliência
builder.Services.AddScoped<CepResilienceService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Endpoint Principal de Busca de CEP
app.MapGet("/api/cep/{cep}", async (string cep, [FromServices] CepResilienceService service, CancellationToken ct) =>
{
    var (success, address, errorMessage) = await service.GetAddressAsync(cep, ct);

    if (!success)
    {
        return Results.Problem(
            statusCode: StatusCodes.Status400BadRequest,
            title: "Erro na Consulta de CEP",
            detail: errorMessage,
            instance: $"/api/cep/{cep}",
            type: "https://buscacep.dev/errors/400"
        );
    }

    return Results.Ok(address);
})
.WithName("GetAddressByCep")
.WithSummary("Consulta e valida CEP com resiliência Polly, Fallback para BrasilAPI e Caching de 24h")
.Produces(StatusCodes.Status200OK)
.ProducesProblem(StatusCodes.Status400BadRequest);

app.Run();
