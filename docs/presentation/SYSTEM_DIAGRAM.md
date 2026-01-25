# System of a Town — System Diagrams & Cross-Module Flows

**Version:** v2.0.0  
**Status:** SPEC COMPLETE  
**Letzte Aktualisierung:** 2026-01-25  
**Zweck:** Visualisierung der Gesamtarchitektur, Publishing-Flows, State Machines

---

## 1) SYSTEM-ÜBERSICHT (3-Zonen-Modell)

### 1.1 High-Level Architecture

```mermaid
flowchart TB
    subgraph Z1["ZONE 1 — ADMIN / GOVERNANCE"]
        Z1_ORG["Organizations / Tenants"]
        Z1_USR["Users & Memberships"]
        Z1_DEL["Delegations & Hierarchies"]
        Z1_TILE["Tile Catalog / Feature Activation"]
        Z1_INT["Integrations Registry"]
        Z1_OVS["Oversight / Monitoring"]
        Z1_VERIFY["Partner Verification Review"]
        Z1_COMM["Commission Approval"]
        Z1_LEADS["Lead Pool Management"]
    end

    subgraph Z2["ZONE 2 — USER PORTALS (9 Module)"]
        Z2_M1["MOD-01: Stammdaten"]
        Z2_M2["MOD-02: KI Office"]
        Z2_M3["MOD-03: DMS"]
        Z2_M4["MOD-04: Immobilien"]
        Z2_M5["MOD-05: MSV"]
        Z2_M6["MOD-06: Verkauf"]
        Z2_M7["MOD-07: Finanzierung"]
        Z2_M8["MOD-08: Vertriebspartner"]
        Z2_M9["MOD-09: Leadgenerierung"]
    end

    subgraph Z3["ZONE 3 — WEBSITES"]
        Z3_KAUFY["Kaufy Marketplace"]
        Z3_SEARCH["Investment Search"]
        Z3_LC["Lead Capture"]
    end

    subgraph CORE["KERNOBJEKTE"]
        C_ORG["Organization"]
        C_USR["User"]
        C_PROP["Property"]
        C_LEAD["Lead"]
        C_DOC["Document"]
        C_CONTACT["Contact"]
    end

    subgraph EXT["EXTERNE SYSTEME"]
        E_RESEND["System Mail (Resend)"]
        E_SCOUT24["Immobilienscout24"]
        E_STRIPE["Stripe Billing"]
        E_AI["Lovable AI Gateway"]
    end

    Z1 --> CORE
    Z2 --> CORE
    Z3 --> CORE

    Z1_TILE --> Z2
    Z1_INT --> EXT
    Z1_OVS -.->|read-only| Z2
    Z1_VERIFY --> Z2_M8
    Z1_COMM --> Z2_M8
    Z1_LEADS --> Z2_M9

    Z2_M6 -->|publish| Z3_KAUFY
    Z2_M6 -->|publish| E_SCOUT24
    Z2_M8 -->|read| Z2_M6

    Z3_LC --> Z2_M9
    Z3_KAUFY --> Z3_LC

    style Z1 fill:#E8F4FD
    style Z2 fill:#E8FDE8
    style Z3 fill:#FDF8E8
```

---

## 2) MOD-06 ↔ MOD-08 DATA FLOW

### 2.1 Complete Interaction Flow

```mermaid
flowchart TD
    subgraph MOD04["MOD-04 Immobilien"]
        P[Property]
        P_FEAT[property_features]
    end

    subgraph MOD06["MOD-06 Verkauf"]
        L[Listing]
        L_PUB[listing_publications]
        L_TERMS[listing_partner_terms]
        L_INQ[listing_inquiries]
        RES[Reservation]
        TX[Transaction]
    end

    subgraph MOD08["MOD-08 Vertriebspartner"]
        CAT[Objektkatalog View]
        SEL[partner_selections]
        CASE[advisory_cases]
        SIM[simulations]
        COMM[commission_records]
    end

    subgraph Z1["Zone 1 Admin"]
        VERIFY[Verification Review]
        COMM_APPR[Commission Approval]
    end

    P -->|sale_enabled| L
    L -->|creates| L_PUB
    L -->|creates| L_TERMS
    L_TERMS -->|finance_distribution_enabled| CAT
    
    CAT -->|partner selects| SEL
    SEL -->|starts case| CASE
    CASE -->|creates| SIM
    
    CASE -->|converts to| RES
    RES -->|becomes| TX
    TX -->|triggers| COMM
    
    VERIFY -->|approves| MOD08
    COMM -->|requires| COMM_APPR

    style MOD04 fill:#f9f9f9
    style MOD06 fill:#e8f4fd
    style MOD08 fill:#e8fde8
    style Z1 fill:#fdf8e8
```

