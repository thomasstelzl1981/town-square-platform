/**
 * OTTO DESK — Zone 1 Operative Desk for Otto² Advisory
 * Handles Finanzierungsanfragen and Beratungsanfragen from otto2advisory.com
 */

export default function OttoDesk() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Otto² Advisory Desk</h1>
        <p className="text-sm text-muted-foreground">Finanzierungs- & Beratungsanfragen von otto2advisory.com</p>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <p>Desk-Oberfläche wird in Phase 5 implementiert (Lead-Pool, Inbox, Zuweisung, Monitor).</p>
      </div>
    </div>
  );
}
