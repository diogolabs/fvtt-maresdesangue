# Changelog

## 1.0.1
- Adicionado plano de fundo temático de convés submerso e tentáculos (`assets/img/sheet-bg.jpg`) na ficha.
- Reforçado contraste geral da paleta (pergaminho envelhecido, cabeçalhos vermelho-sangue, bordas e anéis de latão) e corrigido sobrescrita de cores do tema escuro/claro do Foundry VTT v13/v14 em inputs, selects e botões.

## 1.0.0
- Lançamento inicial do sistema **Mares de Sangue** (`fvtt-maresdesangue`) para **Foundry VTT v13 e v14**.
- Motor 100% baseado em **Escala de Dados (*Step Dice*)**: `D (D6)`, `C (D8)`, `B (D10)`, `A (D12)`.
- Regras oficiais do cenário:
  - 4 Atributos (*Força, Agilidade, Astúcia, Empatia*), 12 Perícias oficiais (com *auto-seed*) e 10 Arquétipos.
  - Sistema de **Condições Narrativas** (3 Físicas + 3 Mentais com severidade Leve / Moderada / Grave e Quebra com tabelas D66 de Lesões Críticas).
  - **Pontos de Vontade (PV)** ganhos automaticamente ao falhar em testes de Atributo (0 sucessos) e consumindo Rum.
  - **Forçar Rolagem**: aplica automaticamente 1 Condição no trilho do Atributo usado e soma **+1 ponto de Chamado** (máx. 1 por rolagem) se sair qualquer `1` (Perdição).
  - **O Chamado (0–10)** com Dado de Chamado (`D6–D12`) e Teste de Chamado.
  - **Três Tradições Mágicas**: Vodu (5 Loa + Percalços D6), Fé Católica (Graças + 5 Mandamentos) e Corrupção das Profundezas (4 Profundidades).
  - **Carga em Punhados**, Tesouro (*Punhados / Sacos / Baús / Tesouros*) e **Consumíveis** (*Comida, Água, Munição*) com Rolagem de Suprimento (1–6).
- Ficha do Pirata em 3 colunas com estética náutica sombria e pergaminho envelhecido, além de fichas de **PNJ / Monstro** (com tabela de Ataques Monstruosos D6) e **Navio / A Arca** (Casco, Velas, Canhões, Carga, Condições Físicas e de Combate, Infâmia, Lealdade, Papéis a Bordo e Módulos).
- Localização completa em **Português (Brasil) (`pt-BR`)** e **English (`en`)** com script de validação (`scripts/check-i18n.mjs`) e empacotamento de release (`scripts/package-release.mjs`).