---

## 3) PUBLISHING CHANNEL FLOWS

### 3.1 Kaufy Publishing Flow

```mermaid
flowchart TD
    A[Listing status=active] --> B{Start Kaufy Wizard}
    B --> C[Step 1: Confirm Channel]
    C --> D[Step 2: Readiness Check]
    D --> E{All required fields?}
    E -->|No| F[Edit in MOD-04]
    F --> D
    E -->|Yes| G[Step 3: Preview Exposé]
    G --> H[Step 4: Partner Release Optional]
    H --> I{Release to partners?}
    I -->|Yes| J[Configure Partner Terms]
    I -->|No| K[Step 5: Publish]
    J --> K
    K --> L[listing_publications INSERT]
    L --> M[Zone 3 Kaufy Visible]
    M --> N[Audit Event]

    style A fill:#90EE90
    style M fill:#90EE90
```

### 3.2 Partner Network Release Flow

```mermaid
flowchart TD
    A[Listing active on Kaufy] --> B{Start Partner Release}
    B --> C[Step 1: Enable Finance Distribution]
    C --> D[Step 2: Set Commission Rate]
    D --> E{Rate 5-15%?}
    E -->|Invalid| D
    E -->|Valid| F[Step 3: PARTNER_RELEASE Consent]
    F --> G{Consent granted?}
    G -->|No| H[Abort]
    G -->|Yes| I[Step 4: SYSTEM_SUCCESS_FEE Consent]
    I --> J{Fee accepted?}
    J -->|No| H
    J -->|Yes| K[Step 5: Generate Agreement PDF]
    K --> L[DMS Document Created]
    L --> M[Step 6: Activate]
    M --> N[listing_partner_terms UPDATE]
    N --> O[listing_publications INSERT]
    O --> P[Visible in MOD-08 Catalog]
    P --> Q[Audit Event]

    style P fill:#90EE90
    style H fill:#FFB6C1
```

### 3.3 Scout24 Publishing Flow

```mermaid
flowchart TD
    A[Listing active] --> B{Start Scout24 Wizard}
    B --> C[Step 1: Show Cost/Credits]
    C --> D[Step 2: Field Mapping Check]
    D --> E{Scout24 fields complete?}
    E -->|No| F[Complete fields]
    F --> D
    E -->|Yes| G[Step 3: Credit Approval]
    G --> H{Credits available?}
    H -->|No| I[Purchase Credits]
    I --> H
    H -->|Yes| J[Step 4: Submit to API]
    J --> K{API Response}
    K -->|Success| L[publication status=published]
    K -->|Failure| M[publication status=failed]
    M --> N[Show Error + Retry]
    N --> J
    L --> O[Audit Event]

    style L fill:#90EE90
    style M fill:#FFB6C1
```

### 3.4 eBay Kleinanzeigen Flow

```mermaid
flowchart TD
    A[Listing active] --> B{Start Kleinanzeigen Wizard}
    B --> C[Step 1: Enter External URL]
    C --> D{Valid URL format?}
    D -->|No| C
    D -->|Yes| E[Step 2: Optional Screenshot]
    E --> F{Upload screenshot?}
    F -->|Yes| G[DMS Upload]
    G --> H[Step 3: Save]
    F -->|No| H
    H --> I[listing_publications INSERT]
    I --> J[status=published_external]
    J --> K[Audit Event]

    style J fill:#FFFACD
```

---

## 4) STATE MACHINES

### 4.1 Listing Lifecycle

```mermaid
stateDiagram-v2
    [*] --> draft: Create Listing
    draft --> internal_review: Submit
    internal_review --> draft: Request Changes
    internal_review --> active: Approve + Publish
    active --> reserved: Reservation Created
    active --> withdrawn: Owner Withdraws
    reserved --> active: Reservation Cancelled
    reserved --> sold: Transaction Completed
    reserved --> withdrawn: Withdrawn
    sold --> [*]
    withdrawn --> [*]
    
    note right of active: Can publish to multiple channels
    note right of sold: Triggers commission calculation
```

### 4.2 Publication Status (per Channel)

