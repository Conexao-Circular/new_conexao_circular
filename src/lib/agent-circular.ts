import "server-only";

import type { AgentModuleId, QuizAnswerMap } from "@/lib/agent-course";
import { scoreAgentQuiz } from "@/lib/agent-course";

export const AGENT_ROLE = "agent_circular" as const;

export function isAgentCircularEnabled() {
  return process.env.AGENT_CIRCULAR_ENABLED !== "false";
}

const QUIZ_ANSWER_KEYS: Record<AgentModuleId, Record<string, number>> = {
  territorio: {
    "territorio-1": 1,
    "territorio-2": 0,
    "territorio-3": 2,
    "territorio-4": 1,
    "territorio-5": 2,
  },
  escuta: {
    "escuta-1": 1,
    "escuta-2": 0,
    "escuta-3": 2,
    "escuta-4": 1,
    "escuta-5": 2,
  },
  mapeamento: {
    "mapeamento-1": 1,
    "mapeamento-2": 1,
    "mapeamento-3": 0,
    "mapeamento-4": 1,
    "mapeamento-5": 0,
  },
  indicacao: {
    "indicacao-1": 1,
    "indicacao-2": 2,
    "indicacao-3": 0,
    "indicacao-4": 1,
    "indicacao-5": 2,
  },
  evidencias: {
    "evidencias-1": 0,
    "evidencias-2": 1,
    "evidencias-3": 2,
    "evidencias-4": 2,
    "evidencias-5": 0,
  },
  rede: {
    "rede-1": 0,
    "rede-2": 0,
    "rede-3": 2,
    "rede-4": 0,
    "rede-5": 1,
  },
};

export function gradeAgentQuiz(moduleId: AgentModuleId, answers: QuizAnswerMap) {
  return scoreAgentQuiz(moduleId, answers, QUIZ_ANSWER_KEYS[moduleId]);
}
