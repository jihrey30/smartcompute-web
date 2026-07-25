"use client";

import { useEffect, useState } from "react";
import { api, PayPeriod, BudgetItem } from "@/lib/api";
import { DollarSign, PieChart, Wallet, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [payPeriod, setPayPeriod] = useState<PayPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", amount: "", type: "expense" });

  async function loadDashboard() {
    try {
        // Fetch the active pay period (for now, fetch all and take the first, or create a specific endpoint)
        const response = await api.get('pay-periods');
        if (response.data && response.data.length > 0) {
          // Include items so we can render them
          const firstPeriod = response.data[0];
          // Prisma doesn't include relations by default unless told to in the backend. 
          // If items are missing, we should ensure the backend is returning them, but for now we'll set it.
          setPayPeriod(firstPeriod);
        } else {
          setPayPeriod(null);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.title || !newItem.amount || !payPeriod) return;

    try {
      await api.post('budget-items', {
        name: newItem.title, // Prisma schema expects 'name'
        amount: parseFloat(newItem.amount),
        type: newItem.type.toUpperCase(), // Prisma schema expects uppercase enum 'EXPENSE', 'SAVINGS'
        isStarred: false,
        payPeriod: { connect: { id: payPeriod.id } }, // Prisma relational connect syntax
      });
      setIsAdding(false);
      setNewItem({ title: "", amount: "", type: "expense" });
      loadDashboard(); // Refresh data
    } catch (error) {
      console.error("Failed to add item", error);
      alert("Failed to add item. Check console.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  async function handleCreatePayPeriod() {
    try {
      // Create a dummy user if needed, or assume a user exists for now.
      // In a real app, you'd pull the logged-in user's ID. 
      // For this local demo, we fetch the first user in the DB.
      const users = await api.get('users');
      let userId = users.data[0]?.id;
      if (!userId) {
        alert("No users found in database! Please run the seed command.");
        return;
      }

      await api.post('pay-periods', {
        label: "Current Period",
        payDate: new Date().toISOString(),
        totalAllocated: 0,
        totalIncome: 0,
        totalBalance: 0,
        userId: userId,
      });
      loadDashboard();
    } catch (error) {
      console.error("Failed to create pay period", error);
    }
  }

  if (!payPeriod) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in">
        <Wallet className="w-16 h-16 text-primary/50" />
        <h2 className="text-2xl font-bold">No Active Pay Period</h2>
        <p className="text-foreground/60 max-w-md">You need to start a new pay period before you can add budget items.</p>
        <button onClick={handleCreatePayPeriod} className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors hover-lift">
          Start New Pay Period
        </button>
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-foreground/60 mt-1">Here is your financial overview for this pay period.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors hover-lift"
        >
          <Plus className="w-4 h-4" />
          <span>New Budget Item</span>
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      {/* Budget Sheet */}
      <section className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Budget Sheet</h2>
          <div className="flex space-x-2">
            <button className="text-sm px-3 py-1.5 bg-surface-hover rounded-md font-medium">All</button>
            <button className="text-sm px-3 py-1.5 text-foreground/60 hover:text-foreground rounded-md font-medium">Expenses</button>
            <button className="text-sm px-3 py-1.5 text-foreground/60 hover:text-foreground rounded-md font-medium">Savings</button>
          </div>
        </div>

        <div className="space-y-3">
          {isAdding && (
            <form onSubmit={handleAddItem} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-surface rounded-lg border border-primary/50">
              <input 
                type="text" 
                placeholder="Item name" 
                className="flex-1 bg-background border border-surface-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                autoFocus
              />
              <input 
                type="number" 
                placeholder="Amount" 
                step="0.01"
                className="w-32 bg-background border border-surface-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                value={newItem.amount}
                onChange={(e) => setNewItem({...newItem, amount: e.target.value})}
              />
              <select 
                className="bg-background border border-surface-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                value={newItem.type}
                onChange={(e) => setNewItem({...newItem, type: e.target.value})}
              >
                <option value="expense">Expense</option>
                <option value="savings">Savings</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium">Save</button>
                <button type="button" onClick={() => setIsAdding(false)} className="bg-surface-hover text-foreground/70 px-4 py-2 rounded-md text-sm">Cancel</button>
              </div>
            </form>
          )}

          {displayData.items && displayData.items.length > 0 ? (
            displayData.items.map((item: any) => (
              <BudgetItemRow key={item.id} item={item} />
            ))
          ) : !isAdding && (
            <div className="py-12 text-center text-foreground/50 border border-dashed border-surface-border rounded-lg">
              <p>No budget items found for this pay period.</p>
              <button onClick={() => setIsAdding(true)} className="text-primary hover:underline mt-2">Add your first item</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ title, amount, icon, trend, highlight = false }: { title: string, amount: number, icon: React.ReactNode, trend: string, highlight?: boolean }) {
  return (
    <div className={cn("glass-panel p-6 flex flex-col justify-between hover-lift relative overflow-hidden", highlight && "border-danger/50")}>
      {highlight && <div className="absolute top-0 right-0 w-16 h-16 bg-danger/10 blur-2xl rounded-full" />}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-foreground/70 font-medium">{title}</h3>
        <div className="p-2 bg-surface-hover rounded-lg">{icon}</div>
      </div>
      <div>
        <div className="text-3xl font-bold tracking-tight">${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <p className={cn("text-sm mt-1", highlight ? "text-danger" : "text-foreground/50")}>{trend}</p>
      </div>
    </div>
  );
}

function BudgetItemRow({ item }: { item: BudgetItem }) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-surface-border hover:border-primary/50 transition-colors group">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center">
          {/* Placeholder for category icon, using simple first letter */}
          <span className="font-bold text-foreground/60">{item.name?.charAt(0)}</span>
        </div>
        <div>
          <h4 className="font-semibold">{item.name}</h4>
          <div className="flex items-center space-x-2 mt-1">
            {item.category && (
              <span 
                className="text-xs px-2 py-0.5 rounded-full" 
                style={{ backgroundColor: `${item.category.color}20`, color: item.category.color }}
              >
                {item.category.name}
              </span>
            )}
            <span className="text-xs text-foreground/50 capitalize">{item.type}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold">${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <button className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
      </div>
    </div>
  );
}
