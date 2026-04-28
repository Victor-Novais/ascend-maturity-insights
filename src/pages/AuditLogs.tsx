import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { exportAuditLogs, useAuditLogs, useAuditStats } from "@/hooks/useAuditLogs";
import { cn } from "@/lib/utils";
import type { AuditLog, AuditLogFilters } from "@/types/audit-log";

const entityOptions = ["User", "Company", "Question", "Assessment", "ActionPlan", "Auth", "Risk"] as const;
const actionOptions = ["CREATE", "UPDATE", "DELETE", "READ", "LOGIN", "LOGIN_FAILED", "ACCESS_DENIED"] as const;

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value: string) {
  return format(new Date(value), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
}

function getRoleBadgeClass(role?: string) {
  if (role === "ADMIN") return "border-purple-200 bg-purple-50 text-purple-700";
  if (role === "AVALIADOR" || role === "COLLABORATOR") return "border-blue-200 bg-blue-50 text-blue-700";
  if (role === "CLIENTE") return "border-green-200 bg-green-50 text-green-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getActionBadgeClass(action: string) {
  if (action === "CREATE") return "border-blue-200 bg-blue-50 text-blue-700";
  if (action === "UPDATE") return "border-yellow-200 bg-yellow-50 text-yellow-700";
  if (action === "DELETE") return "border-red-200 bg-red-50 text-red-700";
  if (action === "LOGIN") return "border-green-200 bg-green-50 text-green-700";
  if (action === "LOGIN_FAILED") return "border-red-200 bg-red-50 text-red-600";
  if (action === "ACCESS_DENIED") return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="rounded-2xl">
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-2xl">
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-44 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function getChangedKeys(before?: Record<string, unknown>, after?: Record<string, unknown>) {
  return Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])).filter(
    (key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]),
  );
}

