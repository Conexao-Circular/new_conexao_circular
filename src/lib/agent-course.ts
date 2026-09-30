export const AGENT_COURSE_PASSING_SCORE = 80;

export const AGENT_COURSE_MODULES = [
  {
    id: "territorio",
    number: 1,
    title: "Conexão Circular",
    summary: "Entenda a rede, o papel do Agente Circular e as oportunidades do território.",
    duration: "15 min",
    lessons: [
      "Economia circular na prática: reduzir, reutilizar, reparar e encaminhar melhor.",
      "O agente como ponte entre pessoas, negócios, cooperativas e soluções locais.",
      "Como observar um problema sem prometer o que a rede ainda não oferece.",
    ],
    quiz: [
      {
        id: "territorio-1",
        question: "Qual é a função central de um Agente Circular?",
        options: [
          "Vender qualquer produto em nome da plataforma.",
          "Conectar uma necessidade local a um encaminhamento circular confiável.",
          "Aprovar sozinho novos parceiros da rede.",
          "Garantir retorno financeiro para toda indicação.",
        ],
      },
      {
        id: "territorio-2",
        question: "Uma abordagem circular começa por qual atitude?",
        options: [
          "Compreender o contexto e a necessidade antes de indicar uma solução.",
          "Publicar a indicação imediatamente.",
          "Escolher a solução com maior preço.",
          "Pedir dados pessoais completos da pessoa interessada.",
        ],
      },
      {
        id: "territorio-3",
        question: "O que deve ser evitado em uma conversa com a comunidade?",
        options: [
          "Registrar uma dúvida para retorno.",
          "Explicar os limites da rede.",
          "Prometer resultado, comissão ou disponibilidade sem confirmação.",
          "Perguntar qual é o objetivo da pessoa.",
        ],
      },
      {
        id: "territorio-4",
        question: "Qual exemplo representa melhor uma solução circular?",
        options: [
          "Descartar um item reutilizável sem procurar destino.",
          "Conectar um material a uma cooperativa que confirmou capacidade de recebê-lo.",
          "Enviar o mesmo anúncio para todos os contatos.",
          "Comprar um produto novo sem considerar reparo.",
        ],
      },
      {
        id: "territorio-5",
        question: "A formação P0 deve preparar o agente para…",
        options: [
          "Publicar automaticamente em nome da Conexão Circular.",
          "Operar pagamentos e comissões.",
          "Fazer boas conexões e registrar evidências de uma missão prática.",
          "Alterar dados de outros usuários.",
        ],
      },
    ],
  },
  {
    id: "escuta",
    number: 2,
    title: "Economia Circular",
    summary: "Aprenda os princípios de circularidade e como traduzi-los em conversas úteis.",
    duration: "15 min",
    lessons: [
      "Perguntas abertas para entender a situação sem induzir uma resposta.",
      "Linguagem simples, comunicação inclusiva e consentimento para continuar o contato.",
      "O que fazer quando a demanda não cabe no escopo da rede.",
    ],
    quiz: [
      {
        id: "escuta-1",
        question: "Qual pergunta ajuda mais a entender uma demanda?",
        options: [
          "Você quer comprar o produto mais caro, certo?",
          "Qual resultado você gostaria de alcançar com essa solução?",
          "Posso cadastrar seus documentos agora?",
          "Você aceita receber qualquer oferta?",
        ],
      },
      {
        id: "escuta-2",
        question: "Antes de registrar uma história ou evidência, o agente deve…",
        options: [
          "Pedir consentimento e explicar a finalidade do registro.",
          "Fotografar sem avisar para não interromper a conversa.",
          "Compartilhar o relato em um grupo público.",
          "Solicitar a senha da pessoa.",
        ],
      },
      {
        id: "escuta-3",
        question: "Como agir quando a pessoa pede algo fora do escopo?",
        options: [
          "Inventar uma resposta para manter o interesse.",
          "Encerrar sem explicar nada.",
          "Reconhecer o limite e, se possível, indicar um próximo passo seguro.",
          "Usar a conta de outro agente.",
        ],
      },
      {
        id: "escuta-4",
        question: "Uma comunicação responsável deve ser…",
        options: [
          "Urgente e baseada em medo.",
          "Clara sobre o que é conhecido, estimado e ainda precisa de confirmação.",
          "Cheia de termos técnicos.",
          "Focada apenas no benefício para o agente.",
        ],
      },
      {
        id: "escuta-5",
        question: "O consentimento para contato pode ser tratado como…",
        options: [
          "Desnecessário quando a intenção é ajudar.",
          "Um detalhe que pode ser resolvido depois.",
          "Uma escolha explícita da pessoa, respeitando sua recusa.",
          "Uma autorização para qualquer uso futuro.",
        ],
      },
    ],
  },
  {
    id: "mapeamento",
    number: 3,
    title: "Resíduos e PNRS",
    summary: "Reconheça fluxos de resíduos e encaminhe materiais com responsabilidade.",
    duration: "20 min",
    lessons: [
      "Como comparar uma necessidade com parceiros, produtos e pontos de coleta.",
      "Critérios mínimos: localização, capacidade, prazo, tipo de material e confirmação.",
      "Como registrar uma indicação sem expor dados desnecessários.",
    ],
    quiz: [
      {
        id: "mapeamento-1",
        question: "Qual critério é indispensável antes de encaminhar um resíduo?",
        options: [
          "A cor do logotipo do parceiro.",
          "A confirmação de que o destino aceita aquele tipo de material.",
          "O número de seguidores do agente.",
          "A preferência pessoal do agente.",
        ],
      },
      {
        id: "mapeamento-2",
        question: "Um bom registro de indicação deve conter…",
        options: [
          "Somente a opinião do agente.",
          "O contexto necessário, o encaminhamento e o status de confirmação.",
          "A senha do contato.",
          "Todos os dados pessoais disponíveis.",
        ],
      },
      {
        id: "mapeamento-3",
        question: "Se a capacidade de um parceiro não foi confirmada, o agente deve…",
        options: [
          "Informar que a confirmação ainda está pendente.",
          "Garantir que haverá atendimento.",
          "Criar uma reserva falsa.",
          "Ocultar a incerteza para acelerar a ação.",
        ],
      },
      {
        id: "mapeamento-4",
        question: "Qual dado é geralmente suficiente para uma primeira indicação?",
        options: [
          "Nome, senha e documento.",
          "Necessidade, região aproximada e melhor forma de retorno consentida.",
          "Extrato bancário.",
          "Lista de contatos da pessoa.",
        ],
      },
      {
        id: "mapeamento-5",
        question: "O que torna um encaminhamento auditável?",
        options: [
          "Uma evidência datada e uma descrição objetiva do que foi feito.",
          "Um texto promocional sem data.",
          "A promessa de que tudo deu certo.",
          "Um print sem contexto.",
        ],
      },
    ],
  },
  {
    id: "indicacao",
    number: 4,
    title: "ODS e Impacto",
    summary: "Relacione conexões locais a impacto, cuidado e desenvolvimento sustentável.",
    duration: "15 min",
    lessons: [
      "Como explicar por que uma solução combina com a necessidade apresentada.",
      "Transparência sobre disponibilidade, preço, prazo e responsabilidades.",
      "Quando encaminhar para suporte humano em vez de insistir na conversa.",
    ],
    quiz: [
      {
        id: "indicacao-1",
        question: "Uma indicação contextualizada explica…",
        options: [
          "Apenas que o agente gostou da solução.",
          "A relação entre a necessidade, os critérios e o próximo passo.",
          "Que a plataforma se responsabiliza por qualquer resultado.",
          "Que toda indicação gera pontos.",
        ],
      },
      {
        id: "indicacao-2",
        question: "Como tratar preço e prazo quando ainda não foram confirmados?",
        options: [
          "Apresentá-los como garantidos.",
          "Omiti-los completamente.",
          "Sinalizar que são informações pendentes de confirmação.",
          "Substituí-los por uma estimativa inventada.",
        ],
      },
      {
        id: "indicacao-3",
        question: "O agente deve encaminhar para suporte humano quando…",
        options: [
          "Houver dúvida sobre segurança, privacidade ou uma exceção não prevista.",
          "Quiser evitar registrar o caso.",
          "A pessoa fizer uma pergunta simples.",
          "Tiver pressa para encerrar.",
        ],
      },
      {
        id: "indicacao-4",
        question: "Qual frase é mais adequada?",
        options: [
          "Isso vai funcionar com certeza.",
          "Pelo que você contou, esta opção parece compatível; confirme disponibilidade antes de seguir.",
          "Se não funcionar, a culpa é sua.",
          "Não preciso explicar o próximo passo.",
        ],
      },
      {
        id: "indicacao-5",
        question: "Uma indicação não deve ser usada para…",
        options: [
          "Explicar limites.",
          "Comparar opções.",
          "Disfarçar publicidade como garantia de impacto.",
          "Facilitar uma decisão informada.",
        ],
      },
    ],
  },
  {
    id: "evidencias",
    number: 5,
    title: "Avaliação de Negócios",
    summary: "Observe práticas, contexto e critérios mínimos antes de indicar uma iniciativa.",
    duration: "20 min",
    lessons: [
      "Diferença entre evidência, relato e resultado confirmado.",
      "Como remover dados pessoais desnecessários de fotos, links e descrições.",
      "Evidências aceitas no P0: relato objetivo, link público opcional e data da ação.",
    ],
    quiz: [
      {
        id: "evidencias-1",
        question: "Uma boa evidência deve ser…",
        options: [
          "Objetiva, relacionada à missão e compartilhada com cuidado.",
          "O mais longa possível.",
          "Obrigatoriamente uma foto de rosto.",
          "Publicada em qualquer rede social.",
        ],
      },
      {
        id: "evidencias-2",
        question: "Qual prática reduz exposição de dados?",
        options: [
          "Capturar documentos completos para provar a ação.",
          "Usar apenas o contexto necessário e ocultar dados pessoais.",
          "Enviar a conversa inteira para a plataforma.",
          "Compartilhar o telefone de terceiros.",
        ],
      },
      {
        id: "evidencias-3",
        question: "Um relato de resultado não confirmado deve ser descrito como…",
        options: [
          "Resultado confirmado.",
          "Meta alcançada.",
          "Relato ou encaminhamento pendente de confirmação.",
          "Comissão aprovada.",
        ],
      },
      {
        id: "evidencias-4",
        question: "Qual item é opcional no P0?",
        options: [
          "A descrição do que foi feito.",
          "A data aproximada da ação.",
          "Um link público de evidência.",
          "A validação da própria missão.",
        ],
      },
      {
        id: "evidencias-5",
        question: "Antes de enviar um link, o agente deve verificar…",
        options: [
          "Se ele expõe dados pessoais ou conteúdo que não deveria ser público.",
          "Se tem o maior número de cliques.",
          "Se menciona uma comissão.",
          "Se contém uma senha.",
        ],
      },
    ],
  },
  {
    id: "rede",
    number: 6,
    title: "Missão do Agente",
    summary: "Consolide a jornada e prepare uma missão prática simples e verificável.",
    duration: "15 min",
    lessons: [
      "Como escolher uma missão pequena, concreta e possível de concluir.",
      "Como comunicar o encerramento sem publicar ou prometer automaticamente.",
      "O que fica para fases futuras: métricas, comissões e publicação assistida.",
    ],
    quiz: [
      {
        id: "rede-1",
        question: "Uma boa missão prática P0 é…",
        options: [
          "Única, específica, possível de verificar e ligada ao território.",
          "Uma campanha pública sem limite.",
          "Uma promessa de resultado financeiro.",
          "Uma ação que exige dados de muitas pessoas.",
        ],
      },
      {
        id: "rede-2",
        question: "Ao concluir a formação, o agente pode…",
        options: [
          "Registrar uma missão e suas evidências para análise futura.",
          "Publicar automaticamente qualquer conteúdo.",
          "Aprovar novos agentes.",
          "Alterar o perfil de outro usuário.",
        ],
      },
      {
        id: "rede-3",
        question: "Qual afirmação sobre comissões no P0 é correta?",
        options: [
          "Toda indicação gera comissão imediata.",
          "A comissão é calculada no navegador.",
          "A comissão real não faz parte deste fluxo inicial.",
          "O agente deve cobrar diretamente da pessoa indicada.",
        ],
      },
      {
        id: "rede-4",
        question: "O painel básico deve ajudar o agente a acompanhar…",
        options: [
          "Indicações, progresso e evidências registradas.",
          "Senhas de contatos.",
          "Dados privados de outros usuários.",
          "Pagamentos futuros garantidos.",
        ],
      },
      {
        id: "rede-5",
        question: "Se uma evidência não puder ser compartilhada publicamente, o agente deve…",
        options: [
          "Publicá-la mesmo assim.",
          "Remover dados sensíveis e, se necessário, registrar apenas um relato seguro.",
          "Pedir a senha da pessoa.",
          "Inventar um link alternativo.",
        ],
      },
    ],
  },
] as const;