```mermaid
stateDiagram-v2
    [*] --> draft: Initialize
    draft --> ready: Readiness Check Passed
    ready --> published: Execute Publish
    ready --> published_external: External Link (Kleinanzeigen)
    published --> paused: Pause
    published --> removed: Remove
    paused --> published: Resume
    published --> failed: API Error
    failed --> ready: Fix + Retry
    removed --> [*]
    published_external --> removed: Remove Link
```

### 4.3 Partner Verification Status

```mermaid
stateDiagram-v2
    [*] --> pending: Account Created
    pending --> submitted: Documents Uploaded
    submitted --> verified: Admin Approves
    submitted --> rejected: Admin Rejects
    rejected --> pending: Reset for Retry
    pending --> submitted: Resubmit
    verified --> expired: Validity Expired
    expired --> pending: Renewal Required
    
    note right of verified: Full catalog access
    note right of pending: Limited access
```

### 4.4 Advisory Case Status

```mermaid
stateDiagram-v2
    [*] --> shortlist: Added to Selection
    shortlist --> consulting: Start Consultation
    shortlist --> dropped: Not Interested
    consulting --> committed: Customer Interested
    consulting --> dropped: Abandoned
    committed --> converted: Reservation Created
    committed --> dropped: Deal Lost
    converted --> [*]
    dropped --> [*]
    
    note right of converted: Links to MOD-06 Reservation
```

### 4.5 Commission Status

```mermaid
stateDiagram-v2
    [*] --> pending: Transaction Completed
    pending --> approved: Admin Approves
    pending --> cancelled: Transaction Cancelled
    approved --> invoiced: Invoice Generated
    invoiced --> paid: Payment Received
    cancelled --> [*]
    paid --> [*]
```

---

## 5) CROSS-MODULE FLOWS

### 5.1 Complete Sales Journey

```mermaid
sequenceDiagram
    participant Owner as Property Owner
    participant MOD04 as MOD-04 Immobilien
    participant MOD06 as MOD-06 Verkauf
    participant Z3 as Zone 3 Kaufy
    participant Partner as Sales Partner
    participant MOD08 as MOD-08 Vertriebspartner
    participant Buyer as End Buyer
    participant Z1 as Zone 1 Admin

    Owner->>MOD04: Enable sale_enabled
    Owner->>MOD06: Create Listing
    Owner->>MOD06: Accept SALES_MANDATE
    MOD06->>MOD06: listing.status = draft
    Owner->>MOD06: Publish to Kaufy
    MOD06->>Z3: Listing visible
    Owner->>MOD06: Release to Partners
    Owner->>MOD06: Set Commission (5-15%)
    Owner->>MOD06: Accept PARTNER_RELEASE
    Owner->>MOD06: Accept SYSTEM_FEE
    MOD06->>MOD08: Listing in Catalog
    
    Partner->>MOD08: Browse Catalog
    Partner->>MOD08: Add to Selection
    Partner->>MOD08: Create Advisory Case
    Partner->>MOD08: Link Buyer Contact
    Partner->>MOD08: Run Simulation
    Partner->>MOD08: Export PDF
    Partner->>Buyer: Present Investment
    Buyer->>Partner: Interested
    Partner->>MOD08: Mark Committed
    Partner->>MOD06: Create Reservation
    
    Owner->>MOD06: Confirm Reservation
    Buyer->>MOD06: Confirm Reservation
    MOD06->>MOD06: reservation.status = confirmed
    
    Note over MOD06: Notary Appointment
    MOD06->>MOD06: transaction.status = notarized
    
    Note over MOD06: BNL Received
    MOD06->>MOD06: transaction.status = bnl_received
    MOD06->>MOD08: Create Commission Record
    MOD08->>Z1: Commission Pending
    Z1->>MOD08: Approve Commission
    MOD08->>Partner: Commission Paid
```

### 5.2 Lead Flow (MOD-09 → MOD-08)

```mermaid
sequenceDiagram
    participant Z3 as Zone 3 Website
    participant MOD09 as MOD-09 Leadgen
    participant Z1 as Zone 1 Lead Pool
    participant MOD08 as MOD-08 Partner
    participant Partner as Sales Partner

    Z3->>MOD09: Lead Captured
    MOD09->>MOD09: Lead Qualified
    MOD09->>Z1: Lead to Admin Pool
    Z1->>Z1: Match to Partner Criteria
    Z1->>MOD08: Assign Lead (Push)
    MOD08->>Partner: Lead Notification
    
    alt Accept within 48h
        Partner->>MOD08: Accept Lead
        MOD08->>MOD08: Create Advisory Case
        Note over MOD08: is_pool_lead = true
    else Timeout
        Z1->>Z1: Reassign Lead
    end
```

