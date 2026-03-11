import { useMemo, useState } from 'react';
import { useStore } from '@/store';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { differenceInHours, parseISO, startOfWeek, format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CHART_COLORS = [
  'hsl(210, 70%, 55%)',
  'hsl(280, 60%, 55%)',
  'hsl(170, 60%, 45%)',
  'hsl(30, 80%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(240, 40%, 55%)',
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

  // Lead Time: created → finished
  const leadTimeData = useMemo(() => {
    const byClient: Record<string, number[]> = {};
    filtered.forEach((d) => {
      if (!d.finishedAt) return;
      const hours = differenceInHours(parseISO(d.finishedAt), parseISO(d.createdAt));
      const client = clients.find((c) => c.id === d.clientId);
      const name = client?.name || 'Unknown';
      (byClient[name] ??= []).push(hours);
    });
    return Object.entries(byClient).map(([name, vals]) => ({
      name,
      avgHours: vals.reduce((a, b) => a + b, 0) / vals.length,
      count: vals.length,
    }));
  }, [filtered, clients]);

  // Cycle Time: started → finished
  const cycleTimeData = useMemo(() => {
    const byClient: Record<string, number[]> = {};
    filtered.forEach((d) => {
      if (!d.startedAt || !d.finishedAt) return;
      const hours = differenceInHours(parseISO(d.finishedAt), parseISO(d.startedAt));
      const client = clients.find((c) => c.id === d.clientId);
      const name = client?.name || 'Unknown';
      (byClient[name] ??= []).push(hours);
    });
    return Object.entries(byClient).map(([name, vals]) => ({
      name,
      avgHours: vals.reduce((a, b) => a + b, 0) / vals.length,
      count: vals.length,
    }));
  }, [filtered, clients]);

  // Throughput per client (pie)
  const throughputData = useMemo(() => {
    const byClient: Record<string, number> = {};
    filtered.forEach((d) => {
      if (d.columnId !== 'done') return;
      const client = clients.find((c) => c.id === d.clientId);
      const name = client?.name || 'Unknown';
      byClient[name] = (byClient[name] || 0) + 1;
    });
    return Object.entries(byClient).map(([name, count]) => ({ name, count }));
  }, [filtered, clients]);

  // Throughput per week (line)
  const throughputWeekly = useMemo(() => {
    const byWeek: Record<string, number> = {};
    filtered.forEach((d) => {
      if (!d.finishedAt) return;
      const week = format(startOfWeek(parseISO(d.finishedAt), { weekStartsOn: 1 }), 'MMM d');
      byWeek[week] = (byWeek[week] || 0) + 1;
    });
    return Object.entries(byWeek).map(([week, count]) => ({ week, count })).sort((a, b) => a.week.localeCompare(b.week));
  }, [filtered]);

  // Blocked Time per client
  const blockedTimeData = useMemo(() => {
    const byClient: Record<string, number[]> = {};
    filtered.forEach((d) => {
      if (!d.blockedAt) return;
      const end = d.isBlocked ? new Date().toISOString() : d.lastUpdated;
      const hours = differenceInHours(parseISO(end), parseISO(d.blockedAt));
      const client = clients.find((c) => c.id === d.clientId);
      const name = client?.name || 'Unknown';
      (byClient[name] ??= []).push(hours);
    });
    return Object.entries(byClient).map(([name, vals]) => ({
      name,
      totalHours: vals.reduce((a, b) => a + b, 0),
      count: vals.length,
    }));
  }, [filtered, clients]);

  // Per type
  const perTypeData = useMemo(() => {
    const byType: Record<string, number> = {};
    filtered.forEach((d) => {
      const dt = demandTypes.find((t) => t.id === d.demandTypeId);
      const name = dt?.label || 'Unknown';
      byType[name] = (byType[name] || 0) + 1;
    });
    return Object.entries(byType).map(([name, count]) => ({ name, count }));
  }, [filtered, demandTypes]);

  // Per priority
  const perPriorityData = useMemo(() => {
    const byP: Record<string, number> = {};
    filtered.forEach((d) => {
      const label = d.priority.charAt(0).toUpperCase() + d.priority.slice(1);
      byP[label] = (byP[label] || 0) + 1;
    });
    return Object.entries(byP).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const PRIORITY_COLORS: Record<string, string> = {
    Urgent: 'hsl(0, 84%, 60%)',
    High: 'hsl(30, 90%, 55%)',
    Medium: 'hsl(48, 95%, 50%)',
    Low: 'hsl(140, 50%, 60%)',
  };

  // Summary stats
  const stats = useMemo(() => {
    const done = filtered.filter((d) => d.columnId === 'done');
    const blocked = filtered.filter((d) => d.isBlocked);
    const avgLead = leadTimeData.length
      ? leadTimeData.reduce((a, b) => a + b.avgHours, 0) / leadTimeData.length
      : 0;
    const avgCycle = cycleTimeData.length
      ? cycleTimeData.reduce((a, b) => a + b.avgHours, 0) / cycleTimeData.length
      : 0;
    return {
      totalDemands: filtered.length,
      completed: done.length,
      blocked: blocked.length,
      avgLeadTime: avgLead,
      avgCycleTime: avgCycle,
    };
  }, [filtered, leadTimeData, cycleTimeData]);

  return (
    <div className="h-full overflow-auto bg-background p-6 scrollbar-thin">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold heading-tight text-foreground">Metrics Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track operational performance across clients</p>
          </div>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Demands', value: stats.totalDemands },
            { label: 'Completed', value: stats.completed },
            { label: 'Blocked', value: stats.blocked },
            { label: 'Avg Lead Time', value: hoursLabel(stats.avgLeadTime) },
            { label: 'Avg Cycle Time', value: hoursLabel(stats.avgCycleTime) },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-semibold text-foreground mt-1 text-tabular">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Lead Time by Client" subtitle="Avg hours from creation to completion">
            {leadTimeData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={leadTimeData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<MetricTooltip />} />
                  <Bar dataKey="avgHours" name="Avg Lead Time" radius={[4, 4, 0, 0]}>
                    {leadTimeData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Cycle Time by Client" subtitle="Avg hours from start to completion">
            {cycleTimeData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cycleTimeData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<MetricTooltip />} />
                  <Bar dataKey="avgHours" name="Avg Cycle Time" radius={[4, 4, 0, 0]}>
                    {cycleTimeData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[(i + 1) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Tickets per Type" subtitle="Distribution by demand type">
            {perTypeData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={perTypeData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip content={<SimpleTooltip />} />
                  <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
                    {perTypeData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Tickets per Priority" subtitle="Distribution by priority level">
            {perPriorityData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={perPriorityData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}
                    label={({ name, count }) => `${name}: ${count}`}>
                    {perPriorityData.map((item) => (
                      <Cell key={item.name} fill={PRIORITY_COLORS[item.name] || CHART_COLORS[0]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Throughput by Client" subtitle="Completed demands per client">
            {throughputData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={throughputData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}
                    label={({ name, count }) => `${name}: ${count}`}>
                    {throughputData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Throughput per Week" subtitle="Completed demands over time">
            {throughputWeekly.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={throughputWeekly} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip content={<SimpleTooltip />} />
                  <Line type="monotone" dataKey="count" name="Completed" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 4, fill: CHART_COLORS[0] }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Blocked Time by Client" subtitle="Total hours demands were blocked">
            {blockedTimeData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={blockedTimeData} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<MetricTooltip field="totalHours" />} />
                  <Bar dataKey="totalHours" name="Blocked Hours" radius={[4, 4, 0, 0]}>
                    {blockedTimeData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Blocked Tickets" subtitle="Currently blocked demands">
            {(() => {
              const blocked = filtered.filter((d) => d.isBlocked);
              if (!blocked.length) return <EmptyChart />;
              return (
                <div className="space-y-2 max-h-[260px] overflow-y-auto scrollbar-thin">
                  {blocked.map((d) => {
                    const client = clients.find((c) => c.id === d.clientId);
                    return (
                      <div key={d.id} className="flex items-center justify-between rounded-lg border border-accent-blocked/20 bg-accent-blocked/5 p-2.5">
                        <div>
                          <p className="text-sm font-medium">{d.title}</p>
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
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
      No data available yet
    </div>
  );
}

function MetricTooltip({ active, payload, field = 'avgHours' }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{data.name}</p>
      <p className="text-muted-foreground mt-1">
        {hoursLabel(data[field])} ({data.count} demand{data.count !== 1 ? 's' : ''})
      </p>
    </div>
  );
}

function SimpleTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{data.name || data.week}</p>
      <p className="text-muted-foreground mt-1">{data.count} ticket{data.count !== 1 ? 's' : ''}</p>
    </div>
  );
}