export type AgentCourseModule = (typeof AGENT_COURSE_MODULES)[number];
export type AgentModuleId = AgentCourseModule["id"];
export type AgentQuizQuestion = AgentCourseModule["quiz"][number];

export type AgentCourseState = {
  completedModuleIds: AgentModuleId[];
  passedModuleIds: AgentModuleId[];
  quizScores: Partial<Record<AgentModuleId, number>>;
  quizAttempts: Partial<Record<AgentModuleId, number>>;
  courseCompleted: boolean;
  updatedAt: string | null;
};

export type QuizAnswerMap = Record<string, number>;

export function emptyAgentCourseState(): AgentCourseState {
  return {
    completedModuleIds: [],
    passedModuleIds: [],
    quizScores: {},
    quizAttempts: {},
    courseCompleted: false,
    updatedAt: null,
  };
}

export function getAgentCourseModule(moduleId: string): AgentCourseModule | null {
  return AGENT_COURSE_MODULES.find((module) => module.id === moduleId) ?? null;
}

export function isAgentModuleId(value: unknown): value is AgentModuleId {
  return typeof value === "string" && getAgentCourseModule(value) !== null;
}

function uniqueModuleIds(values: unknown): AgentModuleId[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter(isAgentModuleId))];
}

function safeScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function normalizeAgentCourseState(value: unknown): AgentCourseState {
  const fallback = emptyAgentCourseState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;

  const raw = value as Record<string, unknown>;
  const completedModuleIds = uniqueModuleIds(raw.completedModuleIds);
  const rawPassedIds = uniqueModuleIds(raw.passedModuleIds);
  const rawScores = raw.quizScores && typeof raw.quizScores === "object" && !Array.isArray(raw.quizScores)
    ? (raw.quizScores as Record<string, unknown>)
    : {};
  const rawAttempts = raw.quizAttempts && typeof raw.quizAttempts === "object" && !Array.isArray(raw.quizAttempts)
    ? (raw.quizAttempts as Record<string, unknown>)
    : {};
  const quizScores: Partial<Record<AgentModuleId, number>> = {};
  const quizAttempts: Partial<Record<AgentModuleId, number>> = {};

  for (const courseModule of AGENT_COURSE_MODULES) {
    const score = safeScore(rawScores[courseModule.id]);
    if (score !== null) quizScores[courseModule.id] = score;

    const attempts = rawAttempts[courseModule.id];
    if (typeof attempts === "number" && Number.isFinite(attempts)) {
      quizAttempts[courseModule.id] = Math.min(99, Math.max(0, Math.floor(attempts)));
    }
  }

  const passedModuleIds = AGENT_COURSE_MODULES
    .map((module) => module.id)
    .filter((moduleId) => rawPassedIds.includes(moduleId) || (quizScores[moduleId] ?? 0) >= AGENT_COURSE_PASSING_SCORE);

  return {
    completedModuleIds,
    passedModuleIds,
    quizScores,
    quizAttempts,
    courseCompleted: passedModuleIds.length === AGENT_COURSE_MODULES.length,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : null,
  };
}

