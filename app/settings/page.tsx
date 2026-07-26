"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Settings, Save, Loader2, Paintbrush, Calendar } from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";
import { useUI } from "@/components/ui/UIProvider";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { buttonStyle, setButtonStyle, currency, setCurrency } = useUI();
  const { theme, setTheme } = useTheme();
  const [localButtonStyle, setLocalButtonStyle] = useState(buttonStyle);
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState({
    frequency: "SEMI_MONTHLY",
    payDays: [15, 30],
  });

  useEffect(() => {
    setMounted(true);
    async function loadSettings() {
      try {
        const response = await api.get('pay-schedule');
        if (response.data) {
          setSchedule(response.data);
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSaveField(fieldName: string) {
    setSaving(true);
    try {
      await api.post('pay-schedule', schedule);
      // Optional toast here
    } catch (error) {
      console.error("Failed to save settings", error);
      alert("Failed to save settings. Check console.");
    } finally {
      setSaving(false);
    }
  }

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
            <Settings className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-foreground/60 mt-1">Configure your pay schedule and defaults.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <section className="glass-panel p-6 flex flex-col h-full">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Pay Schedule</h2>
              <p className="text-sm text-foreground/60">Manage your pay frequency</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/70">Pay Frequency</label>
              <div className="flex items-center gap-2">
                <Dropdown 
                  className="w-full"
                  value={schedule.frequency}
                  onChange={(val) => setSchedule({...schedule, frequency: val})}
                  options={[
                    { value: "MONTHLY", label: "Monthly" },
                    { value: "SEMI_MONTHLY", label: "Semi-Monthly (e.g. 15th and 30th)" }
                  ]}
                />
                <ActionButton icon={Save} label="Save" variant="ghost" onClick={() => handleSaveField('frequency')} disabled={saving} />
              </div>
            </div>

            {schedule.frequency === "MONTHLY" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Pay Date</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="1" max="31"
                    value={schedule.payDays[0] || 1}
                    onChange={(e) => setSchedule({...schedule, payDays: [parseInt(e.target.value, 10)]})}
                    className="w-full bg-background border border-surface-border rounded-md px-3 py-2 focus:outline-none focus:border-primary"
                  />
                  <ActionButton icon={Save} label="Save" variant="ghost" onClick={() => handleSaveField('monthly_date')} disabled={saving} />
                </div>
                <p className="text-xs text-foreground/60">Enter the day of the month you get paid.</p>
              </div>
            )}

            {schedule.frequency === "SEMI_MONTHLY" && (
              <div className="space-y-2 flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-foreground/80">First Pay Date</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1" max="31"
                      value={schedule.payDays[0] || 15}
                      onChange={(e) => setSchedule({...schedule, payDays: [parseInt(e.target.value, 10), schedule.payDays[1] || 30]})}
                      className="w-full bg-background border border-surface-border rounded-md px-3 py-2 focus:outline-none focus:border-primary"
                    />
                    <ActionButton icon={Save} label="Save" variant="ghost" onClick={() => handleSaveField('first_date')} disabled={saving} />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Second Pay Date</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1" max="31"
                      value={schedule.payDays[1] || 30}
                      onChange={(e) => setSchedule({...schedule, payDays: [schedule.payDays[0] || 15, parseInt(e.target.value, 10)]})}
                      className="w-full bg-background border border-surface-border rounded-md px-3 py-2 focus:outline-none focus:border-primary"
                    />
                    <ActionButton icon={Save} label="Save" variant="ghost" onClick={() => handleSaveField('second_date')} disabled={saving} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        
        <section className="glass-panel p-6 flex flex-col h-full">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Paintbrush className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Appearance</h2>
              <p className="text-sm text-foreground/60">Customize the UI layout</p>
            </div>
          </div>

          <div className="space-y-8 flex-1">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/70 flex flex-col">
                <span>Theme</span>
                <span className="text-xs font-normal text-foreground/50 mt-0.5">Select light or dark mode</span>
              </label>
              <div className="flex items-center gap-2">
                {mounted && (
                  <Dropdown 
                    className="w-full"
                    value={theme || "system"}
                    onChange={setTheme}
                    options={[
                      { value: "light", label: "Light" },
                      { value: "dark", label: "Dark" },
                      { value: "system", label: "System Default" },
                    ]}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/70 flex flex-col">
                <span>Currency</span>
                <span className="text-xs font-normal text-foreground/50 mt-0.5">Select your preferred currency for display</span>
              </label>
              <div className="flex items-center gap-2">
                <Dropdown 
                  className="w-full"
                  value={localCurrency}
                  onChange={setLocalCurrency}
                  options={[
                    { value: "PHP", label: "Philippine Peso (₱)" },
                    { value: "USD", label: "US Dollar ($)" },
                    { value: "EUR", label: "Euro (€)" },
                    { value: "GBP", label: "British Pound (£)" },
                  ]}
                />
                <ActionButton 
                  type="button" 
                  icon={Save} 
                  label="Save" 
                  variant="ghost" 
                  onClick={() => setCurrency(localCurrency)} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/70 flex flex-col">
                <span>Action Button Style</span>
                <span className="text-xs font-normal text-foreground/50 mt-0.5">Choose how action buttons are displayed across the app</span>
              </label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setLocalButtonStyle("BOTH")} 
                  className={`p-4 rounded-xl border text-left transition-all ${localButtonStyle === 'BOTH' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-surface-border bg-surface hover:bg-surface-hover hover:border-primary/50'}`}
                >
                  <div className="font-medium mb-3">Icon and Text</div>
                  <div className="flex items-center space-x-2 bg-primary text-white px-3 py-1.5 rounded-md text-sm w-fit">
                    <Paintbrush className="w-4 h-4" />
                    <span>Edit</span>
                  </div>
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setLocalButtonStyle("ICON")} 
                  className={`p-4 rounded-xl border text-left transition-all ${localButtonStyle === 'ICON' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-surface-border bg-surface hover:bg-surface-hover hover:border-primary/50'}`}
                >
                  <div className="font-medium mb-3">Icon Only</div>
                  <div className="flex items-center justify-center bg-primary text-white p-2 rounded-md text-sm w-fit">
                    <Paintbrush className="w-4 h-4" />
                  </div>
                </button>

                <button 
                  type="button" 
                  onClick={() => setLocalButtonStyle("TEXT")} 
                  className={`p-4 rounded-xl border text-left transition-all ${localButtonStyle === 'TEXT' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-surface-border bg-surface hover:bg-surface-hover hover:border-primary/50'}`}
                >
                  <div className="font-medium mb-3">Text Only</div>
                  <div className="flex items-center bg-primary text-white px-4 py-1.5 rounded-md text-sm w-fit">
                    <span>Edit</span>
                  </div>
                </button>
              </div>
              <div className="flex justify-end pt-2">
                <ActionButton 
                  type="button" 
                  icon={Save} 
                  label="Save Style" 
                  variant="primary" 
                  onClick={() => setButtonStyle(localButtonStyle)} 
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
