"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Bot,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileText,
  Gift,
  GitBranch,
  Image as ImageIcon,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SalesTrendChart, type SalesTrendPoint } from "@/components/charts/sales-trend-chart";
import { Textarea } from "@/components/ui/textarea";
import {
  APPLICANT_TYPE_LABELS,
  PRODUCER_APPLICATION_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  WASTE_LABELS,
} from "@/lib/labels";
import {
  TIER_ACTIVATION,
  TIER_NAME,
  describeCriteria,
  type NetworkSample,
  type PartnerTierMetrics,
  type TierEvaluation,
} from "@/lib/partner-tier";
import {
  activateSubscription,
  approveUser,
  rejectUser,
  reviewCircularAgent,
  reviewCircularEvidence,
  reviewCircularMission,
  reviewCircularReferral,
  reviewProducerApplication,
  toggleCooperativeStatus,
  updateCooperative,
  updateProduct,
  updateUser,
} from "./actions";

const TRIAL_DAYS = 7;

const METRICS_PERIODS = [
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
];

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  created_at: string;
};

type UserWithAccess = Profile & {
  approval_status: string;
  approved_at: string | null;
  access_override: boolean;
};

type PendingSubscription = { id: string; planName: string };

type Cooperative = {
  id: string;
  name: string;
  type: string;
  status: string;
  contact_name: string | null;
  contact_phone: string | null;
  collects_description: string | null;
  operation_description: string | null;
};

type Product = {
  id: string;
  name: string;
  category: string | null;
  price_cents: number;
  status: string;
  description: string | null;
};

type Metrics = {
  totalUsers: number;
  payingUsers: number;
  freeUsers: number;
  activeCooperatives: number;
  pendingApprovals: number;
  pendingCuration: number;
};

type ProducerApplicationDocument = {
  id: string;
  documentType: string;
  label: string | null;
  url: string | null;
};

type ProducerApplication = {
  id: string;
  profileId: string;
  applicantType: string;
  name: string;
  email: string;
  cnpj: string;
  razaoSocial: string;
  responsavelNome: string;
  responsavelTelefone: string | null;
  contatoEmail: string | null;
  businessAddress: Record<string, string> | null;
  businessSize: string | null;
  foundedYear: number | null;
  websiteUrl: string | null;
  stateRegistration: string | null;
  wasteType: string | null;
  capacityKgDay: number | null;
  serviceArea: string | null;
  sustainabilityDescription: string;
  materialOrigin: string;
  operationDescription: string;
  bankName: string | null;
  bankAccountType: string | null;
  bankAgency: string | null;
  bankAccount: string | null;
  pixKey: string | null;
  status: string;
  reviewNote: string | null;
  submittedAt: string;
  documents: ProducerApplicationDocument[];
};

function formatAddress(address: Record<string, string> | null) {
  if (!address) return null;
  const line1 = [address.street, address.number].filter(Boolean).join(", ");
  const line2 = [address.neighborhood, address.city, address.state].filter(Boolean).join(" — ");
  return [line1, line2, address.zip].filter(Boolean).join(" · ");
}

type SalesSummary = {
  gmv_cents: number;
  orders_count: number;
  avg_ticket_cents: number;
  mrr_cents: number;
  prev_gmv_cents: number;
  prev_orders_count: number;
};

type TopProduct = {
  product_id: string;
  name: string;
  partner_name: string;
  units_sold: number;
  gmv_cents: number;
};

type SalesData = {
  days: number;
  summary: SalesSummary;
  daily: SalesTrendPoint[];
  topProducts: TopProduct[];
};

type CircularAgent = {
  id: string;
  name: string;
  email: string;
  role: string;
  agentStatus: string;
  agentCode: string | null;
  agentIsAvailable: boolean;
  agentCity: string | null;
  agentNeighborhood: string | null;
  agentInterests: string[];
  agentBio: string | null;
  agentCourse: string | null;
  agentPracticalMission: string | null;
  agentMissionStatus: string | null;
  agentCertificateUrl: string | null;
  createdAt: string;
  lifetimePoints: number;
  pointsBalance: number;
  streakWeeks: number;
  referralCode: string | null;
  referralCount: number;
  completedMissionCount: number;
};

type CircularMission = {
  id: string;
  agentId: string;
  agentName: string;
  courseSlug: string;
  status: string;
  progressPercent: number;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
};

