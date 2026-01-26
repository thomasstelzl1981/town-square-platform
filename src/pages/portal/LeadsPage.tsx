import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox, TrendingUp, Megaphone, BarChart3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfExportFooter, usePdfContentRef } from "@/components/pdf";

const LeadsPage = () => {
  const contentRef = usePdfContentRef();

  return (
    <div className="space-y-6">
      <div ref={contentRef}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Leadgenerierung</h1>
            <p className="text-muted-foreground">Leads verwalten und Kampagnen steuern</p>
          </div>
          <Button className="no-print">
            <Plus className="mr-2 h-4 w-4" />
            Neue Kampagne
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inbox</CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Neue Leads</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Aktive Deals</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kampagnen</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Aktive Kampagnen</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Statistik</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Conversion & ROI</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <PdfExportFooter 
        contentRef={contentRef} 
        documentTitle="Leadgenerierung" 
        moduleName="MOD-10 Leads" 
      />
    </div>
  );
};

export default LeadsPage;
