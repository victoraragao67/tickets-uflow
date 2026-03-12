import { useMemo, useState } from 'react';
import { useStore } from '@/store';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { differenceInHours, parseISO, startOfWeek, format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CHART_COLORS = [
  'hsl(255, 60%, 68%)',
  'hsl(260, 55%, 75%)',
  'hsl(170, 60%, 45%)',
  'hsl(30, 80%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(210, 60%, 55%)',
];

function hoursLabel(h: number) {
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

export function MetricsPage() {
  const { demands, clients, demandTypes } = useStore();
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  const filtered = useMemo(() => {
    if (selectedClientId === 'all') return demands;
    return demands.filter((d) => d.clientId === selectedClientId);
  }, [demands, selectedClientId]);

  const leadTimeData = useMemo(() => {
    const byClient: Record<string, number[]> = {};
    filtered.forEach((d) => {
      if (!d.finishedAt) return;
      const hours = differenceInHours(parseISO(d.finishedAt), parseISO(d.createdAt));
      const client = clients.find((c) => c.id === d.clientId);
      const name = client?.name || 'Desconhecido';
      (byClient[name] ??= []).push(hours);
    });
    return Object.entries(byClient).map(([name, vals]) => ({
      name, avgHours: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length,
    }));
  }, [filtered, clients]);

  const cycleTimeData = useMemo(() => {
    const byClient: Record<string, number[]> = {};
    filtered.forEach((d) => {
      if (!d.startedAt || !d.finishedAt) return;
      const hours = differenceInHours(parseISO(d.finishedAt), parseISO(d.startedAt));
      const client = clients.find((c) => c.id === d.clientId);
      const name = client?.name || 'Desconhecido';
      (byClient[name] ??= []).push(hours);
    });
    return Object.entries(byClient).map(([name, vals]) => ({
      name, avgHours: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length,
    }));
  }, [filtered, clients]);

  const throughputData = useMemo(() => {
    const byClient: Record<string, number> = {};
    filtered.forEach((d) => {
      if (d.columnId !== 'done') return;
      const client = clients.find((c) => c.id === d.clientId);
      const name = client?.name || 'Desconhecido';
      byClient[name] = (byClient[name] || 0) + 1;
    });
    return Object.entries(byClient).map(([name, count]) => ({ name, count }));
  }, [filtered, clients]);

  const throughputWeekly = useMemo(() => {
    const byWeek: Record<string, number> = {};
    filtered.forEach((d) => {
      if (!d.finishedAt) return;
      const week = format(startOfWeek(parseISO(d.finishedAt), { weekStartsOn: 1 }), 'dd/MM');
      byWeek[week] = (byWeek[week] || 0) + 1;
    });
    return Object.entries(byWeek).map(([week, count]) => ({ week, count })).sort((a, b) => a.week.localeCompare(b.week));
  }, [filtered]);

  const blockedTimeData = useMemo(() => {
    const byClient: Record<string, number[]> = {};
    filtered.forEach((d) => {
      if (!d.blockedAt) return;
      const end = d.isBlocked ? new Date().toISOString() : d.lastUpdated;
      const hours = differenceInHours(parseISO(end), parseISO(d.blockedAt));
      const client = clients.find((c) => c.id === d.clientId);
      const name = client?.name || 'Desconhecido';
      (byClient[name] ??= []).push(hours);
    });
    return Object.entries(byClient).map(([name, vals]) => ({
      name, totalHours: vals.reduce((a, b) => a + b, 0), count: vals.length,
    }));
  }, [filtered, clients]);

  const perTypeData = useMemo(() => {
    const byType: Record<string, number> = {};
    filtered.forEach((d) => {
      const dt = demandTypes.find((t) => t.id === d.demandTypeId);
      const name = dt?.label || 'Desconhecido';
      byType[name] = (byType[name] || 0) + 1;
    });
    return Object.entries(byType).map(([name, count]) => ({ name, count }));
  }, [filtered, demandTypes]);

  const perPriorityData = useMemo(() => {
    const PRIORITY_LABELS: Record<string, string> = {
      low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Crítica',
    };
    const byP: Record<string, number> = {};
    filtered.forEach((d) => {
      const label = PRIORITY_LABELS[d.priority] || d.priority;
      byP[label] = (byP[label] || 0) + 1;
    });
    return Object.entries(byP).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const PRIORITY_COLORS: Record<string, string> = {
    Crítica: 'hsl(0, 84%, 60%)',
    Alta: 'hsl(30, 90%, 55%)',
    Média: 'hsl(48, 95%, 50%)',
    Baixa: 'hsl(150, 55%, 48%)',
  };

  const stats = useMemo(() => {
    const done = filtered.filter((d) => d.columnId === 'done');
    const blocked = filtered.filter((d) => d.isBlocked);
    const avgLead = leadTimeData.length ? leadTimeData.reduce((a, b) => a + b.avgHours, 0) / leadTimeData.length : 0;
    const avgCycle = cycleTimeData.length ? cycleTimeData.reduce((a, b) => a + b.avgHours, 0) / cycleTimeData.length : 0;
    return { totalDemands: filtered.length, completed: done.length, blocked: blocked.length, avgLeadTime: avgLead, avgCycleTime: avgCycle };
  }, [filtered, leadTimeData, cycleTimeData]);

  return (
    <div className="h-full overflow-auto bg-background p-8 scrollbar-thin">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold heading-tight text-foreground">Painel de Métricas</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Acompanhe a performance operacional por cliente</p>
          </div>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-48 rounded-xl border-border bg-card card-shadow">
              <SelectValue placeholder="Todos os Clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Clientes</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Tickets abertos', value: stats.totalDemands - stats.completed },
            { label: 'Tickets concluídos', value: stats.completed },
            { label: 'Tickets bloqueados', value: stats.blocked },
            { label: 'Cycle time médio', value: hoursLabel(stats.avgCycleTime) },
            { label: 'Lead time médio', value: hoursLabel(stats.avgLeadTime) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-card card-shadow p-5">
              <p className="text-[12px] text-muted-foreground font-medium">{s.label}</p>
              <p className="text-3xl font-bold text-foreground mt-2 text-tabular">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Lead Time por Cliente" subtitle="Média de horas da criação até conclusão">
            {leadTimeData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={leadTimeData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<MetricTooltip />} />
                  <Bar dataKey="avgHours" name="Lead Time Médio" radius={[6, 6, 0, 0]}>
                    {leadTimeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Cycle Time por Cliente" subtitle="Média de horas do início até conclusão">
            {cycleTimeData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cycleTimeData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<MetricTooltip />} />
                  <Bar dataKey="avgHours" name="Cycle Time Médio" radius={[6, 6, 0, 0]}>
                    {cycleTimeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 1) % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Tickets por Tipo" subtitle="Distribuição por tipo de demanda">
            {perTypeData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={perTypeData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip content={<SimpleTooltip />} />
                  <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]}>
                    {perTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Tickets por Prioridade" subtitle="Distribuição por nível de prioridade">
            {perPriorityData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={perPriorityData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}
                    label={({ name, count }) => `${name}: ${count}`}>
                    {perPriorityData.map((item) => <Cell key={item.name} fill={PRIORITY_COLORS[item.name] || CHART_COLORS[0]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Entregas por Cliente" subtitle="Demandas concluídas por cliente">
            {throughputData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={throughputData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}
                    label={({ name, count }) => `${name}: ${count}`}>
                    {throughputData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Entregas por Semana" subtitle="Demandas concluídas ao longo do tempo">
            {throughputWeekly.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={throughputWeekly} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip content={<SimpleTooltip />} />
                  <Line type="monotone" dataKey="count" name="Concluídos" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 4, fill: CHART_COLORS[0] }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Tempo Bloqueado por Cliente" subtitle="Total de horas com demandas bloqueadas">
            {blockedTimeData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={blockedTimeData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<MetricTooltip field="totalHours" />} />
                  <Bar dataKey="totalHours" name="Horas Bloqueadas" radius={[6, 6, 0, 0]}>
                    {blockedTimeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Tickets Bloqueados" subtitle="Demandas atualmente bloqueadas">
            {(() => {
              const blocked = filtered.filter((d) => d.isBlocked);
              if (!blocked.length) return <EmptyChart />;
              return (
                <div className="space-y-2 max-h-[260px] overflow-y-auto scrollbar-thin">
                  {blocked.map((d) => {
                    const client = clients.find((c) => c.id === d.clientId);
                    return (
                      <div key={d.id} className="flex items-center justify-between rounded-xl border border-accent-blocked/20 bg-accent-blocked/5 p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{d.title}</p>
                          <p className="text-[11px] text-muted-foreground">{client?.name} · {d.blockerReason}</p>
                        </div>
                        <span className="text-[11px] text-accent-blocked font-medium">
                          {d.blockedAt ? hoursLabel(differenceInHours(new Date(), parseISO(d.blockedAt))) : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card card-shadow p-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-[12px] text-muted-foreground mb-4">{subtitle}</p>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
      Sem dados disponíveis
    </div>
  );
}

function MetricTooltip({ active, payload, field = 'avgHours' }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{data.name}</p>
      <p className="text-muted-foreground mt-1">
        {hoursLabel(data[field])} ({data.count} demanda{data.count !== 1 ? 's' : ''})
      </p>
    </div>
  );
}

function SimpleTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{data.name || data.week}</p>
      <p className="text-muted-foreground mt-1">{data.count} ticket{data.count !== 1 ? 's' : ''}</p>
    </div>
  );
}