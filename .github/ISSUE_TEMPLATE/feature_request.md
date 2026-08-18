name: 🚀 Nova Funcionalidade
description: Sugira uma nova ideia, provedor ou funcionalidade para o BuscaCep.
title: "[Funcionalidade]: "
labels: ["enhancement"]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problema ou Necessidade
      description: Qual necessidade ou caso de uso esta sugestão atende?
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Solução Proposta
      description: Descreva em detalhes como a funcionalidade deve se comportar.
    validations:
      required: true
