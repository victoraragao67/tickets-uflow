import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Client } from '@/types';

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Client, 'id' | 'createdAt'>) => void;
  client?: Client | null;
}

const EMPTY: Omit<Client, 'id' | 'createdAt'> = {
  name: '', company: '', segment: '', contactName: '', email: '', phone: '', website: '', notes: '', status: 'active', accountManager: '',
};

export function ClientFormModal({ open, onClose, onSave, client }: ClientFormModalProps) {
  const [form, setForm] = useState<Omit<Client, 'id' | 'createdAt'>>(EMPTY);

  useEffect(() => {
    if (client) {
      const { id, createdAt, ...rest } = client;
      setForm({ ...EMPTY, ...rest });
    } else {
      setForm(EMPTY);
    }
  }, [client, open]);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[560px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome do Cliente *</Label>
              <Input className="h-10 rounded-xl" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Empresa</Label>
              <Input className="h-10 rounded-xl" value={form.company} onChange={(e) => set('company', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Segmento</Label>
              <Input className="h-10 rounded-xl" value={form.segment} onChange={(e) => set('segment', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Responsável Interno</Label>
              <Input className="h-10 rounded-xl" value={form.accountManager} onChange={(e) => set('accountManager', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome do Contato</Label>
              <Input className="h-10 rounded-xl" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">E-mail</Label>
              <Input className="h-10 rounded-xl" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Telefone</Label>
              <Input className="h-10 rounded-xl" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Website</Label>
              <Input className="h-10 rounded-xl" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea className="min-h-[80px] rounded-xl resize-none" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Notas sobre o cliente…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-10 px-5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors">
              Cancelar
            </button>
            <button type="submit" className="h-10 px-5 rounded-xl gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
              {client ? 'Salvar Alterações' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