export function getAgentCourseProgressPercent(state: AgentCourseState): number {
  return Math.round((state.passedModuleIds.length / AGENT_COURSE_MODULES.length) * 100);
}

export function isAgentModuleUnlocked(state: AgentCourseState, moduleId: AgentModuleId): boolean {
  const index = AGENT_COURSE_MODULES.findIndex((module) => module.id === moduleId);
  if (index <= 0) return true;
  return AGENT_COURSE_MODULES.slice(0, index).every((module) => state.passedModuleIds.includes(module.id));
}

export function markAgentModuleCompleted(state: AgentCourseState, moduleId: AgentModuleId, updatedAt: string): AgentCourseState {
  return normalizeAgentCourseState({
    ...state,
    completedModuleIds: [...state.completedModuleIds, moduleId],
    updatedAt,
  });
}

export function scoreAgentQuiz(
  moduleId: AgentModuleId,
  answers: QuizAnswerMap,
  answerKey: Record<string, number>,
): { correctCount: number; questionCount: number; score: number; passed: boolean } {
  const courseModule = getAgentCourseModule(moduleId);
  if (!courseModule) throw new Error("Módulo de formação inválido.");

  let correctCount = 0;
  for (const question of courseModule.quiz) {
    if (answers[question.id] === answerKey[question.id]) correctCount += 1;
  }

  const questionCount = courseModule.quiz.length;
  const score = Math.round((correctCount / questionCount) * 100);
  return {
    correctCount,
    questionCount,
    score,
    passed: score >= AGENT_COURSE_PASSING_SCORE,
  };
}

export function applyAgentQuizResult(
  state: AgentCourseState,
  moduleId: AgentModuleId,
  score: number,
  updatedAt: string,
): AgentCourseState {
  const previousScore = state.quizScores[moduleId] ?? 0;
  const nextScore = Math.max(previousScore, score);
  return normalizeAgentCourseState({
    ...state,
    quizScores: { ...state.quizScores, [moduleId]: nextScore },
    quizAttempts: {
      ...state.quizAttempts,
      [moduleId]: (state.quizAttempts[moduleId] ?? 0) + 1,
    },
    passedModuleIds: nextScore >= AGENT_COURSE_PASSING_SCORE
      ? [...state.passedModuleIds, moduleId]
      : state.passedModuleIds,
    updatedAt,
  });
}