function JsonPanel({
  title,
  value,
  changedKeys,
}: {
  title: string;
  value?: Record<string, unknown>;
  changedKeys: string[];
}) {
  if (!value) {
    return (
      <div className="rounded-xl border">
        <div className="border-b bg-muted/20 px-4 py-3 font-medium">{title}</div>
        <div className="p-4 text-sm text-muted-foreground">Sem dados.</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <div className="border-b bg-muted/20 px-4 py-3 font-medium">{title}</div>
      <div className="max-h-[420px] space-y-3 overflow-auto p-4">
        {Object.keys(value).length ? (
          Object.entries(value).map(([key, item]) => (
            <div
              key={key}
              className={cn("rounded-lg border p-3", changedKeys.includes(key) && "border-yellow-200 bg-yellow-50")}
            >
              <p className="mb-2 text-sm font-medium">{key}</p>
              <pre className="overflow-x-auto text-xs text-muted-foreground">{JSON.stringify(item, null, 2)}</pre>
            </div>
          ))
        ) : (
          <pre className="overflow-x-auto text-xs text-muted-foreground">{JSON.stringify(value, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState(getToday());
  const [entity, setEntity] = useState<string>("ALL");
  const [action, setAction] = useState<string>("ALL");
  const [result, setResult] = useState<"ALL" | "SUCCESS" | "FAILURE">("ALL");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filters: AuditLogFilters = {
    page,
    limit: 10,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    entity: entity === "ALL" ? undefined : entity,
    action: action === "ALL" ? undefined : action,
    success: result === "ALL" ? undefined : result === "SUCCESS",
  };

  const logsQuery = useAuditLogs(filters, isAdmin);
  const statsQuery = useAuditStats(isAdmin);

  const logs = logsQuery.data?.data ?? [];
  const total = logsQuery.data?.total ?? 0;
  const limit = logsQuery.data?.limit ?? 10;
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);
  const failedPercent = statsQuery.data?.totalActions
    ? Math.round((statsQuery.data.failedActions / statsQuery.data.totalActions) * 100)
    : 0;
  const chartData = useMemo(
    () =>
      (statsQuery.data?.topEntities ?? []).slice(0, 5).map((item) => ({
        name: item.entity,
        count: item.count,
        fill: "#2563EB",
      })),
    [statsQuery.data?.topEntities],
  );

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-10 text-center">
        <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">A página de auditoria está disponível apenas para administradores.</p>
      </div>
    );
  }

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo(getToday());
    setEntity("ALL");
    setAction("ALL");
    setResult("ALL");
    setPage(1);
  };

  const handleExport = async () => {
    try {
      await exportAuditLogs(filters);
      toast.success("CSV exportado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao exportar CSV.");
    }
  };

  const before = (selectedLog?.payload?.before as Record<string, unknown> | undefined) ?? undefined;
  const after = (selectedLog?.payload?.after as Record<string, unknown> | undefined) ?? undefined;
  const changedKeys = getChangedKeys(before, after);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acompanhe acessos, alterações, falhas e eventos sensíveis da plataforma.</p>
      </div>

      {statsQuery.isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="rounded-2xl">
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Ações</p>
                  <p className="mt-2 text-3xl font-bold">{statsQuery.data?.totalActions ?? 0}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">Falhas</p>
                  <p className="mt-2 text-3xl font-bold">{statsQuery.data?.failedActions ?? 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{failedPercent}% do total</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">Usuários Únicos Ativos</p>
                  <p className="mt-2 text-3xl font-bold">{statsQuery.data?.uniqueUsers ?? 0}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top 5 Entities</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={90} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 12, 12, 0]}>
                    {chartData.map((entry) => (
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
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Data inicial</p>
            <input
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Data final</p>
            <input
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Entity</p>
            <Select value={entity} onValueChange={(value) => { setEntity(value); setPage(1); }}>
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
            <Select value={action} onValueChange={(value) => { setAction(value); setPage(1); }}>
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

          <div className="flex flex-col justify-end gap-2 xl:flex-row">
            <Button type="button" variant="outline" onClick={() => void handleExport()}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button type="button" variant="ghost" onClick={handleClearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Eventos registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="text-right">Detalhe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length ? (
                    logs.map((log) => (
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
                          {log.entity ? `${log.entity}${log.entityId ? ` #${log.entityId}` : ""}` : "-"}
                        </TableCell>
                        <TableCell>{log.ipAddress ?? "-"}</TableCell>
                        <TableCell>
                          {log.success ? (
                            <span className="inline-flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
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
                          <Button type="button" variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Nenhum log encontrado para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">Mostrando {rangeStart}–{rangeEnd} de {total} registros</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                    Anterior
                  </Button>
                  <Button type="button" variant="outline" disabled={rangeEnd >= total} onClick={() => setPage((current) => current + 1)}>
                    Próximo
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
          <SheetHeader>
            <SheetTitle>Detalhe do Log</SheetTitle>
            <SheetDescription>Registro #{selectedLog?.id}</SheetDescription>
          </SheetHeader>

          {selectedLog ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["Data/Hora", formatDateTime(selectedLog.createdAt)],
                  ["Usuário", selectedLog.userEmail ?? "Sistema"],
                  ["Role", selectedLog.userRole ?? "-"],
                  ["Ação", selectedLog.action],
                  ["Entidade", selectedLog.entity ?? "-"],
                  ["Entity ID", selectedLog.entityId ?? "-"],
                  ["IP", selectedLog.ipAddress ?? "-"],
                  ["User Agent", selectedLog.userAgent ?? "-"],
                  ["Resultado", selectedLog.success ? "Sucesso" : "Falha"],
                  ["Erro", selectedLog.errorMsg ?? "-"],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl border bg-muted/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-2 break-words text-sm">{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Payload</h3>
                {before || after ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <JsonPanel title="Antes" value={before} changedKeys={changedKeys} />
                    <JsonPanel title="Depois" value={after} changedKeys={changedKeys} />
                  </div>
                ) : (
                  <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                    Nenhum payload estruturado disponível.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
