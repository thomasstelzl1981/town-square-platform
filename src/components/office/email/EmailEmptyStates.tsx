/**
 * Email empty states (R-7)
 */
import { Mail, MailOpen } from 'lucide-react';

export function NoEmailSelected({ hasConnectedAccount }: { hasConnectedAccount: boolean }) {
  return (
    <div className="flex-1 flex items-center justify-center text-center p-8">
      {hasConnectedAccount ? (
        <div className="space-y-3">
          <MailOpen className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="font-semibold">Keine E-Mail ausgewählt</h3>
          <p className="text-sm text-muted-foreground">
            Wählen Sie eine E-Mail aus der Liste, um sie anzuzeigen
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Mail className="h-12 w-12 text-muted-foreground/50 mx-auto" />
          <h3 className="font-semibold">E-Mail-Client</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Nach der Verbindung eines E-Mail-Kontos können Sie hier Ihre Nachrichten lesen und verwalten.
          </p>
        </div>
      )}
    </div>
  );
}
