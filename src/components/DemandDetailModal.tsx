import { useStore } from '@/store';
import { PRIORITY_CONFIG, BLOCKER_REASONS } from '@/types';
import type { Priority } from '@/types';
import { X, AlertCircle, MessageSquare, Activity, FileText, User, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { format } from 'date-fns';

interface Props {
  demandId: string;
  onClose: () => void;
}

export function DemandDetailModal({ demandId, onClose }: Props) {
  const { demands, clients, demandTypes, columns, activity, comments, updateDemand, addComment } = useStore();
  const demand = demands.find((d) => d.id === demandId);
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'comments'>('details');
  const [commentText, setCommentText] = useState('');
  const [watcherInput, setWatcherInput] = useState('');

  if (!demand) return null;

  const client = clients.find((c) => c.id === demand.clientId);
  const demandType = demandTypes.find((dt) => dt.id === demand.demandTypeId);
  const column = columns.find((c) => c.id === demand.columnId);
  const demandActivity = activity.filter((a) => a.demandId === demandId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const demandComments = comments.filter((c) => c.demandId === demandId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    addComment({ demandId, user: 'Você', content: commentText.trim() });
    setCommentText('');
  };

  const addWatcher = () => {
    if (!watcherInput.trim() || demand.watchers.includes(watcherInput.trim())) return;
    updateDemand(demandId, { watchers: [...demand.watchers, watcherInput.trim()] });
    setWatcherInput('');
  };

  const removeWatcher = (w: string) => {
    updateDemand(demandId, { watchers: demand.watchers.filter((x) => x !== w) });
  };

  const formatDate = (d: string | null) => d ? format(new Date(d), 'dd/MM/yyyy HH:mm') : '—';

  const TABS = [
    { id: 'details' as const, icon: FileText, label: 'Detalhes' },
    { id: 'activity' as const, icon: Activity, label: 'Atividades' },
    { id: 'comments' as const, icon: MessageSquare, label: 'Comentários', count: demandComments.length },
  ];

  const renderContent = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="text-primary font-medium">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-card card-shadow-hover border border-border flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex-1 pr-8">
            <Input
              className="text-lg font-semibold heading-tight border-none p-0 h-auto bg-transparent focus-visible:ring-0 shadow-none text-foreground"
              value={demand.title}
              onChange={(e) => updateDemand(demandId, { title: e.target.value })}
            />
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {demandType && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: `hsl(${demandType.color} / 0.1)`, color: `hsl(${demandType.color})` }}>
                  {demandType.label}
                </span>
              )}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${PRIORITY_CONFIG[demand.priority].className}`}>
                {PRIORITY_CONFIG[demand.priority].label}
              </span>
              {demand.isBlocked && (
                <span className="inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-accent-blocked/12 text-accent-blocked">
                  <AlertCircle className="h-3 w-3" /> Bloqueado
                </span>
              )}
              <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">{column?.title}</span>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className="text-[10px] bg-accent text-accent-foreground rounded-full px-1.5 py-0.5">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {activeTab === 'details' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-5">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Descrição</label>
                  <Textarea
                    className="min-h-[100px] rounded-xl border-border bg-background text-sm resize-none focus-visible:ring-ring"
                    value={demand.description}
                    onChange={(e) => updateDemand(demandId, { description: e.target.value })}
                    placeholder="Adicione uma descrição…"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Resultado Esperado</label>
                  <Textarea
                    className="min-h-[80px] rounded-xl border-border bg-background text-sm resize-none focus-visible:ring-ring"
                    value={demand.expectedResult}
                    onChange={(e) => updateDemand(demandId, { expectedResult: e.target.value })}
                    placeholder="Qual o resultado esperado…"
                  />
                </div>

                {client && (
                  <div className="rounded-xl border border-border p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Informações do Cliente</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Nome:</span> {client.name}</div>
                      <div><span className="text-muted-foreground">Empresa:</span> {client.company}</div>
                      <div><span className="text-muted-foreground">Contato:</span> {client.contactName}</div>
                      <div><span className="text-muted-foreground">E-mail:</span> {client.email}</div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Observações</label>
                  <Textarea
                    className="min-h-[80px] rounded-xl border-border bg-background text-sm resize-none focus-visible:ring-ring"
                    value={demand.notes}
                    onChange={(e) => updateDemand(demandId, { notes: e.target.value })}
                    placeholder="Observações internas…"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Anexos</label>
                  {demand.attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem anexos.</p>
                  ) : (
                    <div className="space-y-1">
                      {demand.attachments.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {demand.isBlocked && (
                  <div className="rounded-xl border border-accent-blocked/20 bg-accent-blocked/5 p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertCircle className="h-3.5 w-3.5 text-accent-blocked" />
                      <span className="text-sm font-medium text-accent-blocked">Bloqueio</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{demand.blockerReason}</p>
                    {demand.blockedBy && <p className="text-xs text-muted-foreground mt-1">Reportado por: {demand.blockedBy}</p>}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Field label="Cliente">
                  <Select value={demand.clientId || "none"} onValueChange={(v) => updateDemand(demandId, { clientId: v === 'none' ? '' : v })}>
                    <SelectTrigger className="h-9 rounded-xl border-border bg-background text-sm"><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Prioridade">
                  <Select value={demand.priority} onValueChange={(v) => updateDemand(demandId, { priority: v as Priority })}>
                    <SelectTrigger className="h-9 rounded-xl border-border bg-background text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tipo">
                  <Select value={demand.demandTypeId} onValueChange={(v) => updateDemand(demandId, { demandTypeId: v })}>
                    <SelectTrigger className="h-9 rounded-xl border-border bg-background text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {demandTypes.map((dt) => <SelectItem key={dt.id} value={dt.id}>{dt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Responsável">
                  <Input className="h-9 rounded-xl border-border bg-background text-sm focus-visible:ring-ring" value={demand.assignee} onChange={(e) => updateDemand(demandId, { assignee: e.target.value })} placeholder="Atribuir a…" />
                </Field>

                <Field label="Observadores">
                  <div className="space-y-1.5">
                    {demand.watchers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {demand.watchers.map((w) => (
                          <span key={w} className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">
                            <Eye className="h-3 w-3" />
                            {w}
                            <button onClick={() => removeWatcher(w)} className="text-muted-foreground hover:text-foreground ml-0.5">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1">
                      <Input
                        className="h-8 rounded-xl border-border bg-background text-xs flex-1 focus-visible:ring-ring"
                        value={watcherInput}
                        onChange={(e) => setWatcherInput(e.target.value)}
                        placeholder="Adicionar observador…"
                        onKeyDown={(e) => { if (e.key === 'Enter') addWatcher(); }}
                      />
                      <button onClick={addWatcher} className="h-8 px-3 rounded-xl border border-primary bg-card text-primary text-xs font-medium hover:bg-accent transition-colors">Adicionar</button>
                    </div>
                  </div>
                </Field>

                <Field label="Esforço Estimado">
                  <Input className="h-9 rounded-xl border-border bg-background text-sm focus-visible:ring-ring" value={demand.estimatedEffort} onChange={(e) => updateDemand(demandId, { estimatedEffort: e.target.value })} placeholder="ex: 4h" />
                </Field>
                <Field label="Esforço Real">
                  <Input className="h-9 rounded-xl border-border bg-background text-sm focus-visible:ring-ring" value={demand.actualEffort} onChange={(e) => updateDemand(demandId, { actualEffort: e.target.value })} placeholder="ex: 3h" />
                </Field>

                <div className="border-t border-border pt-4 space-y-2.5">
                  <DateRow label="Criado" date={demand.createdAt} />
                  <DateRow label="Iniciado" date={demand.startedAt} />
                  <DateRow label="Finalizado" date={demand.finishedAt} />
                  <DateRow label="Bloqueado" date={demand.blockedAt} />
                  <DateRow label="Atualizado" date={demand.lastUpdated} />
                </div>

                <div className="border-t border-border pt-4">
                  <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={demand.isBlocked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateDemand(demandId, { isBlocked: true, blockedAt: new Date().toISOString(), blockerReason: 'Aguardando cliente', blockedBy: 'Você' });
                        } else {
                          updateDemand(demandId, { isBlocked: false, blockedAt: null, blockerReason: '', blockedBy: '' });
                        }
                      }}
                      className="rounded accent-primary"
                    />
                    Marcar como bloqueado
                  </label>
                  {demand.isBlocked && (
                    <div className="space-y-2 mt-3">
                      <Select value={demand.blockerReason} onValueChange={(v) => updateDemand(demandId, { blockerReason: v })}>
                        <SelectTrigger className="h-9 rounded-xl border-border bg-background text-sm"><SelectValue placeholder="Motivo" /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(BLOCKER_REASONS).map(([k, v]) => <SelectItem key={k} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        className="h-9 rounded-xl border-border bg-background text-sm focus-visible:ring-ring"
                        value={demand.blockedBy}
                        onChange={(e) => updateDemand(demandId, { blockedBy: e.target.value })}
                        placeholder="Bloqueado por…"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {demandActivity.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>}
              {demandActivity.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-accent/50 transition-colors">
                  <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                    event.type === 'blocked' ? 'bg-accent-blocked' :
                    event.type === 'completed' ? 'bg-accent-low' :
                    event.type === 'moved' ? 'bg-primary' :
                    'bg-muted-foreground/40'
                  }`} />
                  <div>
                    <p className="text-sm text-foreground">{event.description}</p>
                    <p className="text-[11px] text-muted-foreground text-tabular">{formatDate(event.timestamp)} · {event.user}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  className="flex-1 rounded-xl border-border bg-background text-sm resize-none min-h-[60px] focus-visible:ring-ring"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva um comentário… Use @nome para mencionar"
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitComment(); }}
                />
                <button
                  onClick={handleSubmitComment}
                  className="self-end h-9 px-4 rounded-xl gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
                >
                  Enviar
                </button>
              </div>
              {demandComments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>}
              {demandComments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-border p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-full gradient-primary flex items-center justify-center text-[10px] font-medium text-primary-foreground">
                      {comment.user.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-foreground">{comment.user}</span>
                    <span className="text-[11px] text-muted-foreground text-tabular">{formatDate(comment.timestamp)}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{renderContent(comment.content)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function DateRow({ label, date }: { label: string; date: string | null }) {
  return (
    <div className="flex justify-between text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-tabular">{date ? format(new Date(date), 'dd/MM/yyyy HH:mm') : '—'}</span>
    </div>
  );
}