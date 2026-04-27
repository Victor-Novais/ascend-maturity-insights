import { useMemo, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  AlertTriangle,
  CalendarIcon,
  CheckCircle2,
  Download,
  Eye,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SkeletonBlock, SkeletonTable } from "@/components/ui/skeleton-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { exportAuditLogs, useAuditLogs, useAuditStats } from "@/hooks/useAuditLogs";
import { cn } from "@/lib/utils";
import type { AuditAction, AuditEntity, AuditLog, AuditLogFilters } from "@/types/audit-log";

const entityOptions: AuditEntity[] = ["User", "Company", "Question", "Assessment", "ActionPlan", "Auth"];
const actionOptions: AuditAction[] = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGIN_FAILED", "ACCESS_DENIED", "READ"];

function formatDateTime(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : value;
}

function getRoleBadgeClass(role?: string | null) {
  if (role === "ADMIN") return "border-blue-200 bg-blue-50 text-blue-700";
  if (role === "CLIENTE") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getActionBadgeClass(action: string) {
  if (action === "CREATE") return "border-blue-200 bg-blue-50 text-blue-700";
  if (action === "UPDATE") return "border-yellow-200 bg-yellow-50 text-yellow-700";
  if (action === "DELETE") return "border-red-200 bg-red-50 text-red-700";
  if (action === "LOGIN") return "border-green-200 bg-green-50 text-green-700";
  if (action === "LOGIN_FAILED") return "border-red-200 bg-red-50 text-red-700";
  if (action === "ACCESS_DENIED") return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value?: string) => void;
}) {
  const selected = value ? new Date(value) : undefined;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}>
            {value ? format(new Date(value), "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
            <CalendarIcon className="h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : undefined)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DiffView({ payload }: { payload: Record<string, unknown> | null }) {
  if (!payload || typeof payload !== "object") {
    return (
      <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
        Nenhum payload estruturado disponivel.
      </div>
    );
  }

  const before = payload.before;
  const after = payload.after;

  if (
    !before ||
    !after ||
    typeof before !== "object" ||
    typeof after !== "object" ||
    Array.isArray(before) ||
    Array.isArray(after)
  ) {
    return (
      <pre className="overflow-x-auto rounded-xl border bg-muted/20 p-4 text-xs">
        {JSON.stringify(payload, null, 2)}
      </pre>
    );
  }

  const beforeRecord = before as Record<string, unknown>;
  const afterRecord = after as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border">
        <div className="border-b bg-muted/20 px-4 py-3 font-medium">Antes</div>
        <div className="space-y-2 p-4">
          {keys.map((key) => {
            const changed = JSON.stringify(beforeRecord[key]) !== JSON.stringify(afterRecord[key]);
            return (
              <div key={`before-${key}`} className={cn("rounded-lg border p-3 text-sm", changed && "bg-yellow-50 border-yellow-200")}>
                <p className="font-medium">{key}</p>
                <pre className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                  {JSON.stringify(beforeRecord[key], null, 2) ?? "null"}
                </pre>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl border">
        <div className="border-b bg-muted/20 px-4 py-3 font-medium">Depois</div>
        <div className="space-y-2 p-4">
          {keys.map((key) => {
            const changed = JSON.stringify(beforeRecord[key]) !== JSON.stringify(afterRecord[key]);
            return (
              <div key={`after-${key}`} className={cn("rounded-lg border p-3 text-sm", changed && "bg-yellow-50 border-yellow-200")}>
                <p className="font-medium">{key}</p>
                <pre className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                  {JSON.stringify(afterRecord[key], null, 2) ?? "null"}
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-5">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-4 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-5">
        <SkeletonBlock className="h-5 w-36" />
        <SkeletonBlock className="mt-4 h-44 w-full" />
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState<AuditEntity | "ALL">("ALL");
  const [action, setAction] = useState<AuditAction | "ALL">("ALL");
  const [result, setResult] = useState<"ALL" | "SUCCESS" | "FAILURE">("ALL");
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const isAdmin = user?.role === "ADMIN";

  const filters: AuditLogFilters = {
    page,
    limit: 10,
    entity: entity === "ALL" ? undefined : entity,
    action: action === "ALL" ? undefined : action,
    success: result === "ALL" ? undefined : result === "SUCCESS",
    dateFrom,
    dateTo,
  };

  const logsQuery = useAuditLogs(filters, isAdmin);
  const statsQuery = useAuditStats(isAdmin);
  const logs = logsQuery.data?.data ?? [];
  const total = logsQuery.data?.total ?? 0;
  const limit = logsQuery.data?.limit ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const failedPercent =
    statsQuery.data?.totalActions ? Math.round((statsQuery.data.failedActions / statsQuery.data.totalActions) * 100) : 0;
  const topEntityChartData = useMemo(
    () => (statsQuery.data?.topEntities ?? []).slice(0, 5).map((item) => ({ ...item, fill: "#2563eb" })),
    [statsQuery.data?.topEntities],
  );

  const pageItems = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-10 text-center">
        <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Apenas administradores podem visualizar os logs de auditoria.
        </p>
      </div>
    );
  }

  const handleClearFilters = () => {
    setPage(1);
    setEntity("ALL");
    setAction("ALL");
    setResult("ALL");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleExport = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("Selecione o intervalo de datas para exportar o CSV.");
      return;
    }

    try {
      await exportAuditLogs({
        dateFrom,
        dateTo,
        entity: entity === "ALL" ? undefined : entity,
        action: action === "ALL" ? undefined : action,
        success: result === "ALL" ? undefined : result === "SUCCESS",
      });
      toast.success("CSV exportado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao exportar CSV.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitore acessos, alteracoes e falhas operacionais em tempo quase real.
        </p>
      </div>

      {statsQuery.isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: "Total de Acoes",
                value: statsQuery.data?.totalActions ?? 0,
                icon: Activity,
                tone: "text-blue-700 bg-blue-100",
                extra: "",
              },
              {
                title: "Acoes com Falha",
                value: statsQuery.data?.failedActions ?? 0,
                icon: AlertTriangle,
                tone: "text-red-700 bg-red-100",
                extra: `${failedPercent}% do total`,
              },
              {
                title: "Usuarios Unicos Ativos",
                value: statsQuery.data?.uniqueUsers ?? 0,
                icon: Users,
                tone: "text-green-700 bg-green-100",
                extra: "",
              },
            ].map((item) => (
              <Card key={item.title} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      <p className="mt-3 text-3xl font-bold">{item.value}</p>
                      {item.extra ? <p className="mt-2 text-xs text-muted-foreground">{item.extra}</p> : null}
                    </div>
                    <div className={cn("rounded-2xl p-3", item.tone)}>
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top entities</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEntityChartData} layout="vertical" margin={{ left: 12, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={90} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 12, 12, 0]}>
                    {topEntityChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-6">
          <DateField label="Data inicial" value={dateFrom} onChange={(value) => { setDateFrom(value); setPage(1); }} />
          <DateField label="Data final" value={dateTo} onChange={(value) => { setDateTo(value); setPage(1); }} />

          <div className="space-y-2">
            <p className="text-sm font-medium">Entity</p>
            <Select value={entity} onValueChange={(value) => { setEntity(value as AuditEntity | "ALL"); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {entityOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Action</p>
            <Select value={action} onValueChange={(value) => { setAction(value as AuditAction | "ALL"); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {actionOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Resultado</p>
            <Select value={result} onValueChange={(value) => { setResult(value as "ALL" | "SUCCESS" | "FAILURE"); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="SUCCESS">Sucesso</SelectItem>
                <SelectItem value="FAILURE">Falha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col justify-end gap-2 lg:col-span-2 lg:flex-row">
            <Button variant="outline" onClick={() => void handleExport()}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="ghost" onClick={handleClearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-lg">Eventos registrados</CardTitle>
          <p className="text-sm text-muted-foreground">
            Exibindo {logs.length} de {total} registros
          </p>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading ? (
            <SkeletonTable rows={6} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acao</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="text-right">Detalhe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{log.userEmail ?? "Sistema"}</p>
                          {log.userRole ? <Badge className={getRoleBadgeClass(log.userRole)}>{log.userRole}</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeClass(log.action)}>{log.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{log.entity}</p>
                          <p className="text-xs text-muted-foreground">ID: {String(log.entityId ?? "-")}</p>
                        </div>
                      </TableCell>
                      <TableCell>{log.ipAddress ?? "-"}</TableCell>
                      <TableCell>
                        {log.success ? (
                          <span className="inline-flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Sucesso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-red-600">
                            <XCircle className="h-4 w-4" />
                            Falha
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                        Nenhum log encontrado para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>

              <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Pagina {page} de {totalPages}
                </p>
                <Pagination className="mx-0 w-auto justify-start">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {pageItems.map((pageItem) => (
                      <PaginationItem key={pageItem}>
                        <PaginationLink
                          href="#"
                          isActive={pageItem === page}
                          onClick={(event) => {
                            event.preventDefault();
                            setPage(pageItem);
                          }}
                        >
                          {pageItem}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          if (page < totalPages) setPage(page + 1);
                        }}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>Detalhe do Log</SheetTitle>
            <SheetDescription>Registro #{selectedLog?.id}</SheetDescription>
          </SheetHeader>

          {selectedLog ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["Data/Hora", formatDateTime(selectedLog.createdAt)],
                  ["Usuario", selectedLog.userEmail ?? "Sistema"],
                  ["Role", selectedLog.userRole ?? "-"],
                  ["Acao", selectedLog.action],
                  ["Entidade", selectedLog.entity],
                  ["EntityId", String(selectedLog.entityId ?? "-")],
                  ["IP", selectedLog.ipAddress ?? "-"],
                  ["User Agent", selectedLog.userAgent ?? "-"],
                  ["Resultado", selectedLog.success ? "Sucesso" : "Falha"],
                  ["Erro", selectedLog.errorMsg ?? "-"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border bg-muted/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-2 break-words text-sm">{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Payload / Diff</h3>
                <DiffView payload={selectedLog.payload} />
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
