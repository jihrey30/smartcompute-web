"use client";

import { useEffect, useState } from "react";
import { api, Status } from "@/lib/api";
import { Plus, Loader2, ListChecks, Edit3, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { StatusModal } from "@/components/StatusModal";

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);

  useEffect(() => {
    async function loadStatuses() {
      try {
        const response = await api.get('statuses');
        setStatuses(response.data);
      } catch (error) {
        console.error("Failed to load statuses", error);
      } finally {
        setLoading(false);
      }
    }
    loadStatuses();
  }, []);

  const handleSaveStatus = async (data: { name: string; slug: string; color: string; sortOrder: number }) => {
    try {
      if (editingStatus) {
        await api.patch(`statuses/${editingStatus.id}`, data);
      } else {
        await api.post('statuses', data);
      }
      setIsModalOpen(false);
      // reload
      const res = await api.get('statuses');
      setStatuses(res.data);
    } catch (error) {
      console.error("Failed to save status", error);
      alert("Failed to save status. Check console.");
    }
  };

  const handleDeleteStatus = async (id: string) => {
    if (!confirm("Are you sure you want to delete this status?")) return;
    try {
      await api.delete(`statuses/${id}`);
      const res = await api.get('statuses');
      setStatuses(res.data);
    } catch (error) {
      console.error("Failed to delete status", error);
      alert("Failed to delete status.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Statuses</h1>
          <p className="text-foreground/60 mt-1">Manage your custom budget item statuses and colors.</p>
        </div>
        <ActionButton 
          type="button" 
          icon={Plus} 
          label="New Status" 
          variant="primary" 
          onClick={() => {
            setEditingStatus(null);
            setIsModalOpen(true);
          }} 
        />
      </header>

      <section className="glass-panel p-6">
        {statuses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {statuses.map((stat) => (
              <StatusCard 
                key={stat.id} 
                status={stat} 
                onEdit={() => {
                  setEditingStatus(stat);
                  setIsModalOpen(true);
                }}
                onDelete={() => handleDeleteStatus(stat.id)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-foreground/50 border border-dashed border-surface-border rounded-lg flex flex-col items-center">
            <ListChecks className="w-12 h-12 text-surface-border mb-4" />
            <p className="text-lg">No statuses defined yet.</p>
            <p className="text-sm">Create statuses to track the progress of your items.</p>
          </div>
        )}
      </section>
      
      <StatusModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStatus}
        initialData={editingStatus}
      />
    </div>
  );
}

function StatusCard({ status, onEdit, onDelete }: { status: Status, onEdit: () => void, onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-surface-border hover-lift group cursor-pointer">
      <div className="flex items-center space-x-4">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center shadow-inner"
          style={{ backgroundColor: `${status.color}20`, border: `1px solid ${status.color}50` }}
        >
          <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: status.color }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{status.name}</h3>
            {status.slug && (
              <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                {status.slug}
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/50">{status.color}</p>
        </div>
      </div>
      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-2 text-foreground/50 hover:text-primary bg-surface-hover rounded-md transition-colors">
          <Edit3 className="w-4 h-4" />
        </button>
        {status.slug !== 'paid' && status.slug !== 'to-pay' && (
          <button onClick={onDelete} className="p-2 text-foreground/50 hover:text-danger bg-surface-hover rounded-md transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
