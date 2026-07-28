import { useState, useRef, useEffect } from "react";
import { X, ArrowRight, Check, Repeat, Calendar } from "lucide-react";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { Dropdown } from "@/components/ui/Dropdown";
import { useUI } from "@/components/ui/UIProvider";
import { useAsyncAction } from "@/lib/useAsyncAction";
import { useRouter } from "next/navigation";
import { Status } from "@/lib/api";
export interface NewBudgetItemData {
  title: string;
  amount: string;
  type: string;
  isRecurring: boolean;
  recurrence: string;
  statusId: string;
  targetDate: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewBudgetItemData) => Promise<void>;
  schedule: { payDays: number[] } | null;
  statuses: Status[];
}

function getPayPeriodForDate(targetDate: string, payDays: number[]): string {
  if (!targetDate || !payDays || payDays.length === 0) return "";
  // Parse date assuming local time to avoid timezone offset issues with YYYY-MM-DD
  const [year, month, day] = targetDate.split('-').map(Number);
  const d = day;
  const m = month - 1; // 0-indexed month
  const y = year;

  const sortedDays = [...payDays].sort((a, b) => a - b);
  
  let resultDate: Date | null = null;

  for (let i = sortedDays.length - 1; i >= 0; i--) {
    if (d >= sortedDays[i]) {
      resultDate = new Date(y, m, sortedDays[i]);
      break;
    }
  }

  if (!resultDate) {
    resultDate = new Date(y, m - 1, sortedDays[sortedDays.length - 1]);
  }

  return resultDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function NewBudgetItemModal({ isOpen, onClose, onSave, schedule, statuses }: Props) {
  const { currency } = useUI();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    title: "",
    amount: "",
    type: "expense",
    isRecurring: false,
    recurrence: "EVERY_PAYDAY",
    statusId: "",
    targetDate: ""
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const toPayStatus = statuses.find(s => s.slug === 'to-pay');
        setStep(1);
        setData({ title: "", amount: "", type: "expense", isRecurring: false, recurrence: "EVERY_PAYDAY", statusId: toPayStatus?.id || "", targetDate: "" });
        inputRef.current?.focus();
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const { execute: executeNext, isPending } = useAsyncAction(async () => {
    if (step === 1 && data.title.trim()) {
      setStep(2);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (step === 2 && data.amount) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      await onSave(data);
    }
  });

  const handleNext = () => executeNext();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isPending) {
      e.preventDefault();
      handleNext();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-surface border border-primary/20 shadow-2xl shadow-primary/5 rounded-3xl w-full max-w-lg overflow-hidden relative flex flex-col min-h-[420px] animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-2 relative z-10">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            {step > 1 && data.title ? data.title : "New Budget Item"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-hover text-foreground/50 hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 flex-1 flex flex-col justify-center relative overflow-visible">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 absolute inset-0 p-8 flex flex-col justify-center">
              <label className="text-sm font-medium text-primary mb-4 uppercase tracking-wider">What is this item for?</label>
              <input
                ref={inputRef}
                type="text"
                value={data.title}
                onChange={e => setData({ ...data, title: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Groceries, Rent, Netflix"
                className="w-full bg-transparent border-b-2 border-surface-border focus:border-primary text-4xl font-light placeholder:text-foreground/20 focus:outline-none pb-3 transition-colors"
              />
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 absolute inset-0 p-8 flex flex-col justify-center">
              <label className="text-sm font-medium text-primary mb-4 uppercase tracking-wider">How much is {data.title}?</label>
              <div className="flex items-center text-4xl font-light border-b-2 border-surface-border focus-within:border-primary transition-colors pb-3">
                <span className="text-foreground/40 mr-2">{getCurrencySymbol(currency)}</span>
                <input
                  ref={inputRef}
                  type="number"
                  step="0.01"
                  value={data.amount}
                  onChange={e => setData({ ...data, amount: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="0.00"
                  className="w-full bg-transparent focus:outline-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 absolute inset-0 p-8 flex flex-col justify-center text-center">
              <label className="text-sm font-medium text-primary mb-8 uppercase tracking-wider">What type of item is this?</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button
                   onClick={() => {
                     setData({...data, type: "expense"});
                     setStep(4);
                   }}
                   className={cn(
                     "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 hover:border-primary hover:bg-surface-hover transition-all group",
                     data.type === "expense" ? "border-primary bg-primary/5" : "border-surface-border"
                   )}
                 >
                    <span className="font-medium text-lg">Expense</span>
                 </button>
                 
                 <button
                   onClick={() => {
                     setData({...data, type: "savings"});
                     setStep(4);
                   }}
                   className={cn(
                     "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 hover:border-primary hover:bg-surface-hover transition-all group",
                     data.type === "savings" ? "border-primary bg-primary/5" : "border-surface-border"
                   )}
                 >
                    <span className="font-medium text-lg">Savings</span>
                 </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 absolute inset-0 p-8 flex flex-col justify-center text-center">
              <label className="text-sm font-medium text-primary mb-8 uppercase tracking-wider">Is this a recurring item?</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button
                   onClick={() => {
                     setData({...data, isRecurring: false});
                     setStep(5);
                   }}
                   className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-surface-border hover:border-primary hover:bg-surface-hover transition-all group"
                 >
                    <div className="w-12 h-12 rounded-full bg-surface-hover group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                       <Calendar className="w-6 h-6 text-foreground/70 group-hover:text-primary transition-colors" />
                    </div>
                    <span className="font-medium text-lg">One-Time</span>
                    <span className="text-xs text-foreground/50">Happens on a specific date</span>
                 </button>
                 
                 <button
                   onClick={() => {
                     setData({...data, isRecurring: true});
                     setStep(5);
                   }}
                   className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-surface-border hover:border-primary hover:bg-surface-hover transition-all group"
                 >
                    <div className="w-12 h-12 rounded-full bg-surface-hover group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                       <Repeat className="w-6 h-6 text-foreground/70 group-hover:text-primary transition-colors" />
                    </div>
                    <span className="font-medium text-lg">Recurring</span>
                    <span className="text-xs text-foreground/50">Repeats every pay period</span>
                 </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 absolute inset-0 p-8 flex flex-col justify-center space-y-6">
              <div className="w-full">
                <label className="text-sm font-medium text-primary mb-6 block uppercase tracking-wider text-center">
                  {!data.isRecurring ? "When is this due?" : "Set the schedule"}
                </label>
                
                <div className="bg-background rounded-2xl border border-surface-border flex flex-col overflow-visible shadow-sm">
                  
                  {/* Date/Schedule Row */}
                  <div className="flex flex-col p-4 bg-surface/50">
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">
                          {!data.isRecurring ? "Specific Date" : "Schedule"}
                       </span>
                       
                       <div className="flex justify-end min-w-[140px]">
                         {!data.isRecurring ? (
                            <input
                              type="date"
                              className="bg-background border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-foreground/70 w-full md:w-auto"
                              value={data.targetDate}
                              onChange={(e) => setData({...data, targetDate: e.target.value})}
                            />
                         ) : (
                            schedule?.payDays && schedule.payDays.length > 0 && (
                              <Dropdown
                                className="w-full md:w-48 bg-background"
                                value={data.recurrence}
                                onChange={(val) => setData({...data, recurrence: val})}
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
                    
                    {!data.isRecurring && data.targetDate && schedule?.payDays && (
                      <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-center">
                        <span className="text-xs text-primary/80 text-center font-medium">
                          This item will fall under the <strong>{getPayPeriodForDate(data.targetDate, schedule.payDays)}</strong> pay period.
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Status Row */}
                  <div className="flex flex-col p-4 bg-surface/30 border-t border-surface-border">
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">
                          Initial Status
                       </span>
                       
                       <div className="flex justify-end min-w-[140px]">
                          <Dropdown
                            className="w-full md:w-48 bg-background"
                            value={data.statusId}
                            onChange={(val) => {
                              if (val === "MANAGE_STATUSES") {
                                router.push('/statuses');
                                return;
                              }
                              setData({...data, statusId: val});
                            }}
                            options={[
                              { value: "", label: "No Status" },
                              ...statuses.map(s => ({ value: s.id, label: s.name })),
                              { value: "MANAGE_STATUSES", label: "+ Manage Statuses" }
                            ]}
                          />
                       </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 bg-surface-hover/30 border-t border-surface-border flex justify-between items-center relative z-10">
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={cn("h-1.5 rounded-full transition-all duration-500", step === i ? "w-8 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : step > i ? "w-4 bg-primary/40" : "w-4 bg-surface-border")} />
            ))}
          </div>
          
          <button
            onClick={handleNext}
            disabled={(step === 1 && !data.title.trim()) || (step === 2 && !data.amount) || (step === 3) || (step === 4) || isPending}
            className="flex items-center space-x-2 bg-foreground text-background px-6 py-3 rounded-xl font-medium hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span>{isPending ? "Saving..." : step === 5 ? "Save Item" : "Next"}</span>
            {!isPending && (step === 5 ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />)}
          </button>
        </div>

      </div>
    </div>
  );
}
