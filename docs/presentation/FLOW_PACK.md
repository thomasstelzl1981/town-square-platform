# FLOW PACK — Cross-Module Flows

**Version:** v1.0  
**Datum:** 2026-01-26

---

## DIA-003: Core Foundations

```mermaid
flowchart TB
    subgraph Auth["AUTHENTICATION"]
        LOGIN["Login"]
        SIGNUP["Signup"]
        SESSION["Session"]
    end

    subgraph Tenant["TENANT ISOLATION"]
        ORG["Organization"]
        MEMBER["Membership"]
        ACTIVE["Active Tenant"]
    end

    subgraph Consent["CONSENT SYSTEM"]
        TEMPLATE["Agreement Template"]
        CONSENT["User Consent"]
        AUDIT["Audit Event"]
    end

    subgraph RLS["ROW LEVEL SECURITY"]
        POLICY["RLS Policy"]
        CHECK["tenant_id Check"]
        ADMIN["is_platform_admin()"]
    end

    LOGIN --> SESSION
    SIGNUP --> SESSION
    SESSION --> ACTIVE
    
    ORG --> MEMBER
    MEMBER --> ACTIVE
    
    TEMPLATE --> CONSENT
    CONSENT --> AUDIT
    
    ACTIVE --> CHECK
    CHECK --> POLICY
    ADMIN --> POLICY

    style Auth fill:#E8F4FD
    style Tenant fill:#E8FDE8
    style Consent fill:#FDF8E8
    style RLS fill:#F0E8FD
```

---

## DIA-010: MOD-04 → MOD-06 Listing-Erstellung

```mermaid
sequenceDiagram
    participant U as User
    participant M4 as MOD-04 Immobilien
    participant M6 as MOD-06 Verkauf
    participant CON as Consent Gate
    participant DB as Database

    U->>M4: Select Property for Sale
    M4->>M4: Check sale_enabled Feature
    M4->>M6: Navigate to Create Listing
    M6->>CON: Check SALES_MANDATE
    alt Consent Missing
        CON-->>U: Show Consent Dialog
        U->>CON: Accept
        CON->>DB: INSERT user_consents
    end
    M6->>DB: INSERT listings (status: draft)
    M6->>DB: INSERT audit_event (listing.created)
    M6-->>U: Listing Created
```

---

## DIA-011: MOD-06 Publishing 4 Channels

```mermaid
sequenceDiagram
    participant U as User
    participant M6 as MOD-06 Verkauf
    participant CON as Consent Gate
    participant CH as Channel Service
    participant DB as Database

    rect rgb(232, 253, 232)
        Note over U,DB: Channel 1: Kaufy (kostenlos)
        U->>M6: Publish to Kaufy
        M6->>M6: Readiness Check
        M6->>DB: INSERT listing_publications (kaufy)
        M6-->>U: Published
    end

    rect rgb(232, 244, 253)
        Note over U,DB: Channel 2: Scout24 (bezahlt)
        U->>M6: Publish to Scout24
        M6->>CON: Check SCOUT24_CREDITS
        CON-->>U: Consent Dialog
        U->>CON: Accept
        M6->>CH: Scout24 API (Stub)
        M6->>DB: INSERT listing_publications (scout24)
    end

    rect rgb(253, 248, 232)
        Note over U,DB: Channel 3: Kleinanzeigen (Link)
        U->>M6: Add Kleinanzeigen Link
        M6->>DB: UPDATE listings (kleinanzeigen_url)
    end

    rect rgb(240, 232, 253)
        Note over U,DB: Channel 4: Partner-Netzwerk
        U->>M6: Release to Partners
        M6->>CON: Check PARTNER_RELEASE
        CON-->>U: Consent (5-15% + €2000)
        U->>CON: Accept
        M6->>DB: UPDATE listings (partner_visibility)
        M6->>DB: INSERT user_consents (SYSTEM_SUCCESS_FEE_2000)
    end
```

