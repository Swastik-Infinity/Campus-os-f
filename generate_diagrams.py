import os
from playwright.sync_api import sync_playwright

DIAGRAM_DIR = r"report_output\diagrams"
os.makedirs(DIAGRAM_DIR, exist_ok=True)

diagrams = {
    "01_system_architecture": """graph TD
    subgraph ClientBrowser ["Client Web Browser (Zero-Server Architecture)"]
        subgraph PresentationLayer ["Presentation & UI Layer"]
            HTML5["Semantic HTML5 Structure (Single Document)"]
            CSS3["Modern CSS3 Design System ('Warm Industrial Editorial')<br/>CSS Variables · Oswald · Inter · JetBrains Mono"]
            UIManager["appUI: Modals · Slide-out Drawers · Toast Queue"]
        end

        subgraph LogicLayer ["Application Logic Layer (Vanilla JS ES6+)"]
            Router["appNav: Client-side Navigation & Module Router"]
            Auth["appAuth: Demo Persona Management & Session State"]
            State["AppState: Central Reactive Reactive Application State"]
            RBAC["ROLE_PERMISSIONS: Multi-Role Access Control Matrix"]
            
            subgraph FeatureModules ["Domain Feature Modules"]
                M1["appDashboardModule"]
                M2["appCampusFixModule<br/>(Keyword Regex AI & SLA Engine)"]
                M3["appAttendanceModule<br/>(75% Rule & Roster Marker)"]
                M4["appLeaveModule<br/>(Multi-Stage Approval Flow)"]
                M5["appNoticesModule"]
                M6["appServicesModule"]
                M7["appAssetsModule"]
                M8["appInventoryModule"]
            end
            
            subgraph Repositories ["Abstracted Repository Layer"]
                R1["ticketRepository"]
                R2["attendanceRepository"]
                R3["leaveRepository"]
                R4["noticeRepository"]
                R5["serviceRepository"]
                R6["assetRepository"]
                R7["inventoryRepository"]
                R8["notificationRepository"]
            end
        end

        subgraph PersistenceLayer ["Client Storage Persistence"]
            LS[("Browser Window.localStorage<br/>JSON Serialization")]
        end
    end

    HTML5 --> LogicLayer
    CSS3 --> HTML5
    UIManager --> LogicLayer
    Router --> FeatureModules
    Auth --> State
    RBAC --> Router
    FeatureModules --> Repositories
    Repositories --> LS
""",

    "02_context_diagram": """graph TD
    Student(("🎓 Student<br/>(Kiran Patil)"))
    Faculty(("👩‍🏫 Faculty<br/>(Dr. Neha Kulkarni)"))
    Staff(("🛠️ Facilities Staff<br/>(Arun More)"))
    Admin(("🏛️ Campus Administrator<br/>(Campus Admin)"))

    CampusOS[["CampusOS v1.2<br/>Smart Campus Operating System<br/>(Unified Client-Side System)"]]

    Student -- "Submit facility tickets, Apply leaves,<br/>Track attendance, Request certificates" --> CampusOS
    CampusOS -- "SLA updates, At-risk warnings,<br/>Notices, Certificate status" --> Student

    Faculty -- "Mark class roster attendance,<br/>Review/approve student leaves" --> CampusOS
    CampusOS -- "Class rosters, Student leave requests,<br/>Faculty circulars" --> Faculty

    Staff -- "Update ticket status, Manage assets,<br/>Adjust consumable stock" --> CampusOS
    CampusOS -- "Assigned workorders, Maintenance logs,<br/>Low-inventory alerts" --> Staff

    Admin -- "Full system oversight, Configure threshold,<br/>Assign tickets, Reset demo data" --> CampusOS
    CampusOS -- "Cross-campus KPI analytics, SLA breaches,<br/>Complete operational logs" --> Admin
""",

    "03_dfd_level_0": """graph TD
    subgraph Actors ["External Campus Actors"]
        Student["Student Actor"]
        Faculty["Faculty Actor"]
        Staff["Maintenance Staff Actor"]
        Admin["Administrator Actor"]
    end

    subgraph Process0 ["Level 0 Core Operations Engine"]
        P0["(0.0) CampusOS Unified Campus<br/>Operations Processing Engine"]
    end

    subgraph Storage ["Local Web Storage"]
        D1[("Browser localStorage<br/>Collections")]
    end

    Student -- "Tickets, Leave Applications, Service Orders" --> P0
    Faculty -- "Roster Marks, Leave Decisions, Notices" --> P0
    Staff -- "Resolution Updates, Stock Adjustments" --> P0
    Admin -- "Policy Thresholds, Staff Assignments" --> P0

    P0 -- "Persist JSON entities" --> D1
    D1 -- "Load stored state" --> P0

    P0 -- "Attendance Risks, SLA Alerts, Badges" --> Student
    P0 -- "Roster Summaries, Pending Applications" --> Faculty
    P0 -- "Assigned Workorders, Low Stock Warnings" --> Staff
    P0 -- "Institutional KPI Metrics, SLA Logs" --> Admin
""",

    "04_dfd_level_1": """graph TD
    User["Campus User"]
    AdminUser["Admin / Manager"]

    subgraph Processes ["Level 1 Functional Processes"]
        P1["(1.0) Auth & Session Handling"]
        P2["(2.0) CampusFix Ticketing & SLA Engine"]
        P3["(3.0) Attendance & Roster Calculation"]
        P4["(4.0) Leave Approval Pipeline"]
        P5["(5.0) Smart Notice Distribution"]
        P6["(6.0) Service Center Request Processing"]
        P7["(7.0) Asset & Inventory Tracking"]
    end

    subgraph DataStores ["localStorage Data Stores"]
        DS_Auth[("Session Key")]
        DS_Tickets[("Tickets Collection")]
        DS_Att[("Attendance Records")]
        DS_Leave[("Leave Requests")]
        DS_Notice[("Notices Collection")]
        DS_Service[("Service Requests")]
        DS_Assets[("Assets & Inventory")]
    end

    User -->|Select Persona| P1
    P1 -->|Store Token| DS_Auth

    User -->|Submit Ticket Form| P2
    P2 -->|Save Docket| DS_Tickets
    P2 -->|SLA Breach Check| User

    User -->|Mark / Query Attendance| P3
    P3 -->|Evaluate 75% Rule| DS_Att

    User -->|Apply Leave| P4
    AdminUser -->|Approve / Clarify| P4
    P4 -->|Update Status| DS_Leave

    AdminUser -->|Publish Notice| P5
    User -->|Mark Read| P5
    P5 -->|Update ReadBy| DS_Notice

    User -->|Order Certificate| P6
    P6 -->|Save Request| DS_Service

    AdminUser -->|Log Repair / Stock| P7
    P7 -->|Stock Adjustment| DS_Assets
""",

    "05_use_case_diagram": """graph TD
    Student(("Student"))
    Faculty(("Faculty"))
    Staff(("Staff"))
    Admin(("Admin"))

    subgraph UseCases ["CampusOS System Capabilities"]
        UC1(["Select Demo Persona & Login"])
        UC2(["View Role Dashboard & KPIs"])
        UC3(["Report CampusFix Issue (AI Assisted)"])
        UC4(["Endorse Issue ('I'm Affected Too')"])
        UC5(["Track Ticket SLA & Timeline"])
        UC6(["Update Ticket Status & Assign Staff"])
        UC7(["View Attendance & Forecast Deficit"])
        UC8(["Mark Faculty Roster Attendance"])
        UC9(["Configure Attendance Threshold (%)"])
        UC10(["Apply for Student Leave"])
        UC11(["Approve / Reject / Clarify Leave"])
        UC12(["Broadcast Official Smart Notice"])
        UC13(["Mark Notice Read"])
        UC14(["Request Official Certificate / NOC"])
        UC15(["Inspect Assets & Maintenance History"])
        UC16(["Adjust Inventory Stock & Reorder"])
        UC17(["Reset Demo Data"])
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC7
    Student --> UC10
    Student --> UC13
    Student --> UC14

    Faculty --> UC1
    Faculty --> UC2
    Faculty --> UC3
    Faculty --> UC5
    Faculty --> UC8
    Faculty --> UC9
    Faculty --> UC11
    Faculty --> UC12
    Faculty --> UC13

    Staff --> UC1
    Staff --> UC2
    Staff --> UC3
    Staff --> UC5
    Staff --> UC6
    Staff --> UC15
    Staff --> UC16

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
    Admin --> UC17
""",

    "06_activity_campusfix": """graph TD
    Start([User Clicks '+ Report an Issue']) --> OpenModal[Open CampusFix Modal Dialog]
    OpenModal --> UserInputs[User types Title, Description, Location]
    UserInputs --> TriggerEval[Trigger evaluateAiSuggestions on input]
    
    TriggerEval --> RegexMatch{Match Category / Urgency Keywords?}
    RegexMatch -- Yes --> SetProposed[Set aiProposed Category & Urgency]
    RegexMatch -- No --> CheckDup

    SetProposed --> CheckDup{Check Active Ticket at Same Location?}
    CheckDup -- Duplicate Found --> ShowBanner[Display AI Suggestion Box & Duplicate Warning Banner]
    CheckDup -- No Duplicate --> ShowBox[Display AI Suggestion Box Only]

    ShowBanner --> UserDecision{User Clicks 'Apply Suggestions'?}
    ShowBox --> UserDecision

    UserDecision -- Yes --> AutoFill[Auto-populate Category dropdown & Urgency selector]
    UserDecision -- No --> ManualFill[User selects values manually]

    AutoFill --> ClickSubmit[User clicks 'Submit Ticket']
    ManualFill --> ClickSubmit

    ClickSubmit --> Validate{Required Fields Valid?}
    Validate -- Missing Title/Loc --> ShowError[Highlight input borders with has-error class] --> UserInputs
    Validate -- Valid --> CreateRecord[AppUtils.generateId: CF-XXXX<br/>Set status: PENDING, SLA target: 24/72/120h]

    CreateRecord --> SaveStore[ticketRepository.create: Save to localStorage]
    SaveStore --> TriggerToast[appUI.showToast: 'Ticket Submitted']
    TriggerToast --> CloseModal[appUI.closeModal & Re-render CampusFix View]
    CloseModal --> End([End])
""",

    "07_sequence_ticket_submission": """sequenceDiagram
    autonumber
    actor User as Campus User
    participant View as CampusFix View
    participant Module as appCampusFixModule
    participant Repo as ticketRepository
    participant Storage as Window.localStorage
    participant UI as appUI

    User->>View: Click "+ Report an Issue"
    View->>Module: openCreateModal()
    Module->>UI: showModal("Report Campus Facility Issue")
    UI-->>User: Render Interactive Form

    User->>Module: Type "Wi-Fi down in Hostel Block C"
    Module->>Module: evaluateAiSuggestions()
    Note over Module: Match regex keywords & scan open tickets
    Module-->>User: Render Category ('IT / Wifi') & Dup Warning

    User->>Module: Click "Apply Suggestions" & "Submit Ticket"
    Module->>Module: submitTicketForm()
    
    alt Validation Failure
        Module-->>User: Show has-error highlight
    else Validation Success
        Module->>Repo: create(newTicketObject)
        Repo->>Storage: setItem('campusos.v1.2.tickets', JSON.stringify(list))
        Storage-->>Repo: Acknowledge Persistence
        Repo-->>Module: Return Persisted Ticket
        Module->>UI: showToast("Ticket Submitted Successfully")
        Module->>UI: closeModal()
        Module->>View: appModuleRenderer.render('campusfix')
        View-->>User: Display New Ticket Docket with SLA Clock
    end
""",

    "08_sequence_demo_login": """sequenceDiagram
    autonumber
    actor User as Campus User
    participant AuthScreen as #auth-screen (Persona Selector)
    participant Auth as appAuth
    participant Storage as Window.localStorage
    participant Loader as appStateLoader
    participant Router as appNav
    participant AppRoot as #app-root

    User->>AuthScreen: Click Role Card (e.g. 'student-kiran')
    AuthScreen->>Auth: login('student-kiran')
    Auth->>Storage: setItem('campusos.v1.2.session', 'student-kiran')
    
    Auth->>AuthScreen: Set display: none
    Auth->>AppRoot: Set display: flex
    
    Auth->>Loader: loadAll()
    Note over Loader: Read tickets, attendance, leaves, notices from localStorage
    
    Auth->>Router: renderNavigation()
    Note over Router: Filter MODULE_CONFIG via ROLE_PERMISSIONS['student']
    
    Auth->>Router: switchModule('dashboard')
    Router-->>AppRoot: Render Dashboard View
    Auth-->>User: Toast: "Welcome back, Kiran"
""",

    "09_state_diagram_ticket": """stateDiagram-v2
    [*] --> PENDING: User reports issue (CF-XXXX generated)
    
    PENDING --> IN_PROGRESS: Staff / Admin acknowledges & begins repair
    PENDING --> RESOLVED: Quick fix resolved directly
    
    IN_PROGRESS --> RESOLVED: Maintenance completed (timestamp recorded)
    
    state PENDING {
        [*] --> UnderTargetSLA
        UnderTargetSLA --> OverdueBreached: Elapsed Hours > Target SLA (24/72/120h)
    }

    state IN_PROGRESS {
        [*] --> InRepairs
        InRepairs --> OverdueBreached: Work ongoing past SLA deadline
    }

    RESOLVED --> [*]: Closed within recorded SLA
""",

    "10_state_diagram_leave": """stateDiagram-v2
    [*] --> PENDING: Student submits leave application (LV-XXXX)
    
    PENDING --> APPROVED: Faculty grants approval
    PENDING --> REJECTED: Faculty rejects with reason
    PENDING --> CLARIFICATION: Faculty requests additional evidence / parent note
    
    CLARIFICATION --> PENDING: Student provides updated notes / documents
    
    APPROVED --> [*]: Final approval recorded
    REJECTED --> [*]: Case closed
""",

    "11_entity_relationship_diagram": """erDiagram
    DEMO_USER ||--o{ TICKET : "reports (ownerId)"
    DEMO_USER ||--o{ TICKET : "assigned_to (staffId)"
    DEMO_USER ||--o{ LEAVE_REQUEST : "applies (studentId)"
    DEMO_USER ||--o{ SERVICE_REQUEST : "orders (studentId)"
    DEMO_USER ||--o{ NOTICE : "reads (readBy)"

    TICKET {
        string id PK "e.g. CF-1001"
        string ownerId FK
        string assignedTo FK
        string title
        string category
        string location
        string urgency
        string status "PENDING | IN_PROGRESS | RESOLVED"
        int affectedCount
        int expectedHours
        datetime created
        datetime resolved
    }

    ATTENDANCE {
        int threshold "Default: 75%"
        json subjects "List of attended/total counts"
        json history "Chronological lecture log"
    }

    LEAVE_REQUEST {
        string id PK "e.g. LV-1001"
        string studentId FK
        date start
        date end
        int days
        string reason
        string document "Attachment filename string"
        string status "PENDING | APPROVED | REJECTED | CLARIFICATION"
        string notes
    }

    NOTICE {
        string id PK "e.g. NT-1001"
        string title
        string content
        string audience "ALL | CE-Student | Faculty"
        string priority "Normal | Important"
        date expiry
        date created
        array readBy "List of user IDs"
    }

    SERVICE_REQUEST {
        string id PK "e.g. SR-1001"
        string studentId FK
        string type "Bonafide | ID Card | Transcript"
        string details
        string status "PENDING | IN_PROGRESS | COMPLETED"
        date date
    }

    ASSET {
        string id PK "e.g. PR-204"
        string name
        string category
        string location
        string condition
        int repairs
        int complaints
        string specs
    }

    INVENTORY {
        string id PK "e.g. INV-101"
        string name
        string department
        int stock
        int min
        string unit
    }
""",

    "12_javascript_component_diagram": """graph TD
    subgraph SingleFileApp ["campusos-v1.2.html (Single-File Architecture)"]
        subgraph CoreState ["State & Security Core"]
            AppState["AppState (Global Reactive Store)"]
            RoleMatrix["ROLE_PERMISSIONS (RBAC Matrix)"]
            ModuleRegistry["MODULE_CONFIG (Module Metadata)"]
        end

        subgraph UIEngine ["UI & Presentation Controllers"]
            appUI["appUI: Toasts · Modals · Drawers"]
            appAuth["appAuth: Persona Session Switcher"]
            appNav["appNav: Module Router & Nav Generator"]
            appReset["appReset: Initial State Restorer"]
            appModuleRenderer["appModuleRenderer: View Orchestrator"]
        end

        subgraph Modules ["Feature Render Modules"]
            MOD_Dash["appDashboardModule"]
            MOD_Fix["appCampusFixModule"]
            MOD_Att["appAttendanceModule"]
            MOD_Leave["appLeaveModule"]
            MOD_Notice["appNoticesModule"]
            MOD_Service["appServicesModule"]
            MOD_Asset["appAssetsModule"]
            MOD_Inv["appInventoryModule"]
        end

        subgraph Repos ["Data Access Repositories"]
            R_Ticket["ticketRepository"]
            R_Att["attendanceRepository"]
            R_Leave["leaveRepository"]
            R_Notice["noticeRepository"]
            R_Service["serviceRepository"]
            R_Asset["assetRepository"]
            R_Inv["inventoryRepository"]
            R_Notif["notificationRepository"]
        end

        subgraph StorageBridge ["Web Storage Interface"]
            LS[("Browser Window.localStorage")]
        end
    end

    appAuth --> AppState
    appNav --> RoleMatrix
    appNav --> appModuleRenderer
    appModuleRenderer --> Modules
    Modules --> Repos
    Repos --> LS
    Modules --> appUI
""",

    "13_deployment_diagram": """graph TD
    subgraph ClientDevice ["Client Computing Node (Desktop / Laptop / Tablet / Smartphone)"]
        subgraph WebBrowser ["Modern Web Browser (Chrome, Edge, Firefox, Safari)"]
            subgraph DOMRuntime ["Browser Runtime Engine"]
                DOM["DOM & CSSOM Tree Render"]
                V8["V8 / SpiderMonkey JavaScript Virtual Machine"]
                StorageEngine["Local Web Storage (localStorage Engine)"]
            end
            
            subgraph StaticAssets ["Static Local Web Artifact"]
                SingleHTML["campusos-v1.2.html<br/>(4,693 Lines · HTML5 + CSS3 + JS ES6+)"]
            end
        end
    end

    subgraph FontCDN ["External Font Delivery Network (Optional CDN Link)"]
        GoogleFonts["fonts.googleapis.com<br/>(Oswald, Inter, JetBrains Mono)"]
    end

    SingleHTML --> DOM
    SingleHTML --> V8
    V8 <--> StorageEngine
    SingleHTML -.->|Fetch webfonts if online| GoogleFonts
"""
}

