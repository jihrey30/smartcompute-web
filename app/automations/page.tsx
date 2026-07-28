"use client";

import { useEffect, useState } from "react";
import { api, Automation } from "@/lib/api";
import { Loader2, Pencil, Trash2, Save, X, CalendarClock, Zap, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Dropdown } from "@/components/ui/Dropdown";
import { useUI } from "@/components/ui/UIProvider";
import { ActionButton } from "@/components/ui/ActionButton";

export default function TemplatesPage() {
  const [items, setItems] = useState<Automation[]>([]);
  const [schedule, setSchedule] = useState<{ payDays: number[] } | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadItems() {
    try {
      const [res, schedRes] = await Promise.all([
        api.get('automations'),
        api.get('pay-schedule')
      ]);
      setItems(res.data);
      if (schedRes.data) {
        setSchedule(schedRes.data);
      }
    } catch (error) {
      console.error("Failed to load recurring items", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchItems() {
      try {
        const [res, schedRes] = await Promise.all([
          api.get('automations'),
          api.get('pay-schedule')
        ]);
        setItems(res.data);
        if (schedRes.data) {
          setSchedule(schedRes.data);
        }
      } catch (error) {
        console.error("Failed to load recurring items", error);
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, []);

  async function handleUpdateItem(id: string, data: Partial<Automation>) {
    try {
      await api.patch(`automations/${id}`, data);
      loadItems();
    } catch (error) {
      console.error("Failed to update item", error);
      alert("Failed to update item.");
    }
  }

  async function handleDeleteItem(id: string) {
    try {
      await api.delete(`automations/${id}`);
      loadItems();
    } catch (error) {
      console.error("Failed to delete item", error);
      alert("Failed to delete item.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const groupedItems = items.reduce((acc, item) => {
    const key = item.recurrence || 'EVERY_PAYDAY';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, Automation[]>);

  const getGroupName = (key: string) => {
    if (key === 'EVERY_PAYDAY') return 'Every Payday';
    if (key === 'FIRST_PAYDAY') return `Day ${schedule?.payDays?.[0] || '15'} of the month`;
    if (key === 'SECOND_PAYDAY') return `Day ${schedule?.payDays?.[1] || '30'} of the month`;
    return key;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Automations
            <span className="text-xs font-medium bg-primary/20 text-primary px-2.5 py-1 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Blueprints
            </span>
          </h1>
          <p className="text-foreground/60 mt-1">Manage budget blueprints to automatically populate new pay periods.</p>
        </div>
      </header>
      <div className="space-y-6">
        {items.length > 0 ? (
          Object.entries(groupedItems).sort(([a], [b]) => {
            const order: Record<string, number> = { 'FIRST_PAYDAY': 1, 'SECOND_PAYDAY': 2, 'EVERY_PAYDAY': 3 };
            return (order[a] || 4) - (order[b] || 4);
          }).map(([groupKey, groupItems]) => (
            <section key={groupKey} className="glass-panel p-6">
              <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-4 border-l-2 border-primary pl-2">{getGroupName(groupKey)}</h3>
              <div className="space-y-3">
                {groupItems.map((item) => (
                  <AutomationRow 
                    key={item.id} 
                    item={item} 
                    schedule={schedule} 
                    onEdit={handleUpdateItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <section className="glass-panel p-6 text-center py-12">
            <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-foreground/40" />
            </div>
            <h3 className="text-lg font-medium">No automations found</h3>
            <p className="text-sm max-w-sm mx-auto mt-2">These act as blueprints. When you create a new pay period, these are automatically applied to it.</p>
          </section>
        )}
      </div>
    </div>
  );
}

function AutomationRow({ 
  item, 
  schedule,
  onEdit,
  onDelete
}: { 
  item: Automation, 
  schedule: { payDays: number[] } | null,
  onEdit: (id: string, data: Partial<Automation>) => void,
  onDelete: (id: string) => void,
}) {
  const { currency } = useUI();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState({ 
    name: item.name, 
    amount: item.defaultAmount.toString(), 
    type: item.type, 
    recurrence: item.recurrence || "EVERY_PAYDAY" 
  });

  const getRecurrenceLabel = () => {
    if (item.recurrence === 'FIRST_PAYDAY' && schedule?.payDays?.[0]) return `Day ${schedule.payDays[0]}`;
    if (item.recurrence === 'SECOND_PAYDAY' && schedule?.payDays?.[1]) return `Day ${schedule.payDays[1]}`;
    return item.recurrence === 'FIRST_PAYDAY' ? '1st Payday' : '2nd Payday';
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData.name || !editData.amount) return;
    onEdit(item.id, {
      name: editData.name,
      defaultAmount: parseFloat(editData.amount),
      type: editData.type,
      recurrence: editData.recurrence,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="flex flex-col gap-4 p-4 bg-surface-hover rounded-lg border border-primary/30 animate-in fade-in">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <input 
            type="text" 
            placeholder="Item name" 
            className="flex-1 w-full bg-background border border-surface-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
            value={editData.name}
            onChange={(e) => setEditData({...editData, name: e.target.value})}
            autoFocus
          />
          <input 
            type="number" 
            placeholder="Amount" 
            step="0.01"
            className="w-full md:w-32 bg-background border border-surface-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
            value={editData.amount}
            onChange={(e) => setEditData({...editData, amount: e.target.value})}
          />
          <Dropdown 
            className="w-full md:w-32"
            value={editData.type}
            onChange={(val) => setEditData({...editData, type: val})}
            options={[
              { value: "EXPENSE", label: "Expense" },
              { value: "INCOME", label: "Income" },
              { value: "SAVINGS", label: "Savings" },
              { value: "DEBT", label: "Debt" }
            ]}
          />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-surface-border">
          {schedule?.payDays && schedule.payDays.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-foreground/70">Recur on:</span>
              <Dropdown
                className="w-48"
                value={editData.recurrence}
                onChange={(val) => setEditData({...editData, recurrence: val})}
                options={[
                  { value: "EVERY_PAYDAY", label: "Every Payday" },
                  ...(schedule.payDays[0] ? [{ value: "FIRST_PAYDAY", label: `Only on Day ${schedule.payDays[0]}` }] : []),
                  ...(schedule.payDays[1] ? [{ value: "SECOND_PAYDAY", label: `Only on Day ${schedule.payDays[1]}` }] : [])
                ]}
              />
            </div>
          )}
          <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
            <ActionButton 
              type="submit" 
              icon={Save} 
              label="Save" 
              variant="primary" 
              className="flex-1 md:flex-none"
            />
            <ActionButton 
              type="button" 
              icon={X} 
              label="Cancel" 
              variant="default"
              onClick={() => {
                setIsEditing(false);
                setEditData({ name: item.name, amount: item.defaultAmount.toString(), type: item.type, recurrence: item.recurrence || "EVERY_PAYDAY" });
              }} 
              className="flex-1 md:flex-none"
            />
          </div>
        </div>
      </form>
    );
  }

  if (isDeleting) {
    return (
      <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20 animate-in fade-in">
        <div className="flex items-center space-x-3 text-red-500 mb-4 md:mb-0">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium text-sm">Are you sure you want to delete the &quot;{item.name}&quot; automation? It will no longer be applied to future pay periods.</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onDelete(item.id)} className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors">Yes, Delete</button>
          <button onClick={() => setIsDeleting(false)} className="bg-background text-foreground/70 px-4 py-2 rounded-md text-sm border border-surface-border hover:text-foreground transition-colors">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-surface-border hover-lift group transition-all">
      <div className="flex items-center space-x-4">
        <div>
          <h4 className="font-semibold">{item.name}</h4>
          <div className="flex items-center space-x-2 mt-1">
            {item.category && (
              <span 
                className="text-xs px-2 py-0.5 rounded-full border" 
                style={{ backgroundColor: `${item.category.color}10`, color: item.category.color, borderColor: `${item.category.color}30` }}
              >
                {item.category.name}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-foreground/70 capitalize border border-surface-border">
              {item.type}
            </span>
            {item.recurrence && item.recurrence !== 'EVERY_PAYDAY' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center">
                <CalendarClock className="w-3 h-3 mr-1" />
                {getRecurrenceLabel()}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-6">
        <div>
          <div className="text-xs text-foreground/50 mb-1">Default Amount</div>
          <div className="font-bold text-lg">{formatCurrency(parseFloat(item.defaultAmount.toString()), currency)}</div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionButton 
            icon={Pencil} 
            label="Edit" 
            onClick={() => setIsEditing(true)}
            variant="ghost"
          />
          <ActionButton 
            icon={Trash2} 
            label="Delete" 
            onClick={() => setIsDeleting(true)}
            variant="danger"
          />
        </div>
      </div>
    </div>
  );
}
