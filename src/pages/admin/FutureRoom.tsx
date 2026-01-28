import { FutureRoomDashboard } from '@/components/admin/futureroom';

export default function FutureRoomPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Future Room</h1>
        <p className="text-muted-foreground">
          Finanzierungsmandate verwalten und an Manager delegieren
        </p>
      </div>
      <FutureRoomDashboard />
    </div>
  );
}