# 1. Write all Mermaid files
for name, content in diagrams.items():
    mmd_path = os.path.join(DIAGRAM_DIR, f"{name}.mmd")
    with open(mmd_path, "w", encoding="utf-8") as f:
        f.write(content)

# 2. Render all Mermaid diagrams to PNG using Playwright and Mermaid.js
html_template = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        body {
            margin: 20px;
            background: #FFFFFF;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #container {
            padding: 24px;
            background: #FFFFFF;
            border: 1px solid #E0E0E0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            display: inline-block;
        }
    </style>
</head>
<body>
    <div id="container">
        <pre class="mermaid" id="diagram-target"></pre>
    </div>
    <script>
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            themeVariables: {
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '13px',
                primaryColor: '#EBF3F0',
                primaryBorderColor: '#2B5E56',
                primaryTextColor: '#111D33',
                lineColor: '#2B5E56',
                secondaryColor: '#FFF8EB',
                tertiaryColor: '#F4F5F0'
            }
        });
        async function renderDiagram(code) {
            const target = document.getElementById('diagram-target');
            target.removeAttribute('data-processed');
            target.innerHTML = code;
            await mermaid.run({ nodes: [target] });
        }
    </script>
</body>
</html>"""

render_html_path = os.path.join(DIAGRAM_DIR, "render_engine.html")
with open(render_html_path, "w", encoding="utf-8") as f:
    f.write(html_template)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1600, "height": 1200})
    file_url = f"file:///{os.path.abspath(render_html_path).replace(os.sep, '/')}"
    page.goto(file_url)
    page.wait_for_timeout(1000)

    for name, code in diagrams.items():
        png_path = os.path.join(DIAGRAM_DIR, f"{name}.png")
        svg_path = os.path.join(DIAGRAM_DIR, f"{name}.svg")
        
        # Render diagram in page
        escaped_code = code.replace("`", "\\`").replace("$", "\\$")
        page.evaluate(f"renderDiagram(`{escaped_code}`)")
        page.wait_for_timeout(1200)
        
        # Capture container element
        container = page.locator("#container")
        container.screenshot(path=png_path)
        
        # Also extract raw SVG
        svg_content = page.evaluate("document.querySelector('#diagram-target svg')?.outerHTML || ''")
        if svg_content:
            with open(svg_path, "w", encoding="utf-8") as f:
                f.write(svg_content)
        
        print(f"Rendered: {name}.png and .svg")

    browser.close()

print("\nAll 13 diagrams successfully rendered!")
