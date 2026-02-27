/**
 * NCORE DESK — Zone 1 Operative Desk for Ncore Business Consulting
 * Handles Projekt-Anfragen and Kooperations-Anfragen from ncore.online
 */
import { Routes, Route, Navigate } from 'react-router-dom';

export default function NcoreDesk() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ncore Desk</h1>
        <p className="text-sm text-muted-foreground">Projekt- & Kooperationsanfragen von ncore.online</p>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <p>Desk-Oberfläche wird in Phase 5 implementiert (Lead-Pool, Zuweisung, Monitor).</p>
      </div>
    </div>
  );
}
