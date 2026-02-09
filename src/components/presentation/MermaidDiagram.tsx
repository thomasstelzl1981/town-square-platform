import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#3b82f6",
    primaryTextColor: "#f8fafc",
    primaryBorderColor: "#3b82f6",
    lineColor: "#64748b",
    secondaryColor: "#1e293b",
    tertiaryColor: "#0f172a",
    background: "#0d1321",
    mainBkg: "#1e293b",
    nodeBorder: "#3b82f6",
    clusterBkg: "#1e293b",
    clusterBorder: "#334155",
    titleColor: "#f8fafc",
    edgeLabelBackground: "#1e293b",
  },
  flowchart: {
    curve: "basis",
    padding: 20,
    nodeSpacing: 50,
    rankSpacing: 80,
  },
  securityLevel: "loose",
});

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;
      
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError(err instanceof Error ? err.message : "Failed to render diagram");
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className={`bg-status-error/10 border border-status-error/30 rounded-lg p-4 ${className}`}>
        <p className="text-status-error text-sm">Diagram Error: {error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`mermaid-container overflow-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// Full System Architecture Chart
export const SYSTEM_OVERVIEW_CHART = `
flowchart TB
    subgraph Z1["<b>ZONE 1 — ADMIN / GOVERNANCE</b>"]
        direction LR
        Z1_ORG["🏢 Organizations<br/>& Tenants"]
        Z1_USR["👥 Users &<br/>Memberships"]
        Z1_DEL["🔗 Delegations<br/>& Hierarchies"]
        Z1_TILE["🎛️ Tile Catalog<br/>& Activation"]
        Z1_INT["🔌 Integration<br/>Registry"]
        Z1_OVS["👁️ Oversight<br/>& Monitoring"]
        Z1_BILL["💳 Billing<br/>& Plans"]
    end

    subgraph Z2["<b>ZONE 2 — USER PORTALS (9 Module)</b>"]
        direction TB
        subgraph Z2_ROW1["Core Modules"]
            direction LR
            Z2_M1["<b>MOD-01</b><br/>📋 Stammdaten<br/><i>Profil • Firma • Abrechnung</i>"]
            Z2_M2["<b>MOD-02</b><br/>🤖 KI Office<br/><i>Email • Brief • Kontakte</i>"]
            Z2_M3["<b>MOD-03</b><br/>📁 DMS<br/><i>Eingang • Archiv • Storage</i>"]
        end
        subgraph Z2_ROW2["Asset Modules"]
            direction LR
            Z2_M4["<b>MOD-04</b><br/>🏠 Immobilien<br/><i>Portfolio • Exposé • Sanierung</i>"]
            Z2_M5["<b>MOD-05</b><br/>🔑 MSV<br/><i>Mieter • Eingang • Vermietung</i>"]
            Z2_M6["<b>MOD-06</b><br/>🏷️ Verkauf<br/><i>Objekte • Reservierung</i>"]
        end
        subgraph Z2_ROW3["Business Modules"]
            direction LR
            Z2_M7["<b>MOD-07</b><br/>🤝 Vertriebspartner<br/><i>Pipeline • Investment Engine</i>"]
            Z2_M8["<b>MOD-08</b><br/>💰 Finanzierung<br/><i>Pakete • Future Room</i>"]
            Z2_M9["<b>MOD-09</b><br/>🎯 Leadgenerierung<br/><i>Ads • Studio • Leads</i>"]
        end
    end

    subgraph Z3["<b>ZONE 3 — WEBSITES</b>"]
        direction LR
        Z3_KAUFY["🛒 KAUFY.IO<br/><i>Verkauf & Partner Marketing</i>"]
        Z3_MIETY["🏘️ MIETY.de<br/><i>Mietverwaltung Marketing</i>"]
        Z3_LC["📥 Lead Capture<br/><i>Forms & AI Chatbots</i>"]
    end

    subgraph CORE["<b>KERNOBJEKTE (Cross-Zone)</b>"]
        direction LR
        C_ORG["🏢 Organization"]
        C_USR["👤 User"]
        C_PROP["🏠 Property"]
        C_LEAD["📋 Lead"]
        C_DOC["📄 Document"]
    end

    subgraph EXT["<b>EXTERNE SYSTEME</b>"]
        direction LR
        E_RESEND["📧 Resend<br/><i>System Mail</i>"]
        E_STRIPE["💳 Stripe<br/><i>Billing</i>"]
        E_CAYA["📬 Posteingang<br/><i>E-Mail Inbound</i>"]
        E_AI["🧠 Lovable AI<br/><i>Gateway</i>"]
        E_META["📢 Meta Ads<br/><i>Campaigns</i>"]
    end

    %% Zone 1 → Zone 2 Control
    Z1_TILE -->|"aktiviert"| Z2
    Z1_OVS -.->|"read-only"| Z2

    %% Zone 1 → External
    Z1_INT -->|"steuert"| EXT

    %% Zone 3 → Zone 2 Lead Flow
    Z3_LC -->|"Leads"| Z2_M9

    %% Cross-Zone to Core
    Z1 --> CORE
    Z2 --> CORE
    Z3 --> CORE

    %% External → Zone 2
    E_CAYA -->|"PDFs"| Z2_M3
    E_AI -->|"Armstrong"| Z2_M2
    E_META -->|"Ads"| Z3_KAUFY

    %% Inter-Module Dependencies
    Z2_M9 -.->|"qualified"| Z2_M7
    Z2_M7 -.->|"matched"| Z2_M8
    Z2_M8 -.->|"financed"| Z2_M6
    Z2_M4 -.->|"rental"| Z2_M5
    Z2_M4 -.->|"sale"| Z2_M6

    classDef zone1 fill:#1e40af,stroke:#3b82f6,color:#f8fafc
    classDef zone2 fill:#166534,stroke:#22c55e,color:#f8fafc
    classDef zone3 fill:#0e7490,stroke:#06b6d4,color:#f8fafc
    classDef core fill:#7c3aed,stroke:#a78bfa,color:#f8fafc
    classDef external fill:#475569,stroke:#94a3b8,color:#f8fafc

    class Z1_ORG,Z1_USR,Z1_DEL,Z1_TILE,Z1_INT,Z1_OVS,Z1_BILL zone1
    class Z2_M1,Z2_M2,Z2_M3,Z2_M4,Z2_M5,Z2_M6,Z2_M7,Z2_M8,Z2_M9 zone2
    class Z3_KAUFY,Z3_MIETY,Z3_LC zone3
    class C_ORG,C_USR,C_PROP,C_LEAD,C_DOC core
    class E_RESEND,E_STRIPE,E_CAYA,E_AI,E_META external
`;

// Module Dependencies Chart
export const MODULE_DEPENDENCIES_CHART = `
flowchart LR
    subgraph INPUT["Eingang"]
        LEAD["🎯 Lead<br/>Zone 3"]
        POST["📬 Post<br/>Posteingang"]
    end

    subgraph CORE["Core Modules"]
        M1["MOD-01<br/>Stammdaten"]
        M2["MOD-02<br/>KI Office"]
        M3["MOD-03<br/>DMS"]
    end

    subgraph ASSETS["Asset Modules"]
        M4["MOD-04<br/>Immobilien"]
        M5["MOD-05<br/>MSV"]
        M6["MOD-06<br/>Verkauf"]
    end

    subgraph BUSINESS["Business Modules"]
        M7["MOD-07<br/>Partner"]
        M8["MOD-08<br/>Finanz"]
        M9["MOD-09<br/>Leads"]
    end

    subgraph OUTPUT["Output"]
        TRANS["✅ Transaction"]
        HANDOFF["🤝 Handoff"]
    end

    LEAD --> M9
    POST --> M3
    
    M9 --> M7
    M7 --> M4
    M7 --> M8
    M8 --> M6
    M4 --> M5
    M4 --> M6
    M6 --> TRANS
    M8 --> HANDOFF
    
    M3 -.-> M4
    M2 -.-> M7
    M1 -.-> M2

    classDef input fill:#0e7490,stroke:#06b6d4,color:#f8fafc
    classDef core fill:#1e40af,stroke:#3b82f6,color:#f8fafc
    classDef asset fill:#166534,stroke:#22c55e,color:#f8fafc
    classDef business fill:#7c3aed,stroke:#a78bfa,color:#f8fafc
    classDef output fill:#15803d,stroke:#22c55e,color:#f8fafc

    class LEAD,POST input
    class M1,M2,M3 core
    class M4,M5,M6 asset
    class M7,M8,M9 business
    class TRANS,HANDOFF output
`;

// Data Flow Chart
export const DATA_FLOW_CHART = `
flowchart TB
    subgraph ZONE3["Zone 3 — Public"]
        WEB["🌐 Website"]
        FORM["📝 Lead Form"]
        BOT["🤖 AI Chatbot"]
    end

    subgraph ADMIN["Zone 1 — Admin"]
        POOL["📥 Lead Pool"]
        ASSIGN["🔀 Assignment"]
    end

    subgraph ZONE2["Zone 2 — Portal"]
        M9["MOD-09 Leads"]
        M7["MOD-07 Partner"]
        M8["MOD-08 Finanz"]
        M4["MOD-04 Immobilien"]
        M6["MOD-06 Verkauf"]
    end

    subgraph EXT["External"]
        FUTURE["🏦 Future Room"]
        NOTAR["📜 Notar"]
    end

    WEB --> FORM
    WEB --> BOT
    FORM --> POOL
    BOT --> POOL
    
    POOL --> ASSIGN
    ASSIGN --> M9
    
    M9 -->|"Qualifiziert"| M7
    M7 -->|"Property Match"| M4
    M7 -->|"Finanzierung"| M8
    
    M8 -->|"Handoff"| FUTURE
    M4 -->|"Verkauf"| M6
    M6 -->|"Closing"| NOTAR

    style ZONE3 fill:#0e7490,stroke:#06b6d4
    style ADMIN fill:#1e40af,stroke:#3b82f6
    style ZONE2 fill:#166534,stroke:#22c55e
    style EXT fill:#475569,stroke:#94a3b8
`;
