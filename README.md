# Mares de Sangue — Foundry VTT System (`fvtt-maresdesangue`)

Sistema oficial para **Foundry VTT (v13 e v14)** do RPG **Mares de Sangue** — sobrevivência pirata, baixa fantasia e horror marítimo no Caribe, construído sobre a **Escala de Dados (*Step Dice*)** da Year Zero Engine.

## Principais Recursos

- **100% Escala de Dados (*Step Dice*)**: Classificações **D (`D6`)**, **C (`D8`)**, **B (`D10`)** e **A (`D12`)** para Atributos, Perícias, Navio, Chamado e Infâmia, com sucessos em `6+` e sucesso duplo em `10+`.
- **Ciclo de Risco e Recompensa de Mares de Sangue**:
  - **Falhar em um teste de Atributo** (0 sucessos) concede **+1 Ponto de Vontade (PV)**.
  - **Forçar a Rolagem** sempre aplica **1 Condição** no trilho do Atributo usado (`Força`/`Agilidade` → Física; `Astúcia`/`Empatia` → Mental) e, se sair qualquer **`1` (Perdição)** após forçar, soma **+1 ponto de Chamado** (no máximo 1 por rolagem).
- **Condições Narrativas & Lesões Críticas**:
  - 3 espaços para Condições Físicas e 3 para Condições Mentais com descrição livre e severidade (**Leve `−1`**, **Moderada `−2`**, **Grave `−3`** — prevalece a mais severa).
  - Tabelas integradas **D66 de Lesões Críticas Físicas e Mentais** (com adição automática na ficha do personagem).
- **Três Pilares Sobrenaturais**:
  - **O Chamado (0–10)** com Dado de Chamado dinâmico (`D6` a `D12`) e Teste de Chamado.
  - **Vodu** (Legba, Ogou, Erzulie, Baron Samedi, Agwé + tabela D6 de Percalços).
  - **Fé Católica** (Graças + rastreador dos 5 Mandamentos com penalidade automática por violação).
  - **Corrupção das Profundezas** (4 Profundidades que não gastam PV, mas elevam o Chamado).
- **Atores**:
  - **Pirata (`character`)**: Ficha temática náutica em 3 colunas com medalhões de bússola, 12 perícias oficiais com *auto-seed*, 10 arquétipos, Relacionamentos, Carga em Punhados, Tesouro (*Punhados/Sacos/Baús/Tesouros*), Consumíveis (1–6 com Rolagem de Suprimento), Rum, Magia e Efeitos.
  - **PNJ / Monstro (`npc`)**: Suporte a Feras, Horrores do Mar, Mortos-Vivos, Entidades e Humanos, incluindo tabela de **Ataques Monstruosos (D6)**.
  - **Navio / A Arca (`ship`)**: Casco, Velas, Canhões, Carga, Condições Físicas e de Combate, Infâmia (`D6–D12`), Lealdade (`0–5`), Papéis a Bordo, Postura Tática e Módulos.
- **Bilíngue (`pt-BR` e `en`)**: Validado via `node scripts/check-i18n.mjs`.

## Instalação no Foundry VTT (v13 / v14)

Use a URL de manifesto abaixo na aba **Sistemas de Jogo → Instalar Sistema**:

```
https://github.com/diogolabs/fvtt-maresdesangue/releases/latest/download/system.json
```

## Desenvolvimento e Validação

```bash
# Validar paridade e referências de internacionalização (pt-BR e en)
node scripts/check-i18n.mjs

# Gerar artefatos de release (system.json + system.zip)
node scripts/package-release.mjs v1.0.0
```

## Licença

- **Código**: MIT License (utiliza [YZUR](https://github.com/Stefouch/foundry-year-zero-roller) de Stefouch, sob licença MIT).
- **Regras**: Baseado no *Year Zero Engine Standard Reference Document v1.0* © 2023 Fria Ligan AB, sob a **Year Zero Engine Free Tabletop License (FTL)**.