---

## 6) AGREEMENT & CONSENT FLOW

### 6.1 Publishing Consent Chain

```mermaid
flowchart TD
    subgraph "Listing Creation"
        A[Create Listing] --> B{SALES_MANDATE}
        B -->|Accept| C[Listing Created]
        B -->|Decline| D[Blocked]
    end

    subgraph "Kaufy Publishing"
        C --> E[Publish to Kaufy]
        E --> F[No additional consent]
        F --> G[Published]
    end

    subgraph "Partner Release"
        G --> H{Release to Partners?}
        H -->|Yes| I{PARTNER_RELEASE}
        I -->|Accept| J{SYSTEM_SUCCESS_FEE_2000}
        J -->|Accept| K[Generate Agreement PDF]
        K --> L[Released to Partners]
        I -->|Decline| M[Not Released]
        J -->|Decline| M
    end

    subgraph "Scout24 Publishing"
        G --> N{Publish to Scout24?}
        N -->|Yes| O{SCOUT24_CREDITS}
        O -->|Pay| P[Published to Scout24]
        O -->|Decline| Q[Not Published]
    end

    style C fill:#90EE90
    style G fill:#90EE90
    style L fill:#90EE90
    style P fill:#90EE90
    style D fill:#FFB6C1
    style M fill:#FFFACD
    style Q fill:#FFFACD
```

---

## 7) PROVISIONS-MODELL DIAGRAMM

### 7.1 Commission Calculation Flow

```mermaid
flowchart TD
    A[Transaction Completed] --> B{Partner Involved?}
    B -->|No| C[No Commission]
    B -->|Yes| D[Get Commission Rate]
    D --> E[Calculate Gross: final_price × rate]
    E --> F{Is Pool Lead?}
    F -->|No| G[Partner Share = 100%]
    F -->|Yes| H[Platform: 33.33%]
    H --> I[Partner: 66.67%]
    G --> J[Create Commission Record]
    I --> J
    J --> K{System Fee Enabled?}
    K -->|Yes| L[Add 2.000€ System Fee]
    K -->|No| M[No System Fee]
    L --> N[Record Created]
    M --> N
    N --> O[Status: pending]
    O --> P[Zone 1: Approval Queue]

    style N fill:#90EE90
```

---

## 8) ZONE 2 MODULE GRID (9 Module)

```mermaid
flowchart LR
    subgraph "Standard Modules (All Tenants)"
        M1[MOD-01<br/>Stammdaten]
        M2[MOD-02<br/>KI Office]
        M3[MOD-03<br/>DMS]
        M4[MOD-04<br/>Immobilien]
        M5[MOD-05<br/>MSV]
        M6[MOD-06<br/>Verkauf]
        M7[MOD-07<br/>Finanzierung]
    end
    
    subgraph "Add-on Modules (Role-specific)"
        M8[MOD-08<br/>Vertriebspartner]
        M9[MOD-09<br/>Leadgenerierung]
    end

    M4 --> M6
    M6 --> M8
    M8 --> M9
    M6 --> M7
    M1 --> M4
    M1 --> M8
    M3 --> M6
    M3 --> M8

    style M6 fill:#e8f4fd
    style M8 fill:#e8fde8
    style M9 fill:#fdf8e8
```

---

## 9) INVESTMENT ENGINE INTEGRATION

```mermaid
sequenceDiagram
    participant UI as MOD-08 Beratung UI
    participant API as Partner API
    participant EF as sot-investment-engine
    participant DB as Database
    participant DMS as MOD-03 DMS

    UI->>API: POST /simulations/calculate
    API->>EF: Forward calculation request
    EF->>EF: Load interest rate tables
    EF->>EF: Calculate 40-year projection
    EF->>EF: Apply AfA model
    EF->>EF: Calculate tax effects
    EF-->>API: Return YearlyData[]
    API->>DB: Store simulation
    API-->>UI: Return results

    UI->>API: POST /simulations/:id/export
    API->>EF: Generate PDF
    EF-->>API: PDF binary
    API->>DMS: Store document
    DMS-->>API: document_id
    API->>DB: Store export record
    API-->>UI: Return document_id
```

---

*Version 2.0.0 — Vollständige Diagramm-Sammlung für MOD-06 + MOD-08*
