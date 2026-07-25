"use client";

import { useEffect, useState } from "react";
import { api, Category } from "@/lib/api";
import { Plus, Loader2, Tags, Edit3, Trash2 } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await api.get('categories');
        setCategories(response.data);
      } catch (error) {
        console.error("Failed to load categories", error);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
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
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-foreground/60 mt-1">Manage your budget categories and custom colors.</p>
        </div>
        <button className="flex items-center space-x-2 bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors hover-lift">
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </header>

      <section className="glass-panel p-6">
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-foreground/50 border border-dashed border-surface-border rounded-lg flex flex-col items-center">
            <Tags className="w-12 h-12 text-surface-border mb-4" />
            <p className="text-lg">No categories defined yet.</p>
            <p className="text-sm">Create categories to organize your expenses and savings.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-surface-border hover-lift group cursor-pointer">
      <div className="flex items-center space-x-4">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center shadow-inner"
          style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}50` }}
        >
          <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: category.color }} />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{category.name}</h3>
          <p className="text-xs text-foreground/50">{category.color}</p>
        </div>
      </div>
      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 text-foreground/50 hover:text-primary bg-surface-hover rounded-md transition-colors">
          <Edit3 className="w-4 h-4" />
        </button>
        <button className="p-2 text-foreground/50 hover:text-danger bg-surface-hover rounded-md transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
