import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, MessageSquare, CalendarCheck, Receipt, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfExportFooter, usePdfContentRef } from "@/components/pdf";

const VerkaufPage = () => {
  const contentRef = usePdfContentRef();

  return (
    <div className="space-y-6">
      <div ref={contentRef}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Verkauf</h1>
            <p className="text-muted-foreground">Immobilienverkauf und Inserate verwalten</p>
          </div>
          <Button className="no-print">
            <Plus className="mr-2 h-4 w-4" />
            Neues Inserat
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inserate</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Aktive Inserate</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anfragen</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Neue Anfragen</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservierungen</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Aktive Reservierungen</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transaktionen</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Abgeschlossen</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <PdfExportFooter 
        contentRef={contentRef} 
        documentTitle="Verkaufsübersicht" 
        moduleName="MOD-06 Verkauf" 
      />
    </div>
  );
};

export default VerkaufPage;
