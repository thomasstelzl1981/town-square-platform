import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Inbox, 
  Send, 
  FileEdit, 
  Trash2, 
  Archive, 
  FolderPlus,
  Search,
  Star,
  Paperclip,
  Mail,
  MailOpen,
  RefreshCw,
  Settings,
  Plus
} from 'lucide-react';


// Mock email data for UI demonstration
const mockEmails = [
  {
    id: '1',
    from: 'Max Mustermann',
    fromEmail: 'max@immobilia.de',
    subject: 'Mieterhöhung Hauptstraße 15',
    preview: 'Sehr geehrte Damen und Herren, bezüglich der anstehenden Mietanpassung...',
    date: '14:30',
    isRead: false,
    hasAttachment: true,
    isStarred: true,
  },
  {
    id: '2',
    from: 'Anna Schmidt',
    fromEmail: 'anna@hausverwaltung.de',
    subject: 'Nebenkostenabrechnung 2025',
    preview: 'Anbei senden wir Ihnen die Nebenkostenabrechnung für das Jahr 2025...',
    date: 'gestern',
    isRead: true,
    hasAttachment: true,
    isStarred: false,
  },
  {
    id: '3',
    from: 'Thomas Müller',
    fromEmail: 'mueller@finanzierung.de',
    subject: 'RE: Finanzierungsanfrage',
    preview: 'Vielen Dank für Ihre Anfrage. Wir haben die Unterlagen geprüft und...',
    date: '22.01.',
    isRead: true,
    hasAttachment: false,
    isStarred: false,
  },
];

interface EmailFolder {
  id: string;
  name: string;
  icon: React.ReactNode;
  count?: number;
}

const folders: EmailFolder[] = [
  { id: 'inbox', name: 'Eingang', icon: <Inbox className="h-4 w-4" />, count: 3 },
  { id: 'sent', name: 'Gesendet', icon: <Send className="h-4 w-4" /> },
  { id: 'drafts', name: 'Entwürfe', icon: <FileEdit className="h-4 w-4" />, count: 1 },
  { id: 'trash', name: 'Papierkorb', icon: <Trash2 className="h-4 w-4" /> },
  { id: 'archive', name: 'Archiv', icon: <Archive className="h-4 w-4" /> },
];

export function EmailTab() {
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const selectedEmailData = mockEmails.find(e => e.id === selectedEmail);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-Mail-Konto verbinden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Verbinden Sie Ihr E-Mail-Konto, um Nachrichten direkt in System of a Town zu empfangen und zu versenden.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="h-6 w-6" />
                Gmail
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018–present%29.svg" alt="Outlook" className="h-6 w-6" />
                Microsoft 365
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Settings className="h-6 w-6" />
                IMAP/SMTP
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Demo-Modus aktivieren um die Oberfläche zu testen
              </p>
              <Button onClick={() => setIsConnected(true)}>
                Demo starten
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-280px)]">
      {/* Left Sidebar - Folders */}
      <div className="col-span-2 border rounded-lg p-3 space-y-2">
        <Button className="w-full gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Neue E-Mail
        </Button>
        <Separator className="my-3" />
        <ScrollArea className="h-[calc(100%-60px)]">
          <div className="space-y-1">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  selectedFolder === folder.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {folder.icon}
                <span className="flex-1 text-left">{folder.name}</span>
                {folder.count && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {folder.count}
                  </Badge>
                )}
              </button>
            ))}
            <Separator className="my-2" />
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <FolderPlus className="h-4 w-4" />
              <span>Ordner erstellen</span>
            </button>
          </div>
        </ScrollArea>
      </div>

      {/* Middle - Email List */}
      <div className="col-span-4 border rounded-lg flex flex-col">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="E-Mails durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="ghost" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {mockEmails.map((email) => (
              <button
                key={email.id}
                onClick={() => setSelectedEmail(email.id)}
                className={cn(
                  'w-full p-3 text-left transition-colors',
                  selectedEmail === email.id ? 'bg-muted' : 'hover:bg-muted/50',
                  !email.isRead && 'bg-primary/5'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {email.isRead ? (
                      <MailOpen className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Mail className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('font-medium truncate', !email.isRead && 'text-foreground')}>
                        {email.from}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {email.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {email.isStarred && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                      {email.hasAttachment && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                      <span className={cn('text-sm truncate', email.isRead ? 'text-muted-foreground' : 'text-foreground')}>
                        {email.subject}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {email.preview}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right - Email Detail */}
      <div className="col-span-6 border rounded-lg flex flex-col">
        {selectedEmailData ? (
          <>
            <div className="p-4 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedEmailData.subject}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">{selectedEmailData.from}</span>
                    <span className="text-muted-foreground text-sm">&lt;{selectedEmailData.fromEmail}&gt;</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">An: mich</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon">
                    <Star className={cn('h-4 w-4', selectedEmailData.isStarred && 'fill-yellow-400 text-yellow-400')} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="prose prose-sm max-w-none">
                <p>Sehr geehrte Damen und Herren,</p>
                <p>{selectedEmailData.preview}</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
                <p>Mit freundlichen Grüßen,<br />{selectedEmailData.from}</p>
              </div>
            </ScrollArea>
            <div className="p-3 border-t flex gap-2">
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Antworten
              </Button>
              <Button variant="outline">Allen antworten</Button>
              <Button variant="outline">Weiterleiten</Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div className="space-y-3">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="font-semibold">Keine E-Mail ausgewählt</h3>
              <p className="text-sm text-muted-foreground">Wählen Sie eine E-Mail aus der Liste aus, um sie hier anzuzeigen.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