type CircularReferral = {
  id: string;
  agentName: string;
  referredName: string | null;
  referredEmail: string | null;
  referralCode: string | null;
  referredAt: string | null;
  convertedAt: string | null;
  createdAt: string;
  status: string;
};

type CircularEvidence = {
  id: string;
  agentName: string;
  type: string;
  title: string | null;
  description: string | null;
  url: string | null;
  status: string;
  reviewNote: string | null;
  createdAt: string;
};

type CircularReviewData = {
  agents: CircularAgent[];
  missions: CircularMission[];
  referrals: CircularReferral[];
  evidence: CircularEvidence[];
};

type PartnerTierRow = {
  partnerId: string;
  name: string;
  metrics: PartnerTierMetrics;
  evaluation: TierEvaluation;
};

type PartnerTierData = {
  sample: NetworkSample;
  gap: NetworkSample;
  partners: PartnerTierRow[];
};

interface AdminPanelProps {
  metrics: Metrics;
  users: UserWithAccess[];
  pendingUsers: Profile[];
  cooperatives: Cooperative[];
  producerApplications: ProducerApplication[];
  curationStatus: string;
  products: Product[];
  subscriptionMap: Record<string, string>;
  pendingSubscriptionMap: Record<string, PendingSubscription>;
  defaultTab: string;
  partnerTier: PartnerTierData;
  sales: SalesData;
  circularReview?: CircularReviewData;
}

const ROLE_LABELS: Record<string, string> = {
  consumidor: "Consumidor",
  produtor: "Produtor",
  cooperativa: "Cooperativa",
  admin: "Admin",
  agent_circular: "Agente Circular",
};

const TYPE_LABELS: Record<string, string> = {
  organic: "Orgânico",
  solid: "Seco",
  both: "Ambos",
};

