# UX/UI — SHOWCASE

**Fase:** 3 | **Status:** IN_PROGRESS
## Objetivo

Oferecer uma experiência simples, confiável e responsiva para clientes encontrarem e contratarem músicos para eventos, enquanto profissionais gerenciam seu perfil, disponibilidade e contratações.

## Usuários principais

- **Cliente:** cria um evento, encontra músicos, solicita uma contratação, acompanha o status e avalia o serviço.
- **Músico:** configura seu perfil, informa habilidades, gêneros, área de atendimento e disponibilidade, e responde a solicitações.
- **Administrador:** modera usuários, verificações, denúncias e ações de suporte.

## Princípios de experiência

1. **Clareza antes da ação:** cada tela apresenta uma ação principal evidente e o estado atual do processo.
2. **Confiança progressiva:** avaliações, verificação, preço, distância e disponibilidade aparecem antes da solicitação.
3. **Menor esforço:** formulários em etapas curtas, valores preservados ao voltar e validação junto ao campo.
4. **Privacidade por padrão:** a localização exata do músico nunca é exibida; o cliente vê apenas distância e área de atendimento.
5. **Acessibilidade desde o início:** navegação por teclado, foco visível, contraste adequado, rótulos associados e mensagens de erro compreensíveis.

## Fluxo principal do cliente

1. Acessar a busca e informar habilidade, gênero, data, duração e localização do evento.
2. Comparar resultados por relevância, distância, disponibilidade, reputação, preço e verificação.
3. Abrir o perfil do músico e consultar mídia, habilidades, área de atendimento, avaliações e condições.
4. Criar ou revisar os dados do evento.
5. Enviar a solicitação de contratação.
6. Acompanhar os estados: solicitada, aceita, confirmada, em andamento, concluída ou cancelada.
7. Realizar avaliação mútua após a conclusão do evento.

## Fluxo principal do músico

1. Completar o perfil público com nome artístico, biografia, foto, habilidades, gêneros e mídias.
2. Definir área de atendimento, faixa de preço e disponibilidade.
3. Receber solicitações com os dados necessários do evento, sem expor dados privados além do necessário.
4. Aceitar ou recusar a solicitação.
5. Acompanhar agenda, mensagens, pagamento e repasse.
6. Avaliar o cliente após o evento.

## Telas do MVP

### Públicas

- Página inicial com busca principal.
- Resultados com filtros e ordenação.
- Perfil público do músico.
- Login, cadastro e verificação de e-mail.

### Cliente

- Painel de eventos e contratações.
- Criação e edição de evento.
- Detalhes da contratação.
- Chat vinculado à contratação.
- Pagamento, status do escrow e avaliação.

### Músico

- Painel de solicitações.
- Editor de perfil e portfólio.
- Agenda e disponibilidade.
- Detalhes da contratação, chat e repasse.

### Administração

- Usuários e verificações.
- Denúncias e moderação.
- Auditoria de ações relevantes.

## Busca e resultados

Cada resultado deve permitir comparação rápida e apresentar:

- nome artístico e imagem;
- habilidades e gêneros;
- distância aproximada e área de atendimento;
- faixa de preço;
- nota e quantidade de avaliações;
- indicador de verificação;
- disponibilidade compatível, quando conhecida.

O ranking deve seguir o módulo de matching determinístico definido na arquitetura. Filtros e ordenação devem ser preservados durante a navegação e funcionar sem depender de informações privadas do músico.

## Estados e feedback

Toda ação assíncrona deve possuir estados de carregamento, sucesso, erro e ausência de dados. Solicitações e pagamentos devem exibir o estado atual, o próximo passo esperado e, quando aplicável, a ação disponível para cada papel.

Mensagens de erro devem explicar o que ocorreu e como corrigir. Ações irreversíveis, como cancelamento ou bloqueio, exigem confirmação explícita.

## Responsividade

- **Mobile:** navegação prioriza uma coluna, ações principais ficam acessíveis e tabelas tornam-se listas ou seções empilhadas.
- **Desktop:** busca, filtros e comparação aproveitam o espaço horizontal sem criar densidade excessiva.
- Componentes devem manter dimensões estáveis durante carregamento e não depender de hover para revelar informação essencial.

## Componentes base

- cabeçalho com navegação contextual;
- campo de busca e filtros;
- cartão de resultado do músico;
- perfil com abas para apresentação, mídia e avaliações;
- formulário de evento em etapas;
- indicador de status da contratação;
- agenda de disponibilidade;
- conversa vinculada ao evento;
- confirmação para ações destrutivas;
- notificações e mensagens de validação.

## Métricas de UX

- conclusão da busca;
- abertura de perfil a partir dos resultados;
- taxa de solicitação enviada;
- tempo até resposta do músico;
- taxa de aceitação;
- conclusão de contratação;
- avaliações após o evento;
- erros e abandono em formulários.

## Fora do escopo inicial

- matching baseado em IA;
- aplicativo nativo;
- recomendações personalizadas avançadas;
- edição colaborativa de eventos;
- localização exata pública do músico.
