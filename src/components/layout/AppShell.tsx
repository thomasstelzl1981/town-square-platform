import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  SidebarProvider, 
  SidebarTrigger,
  useSidebar 
} from "@/components/ui/sidebar";
import { ChatPanel, type ChatContext, type QuickAction } from "@/components/chat/ChatPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Bell, 
  MessageSquare,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export interface AppShellProps {
  zone: "admin" | "portal";
  children: React.ReactNode;
  sidebar: React.ReactNode;
  pageTitle: string;
  breadcrumbs?: { label: string; href?: string }[];
  showChat?: boolean;
  chatContext?: ChatContext;
  chatQuickActions?: QuickAction[];
  headerActions?: React.ReactNode;
}

function AppShellContent({
  zone,
  children,
  sidebar,
  pageTitle,
  breadcrumbs,
  showChat = true,
  chatContext,
  chatQuickActions,
  headerActions,
}: AppShellProps) {
  const isMobile = useIsMobile();
  const [chatOpen, setChatOpen] = React.useState(!isMobile && showChat);
  const [chatPosition, setChatPosition] = React.useState<"docked" | "drawer" | "bottomsheet">(
    isMobile ? "bottomsheet" : "docked"
  );

  // Update chat position based on screen size
  React.useEffect(() => {
    if (isMobile) {
      setChatPosition("bottomsheet");
      setChatOpen(false);
    } else {
      setChatPosition("docked");
    }
  }, [isMobile]);

  const defaultQuickActions: QuickAction[] = chatQuickActions || [
    { label: "Zusammenfassen", action: "summarize" },
    { label: "Aufgabe erstellen", action: "create-task" },
    { label: "Dokument suchen", action: "search-doc" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      {sidebar}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            
            <div>
              {/* Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                  {breadcrumbs.map((crumb, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <ChevronRight className="h-3 w-3" />}
                      <span className={i === breadcrumbs.length - 1 ? "text-foreground" : ""}>
                        {crumb.label}
                      </span>
                    </React.Fragment>
                  ))}
                </nav>
              )}
              {/* Page Title */}
              <h1 className="text-lg font-semibold tracking-tight">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                className="pl-9 h-9"
              />
            </div>

            {/* Header Actions */}
            {headerActions}

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-status-error" />
            </Button>

            {/* Chat Toggle (Desktop) */}
            {showChat && !isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setChatOpen(!chatOpen)}
              >
                {chatOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Chat Toggle (Mobile) */}
            {showChat && isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setChatOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}

            {/* User Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="text-xs">JD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>

          {/* Chat Panel (Docked - Desktop) */}
          {showChat && chatOpen && !isMobile && (
            <ChatPanel
              position="docked"
              context={chatContext || { zone: zone === "admin" ? "Zone 1" : "Zone 2" }}
              quickActions={defaultQuickActions}
              onClose={() => setChatOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Chat Panel (Bottom Sheet - Mobile) */}
      {showChat && chatOpen && isMobile && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setChatOpen(false)}
          />
          <ChatPanel
            position="bottomsheet"
            context={chatContext || { zone: zone === "admin" ? "Zone 1" : "Zone 2" }}
            quickActions={defaultQuickActions}
            onClose={() => setChatOpen(false)}
          />
        </>
      )}
    </div>
  );
}

// Wrapper with SidebarProvider
export function AppShell(props: AppShellProps) {
  return (
    <SidebarProvider>
      <AppShellContent {...props} />
    </SidebarProvider>
  );
}

export default AppShell;
