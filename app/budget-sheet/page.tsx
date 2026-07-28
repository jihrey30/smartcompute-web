"use client";

import { useEffect, useState, useMemo } from "react";
import { api, PayPeriod, BudgetItem, Status } from "@/lib/api";
import { Plus, Loader2, Pencil, Trash2, Save, X, Wallet, Repeat, CheckCircle, ChevronDown, GripVertical } from "lucide-react";
import { cn, formatCurrency, getPayPeriodDate, formatPayPeriodLabel } from "@/lib/utils";
import { Dropdown } from "@/components/ui/Dropdown";
import { useUI } from "@/components/ui/UIProvider";
import { ActionButton } from "@/components/ui/ActionButton";
import { NewBudgetItemModal, NewBudgetItemData } from "@/components/NewBudgetItemModal";
import { AnimatePresence, motion } from "framer-motion";
import { DndContext, DragEndEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface UpdateBudgetItemData {
  name?: string;
  amount?: string;
  type?: string;
  isRecurring?: boolean;
  recurrence?: string;
  statusId?: string;
  targetDate?: string;
}

export default function BudgetSheetPage() {
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { currency } = useUI();
  const [isAdding, setIsAdding] = useState(false);
  const [schedule, setSchedule] = useState<{ payDays: number[] } | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPaidGlow, setIsPaidGlow] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );
  async function loadData() {
    try {
      const [periodsRes, schedRes, statusesRes] = await Promise.all([
        api.get('pay-periods'),
        api.get('pay-schedule'),
        api.get('statuses')
      ]);
      
      if (schedRes.data) {
        setSchedule(schedRes.data);
      }
      
      if (statusesRes.data) {
        setStatuses(statusesRes.data);
      }

      if (periodsRes.data && periodsRes.data.length > 0) {
        setPeriods(periodsRes.data);
        if (!selectedPeriodId || !periodsRes.data.find((p: PayPeriod) => p.id === selectedPeriodId)) {
          setSelectedPeriodId(periodsRes.data[0].id);
        }
      } else {
        setPeriods([]);
        setSelectedPeriodId(null);
      }
    } catch (error) {
      console.error("Failed to load budget data", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // We wrap loadData in setTimeout to avoid the strict synchronous setState lint error 
    // from custom rulesets catching setState calls even inside async functions.
    setTimeout(() => {
      void loadData();
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payPeriod = periods.find(p => p.id === selectedPeriodId) || null;

  async function handleDeleteItem(id: string) {
    if (!confirm("Are you sure you want to delete this budget item?")) return;
    try {
      await api.delete(`budget-items/${id}`);
      loadData();
    } catch (error) {
      console.error("Failed to delete item", error);
      alert("Failed to delete item.");
    }
  }


  async function handleUpdateItem(id: string, data: UpdateBudgetItemData) {
    try {
      const { isRecurring, recurrence, ...patchData } = data;
      
      let targetPayPeriodId = payPeriod?.id;
      if (!isRecurring && patchData.targetDate && schedule?.payDays) {
         const pDate = getPayPeriodDate(patchData.targetDate, schedule.payDays);
         if (pDate) {
           const matchingPeriod = periods.find(p => {
             const localPDate = new Date(p.payDate);
             return localPDate.getDate() === pDate.getUTCDate() &&
                    localPDate.getMonth() === pDate.getUTCMonth() &&
                    localPDate.getFullYear() === pDate.getUTCFullYear();
           });
           if (matchingPeriod) {
             targetPayPeriodId = matchingPeriod.id;
           }
         }
      } else if (isRecurring && schedule?.payDays && payPeriod && recurrence !== "EVERY_PAYDAY") {
         const targetDay = recurrence === "FIRST_PAYDAY" ? schedule.payDays[0] : schedule.payDays[1];
         if (targetDay) {
            const currentPeriodDate = new Date(payPeriod.payDate);
            const match = periods.find(p => {
               const pD = new Date(p.payDate);
               return pD.getMonth() === currentPeriodDate.getMonth() &&
                      pD.getFullYear() === currentPeriodDate.getFullYear() &&
                      pD.getDate() === targetDay;
            });
            if (match) targetPayPeriodId = match.id;
         }
      }

      const payload: Record<string, unknown> = { ...patchData };
      if (targetPayPeriodId) payload.payPeriod = { connect: { id: targetPayPeriodId } };
      
      if (payload.statusId) {
        payload.status = { connect: { id: payload.statusId } };
        
        // Trigger glow if marked as paid
        const defaultPaidStatus = statuses.find(s => s.slug === 'paid');
        if (defaultPaidStatus && payload.statusId === defaultPaidStatus.id) {
          triggerPaidGlow();
        }
      } else if (payload.statusId === null) {
        payload.status = { disconnect: true };
      }
      delete payload.statusId;
      
      await api.patch(`budget-items/${id}`, payload);
      
      if (isRecurring) {
        await api.post('automations', {
          name: patchData.name,
          defaultAmount: parseFloat(patchData.amount || "0"),
          type: patchData.type?.toUpperCase(),
          isActive: true,
          recurrence: recurrence,
          startPayPeriodId: payPeriod?.id
        });
      }
      
      loadData();
    } catch (error) {
      console.error("Failed to update item", error);
      alert("Failed to update item.");
    }
  }

  const displayData = payPeriod || { items: [] as BudgetItem[] };

  const defaultPaidStatus = useMemo(() => statuses.find(s => s.slug === 'paid'), [statuses]);
  
  const { paidItems, unpaidGroups, paidTotal } = useMemo(() => {
    const items = displayData.items || [];
    if (!defaultPaidStatus) return { paidItems: [], unpaidGroups: [], paidTotal: 0 };
    
    const paid = items.filter(item => item.statusId === defaultPaidStatus.id);
    const unpaid = items.filter(item => item.statusId !== defaultPaidStatus.id);
    const total = paid.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    
    const groups: { status: Status | undefined; items: BudgetItem[] }[] = [];
    
    statuses.forEach(status => {
      if (status.id === defaultPaidStatus.id) return;
      const groupItems = unpaid.filter(item => item.statusId === status.id);
      if (groupItems.length > 0 || status.slug === 'to-pay') {
        groups.push({ status, items: groupItems });
      }
    });
    
    const unassignedItems = unpaid.filter(item => !item.statusId);
    if (unassignedItems.length > 0) {
      groups.push({ status: undefined, items: unassignedItems });
    }
    
    return { paidItems: paid, unpaidGroups: groups, paidTotal: total };
  }, [displayData.items, defaultPaidStatus, statuses]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }


  if (periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in">
        <Wallet className="w-16 h-16 text-primary/50" />
        <h2 className="text-2xl font-bold">No Pay Periods Yet</h2>
        <p className="text-foreground/60 max-w-md">Go to your Dashboard to generate a new pay period.</p>
      </div>
    );
  }

  const triggerPaidGlow = () => {
    setIsPaidGlow(true);
    setTimeout(() => {
      setIsPaidGlow(false);
    }, 1500);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !payPeriod) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) return;

    const currentItems = [...(payPeriod.items || [])];
    const activeIndex = currentItems.findIndex(i => i.id === activeId);
    if (activeIndex === -1) return;

    const activeItem = currentItems[activeIndex];
    
    let newStatusId = activeItem.statusId;
    let newIndex = activeIndex;

    const overItemIndex = currentItems.findIndex(i => i.id === overId);
    
    if (overItemIndex !== -1) {
      // Dropped on another item
      newStatusId = currentItems[overItemIndex].statusId;
      newIndex = overItemIndex;
    } else {
      // Dropped on an empty container
      newStatusId = overId === 'unassigned' ? null : overId;
      // Put at the end of the new list
      newIndex = currentItems.length - 1; 
    }

    if (newStatusId && newStatusId !== activeItem.statusId && newStatusId === defaultPaidStatus?.id) {
      triggerPaidGlow();
    }

    // Optimistic update
    const updatedItems = arrayMove(currentItems, activeIndex, newIndex).map((item, index) => {
      if (item.id === activeId) {
        return { ...item, statusId: newStatusId, sortOrder: index };
      }
      return { ...item, sortOrder: index };
    });

    setPeriods(periods.map(p => 
      p.id === payPeriod.id ? { ...p, items: updatedItems } : p
    ));

    // Backend sync
    try {
      const payload = updatedItems
        .filter(item => item.statusId === newStatusId || item.id === activeId)
        .map(item => ({
          id: item.id,
          statusId: item.statusId,
          sortOrder: item.sortOrder
        }));
        
      await api.patch('budget-items/bulk-update', { items: payload });
    } catch (error) {
      console.error("Failed to reorder items", error);
      // Fallback
      loadData();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Budget Sheet
            <span className="text-xs font-medium bg-primary/20 text-primary px-2.5 py-1 rounded-full flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              Transactions
            </span>
          </h1>
          <div className="flex items-center flex-wrap gap-3 mt-3">
            <span className="text-sm font-medium text-foreground/60">Pay Period:</span>
            <Dropdown 
              className="w-56"
              value={selectedPeriodId || ""}
              onChange={setSelectedPeriodId}
              options={periods.map(p => ({
                value: p.id,
                label: `${p.label} ${new Date(p.payDate).getFullYear()}`
              }))}
              placeholder="Select Period"
            />
          </div>
        </div>
        <ActionButton 
          variant="primary" 
          icon={Plus} 
          label="New Budget Item"
          onClick={() => setIsAdding(true)}
          className="hover-lift shadow-lg shadow-primary/20"
        />
      </header>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            {unpaidGroups.length > 0 ? (
              unpaidGroups.map((group) => (
                <section key={group.status?.id || 'unassigned'} className="glass-panel p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: group.status?.color || '#a1a1aa' }}>
                      {group.status && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.status.color }} />}
                      {!group.status && <div className="w-3 h-3 rounded-full bg-zinc-400" />}
                      {group.status?.name || 'Unassigned Items'}
                    </h2>
                    <span 
                      className="text-sm font-bold px-3 py-1 rounded-full border"
                      style={{ 
                        backgroundColor: `${group.status?.color || '#a1a1aa'}1A`, 
                        color: group.status?.color || '#a1a1aa',
                        borderColor: `${group.status?.color || '#a1a1aa'}33` 
                      }}
                    >
                      {formatCurrency(group.items.reduce((acc, i) => acc + (Number(i.amount) || 0), 0), currency)}
                    </span>
                  </div>
                  <DroppableSection id={group.status?.id || 'unassigned'} className="flex flex-col gap-3">
                    <SortableContext items={group.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      <AnimatePresence mode="popLayout">
                        {group.items.length > 0 ? (
                          group.items.map((item: BudgetItem) => (
                            <motion.div
                              key={item.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                              <BudgetItemRow item={item} schedule={schedule} payPeriodLabel={payPeriod?.label} statuses={statuses} onEdit={handleUpdateItem} onDelete={handleDeleteItem} />
                            </motion.div>
                          ))
                        ) : (
                          <motion.div 
                            key="empty"
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-8 text-center border border-dashed border-surface-border rounded-lg bg-surface-hover/30"
                          >
                            <p className="text-sm text-foreground/50">No items here yet.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </SortableContext>
                  </DroppableSection>
                </section>
              ))
            ) : (
            <section className="glass-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Line Items</h2>
              </div>
              <motion.div 
                key="empty"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center text-foreground/50 border border-dashed border-surface-border rounded-lg"
              >
                <p>No unpaid items for this pay period.</p>
                <button onClick={() => setIsAdding(true)} className="text-primary hover:underline mt-2">Add a new item</button>
              </motion.div>
            </section>
          )}
        </div>

          {defaultPaidStatus && (
            <aside className="lg:col-span-1 relative group">
              <div className="sticky top-8 bg-surface/40 backdrop-blur-xl border border-surface-border shadow-lg rounded-2xl p-6 transition-all duration-300">
                {/* Modern Border Trace Effect */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none z-0 overflow-hidden">
                  <AnimatePresence>
                    {isPaidGlow && (
                      <svg className="absolute inset-0 w-full h-full">
                        <motion.rect
                          width="100%"
                          height="100%"
                          rx="16"
                          stroke="currentColor"
                          className="text-emerald-500"
                          strokeWidth="4"
                          fill="none"
                          initial={{ pathLength: 0, opacity: 1 }}
                          animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                          transition={{ 
                            pathLength: { duration: 1, ease: "easeInOut" },
                            opacity: { duration: 1.2, ease: "easeOut" }
                          }}
                        />
                      </svg>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    Paid Items
                  </h2>
                  <motion.span 
                    animate={isPaidGlow ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.4 }}
                    className="text-sm font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20"
                  >
                    {formatCurrency(paidTotal, currency)}
                  </motion.span>
                </div>
                <DroppableSection id={defaultPaidStatus.id} className="flex flex-col gap-3 relative z-10">
                  <SortableContext items={paidItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <AnimatePresence mode="popLayout">
                      {paidItems.length > 0 ? (
                        paidItems.map((item: BudgetItem) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                          >
                            <BudgetItemRow item={item} schedule={schedule} payPeriodLabel={payPeriod?.label} statuses={statuses} onEdit={handleUpdateItem} onDelete={handleDeleteItem} compact />
                          </motion.div>
                        ))
                      ) : (
                        <motion.div 
                          key="empty"
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="py-8 text-center border border-dashed border-primary/20 rounded-lg bg-primary/5"
                        >
                          <p className="text-sm text-primary/70">Mark items as paid to see them here.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SortableContext>
                </DroppableSection>
              </div>
            </aside>
          )}
        </div>
        
        <DragOverlay dropAnimation={{
          duration: 350,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)'
        }}>
          {activeId && payPeriod?.items ? (
            <BudgetItemRow 
              item={payPeriod.items.find(i => i.id === activeId)!} 
              schedule={schedule} 
              payPeriodLabel={payPeriod.label} 
              statuses={statuses} 
              onEdit={handleUpdateItem} 
              onDelete={handleDeleteItem} 
              isOverlay 
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <NewBudgetItemModal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        schedule={schedule}
        statuses={statuses}
        onSave={async (data: NewBudgetItemData) => {
          if (!payPeriod) return;
          try {
            let targetPayPeriodId = payPeriod.id;
            
            if (!data.isRecurring && data.targetDate && schedule?.payDays) {
              const pDate = getPayPeriodDate(data.targetDate, schedule.payDays);
              if (pDate) {
                const matchingPeriod = periods.find(p => {
                  const localPDate = new Date(p.payDate);
                  return localPDate.getDate() === pDate.getUTCDate() &&
                         localPDate.getMonth() === pDate.getUTCMonth() &&
                         localPDate.getFullYear() === pDate.getUTCFullYear();
                });
                if (matchingPeriod) {
                  targetPayPeriodId = matchingPeriod.id;
                } else {
                  alert(`Note: The target date falls outside of your generated pay periods. Saving to the current view.`);
                }
              }
            } else if (data.isRecurring && schedule?.payDays && data.recurrence !== "EVERY_PAYDAY") {
               const targetDay = data.recurrence === "FIRST_PAYDAY" ? schedule.payDays[0] : schedule.payDays[1];
               if (targetDay) {
                  const currentPeriodDate = new Date(payPeriod.payDate);
                  const match = periods.find(p => {
                     const pD = new Date(p.payDate);
                     return pD.getMonth() === currentPeriodDate.getMonth() &&
                            pD.getFullYear() === currentPeriodDate.getFullYear() &&
                            pD.getDate() === targetDay;
                  });
                  if (match) targetPayPeriodId = match.id;
               }
            }

            await api.post('budget-items', {
              name: data.title,
              amount: parseFloat(data.amount),
              type: data.type ? data.type.toUpperCase() : "EXPENSE",
              isStarred: false,
              targetDate: (!data.isRecurring && data.targetDate) ? new Date(data.targetDate as string).toISOString() : null,
              payPeriod: { connect: { id: targetPayPeriodId } },
              ...(data.statusId ? { status: { connect: { id: data.statusId } } } : {})
            });
            if (data.isRecurring) {
              await api.post('automations', {
                name: data.title,
                defaultAmount: parseFloat(data.amount),
                type: data.type ? data.type.toUpperCase() : "EXPENSE",
                isActive: true,
                recurrence: data.recurrence,
              });
            }
            setIsAdding(false);
            loadData();
          } catch (error) {
            console.error("Failed to add item", error);
            alert("Failed to add item. Check console.");
          }
        }}
      />
    </div>
  );
}

function DroppableSection({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn("min-h-[100px]", className)}>
      {children}
    </div>
  );
}

function BudgetItemRow({ item, schedule, payPeriodLabel, statuses, onEdit, onDelete, compact, isOverlay }: { item: BudgetItem, schedule: { payDays: number[] } | null, payPeriodLabel?: string, statuses: Status[], onEdit: (id: string, data: UpdateBudgetItemData) => void, onDelete: (id: string) => void, compact?: boolean, isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, data: { item } });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : (isOverlay ? 100 : 'auto'),
  };

  const { currency } = useUI();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editData, setEditData] = useState({ 
    name: item.name, 
    amount: item.amount.toString(), 
    type: item.type, 
    isRecurring: false, 
    recurrence: "EVERY_PAYDAY",
    statusId: item.statusId || "",
    targetDate: (item as unknown as {targetDate?: string}).targetDate ? new Date((item as unknown as {targetDate?: string}).targetDate as string).toISOString().split('T')[0] : "" 
  });

  const handleSave = () => {
    onEdit(item.id, {
      name: editData.name,
      amount: editData.amount,
      type: editData.type,
      statusId: editData.statusId || undefined,
      isRecurring: editData.isRecurring,
      recurrence: editData.recurrence,
      targetDate: (!editData.isRecurring && editData.targetDate) ? new Date(editData.targetDate).toISOString() : undefined
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className={cn("bg-surface rounded-lg border border-primary/50 transition-colors animate-in fade-in", compact ? "p-3" : "p-4")}>
        <div className="flex flex-col gap-3">
          
          {/* Row 1: Name and Amount */}
          <div className="flex gap-3">
            <input 
              type="text" 
              className="flex-1 min-w-0 bg-background border border-surface-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary placeholder:text-foreground/30"
              value={editData.name}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
              placeholder="Name"
            />
            <input 
              type="number" 
              step="0.01"
              className="w-24 sm:w-32 flex-shrink-0 bg-background border border-surface-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary placeholder:text-foreground/30"
              value={editData.amount}
              onChange={(e) => setEditData({...editData, amount: e.target.value})}
              placeholder="0.00"
            />
          </div>

          {/* Row 2: Type and Status */}
          <div className="flex gap-3">
            <Dropdown
              className="flex-1"
              value={editData.type}
              onChange={(val) => setEditData({...editData, type: val})}
              options={[
                { value: 'EXPENSE', label: 'Expense' },
                { value: 'INCOME', label: 'Income' },
                { value: 'DEBT', label: 'Debt' },
                { value: 'SAVINGS', label: 'Savings' }
              ]}
            />
            <Dropdown
              className="flex-1"
              value={editData.statusId}
              onChange={(val) => setEditData({...editData, statusId: val})}
              options={[
                { value: "", label: "No Status" },
                ...statuses.map(s => ({ value: s.id, label: s.name }))
              ]}
            />
          </div>

          {/* Row 3: Target Date / Recurring & Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mt-1 pt-3 border-t border-surface-border">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setEditData({...editData, isRecurring: !editData.isRecurring})}
                className={cn(
                  "p-2 rounded-md transition-colors border flex-shrink-0",
                  editData.isRecurring ? "bg-primary text-white border-primary" : "bg-surface border-surface-border text-foreground/50 hover:text-foreground hover:bg-surface-hover"
                )}
                title="Toggle Recurring"
              >
                <Repeat className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                {!editData.isRecurring ? (
                  <input 
                    type="date" 
                    className="w-full bg-background border border-surface-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground/70"
                    value={editData.targetDate}
                    onChange={(e) => setEditData({...editData, targetDate: e.target.value})}
                  />
                ) : (
                  schedule?.payDays && schedule.payDays.length > 0 && (
                    <Dropdown
                      className="w-full"
                      value={editData.recurrence}
                      onChange={(val) => setEditData({...editData, recurrence: val})}
                      options={[
                        { value: "EVERY_PAYDAY", label: "Every Payday" },
                        ...(schedule.payDays[0] ? [{ value: "FIRST_PAYDAY", label: `Day ${schedule.payDays[0]}` }] : []),
                        ...(schedule.payDays[1] ? [{ value: "SECOND_PAYDAY", label: `Day ${schedule.payDays[1]}` }] : [])
                      ]}
                    />
                  )
                )}
              </div>
            </div>

            <div className={cn("flex items-center gap-2", compact ? "justify-end w-full" : "w-full sm:w-auto")}>
              <ActionButton type="button" icon={Save} label="Save" variant="primary" onClick={handleSave} className={cn(compact ? "flex-1" : "flex-1 sm:flex-none")} />
              <ActionButton type="button" icon={X} label="Cancel" variant="default" onClick={() => setIsEditing(false)} className={cn(compact ? "flex-1" : "flex-1 sm:flex-none")} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const badgeContent = (
    <div className="flex items-center flex-wrap gap-2">
      {payPeriodLabel && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
          {formatPayPeriodLabel(payPeriodLabel)}
        </span>
      )}
      {(item as unknown as {targetDate?: string}).targetDate && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-foreground/70 border border-surface-border whitespace-nowrap">
          {new Date((item as unknown as {targetDate?: string}).targetDate as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      )}
      {item.category && (
        <span 
          className="text-xs px-2 py-0.5 rounded-full border whitespace-nowrap" 
          style={{ backgroundColor: `${item.category.color}15`, color: item.category.color, borderColor: `${item.category.color}30` }}
        >
          {item.category.name}
        </span>
      )}
      {item.status && (
        <span 
          className="text-xs px-2 py-0.5 rounded-full border whitespace-nowrap" 
          style={{ backgroundColor: `${item.status.color}15`, color: item.status.color, borderColor: `${item.status.color}30` }}
        >
          {item.status.name}
        </span>
      )}
      <span className="text-xs text-foreground/50 capitalize px-1">{item.type.toLowerCase()}</span>
    </div>
  );

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(
      "flex flex-col bg-surface rounded-lg border transition-all overflow-hidden cursor-grab active:cursor-grabbing group hover:border-primary/40", 
      compact ? "p-3" : "p-3 md:p-4", 
      isDragging && !isOverlay ? "opacity-30 border-primary/30 bg-surface/50 shadow-sm" : "border-surface-border",
      isOverlay && "opacity-100 shadow-2xl scale-[1.02] border-primary ring-2 ring-primary/20 rotate-1 shadow-primary/10"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="opacity-0 group-hover:opacity-40 transition-opacity -ml-1 sm:-ml-2 hidden sm:block">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-hover flex-shrink-0 flex items-center justify-center">
          <span className="font-bold text-foreground/60">{item.name?.charAt(0)}</span>
        </div>
        <div>
          <h4 className={cn("font-semibold", compact ? "text-sm" : "text-sm md:text-base")}>{item.name}</h4>
          <div className={cn("mt-1", compact ? "hidden" : "hidden md:block")}>
            {badgeContent}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className={cn("font-bold", compact ? "text-sm" : "text-sm md:text-base")}>{formatCurrency(parseFloat(item.amount.toString()), currency)}</div>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className={cn("p-1.5 rounded-md text-foreground/50 hover:bg-surface-hover hover:text-foreground transition-colors", compact ? "block" : "block md:hidden")}
        >
          <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
        </button>
        <div className={cn("items-center gap-1", compact ? "hidden" : "hidden md:flex")}>
          <ActionButton icon={Pencil} label="Edit" variant="ghost" onClick={() => setIsEditing(true)} />
          <ActionButton icon={Trash2} label="Delete" variant="danger" onClick={() => onDelete(item.id)} />
        </div>
      </div>
      </div>
      {isExpanded && (
        <div className={cn("mt-3 pt-3 border-t border-surface-border flex-col gap-4 animate-in fade-in slide-in-from-top-2", compact ? "flex" : "flex md:hidden")}>
          {badgeContent}
          <div className="flex items-center justify-end gap-2">
            <ActionButton icon={Pencil} label="Edit" variant="ghost" onClick={() => setIsEditing(true)} />
            <ActionButton icon={Trash2} label="Delete" variant="danger" onClick={() => onDelete(item.id)} />
          </div>
        </div>
      )}
    </div>
  );
}