const BANK_ACCOUNT_TYPE_LABELS: Record<string, string> = {
  corrente: "Conta corrente",
  pagamentos: "Conta de pagamentos",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDelta(current: number, previous: number) {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function trialDaysLeft(approvedAt: string | null) {
  if (!approvedAt) return 0;
  const elapsedMs = Date.now() - new Date(approvedAt).getTime();
  return Math.ceil(TRIAL_DAYS - elapsedMs / (24 * 60 * 60 * 1000));
}

function AccessBadge({
  user,
  hasActiveSubscription,
  pendingSubscription,
}: {
  user: UserWithAccess;
  hasActiveSubscription: boolean;
  pendingSubscription?: PendingSubscription;
}) {
  if (user.role === "admin" || user.access_override) return null;

  if (user.approval_status === "pending") {
    return <Badge variant="secondary">Em análise</Badge>;
  }
  if (user.approval_status === "rejected") {
    return <Badge variant="destructive">Recusado</Badge>;
  }
  if (hasActiveSubscription) return null;
  if (pendingSubscription) {
    return <Badge variant="secondary">Pagamento pendente</Badge>;
  }

  const daysLeft = trialDaysLeft(user.approved_at);
  if (daysLeft > 0) {
    return (
      <Badge variant="outline" className="border-cc-orange text-cc-orange">
        Grátis · {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
      </Badge>
    );
  }
  return <Badge variant="destructive">Trial vencido</Badge>;
}

const CURATION_FILTERS = [
  { value: "pending", label: "Em análise" },
  { value: "docs_pending", label: "Documentação pendente" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Reprovados" },
  { value: "all", label: "Todos" },
];

const EMPTY_CIRCULAR_REVIEW: CircularReviewData = {
  agents: [],
  missions: [],
  referrals: [],
  evidence: [],
};

const CIRCULAR_STATUS_LABELS: Record<string, string> = {
  pending: "Em análise",
  not_started: "Não iniciada",
  in_progress: "Em andamento",
  completed: "Concluída",
  active: "Ativo",
  suspended: "Suspenso",
  inactive: "Inativo",
  registered: "Registrada",
  converted: "Convertida",
  approved: "Aprovado",
  confirmed: "Aprovada",
  submitted: "Enviada para revisão",
  under_review: "Em revisão",
  verified: "Verificada",
  rejected: "Rejeitado",
  canceled: "Cancelada",
};

function circularStatusVariant(status: string): "default" | "secondary" | "destructive" {
  if (
    status === "approved" ||
    status === "confirmed" ||
    status === "completed" ||
    status === "active" ||
    status === "converted"
  ) {
    return "default";
  }
  if (
    status === "rejected" ||
    status === "canceled" ||
    status === "suspended" ||
    status === "inactive"
  ) {
    return "destructive";
  }
  return "secondary";
}

export function AdminPanel({
  metrics,
  users,
  pendingUsers,
  cooperatives,
  producerApplications,
  curationStatus,
  products,
  subscriptionMap,
  pendingSubscriptionMap,
  defaultTab,
  partnerTier,
  sales,
  circularReview = EMPTY_CIRCULAR_REVIEW,
}: AdminPanelProps) {
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCooperative, setEditingCooperative] = useState<Cooperative | null>(null);
  const [reviewingApplication, setReviewingApplication] = useState<{
    app: ProducerApplication;
    decision: "rejected" | "docs_pending";
  } | null>(null);
  const [toggling, startToggle] = useTransition();

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Users className="h-4 w-4 text-cc-green" />
            <CardTitle className="text-sm">Total de usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-cc-green">{metrics.totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <CreditCard className="h-4 w-4 text-cc-green" />
            <CardTitle className="text-sm">Assinantes pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-cc-green">{metrics.payingUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Gift className="h-4 w-4 text-cc-orange" />
            <CardTitle className="text-sm">Plano gratuito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-cc-orange">{metrics.freeUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Building2 className="h-4 w-4 text-cc-green" />
            <CardTitle className="text-sm">Cooperativas ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-cc-green">{metrics.activeCooperatives}</p>
          </CardContent>
        </Card>

        <Card className={metrics.pendingApprovals > 0 ? "border-cc-orange" : undefined}>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <ShieldAlert className="h-4 w-4 text-cc-orange" />
            <CardTitle className="text-sm">Aprovações pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-cc-orange">{metrics.pendingApprovals}</p>
          </CardContent>
        </Card>

        <Card className={metrics.pendingCuration > 0 ? "border-cc-orange" : undefined}>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <FileText className="h-4 w-4 text-cc-orange" />
            <CardTitle className="text-sm">Parceiros em análise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-cc-orange">{metrics.pendingCuration}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="h-auto w-full flex-wrap">
          <TabsTrigger value="agentes" className="flex-1">
            Agente Circular
          </TabsTrigger>
          <TabsTrigger value="aprovacoes" className="flex-1">
            Aprovações{pendingUsers.length > 0 ? ` (${pendingUsers.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex-1">
            Usuários
          </TabsTrigger>
          <TabsTrigger value="parceiros" className="flex-1">
            Parceiros
          </TabsTrigger>
          <TabsTrigger value="mercado" className="flex-1">
            Mercado
          </TabsTrigger>
          <TabsTrigger value="metricas" className="flex-1">
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agentes" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <Bot className="h-4 w-4 text-cc-green" />
                <CardTitle className="text-sm">Agentes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-cc-green">
                  {circularReview.agents.length}
                </p>
                <p className="text-xs text-muted-foreground">perfis acompanhados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <ClipboardCheck className="h-4 w-4 text-cc-orange" />
                <CardTitle className="text-sm">Missões</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-cc-orange">
                  {circularReview.missions.length}
                </p>
                <p className="text-xs text-muted-foreground">missões práticas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <GitBranch className="h-4 w-4 text-cc-green" />
                <CardTitle className="text-sm">Indicações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-cc-green">
                  {circularReview.referrals.length}
                </p>
                <p className="text-xs text-muted-foreground">vínculos registrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <ImageIcon className="h-4 w-4 text-cc-orange" />
                <CardTitle className="text-sm">Evidências</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-cc-orange">
                  {circularReview.evidence.length}
                </p>
                <p className="text-xs text-muted-foreground">arquivos enviados</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-muted-foreground">Agentes e acesso</p>
              <Badge variant="secondary">
                {circularReview.agents.filter((agent) => agent.agentStatus === "registered" || agent.agentStatus === "pending").length}{" "}
                pendentes
              </Badge>
            </div>
            <div className="space-y-3">
              {circularReview.agents.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhum agente encontrado.
                </p>
              ) : (
                circularReview.agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="space-y-3 rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-cc-green">{agent.name}</p>
                        <p className="truncate text-muted-foreground">{agent.email}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Badge variant="outline">{ROLE_LABELS[agent.role] ?? agent.role}</Badge>
                          <Badge variant={circularStatusVariant(agent.agentStatus)}>
                            {CIRCULAR_STATUS_LABELS[agent.agentStatus] ?? agent.agentStatus}
                          </Badge>
                          {agent.agentCode ? (
                            <span className="text-xs text-muted-foreground">{agent.agentCode}</span>
                          ) : null}
                          <span className="text-xs text-muted-foreground">
                            {agent.agentIsAvailable ? "Disponível" : "Indisponível"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Desde {formatDate(agent.createdAt)}
                          </span>
                        </div>
                      </div>
                      {agent.agentStatus === "registered" || agent.agentStatus === "pending" ? (
                        <div className="flex shrink-0 gap-2">
                          <form action={reviewCircularAgent}>
                            <input type="hidden" name="id" value={agent.id} />
                            <input type="hidden" name="decision" value="rejected" />
                            <Button type="submit" variant="outline" size="sm">
                              Rejeitar
                            </Button>
                          </form>
                          <form action={reviewCircularAgent}>
                            <input type="hidden" name="id" value={agent.id} />
                            <input type="hidden" name="decision" value="approved" />
                            <Button type="submit" size="sm">
                              Aprovar
                            </Button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{agent.completedMissionCount} missões concluídas</span>
                      <span>{agent.referralCount} indicações</span>
                      <span>{agent.lifetimePoints} pontos totais</span>
                      <span>{agent.streakWeeks} semanas de sequência</span>
                    </div>
                    {agent.agentPracticalMission || agent.agentBio ? (
                      <p className="text-xs text-muted-foreground">
                        {agent.agentPracticalMission ?? agent.agentBio}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-muted-foreground">Missões práticas</p>
              <span className="text-xs text-muted-foreground">progresso de formação</span>
            </div>
            <div className="space-y-3">
              {circularReview.missions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma missão prática encontrada.
                </p>
              ) : (
                circularReview.missions.map((mission) => (
                  <div
                    key={mission.id}
                    className="space-y-3 rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-cc-green">{mission.agentName}</p>
                        <p className="text-muted-foreground">
                          {mission.courseSlug} · atualizada em {formatDate(mission.updatedAt)}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Badge variant={circularStatusVariant(mission.status)}>
                            {CIRCULAR_STATUS_LABELS[mission.status] ?? mission.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {mission.progressPercent}% concluída
                          </span>
                        </div>
                      </div>
                      {mission.status === "submitted" || mission.status === "under_review" || mission.status === "in_progress" ? (
                        <div className="flex shrink-0 gap-2">
                          <form action={reviewCircularMission}>
                            <input type="hidden" name="id" value={mission.id} />
                            <input type="hidden" name="decision" value="rejected" />
                            <Button type="submit" variant="outline" size="sm">
                              Rejeitar
                            </Button>
                          </form>
                          <form action={reviewCircularMission}>
                            <input type="hidden" name="id" value={mission.id} />
                            <input type="hidden" name="decision" value="approved" />
                            <Button type="submit" size="sm">
                              Aprovar
                            </Button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Início: {formatDate(mission.startedAt)}
                      {mission.completedAt
                        ? ` · Conclusão: ${formatDate(mission.completedAt)}`
                        : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-muted-foreground">Indicações</p>
              <span className="text-xs text-muted-foreground">quem trouxe quem para a rede</span>
            </div>
            <div className="space-y-3">
              {circularReview.referrals.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma indicação encontrada.
                </p>
              ) : (
                circularReview.referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-cc-green">
                        {referral.referredName ??
                          referral.referredEmail ??
                          "Contato não identificado"}
                      </p>
                      <p className="truncate text-muted-foreground">
                        indicado por {referral.agentName}
                        {referral.referralCode ? ` · código ${referral.referralCode}` : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant={circularStatusVariant(referral.status)}>
                          {CIRCULAR_STATUS_LABELS[referral.status] ?? referral.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(referral.createdAt)}
                        </span>
                      </div>
                    </div>
                    {referral.status === "indicated" || referral.status === "review" || referral.status === "pending" ? (
                      <div className="flex shrink-0 gap-2">
                        <form action={reviewCircularReferral}>
                          <input type="hidden" name="id" value={referral.id} />
                          <input type="hidden" name="decision" value="rejected" />
                          <Button type="submit" variant="outline" size="sm">
                            Rejeitar
                          </Button>
                        </form>
                        <form action={reviewCircularReferral}>
                          <input type="hidden" name="id" value={referral.id} />
                          <input type="hidden" name="decision" value="approved" />
                          <Button type="submit" size="sm">
                            Aprovar
                          </Button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-muted-foreground">Evidências</p>
              <span className="text-xs text-muted-foreground">
                fotos e comprovantes de execução
              </span>
            </div>
            <div className="space-y-3">
              {circularReview.evidence.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma evidência encontrada.
                </p>
              ) : (
                circularReview.evidence.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cc-green/8 text-cc-green">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-cc-green">{evidence.agentName}</p>
                        <p className="truncate text-muted-foreground">
                          {evidence.title ?? evidence.type} · {evidence.agentName}
                        </p>
                        {evidence.description ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {evidence.description}
                          </p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant={circularStatusVariant(evidence.status)}>
                            {CIRCULAR_STATUS_LABELS[evidence.status] ?? evidence.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(evidence.createdAt)}
                          </span>
                          {evidence.url ? (
                            <a
                              href={evidence.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-cc-green underline"
                            >
                              Abrir arquivo
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {evidence.status === "uploaded" || evidence.status === "under_review" || evidence.status === "pending" ? (
                      <div className="flex shrink-0 gap-2">
                        <form action={reviewCircularEvidence}>
                          <input type="hidden" name="id" value={evidence.id} />
                          <input type="hidden" name="decision" value="rejected" />
                          <Button type="submit" variant="outline" size="sm">
                            Rejeitar
                          </Button>
                        </form>
                        <form action={reviewCircularEvidence}>
                          <input type="hidden" name="id" value={evidence.id} />
                          <input type="hidden" name="decision" value="approved" />
                          <Button type="submit" size="sm">
                            Aprovar
                          </Button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="aprovacoes" className="mt-4 space-y-3">
          {pendingUsers.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhuma solicitação de acesso pendente.
            </p>
          ) : (
            pendingUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-cc-green">{u.name}</p>
                  <p className="truncate text-muted-foreground">{u.email}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="secondary">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(u.created_at)}
                    </span>
                  </div>
                </div>
                <div className="ml-2 flex shrink-0 gap-2">
                  <form action={rejectUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Recusar
                    </Button>
                  </form>
                  <form action={approveUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <Button type="submit" size="sm">
                      Aprovar
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="usuarios" className="mt-4 space-y-3">
          {users.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum usuário encontrado.
            </p>
          ) : (
            users.map((u) => {
              const pendingSubscription = pendingSubscriptionMap[u.id];
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-cc-green">{u.name}</p>
                    <p className="truncate text-muted-foreground">{u.email}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="secondary">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                      {subscriptionMap[u.id] && (
                        <Badge variant="default">{subscriptionMap[u.id]}</Badge>
                      )}
                      <AccessBadge
                        user={u}
                        hasActiveSubscription={!!subscriptionMap[u.id]}
                        pendingSubscription={pendingSubscription}
                      />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(u.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-2 flex shrink-0 gap-2">
                    {pendingSubscription && (
                      <form action={activateSubscription}>
                        <input type="hidden" name="id" value={pendingSubscription.id} />
                        <Button type="submit" size="sm">
                          Confirmar pagamento
                        </Button>
                      </form>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setEditingUser(u)}>
                      Editar
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="parceiros" className="mt-4 space-y-6">
          <div>
            <p className="mb-2 text-sm font-semibold text-muted-foreground">Tier {TIER_NAME}</p>
            <div className="space-y-3 rounded-xl border border-border p-3">
              {partnerTier.gap.verifiedPartners > 0 || partnerTier.gap.deliveredOrders > 0 ? (
                <div className="rounded-lg border border-cc-orange/30 bg-cc-orange/5 p-3 text-sm">
                  <p className="font-medium text-cc-green">Critério ainda não vale para ninguém</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    A rede tem {partnerTier.sample.verifiedPartners} parceiros verificados e{" "}
                    {partnerTier.sample.deliveredOrders} pedidos entregues. O selo só passa a ser
                    concedido com {TIER_ACTIVATION.minVerifiedPartners} parceiros e{" "}
                    {TIER_ACTIVATION.minNetworkDeliveredOrders} pedidos — faltam{" "}
                    {partnerTier.gap.verifiedPartners} parceiros e {partnerTier.gap.deliveredOrders}{" "}
                    pedidos. Até lá o ranking mediria ruído, não desempenho.
                  </p>
                </div>
              ) : null}

              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Requisitos por parceiro</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {describeCriteria().map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              {partnerTier.partners.length === 0 ? (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  Nenhum parceiro verificado ainda — a curadoria não aprovou nenhuma solicitação.
                </p>
              ) : (
                partnerTier.partners.map((row) => (
                  <div key={row.partnerId} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-cc-green">{row.name}</span>
                      <Badge variant={row.evaluation.awarded ? "default" : "secondary"}>
                        {row.evaluation.awarded ? TIER_NAME : "Verificado"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.metrics.deliveredOrders} entregues · {formatPrice(row.metrics.gmvCents)}{" "}
                      · {row.metrics.reviewsCount} avaliações ·{" "}
                      {row.metrics.averageRating === null
                        ? "sem nota"
                        : `nota ${row.metrics.averageRating.toFixed(1)}`}{" "}
                      · {row.metrics.activeDays} dias ativo
                    </p>
                    {row.evaluation.missing.length > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Falta: {row.evaluation.missing.join(" · ")}
                      </p>
                    ) : row.evaluation.blockedByNetwork ? (
                      <p className="mt-1 text-xs text-cc-orange">
                        Cumpre todos os requisitos; aguardando a rede atingir o tamanho mínimo.
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-muted-foreground">Cooperativas</p>
            <div className="space-y-3">
              {cooperatives.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma cooperativa cadastrada.
                </p>
              ) : (
                cooperatives.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-cc-green">{c.name}</p>
                      <p className="text-muted-foreground">
                        {c.contact_name ?? "—"} · {c.contact_phone ?? "—"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="secondary">{TYPE_LABELS[c.type] ?? c.type}</Badge>
                        <Badge variant={c.status === "active" ? "default" : "destructive"}>
                          {c.status === "active" ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-2 flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingCooperative(c)}>
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={toggling}
                        onClick={() => startToggle(() => toggleCooperativeStatus(c.id, c.status))}
                      >
                        {c.status === "active" ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground">Curadoria de parceiros</p>
              <div className="flex gap-1">
                {CURATION_FILTERS.map((filter) => (
                  <Link key={filter.value} href={`/admin?aba=parceiros&curadoria=${filter.value}`}>
                    <Badge variant={curationStatus === filter.value ? "default" : "secondary"}>
                      {filter.label}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {producerApplications.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma candidatura {curationStatus === "all" ? "" : `com esse status`} no
                  momento.
                </p>
              ) : (
                producerApplications.map((app) => (
                  <div
                    key={app.id}
                    className="space-y-3 rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-cc-green">{app.razaoSocial}</p>
                          <Badge variant="outline">
                            {APPLICANT_TYPE_LABELS[app.applicantType] ?? app.applicantType}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          CNPJ {app.cnpj}
                          {app.stateRegistration ? ` · IE ${app.stateRegistration}` : ""}
                        </p>
                        <p className="truncate text-muted-foreground">
                          {app.name} · {app.email}
                        </p>
                        <p className="text-muted-foreground">
                          Resp.: {app.responsavelNome}
                          {app.responsavelTelefone ? ` · ${app.responsavelTelefone}` : ""}
                          {app.contatoEmail ? ` · ${app.contatoEmail}` : ""}
                        </p>
                        {formatAddress(app.businessAddress) ? (
                          <p className="text-muted-foreground">
                            {formatAddress(app.businessAddress)}
                          </p>
                        ) : null}
                        {app.applicantType === "produtor" ? (
                          <p className="text-muted-foreground">
                            {app.businessSize ? `Porte: ${app.businessSize.toUpperCase()}` : null}
                            {app.foundedYear ? ` · Desde ${app.foundedYear}` : ""}
                            {app.websiteUrl ? ` · ${app.websiteUrl}` : ""}
                          </p>
                        ) : (
                          <p className="text-muted-foreground">
                            {app.wasteType
                              ? `Coleta: ${WASTE_LABELS[app.wasteType] ?? app.wasteType}`
                              : null}
                            {app.capacityKgDay ? ` · ${app.capacityKgDay} kg/dia` : ""}
                            {app.serviceArea ? ` · Área: ${app.serviceArea}` : ""}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Badge
                            variant={
                              app.status === "approved"
                                ? "default"
                                : app.status === "rejected"
                                  ? "destructive"
                                  : app.status === "docs_pending"
                                    ? "outline"
                                    : "secondary"
                            }
                          >
                            {PRODUCER_APPLICATION_STATUS_LABELS[app.status] ?? app.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(app.submittedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-muted-foreground">
                      <p>
                        <span className="font-medium text-cc-green">Produz/coleta: </span>
                        {app.sustainabilityDescription}
                      </p>
                      <p>
                        <span className="font-medium text-cc-green">Origem dos materiais: </span>
                        {app.materialOrigin}
                      </p>
                      <p>
                        <span className="font-medium text-cc-green">Operação: </span>
                        {app.operationDescription}
                      </p>
                      {app.bankName && (
                        <p>
                          <span className="font-medium text-cc-green">Repasse: </span>
                          {app.bankName}
                          {app.bankAccountType
                            ? ` · ${BANK_ACCOUNT_TYPE_LABELS[app.bankAccountType] ?? app.bankAccountType}`
                            : ""}
                          {app.bankAgency ? ` · Ag. ${app.bankAgency}` : ""}
                          {app.bankAccount ? ` · Conta ${app.bankAccount}` : ""}
                          {app.pixKey ? ` · Pix ${app.pixKey}` : ""}
                        </p>
                      )}
                      {app.reviewNote && (
                        <p className="rounded bg-destructive/5 p-2 text-destructive">
                          {app.status === "docs_pending" ? "Pendência: " : "Motivo da recusa: "}
                          {app.reviewNote}
                        </p>
                      )}
                    </div>

                    {app.documents.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {app.documents.map((doc) =>
                          doc.url ? (
                            <a
                              key={doc.id}
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-cc-green hover:bg-cc-green/5"
                            >
                              <FileText className="h-3 w-3" />
                              {doc.label ||
                                DOCUMENT_TYPE_LABELS[doc.documentType] ||
                                doc.documentType}
                            </a>
                          ) : null,
                        )}
                      </div>
                    )}

                    {app.status !== "approved" && (
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewingApplication({ app, decision: "rejected" })}
                        >
                          Reprovar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewingApplication({ app, decision: "docs_pending" })}
                        >
                          Pedir documentação
                        </Button>
                        <form action={reviewProducerApplication}>
                          <input type="hidden" name="id" value={app.id} />
                          <input type="hidden" name="decision" value="approved" />
                          <Button type="submit" size="sm">
                            Aprovar
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mercado" className="mt-4 space-y-3">
          {products.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum produto cadastrado.
            </p>
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-cc-green">{p.name}</p>
                  <p className="text-muted-foreground">{p.category ?? "—"}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="text-xs font-medium">{formatPrice(p.price_cents)}</span>
                    <Badge variant={p.status === "active" ? "default" : "secondary"}>
                      {p.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 shrink-0"
                  onClick={() => setEditingProduct(p)}
                >
                  Editar
                </Button>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="metricas" className="mt-4 space-y-4">
          <div className="flex justify-end gap-2">
            {METRICS_PERIODS.map((period) => (
              <Link key={period.days} href={`/admin?aba=metricas&periodo=${period.days}`}>
                <Badge variant={sales.days === period.days ? "default" : "secondary"}>
                  {period.label}
                </Badge>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">GMV da loja</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-xl font-semibold text-cc-green">
                  {formatPrice(sales.summary.gmv_cents)}
                </p>
                {(() => {
                  const delta = formatDelta(sales.summary.gmv_cents, sales.summary.prev_gmv_cents);
                  if (delta === null) return null;
                  return (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${delta >= 0 ? "text-cc-green" : "text-destructive"}`}
                    >
                      {delta >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {delta >= 0 ? "+" : ""}
                      {delta}%
                    </span>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Receita recorrente (MRR)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-cc-green">
                  {formatPrice(sales.summary.mrr_cents)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-cc-green">{sales.summary.orders_count}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Ticket médio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-cc-green">
                  {formatPrice(sales.summary.avg_ticket_cents)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendas por dia</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesTrendChart data={sales.daily} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Produtos mais vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {sales.topProducts.length === 0 ||
              sales.topProducts.every((p) => p.gmv_cents === 0) ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma venda registrada neste período.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Produtor</TableHead>
                      <TableHead className="text-right">Unidades</TableHead>
                      <TableHead className="text-right">GMV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.topProducts.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell className="max-w-40 truncate">{product.name}</TableCell>
                        <TableCell className="max-w-32 truncate text-muted-foreground">
                          {product.partner_name}
                        </TableCell>
                        <TableCell className="text-right">{product.units_sold}</TableCell>
                        <TableCell className="text-right font-medium text-cc-green">
                          {formatPrice(product.gmv_cents)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: editar usuário */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form action={updateUser} onSubmit={() => setEditingUser(null)}>
              <input type="hidden" name="id" value={editingUser.id} />
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="u-name">Nome</Label>
                  <Input id="u-name" name="name" defaultValue={editingUser.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="u-phone">Telefone</Label>
                  <Input id="u-phone" name="phone" defaultValue={editingUser.phone ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="u-role">Perfil</Label>
                  <Select name="role" defaultValue={editingUser.role}>
                    <SelectTrigger id="u-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consumidor">Consumidor</SelectItem>
                      <SelectItem value="produtor">Produtor</SelectItem>
                      <SelectItem value="cooperativa">Cooperativa</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: reprovar ou pedir documentação de uma candidatura */}
      <Dialog open={!!reviewingApplication} onOpenChange={() => setReviewingApplication(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewingApplication?.decision === "docs_pending"
                ? "Pedir documentação"
                : "Reprovar candidatura"}
            </DialogTitle>
          </DialogHeader>
          {reviewingApplication && (
            <form
              action={reviewProducerApplication}
              className="space-y-4"
              onSubmit={() => setReviewingApplication(null)}
            >
              <input type="hidden" name="id" value={reviewingApplication.app.id} />
              <input type="hidden" name="decision" value={reviewingApplication.decision} />
              <div className="space-y-2">
                <Label htmlFor="review_note">
                  {reviewingApplication.decision === "docs_pending"
                    ? "O que está faltando (visível para o parceiro)"
                    : "Motivo (visível para o parceiro)"}
                </Label>
                <Textarea
                  id="review_note"
                  name="review_note"
                  rows={3}
                  required={reviewingApplication.decision === "docs_pending"}
                  placeholder={
                    reviewingApplication.decision === "docs_pending"
                      ? "Ex: envie uma foto da operação e a licença ambiental."
                      : "Ex: CNPJ ilegível, dados inconsistentes."
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  variant={
                    reviewingApplication.decision === "docs_pending" ? "default" : "destructive"
                  }
                >
                  {reviewingApplication.decision === "docs_pending"
                    ? "Enviar pedido"
                    : "Confirmar reprovação"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: editar página pública da cooperativa */}
      <Dialog open={!!editingCooperative} onOpenChange={() => setEditingCooperative(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Página pública da cooperativa</DialogTitle>
          </DialogHeader>
          {editingCooperative && (
            <form
              action={updateCooperative}
              className="space-y-4"
              onSubmit={() => setEditingCooperative(null)}
            >
              <input type="hidden" name="id" value={editingCooperative.id} />
              <div className="space-y-2">
                <Label htmlFor="collects_description">O que a cooperativa coleta</Label>
                <Textarea
                  id="collects_description"
                  name="collects_description"
                  rows={3}
                  defaultValue={editingCooperative.collects_description ?? ""}
                  placeholder="Ex: recicláveis secos (papel, plástico, metal, vidro) de residências e comércios da região."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operation_description">
                  Como funciona a operação (passo a passo simples)
                </Label>
                <Textarea
                  id="operation_description"
                  name="operation_description"
                  rows={4}
                  defaultValue={editingCooperative.operation_description ?? ""}
                  placeholder="Ex: 1) Você solicita a coleta pelo app. 2) Um coletor vai até o endereço. 3) O material é pesado e triado na cooperativa. 4) Você recebe os pontos."
                />
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: editar produto */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar produto</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <form action={updateProduct} onSubmit={() => setEditingProduct(null)}>
              <input type="hidden" name="id" value={editingProduct.id} />
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="p-name">Nome</Label>
                  <Input id="p-name" name="name" defaultValue={editingProduct.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-desc">Descrição</Label>
                  <Input
                    id="p-desc"
                    name="description"
                    defaultValue={editingProduct.description ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-price">Preço (R$)</Label>
                  <Input
                    id="p-price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={(editingProduct.price_cents / 100).toFixed(2)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-status">Status</Label>
                  <Select name="status" defaultValue={editingProduct.status}>
                    <SelectTrigger id="p-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
