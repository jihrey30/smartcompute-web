import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; slug: string; color: string; sortOrder: number }) => Promise<void>;
  initialData?: { name: string; slug?: string | null; color: string; sortOrder: number } | null;
}

export function StatusModal({ isOpen, onClose, onSave, initialData }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("#3b82f6"); // Default blue
  const [sortOrder, setSortOrder] = useState("0");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (isOpen) {
       
      setTimeout(() => {
        setName(initialData?.name || "");
        setSlug(initialData?.slug || "");
        setColor(initialData?.color || "#3b82f6");
        setSortOrder(initialData?.sortOrder?.toString() || "0");
        setIsPending(false);
      }, 0);
       
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsPending(true);
    try {
      await onSave({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        color,
        sortOrder: parseInt(sortOrder) || 0
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-surface-border rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-hover/50">
          <h2 className="text-lg font-semibold">{initialData ? "Edit Status" : "New Status"}</h2>
          <button onClick={onClose} className="p-1 rounded-md text-foreground/50 hover:bg-surface-border transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">Status Name</label>
            <input
              type="text"
              className="w-full bg-background border border-surface-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. In Progress"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">Color</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                className="w-12 h-12 p-1 bg-background border border-surface-border rounded-lg cursor-pointer"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <span className="text-foreground/70 font-mono">{color}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">Sort Order</label>
            <input
              type="number"
              className="w-full bg-background border border-surface-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
              placeholder="0"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">Slug Identifier</label>
            <input
              type="text"
              className="w-full bg-background border border-surface-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors text-foreground/70 font-mono text-sm"
              placeholder="e.g. in-progress"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={initialData?.slug === 'paid' || initialData?.slug === 'to-pay'}
            />
            {(initialData?.slug === 'paid' || initialData?.slug === 'to-pay') && (
              <p className="text-xs text-primary mt-1">This is a system slug and cannot be changed.</p>
            )}
          </div>
        </div>

        <div className="p-4 bg-surface-hover/30 border-t border-surface-border flex justify-end space-x-2">
          <ActionButton type="button" icon={X} label="Cancel" variant="default" onClick={onClose} />
          <ActionButton 
            type="button" 
            icon={Save} 
            label={isPending ? "Saving..." : "Save"} 
            variant="primary" 
            onClick={handleSave} 
            disabled={!name.trim() || isPending}
          />
        </div>
      </div>
    </div>
  );
}
