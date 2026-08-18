name: 🐛 Relato de Bug
description: Reporte um erro ou comportamento inesperado no BuscaCep.
title: "[Correção]: "
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: Obrigado por relatar o problema! Forneça detalhes para reprodução.
  - type: input
    id: cep
    attributes:
      label: CEP Consultado
      description: Qual CEP gerou o comportamento inesperado?
      placeholder: "Ex: 01001-000"
    validations:
      required: true
  - type: textarea
    id: description
    attributes:
      label: Descrição do Problema
      description: O que aconteceu e qual era o comportamento esperado?
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Passos para Reproduzir
      placeholder: |
        1. Acesse a aba de busca
        2. Digite o CEP '...'
        3. Observe o erro...
    validations:
      required: true
