"use client";

import { useEffect } from "react";

// Proteções realistas contra cópia casual.
// HONESTIDADE: NENHUM site é 100% inclonável. Isto apenas eleva a barreira
// para curiosos. A lógica inteligente (otimizador, IA, cálculos) fica no servidor.
export function ProtectionGuard() {
  useEffect(() => {
    // 1. Bloquear menu de contexto (botão direito)
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
    };
    // 2. Bloquear atalhos de DevTools
    const onKey = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") { e.preventDefault(); return; }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) {
        e.preventDefault(); return;
      }
      // Ctrl+U (ver código-fonte)
      if ((e.ctrlKey || e.metaKey) && e.key.toUpperCase() === "U") {
        e.preventDefault(); return;
      }
    };

    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKey);

    // 3. Aviso no console
    const style1 = "color: #ef4444; font-size: 28px; font-weight: bold;";
    const style2 = "color: #10b981; font-size: 14px;";
    const style3 = "color: #6b7280; font-size: 12px;";
    console.log("%c⚠️ PARE!", style1);
    console.log("%cEste é o painel No Verde. Toda a lógica de otimização roda no servidor.", style2);
    console.log("%cTentativas de clonagem ou acesso não autorizado são monitoradas. Use sua própria conta.", style3);

    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
