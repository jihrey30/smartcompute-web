"use client";

import { useEffect, useState } from "react";
import { api, BudgetItemTemplate } from "@/lib/api";
import { Plus, Loader2, CalendarClock, Zap } from "lucide-react";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<BudgetItemTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await api.get('/templates');
        setTemplates(response.data);
      } catch (error) {
        console.error("Failed to load templates", error);
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Templates
            <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-md flex items-center">
              <Zap className="w-3 h-3 mr-1" /> Automation
            </span>
          </h1>
          <p className="text-foreground/60 mt-1">Manage recurring items to automatically populate new pay periods.</p>
        </div>
        <button className="flex items-center space-x-2 bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors hover-lift">
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </header>

      <section className="glass-panel p-6">
        {templates.length > 0 ? (
          <div className="space-y-3">
            {templates.map((tpl) => (
              <TemplateRow key={tpl.id} template={tpl} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-foreground/50 border border-dashed border-surface-border rounded-lg flex flex-col items-center">
            <CalendarClock className="w-12 h-12 text-surface-border mb-4" />
            <p className="text-lg">No automated templates yet.</p>
            <p className="text-sm max-w-sm mx-auto mt-2">Templates act as blueprints. When you create a new pay period, these items are automatically copied into it.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function TemplateRow({ template }: { template: BudgetItemTemplate }) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-surface-border hover-lift group">
      <div className="flex items-center space-x-4">
        <div>
          <h4 className="font-semibold">{template.title}</h4>
          <div className="flex items-center space-x-2 mt-1">
            {template.category && (
              <span 
                className="text-xs px-2 py-0.5 rounded-full border" 
                style={{ backgroundColor: `${template.category.color}10`, color: template.category.color, borderColor: `${template.category.color}30` }}
              >
                {template.category.name}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-foreground/70 capitalize border border-surface-border">
              {template.type}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right flex items-center gap-6">
        <div className="font-bold text-lg">${template.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <button className="text-sm px-4 py-2 bg-surface-border text-foreground hover:bg-primary hover:text-white transition-colors rounded-md opacity-0 group-hover:opacity-100">
          Edit
        </button>
      </div>
    </div>
  );
}
