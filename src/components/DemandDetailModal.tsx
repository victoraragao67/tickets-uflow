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
    addComment({ demandId, user: 'You', content: commentText.trim() });
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

  const formatDate = (d: string | null) => d ? format(new Date(d), 'MMM d, yyyy HH:mm') : '—';

  const TABS = [
    { id: 'details' as const, icon: FileText, label: 'Details' },
    { id: 'activity' as const, icon: Activity, label: 'Activity' },
    { id: 'comments' as const, icon: MessageSquare, label: 'Comments', count: demandComments.length },
  ];

  // Render @mentions in comments
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
        className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-xl bg-card card-shadow flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-6 pb-4">
          <div className="flex-1 pr-8">
            <Input
              className="text-lg font-medium heading-tight border-none p-0 h-auto bg-transparent focus-visible:ring-0 shadow-none"
              value={demand.title}
              onChange={(e) => updateDemand(demandId, { title: e.target.value })}
            />
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {demandType && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: `hsl(${demandType.color} / 0.12)`, color: `hsl(${demandType.color})` }}>
                  {demandType.label}
                </span>
              )}
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_CONFIG[demand.priority].className}`}>
                {PRIORITY_CONFIG[demand.priority].label}
              </span>
              {demand.isBlocked && (
                <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium bg-accent-blocked/15 text-accent-blocked">
                  <AlertCircle className="h-3 w-3" /> Blocked
                </span>
              )}
              <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{column?.title}</span>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 gap-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className="text-[10px] bg-muted rounded-full px-1.5">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {activeTab === 'details' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
                  <Textarea
                    className="min-h-[100px] bg-input border-none text-sm resize-none"
                    value={demand.description}
                    onChange={(e) => updateDemand(demandId, { description: e.target.value })}
                    placeholder="Add a description…"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Expected Result</label>
                  <Textarea
                    className="min-h-[80px] bg-input border-none text-sm resize-none"
                    value={demand.expectedResult}
                    onChange={(e) => updateDemand(demandId, { expectedResult: e.target.value })}
                    placeholder="What is the expected outcome…"
                  />
                </div>

                {/* Client Information */}
                {client && (
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Client Information</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Name:</span> {client.name}</div>
                      <div><span className="text-muted-foreground">Company:</span> {client.company}</div>
                      <div><span className="text-muted-foreground">Contact:</span> {client.contactName}</div>
                      <div><span className="text-muted-foreground">Email:</span> {client.email}</div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Notes</label>
                  <Textarea
                    className="min-h-[80px] bg-input border-none text-sm resize-none"
                    value={demand.notes}
                    onChange={(e) => updateDemand(demandId, { notes: e.target.value })}
                    placeholder="Internal notes…"
                  />
                </div>

                {/* Attachments */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Attachments</label>
                  {demand.attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attachments.</p>
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
                  <div className="rounded-lg border border-accent-blocked/20 bg-accent-blocked/5 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertCircle className="h-3.5 w-3.5 text-accent-blocked" />
                      <span className="text-sm font-medium text-accent-blocked">Blocker</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{demand.blockerReason}</p>
                    {demand.blockedBy && <p className="text-xs text-muted-foreground mt-1">Reported by: {demand.blockedBy}</p>}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Field label="Client">
                  <Select value={demand.clientId || "none"} onValueChange={(v) => updateDemand(demandId, { clientId: v === 'none' ? '' : v })}>
                    <SelectTrigger className="h-9 bg-input border-none text-sm"><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Priority">
                  <Select value={demand.priority} onValueChange={(v) => updateDemand(demandId, { priority: v as Priority })}>
                    <SelectTrigger className="h-9 bg-input border-none text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Type">
                  <Select value={demand.demandTypeId} onValueChange={(v) => updateDemand(demandId, { demandTypeId: v })}>
                    <SelectTrigger className="h-9 bg-input border-none text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {demandTypes.map((dt) => <SelectItem key={dt.id} value={dt.id}>{dt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Assignee">
                  <Input className="h-9 bg-input border-none text-sm" value={demand.assignee} onChange={(e) => updateDemand(demandId, { assignee: e.target.value })} placeholder="Assign to…" />
                </Field>

                {/* Watchers */}
                <Field label="Watchers">
                  <div className="space-y-1.5">
                    {demand.watchers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {demand.watchers.map((w) => (
                          <span key={w} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]">
                            <Eye className="h-3 w-3 text-muted-foreground" />
                            {w}
                            <button onClick={() => removeWatcher(w)} className="text-muted-foreground hover:text-foreground ml-0.5">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1">
                      <Input
                        className="h-8 bg-input border-none text-xs flex-1"
                        value={watcherInput}
                        onChange={(e) => setWatcherInput(e.target.value)}
                        placeholder="Add watcher…"
                        onKeyDown={(e) => { if (e.key === 'Enter') addWatcher(); }}
                      />
                      <button onClick={addWatcher} className="h-8 px-2 rounded-md bg-secondary text-secondary-foreground text-xs hover:opacity-90">Add</button>
                    </div>
                  </div>
                </Field>

                <Field label="Estimated Effort">
                  <Input className="h-9 bg-input border-none text-sm" value={demand.estimatedEffort} onChange={(e) => updateDemand(demandId, { estimatedEffort: e.target.value })} placeholder="e.g. 4h" />
                </Field>
                <Field label="Actual Effort">
                  <Input className="h-9 bg-input border-none text-sm" value={demand.actualEffort} onChange={(e) => updateDemand(demandId, { actualEffort: e.target.value })} placeholder="e.g. 3h" />
                </Field>

                <div className="border-t border-border pt-4 space-y-2">
                  <DateRow label="Created" date={demand.createdAt} />
                  <DateRow label="Started" date={demand.startedAt} />
                  <DateRow label="Finished" date={demand.finishedAt} />
                  <DateRow label="Blocked" date={demand.blockedAt} />
                  <DateRow label="Updated" date={demand.lastUpdated} />
                </div>

                <div className="border-t border-border pt-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={demand.isBlocked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateDemand(demandId, { isBlocked: true, blockedAt: new Date().toISOString(), blockerReason: 'Waiting for client', blockedBy: 'You' });
                        } else {
                          updateDemand(demandId, { isBlocked: false, blockedAt: null, blockerReason: '', blockedBy: '' });
                        }
                      }}
                      className="rounded"
                    />
                    Mark as blocked
                  </label>
                  {demand.isBlocked && (
                    <div className="space-y-2 mt-2">
                      <Select value={demand.blockerReason} onValueChange={(v) => updateDemand(demandId, { blockerReason: v })}>
                        <SelectTrigger className="h-9 bg-input border-none text-sm"><SelectValue placeholder="Reason" /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(BLOCKER_REASONS).map(([k, v]) => <SelectItem key={k} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        className="h-9 bg-input border-none text-sm"
                        value={demand.blockedBy}
                        onChange={(e) => updateDemand(demandId, { blockedBy: e.target.value })}
                        placeholder="Blocked by…"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {demandActivity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
              {demandActivity.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                    event.type === 'blocked' ? 'bg-accent-blocked' :
                    event.type === 'completed' ? 'bg-accent-low' :
                    event.type === 'moved' ? 'bg-primary' :
                    'bg-muted-foreground/40'
                  }`} />
                  <div>
                    <p className="text-sm">{event.description}</p>
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
                  className="flex-1 bg-input border-none text-sm resize-none min-h-[60px]"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment… Use @name to mention"
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitComment(); }}
                />
                <button
                  onClick={handleSubmitComment}
                  className="self-end h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Send
                </button>
              </div>
              {demandComments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
              {demandComments.map((c) => (
                <div key={c.id} className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{c.user}</span>
                    <span className="text-[11px] text-muted-foreground text-tabular">{formatDate(c.timestamp)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{renderContent(c.content)}</p>
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
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function DateRow({ label, date }: { label: string; date: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[11px] text-muted-foreground text-tabular">
        {date ? format(new Date(date), 'MMM d, HH:mm') : '—'}
      </span>
    </div>
  );
}
