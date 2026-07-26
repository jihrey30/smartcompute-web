"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import Cookies from "js-cookie";

type ButtonStyle = "ICON" | "TEXT" | "BOTH";

interface UIContextType {
  buttonStyle: ButtonStyle;
  setButtonStyle: (style: ButtonStyle) => void;
  currency: string;
  setCurrency: (currency: string) => void;
}

const UIContext = createContext<UIContextType>({
  buttonStyle: "BOTH",
  setButtonStyle: () => {},
  currency: "PHP",
  setCurrency: () => {},
});

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [buttonStyle, setButtonStyle] = useState<ButtonStyle>("BOTH");
  const [currency, setCurrencyState] = useState<string>("PHP");

  useEffect(() => {
    async function fetchPreferences() {
      if (!Cookies.get("access_token")) return;
      try {
        const res = await api.get('auth/me');
        if (res.data) {
          if (res.data.buttonStyle) setButtonStyle(res.data.buttonStyle as ButtonStyle);
          if (res.data.currency) setCurrencyState(res.data.currency);
        }
      } catch (e) {
        // fail silently for unauthenticated
      }
    }
    fetchPreferences();
  }, []);

  const handleSetButtonStyle = async (style: ButtonStyle) => {
    setButtonStyle(style);
    try {
      await api.patch('auth/preferences', { buttonStyle: style });
    } catch (e) {
      console.error("Failed to save button style preference", e);
    }
  };

  const handleSetCurrency = async (curr: string) => {
    setCurrencyState(curr);
    try {
      await api.patch('auth/preferences', { currency: curr });
    } catch (e) {
      console.error("Failed to save currency preference", e);
    }
  };

  return (
    <UIContext.Provider value={{ buttonStyle, setButtonStyle: handleSetButtonStyle, currency, setCurrency: handleSetCurrency }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
