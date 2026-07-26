"use client";

import { useEffect, useState, useRef } from "react";
import { api, PayPeriod, BudgetItem } from "@/lib/api";
import { DollarSign, PieChart, Wallet, Plus, Loader2, ChevronDown, Check, Pencil, Trash2, Save, X } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Dropdown } from "@/components/ui/Dropdown";
import { useUI } from "@/components/ui/UIProvider";
import { ActionButton } from "@/components/ui/ActionButton";
import { MilestoneTracker } from "@/components/MilestoneTracker";

export default function Dashboard() {
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [metrics, setMetrics] = useState<{ periods: any[], streak: number } | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      const [periodsRes, metricsRes] = await Promise.all([
        api.get('pay-periods'),
        api.get('metrics/dashboard').catch(() => ({ data: null }))
      ]);

      if (metricsRes.data) {
        setMetrics(metricsRes.data);
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
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadDashboard();
  }, []);

  const payPeriod = periods.find(p => p.id === selectedPeriodId) || null;



  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  async function handleCreatePayPeriod() {
    try {
      const response = await api.post('pay-periods/generate', {});
      if (response.data && response.data.id) {
        setSelectedPeriodId(response.data.id);
      }
      loadDashboard();
    } catch (error) {
      console.error("Failed to generate pay period", error);
      alert("Failed to generate next pay period. Ensure your schedule is set up.");
    }
  }

  if (periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in">
        <Wallet className="w-16 h-16 text-primary/50" />
        <h2 className="text-2xl font-bold">No Pay Periods Yet</h2>
        <p className="text-foreground/60 max-w-md">Start a new pay period to auto-generate your recurring items based on your schedule.</p>
        <ActionButton 
          variant="primary" 
          icon={Plus} 
          label="Start New Pay Period" 
          onClick={handleCreatePayPeriod} 
          className="px-6 py-3 hover-lift"
        />
      </div>
    );
  }

  const displayData = payPeriod || {
    totalIncome: 0,
    totalAllocated: 0,
    items: [] as BudgetItem[],
  };

  const remaining = displayData.totalIncome - displayData.totalAllocated;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
            <ActionButton 
              variant="primary"
              icon={Plus}
              label="Auto-Generate Next"
              onClick={handleCreatePayPeriod}
              className="text-xs bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary rounded-full shadow-sm"
              title="Generate Next Period based on your schedule"
            />
          </div>
        </div>
      </header>

      {/* Summary Cards (Temporarily hidden as requested) */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          title="Total Income" 
          amount={displayData.totalIncome} 
          icon={<DollarSign className="w-6 h-6 text-success" />} 
          trend="+5.2%"
        />
        <SummaryCard 
          title="Allocated Budget" 
          amount={displayData.totalAllocated} 
          icon={<PieChart className="w-6 h-6 text-warning" />} 
          trend="82% utilized"
        />
        <SummaryCard 
          title="Remaining Balance" 
          amount={remaining} 
          icon={<Wallet className="w-6 h-6 text-primary" />} 
          trend={remaining >= 0 ? "On track" : "Over budget"}
          highlight={remaining < 0}
        />
      </div> */}

      {/* Milestone Progress Tracker */}
      {metrics && metrics.periods && metrics.periods.find(p => p.id === selectedPeriodId) && (
        <div className="mt-8 mb-4">
          <MilestoneTracker 
            totalItems={metrics.periods.find(p => p.id === selectedPeriodId).totalItems}
            paidItems={metrics.periods.find(p => p.id === selectedPeriodId).paidItems}
            streak={metrics.streak}
          />
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, amount, icon, trend, highlight = false }: { title: string, amount: number, icon: React.ReactNode, trend: string, highlight?: boolean }) {
  const { currency } = useUI();
  return (
    <div className={cn("glass-panel p-6 flex flex-col justify-between hover-lift relative overflow-hidden", highlight && "border-danger/50")}>
      {highlight && <div className="absolute top-0 right-0 w-16 h-16 bg-danger/10 blur-2xl rounded-full" />}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-foreground/70 font-medium">{title}</h3>
        <div className="p-2 bg-surface-hover rounded-lg">{icon}</div>
      </div>
      <div>
        <div className="text-3xl font-bold tracking-tight">{formatCurrency(amount, currency)}</div>
        <p className={cn("text-sm mt-1", highlight ? "text-danger" : "text-foreground/50")}>{trend}</p>
      </div>
    </div>
  );
}


