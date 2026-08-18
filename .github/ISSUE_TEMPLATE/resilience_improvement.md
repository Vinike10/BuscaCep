name: 🛡️ Melhoria de Resiliência & Políticas Polly
description: Sugira ajustes em timeouts, retries, backoffs ou novos fallbacks.
title: "[Resiliência]: "
labels: ["resilience", "enhancement"]
body:
  - type: textarea
    id: resilience-proposal
    attributes:
      label: Proposta de Resiliência
      description: Descreva o ajuste na política de resiliência (Timeout, Retry, Fallback, Circuit Breaker).
    validations:
      required: true