---

## DIA-012: MOD-06 → MOD-09 Partner Release

```mermaid
sequenceDiagram
    participant O as Owner (MOD-06)
    participant M6 as MOD-06
    participant DB as Database
    participant M9 as MOD-09
    participant P as Partner

    O->>M6: Release Listing to Partners
    M6->>M6: Set partner_visibility
    alt All Partners
        M6->>DB: UPDATE listings SET partner_visibility = 'all'
    else Selected Partners
        M6->>DB: INSERT listing_partner_visibility (partner_ids)
    end
    M6->>DB: INSERT audit_event (listing.released_to_partners)
    
    Note over DB,M9: Partner Login
    P->>M9: View Objektkatalog
    M9->>DB: SELECT listings WHERE partner_visible
    DB-->>M9: Filtered Listings
    M9-->>P: Show Available Listings
```

---

## DIA-013: Kaufy Favorites Sync

```mermaid
sequenceDiagram
    participant W as Kaufy Website (Zone 3)
    participant LS as LocalStorage
    participant AUTH as Auth
    participant M8 as MOD-08
    participant DB as Database

    Note over W,LS: Anonymous Browsing
    W->>W: User views Property
    W->>LS: Save Favorite (property_id)
    W->>LS: Save Favorite (property_id)
    
    Note over AUTH,DB: User Registers/Logs In
    W->>AUTH: Login/Signup
    AUTH-->>W: Session Token
    W->>LS: Read Favorites
    LS-->>W: [fav1, fav2, ...]
    W->>M8: POST /investments/favorites/import
    M8->>DB: INSERT investment_favorites (each)
    M8->>LS: Clear Kaufy Favorites
    M8-->>W: Import Complete
    W->>W: Redirect to MOD-08 Favorites
```

---

## DIA-015: MOD-05 → Miety Invite

```mermaid
sequenceDiagram
    participant L as Landlord (MOD-05)
    participant M5 as MOD-05 MSV
    participant DB as Database
    participant EMAIL as Email Service
    participant R as Renter

    L->>M5: Invite Renter
    M5->>DB: SELECT contact (renter)
    M5->>DB: INSERT renter_invites (token, email)
    M5->>EMAIL: Send Invite Email
    EMAIL-->>R: Invitation Link
    
    Note over R,DB: Miety Andockpunkt (nicht implementieren)
    R->>R: Click Link → Miety App
    R->>R: Register with Token
    R->>DB: UPDATE renter_invites (accepted_at)
    R->>DB: CREATE membership (renter_user)
```

---

## DIA-016: Lead Capture → Pipeline

```mermaid
sequenceDiagram
    participant W as Zone 3 Website
    participant Z1 as Zone 1 Admin
    participant M10 as MOD-10
    participant P as Partner
    participant DB as Database

    Note over W,Z1: Lead Capture
    W->>DB: INSERT leads (source: zone3, status: new)
    W->>Z1: New Lead Notification

    Note over Z1,DB: Admin Qualification
    Z1->>DB: UPDATE leads (status: qualified)
    Z1->>M10: Assign to Partner
    Z1->>DB: INSERT lead_assignments
    Z1->>DB: INSERT audit_event (lead.assigned)

    Note over M10,P: Partner Inbox
    P->>M10: View Inbox
    M10->>DB: SELECT leads WHERE assigned_partner_id = me
    M10-->>P: Show Leads
    
    alt Accept Lead
        P->>M10: Accept
        M10->>DB: INSERT user_consents (LEAD_SPLIT_AGREEMENT)
        M10->>DB: UPDATE leads (status: accepted)
        M10->>DB: INSERT partner_deals
    else Reject Lead
        P->>M10: Reject
        M10->>DB: UPDATE lead_assignments (rejected_at)
        M10->>Z1: Return to Pool
    end
```

---

*Dieses Dokument enthält alle Cross-Module Flow-Diagramme.*
