Essas são features a serem implementadas após o MVP na API.
Todas essas ideias precisam passar por PRD, ADR, SPEC e TASK_PLAN antes.

1. Confirmação de mensagens via Whastapp de atendimento

- Usar Evolution API dentro de uma VPS (digitalOcean) para fazer o fluxo completo

2. Setar comissão de venda para cada barbeiro

3. Na tela de barbeiros, mostrar quando ele tem de comissão pendente, e um botão para poder marcar como pago.

4. Aparencia da barbearia customizada

- dar opções de template de como vai aparecer a barbearia da pessoa
- cor pricipal e secundária
- galeria de trabalhos
- redes sociais

5. Bloqueio de horário específico dentro do dia

- Hoje o `BlockedDate` só bloqueia dia inteiro (ex: feriado)
- Futuro: criar entidade `TimeOff` com startTime/endTime (horário local) para bloquear intervalos parciais como "12h30 às 15h30"
- Importante: converter horário local para UTC igual ao slot calculation

6. Automação para limpar dados "apagáveis"

- o script cleanup ja existe, mas precisamos deixar scheduled 1x por semana
