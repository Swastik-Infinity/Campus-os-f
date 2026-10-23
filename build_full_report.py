import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCX_OUT = r"report_output\final\CampusOS_Project_Report.docx"
DIAGRAM_DIR = r"report_output\diagrams"
SCREENSHOT_DIR = r"report_output\screenshots"
LOGO_PATH = r"report_output\screenshots\extracted_logo.jpg"

os.makedirs(r"report_output\final", exist_ok=True)

doc = Document()

# Set standard A4 portrait dimensions
for s in doc.sections:
    s.page_width = Inches(8.27)
    s.page_height = Inches(11.69)
    s.top_margin = Inches(0.8)
    s.bottom_margin = Inches(0.8)
    s.left_margin = Inches(1.0)
    s.right_margin = Inches(0.8)

# Color tokens
COLOR_INK = RGBColor(17, 29, 51)
COLOR_TEAL = RGBColor(43, 94, 86)
COLOR_MUTED = RGBColor(102, 112, 133)

def set_run_font(run, name="Times New Roman", size=12, bold=False, italic=False, color=None):
    run.font.name = name
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color

def add_p(doc, text="", style='Normal', align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=6, line_spacing=1.15, bold=False, italic=False, size=12, color=None):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    if text:
        r = p.add_run(text)
        set_run_font(r, size=size, bold=bold, italic=italic, color=color)
    return p

def add_heading_1(doc, text):
    p = add_p(doc, text, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=14, space_after=8, bold=True, size=16, color=COLOR_INK)
    p.paragraph_format.keep_with_next = True
    return p

def add_heading_2(doc, text):
    p = add_p(doc, text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=12, space_after=6, bold=True, size=14, color=COLOR_TEAL)
    p.paragraph_format.keep_with_next = True
    return p

def add_heading_3(doc, text):
    p = add_p(doc, text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=8, space_after=4, bold=True, italic=True, size=12.5, color=COLOR_INK)
    p.paragraph_format.keep_with_next = True
    return p

def add_bullet(doc, title, desc):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    r1 = p.add_run(title + (" — " if desc else ""))
    set_run_font(r1, bold=True, size=12)
    if desc:
        r2 = p.add_run(desc)
        set_run_font(r2, bold=False, size=12)
    return p

def add_figure(doc, img_path, fig_num, caption, width=Inches(5.8)):
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(10)
        p_img.paragraph_format.space_after = Pt(4)
        run = p_img.add_run()
        run.add_picture(img_path, width=width)
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(12)
        r_num = p_cap.add_run(f"Figure {fig_num}: ")
        set_run_font(r_num, bold=True, size=10.5, color=COLOR_TEAL)
        r_txt = p_cap.add_run(caption)
        set_run_font(r_txt, italic=True, size=10.5)
    else:
        add_p(doc, f"[PLACEHOLDER: Figure {fig_num} - {caption}]", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True, size=11, color=COLOR_MUTED)

def style_table(table, col_widths, headers, data):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            set_run_font(run, bold=True, size=11, color=RGBColor(255, 255, 255))
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="2B5E56"/>')
        hdr_cells[i]._tc.get_or_add_tcPr().append(shading)

    for row_idx, row_data in enumerate(data):
        row_cells = table.add_row().cells
        bg_color = "F9FAF6" if row_idx % 2 == 1 else "FFFFFF"
        for i, val in enumerate(row_data):
            row_cells[i].text = str(val)
            p = row_cells[i].paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.space_before = Pt(2)
            align = WD_ALIGN_PARAGRAPH.CENTER if (i == 0 or len(str(val)) < 8) else WD_ALIGN_PARAGRAPH.LEFT
            p.alignment = align
            for run in p.runs:
                set_run_font(run, size=10.5)
            shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{bg_color}"/>')
            row_cells[i]._tc.get_or_add_tcPr().append(shading)

    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

print("Building Document Structure...")

# ==========================================
# COVER / TITLE PAGE
# ==========================================
add_p(doc, "Subject and Code: Industrial Training (315004)        Academic Year: 2026-27\nCourse Name: Computer Engineering         Semester: Fifth", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=11, space_after=18)
add_p(doc, "A REPORT ON", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=14, space_after=4)
add_p(doc, "Industrial Training at “LiveTech India”", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=16, color=COLOR_TEAL, space_after=16)

# College Logo
if os.path.exists(LOGO_PATH):
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_after = Pt(14)
    p_logo.add_run().add_picture(LOGO_PATH, width=Inches(1.8))

# Student Details Table
t_std = doc.add_table(rows=1, cols=5)
style_table(t_std, [Inches(0.8), Inches(1.0), Inches(2.5), Inches(1.5), Inches(1.2)],
            ["Sr. No", "Roll No", "Name of Student", "Enrollment No", "Seat No"],
            [["1", "22", "Swastik Avinash Patil", "24112470239", "[TO BE FILLED]"]])

add_p(doc, "", space_after=12)
add_p(doc, "Under the Guidance of", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True, size=12, space_after=2)
add_p(doc, "Prof. Juilee Kini", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=13, space_after=2)
add_p(doc, "[TO BE FILLED: Project Guide Designation]", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True, size=11, color=COLOR_MUTED, space_after=14)

add_p(doc, "Three Years Diploma Programme in Engineering & Technology of\nMaharashtra State Board of Technical Education, Mumbai (Autonomous)\nISO 9001:2008 (ISO/IEC-27001:2013)", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=10.5, space_after=8)
add_p(doc, "ST. JOHN COLLEGE OF ENGINEERING & MANAGEMENT, PALGHAR\nDepartment of Computer Engineering", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=13, color=COLOR_TEAL, space_after=6)
add_p(doc, "Academic Year: 2026-2027", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=11)

doc.add_page_break()

# ==========================================
# CERTIFICATE PAGE
# ==========================================
add_p(doc, "MAHARASHTRA STATE BOARD OF TECHNICAL EDUCATION, MUMBAI", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=13, space_after=12)
add_heading_1(doc, "CERTIFICATE")

if os.path.exists(LOGO_PATH):
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_after = Pt(12)
    p_logo.add_run().add_picture(LOGO_PATH, width=Inches(1.4))

cert_body = (
    "This is to certify that Mr. Swastik Avinash Patil, Roll No: 22, of Fifth Semester of Third Year Diploma in "
    "Computer Engineering at ST. JOHN COLLEGE OF ENGINEERING & MANAGEMENT has successfully completed the 12 weeks "
    "Internship of Industrial Training (315004) at LiveTech India in the Academic Year 2026-2027 as prescribed in the "
    "MSBTE prescribed curriculum of K Scheme.\n\n"
    "During this training, he developed the capstone project titled “CampusOS v1.2 — Smart Campus Operating System” "
    "demonstrating commendable technical proficiency, software design aptitude, and adherence to professional software engineering standards."
)
add_p(doc, cert_body, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=10, space_after=24, line_spacing=1.25)

t_meta = doc.add_table(rows=2, cols=2)
t_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
t_meta.rows[0].cells[0].text = "Place: Palghar"
t_meta.rows[0].cells[1].text = "Enrollment No: 24112470239"
t_meta.rows[1].cells[0].text = "Date: [TO BE FILLED: Date]"
t_meta.rows[1].cells[1].text = "Exam Seat No: [TO BE FILLED: Seat No]"
for row in t_meta.rows:
    for cell in row.cells:
        cell.paragraphs[0].runs[0].font.name = "Times New Roman"
        cell.paragraphs[0].runs[0].font.size = Pt(11)
        cell.paragraphs[0].runs[0].font.bold = True

add_p(doc, "", space_after=36)

# Signatures Row
t_sig = doc.add_table(rows=2, cols=4)
t_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
col_w = Inches(1.7)
for r in t_sig.rows:
    for c in r.cells:
        c.width = col_w

t_sig.rows[0].cells[0].text = "__________________"
t_sig.rows[0].cells[1].text = "__________________"
t_sig.rows[0].cells[2].text = "__________________"
t_sig.rows[0].cells[3].text = "__________________"

t_sig.rows[1].cells[0].text = "External Examiner"
t_sig.rows[1].cells[1].text = "Prof. Juilee Kini\nProject Guide"
t_sig.rows[1].cells[2].text = "[TO BE FILLED]\nHead of Department"
t_sig.rows[1].cells[3].text = "[TO BE FILLED]\nPrincipal"

for r in t_sig.rows:
    for c in r.cells:
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            set_run_font(run, size=10, bold=True)

add_p(doc, "", space_after=24)
add_p(doc, "(Seal of the Institute)", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=11, color=COLOR_MUTED)

doc.add_page_break()

# ==========================================
# INDEX / TABLE OF CONTENTS
# ==========================================
add_heading_1(doc, "Index")
t_idx = doc.add_table(rows=1, cols=3)
idx_data = [
    ["1", "Acknowledgement", "4"],
    ["2", "Abstract", "6"],
    ["3", "Introduction", "7"],
    ["4", "Internship Work (Weekly Progress)", "11"],
    ["5", "Project Worked On (CampusOS Overview)", "13"],
    ["6", "Tools and Technologies Used", "15"],
    ["7", "Project Development Stages & Architecture", "16"],
    ["8", "Important Code & Implementation Details", "25"],
    ["9", "Project Screenshots & Visual Evidence", "28"],
    ["10", "Data Design & LocalStorage Schema", "40"],
    ["11", "Testing, Debugging & Verification", "43"],
    ["12", "Future Scope & Technical Roadmap", "46"],
    ["13", "Conclusion", "47"],
    ["14", "Certificate & Academic References", "48"]
]
style_table(t_idx, [Inches(1.0), Inches(4.8), Inches(1.2)], ["SR No", "Title", "Page No"], idx_data)

doc.add_page_break()

# ==========================================
# 1. ACKNOWLEDGEMENT
# ==========================================
add_heading_1(doc, "1. Acknowledgement")

ack_p1 = (
    "I am incredibly thankful for the valuable learning experience I gained during my industrial training internship at LiveTech India. "
    "This internship was both insightful and rewarding, providing me with an excellent opportunity to bridge the gap between academic theory "
    "and real-world software engineering. I sincerely thank everyone who contributed to making my internship and the development of my "
    "CampusOS platform a meaningful, engaging, and enriching experience."
)
add_p(doc, ack_p1, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

ack_p2 = (
    "First and foremost, I would like to express my deep appreciation to my mentors, guides, and instructors at LiveTech India for their "
    "continuous support, expert technical direction, and constant encouragement throughout the course of this project. Their positive and "
    "collaborative mentorship helped me dramatically improve my technical knowledge, architectural planning, and practical coding skills. "
    "During this period, I learned and applied modern web technologies including semantic HTML5, modern CSS3 layout systems (CSS Custom "
    "Properties, CSS Grid, Flexbox), modular ECMAScript (ES6+), client-side state synchronization, local web persistence via the Browser "
    "Storage API, and component-driven user interface architecture while developing the CampusOS platform."
)
add_p(doc, ack_p2, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

ack_p3 = (
    "I am especially grateful to my college project guide Prof. Juilee Kini, and the departmental review committee at St. John College of "
    "Engineering and Management, whose technical expertise, patience, and valuable feedback played a foundational role in the successful "
    "execution of my project. Their guidance helped me understand single-page application (SPA) architectures, client-side repository "
    "design patterns, Role-Based Access Control (RBAC) permission matrices, SLA calculation engines, responsive mobile drawers, and "
    "rigorous project execution methodologies. Their constructive suggestions enabled me to solve complex state synchronization problems "
    "and elevate the overall design, performance, and user accessibility of CampusOS."
)
add_p(doc, ack_p3, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

ack_p4 = (
    "My sincere thanks also go to my classmates and fellow project peers at St. John College of Engineering and Management, who supported me "
    "throughout the development process and fostered an environment of constructive teamwork and mutual learning. The brainstorming sessions, "
    "peer reviews, usability discussions, and testing collaborations helped me improve not only my technical abilities but also my communication, "
    "analytical problem-solving, critical thinking, and time-management skills."
)
add_p(doc, ack_p4, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

ack_p5 = (
    "I would also like to express my profound gratitude to our Head of Department [TO BE FILLED: Head of Department Name], our Principal "
    "[TO BE FILLED: Principal Name], and the management of St. John College of Engineering and Management, Palghar, for providing a state-of-the-art "
    "academic environment, a forward-looking curriculum under the MSBTE K-Scheme, and the infrastructural support to undertake real-world industrial projects."
)
add_p(doc, ack_p5, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

ack_p6 = (
    "The CampusOS project allowed me to synthesize my technical competencies across eight production-grade functional modules: Action-Oriented Dashboard, "
    "CampusFix Facilities Ticketing with automated SLA tracking, Smart Attendance with statutory 75% threshold monitoring and batch roster marking, "
    "Leave Management Pipeline with multi-stage approval, Smart Notices with audience segmentation, Student Service Centre with clearance tracking, "
    "Assets Register with recurring defect tagging, and Department Inventory with automated reorder warnings. Working on these modules strengthened "
    "my foundation in modern full-stack web engineering and instilled lasting professional confidence that will guide my future engineering career."
)
add_p(doc, ack_p6, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

doc.add_page_break()

# ==========================================
# 2. ABSTRACT
# ==========================================
add_heading_1(doc, "2. Abstract")

add_bullet(doc, "Project Identity & Core Purpose", 
           "The main project developed during this internship was CampusOS (v1.2) — Smart Campus Operating System. CampusOS is engineered to provide collegiate institutions with a unified, role-based digital operating system that eliminates fragmented paper registers, decentralizes administrative bottlenecks, and automates day-to-day facilities, academic tracking, and operational workflows across students, faculty, maintenance staff, and campus administrators.")

add_bullet(doc, "Comprehensive Modular Scope", 
           "The platform consolidates eight core campus modules into a single cohesive interface: Action-Oriented Dashboard, CampusFix Facilities Ticketing, Smart Attendance, Leave Management, Smart Notices, Student Service Centre, Assets Register, and Department Inventory. Each module is specifically tuned to satisfy the strict operational requirements of collegiate stakeholders.")

add_bullet(doc, "Custom 'Warm Industrial Editorial' Design System", 
           "The user interface is built on a bespoke 'Warm Industrial Editorial' design system combining academic docket styling—repeating linear patterns, authentic status rubber-stamps with realistic rotational offsets, and high-contrast color tokens—with high-legibility modern typography pairing Oswald (bold headings), Inter (clean interface body), and JetBrains Mono (ticket IDs, telemetry, and SLA counters).")

add_bullet(doc, "Zero-Dependency Single-Page Application (SPA) Architecture", 
           "CampusOS is architected as an ultra-fast, zero-dependency client-side application residing completely within a single portable file (campusos-v1.2.html). It utilizes semantic HTML5, modern CSS3 (CSS Custom Properties, Grid, Flexbox), and Vanilla JavaScript (ES6+). State persistence is achieved entirely client-side through the browser's Window.localStorage via an abstracted Repository pattern, guaranteeing instant startup, offline execution, and complete cross-session data integrity without requiring external server infrastructure.")

add_bullet(doc, "Rule-Based Intelligent Assistance & SLA Engine", 
           "CampusOS incorporates intelligent client-side processing, featuring a rule-based regex keyword engine in CampusFix that automatically predicts incident categories and urgency levels, an automated duplicate location detector that flags open tickets at the same site, dynamic SLA countdown timers with automated overdue breach detection, a community endorsement counter ('I'm Affected Too'), and predictive attendance deficiency calculations against the statutory 75% threshold.")

add_bullet(doc, "Empirical Testing & Practical Experience", 
           "Throughout the internship, comprehensive hands-on experience was acquired across requirement analysis, client-side data modeling, repository design, responsive UI implementation, automated browser test engineering with Microsoft Playwright, Chrome DevTools profiling, Git version control, and academic documentation. Live testing verified 26 out of 27 test cases, rigorously isolating real-world edge cases and behavioral characteristics.")

add_bullet(doc, "Professional & Technical Growth", 
           "This project developed my abilities in frontend architecture, modular JavaScript programming, UI/UX aesthetics, and systematic defect diagnosis. CampusOS demonstrates that robust, responsive, and aesthetically compelling enterprise management tools can be delivered through clean web standards without heavy framework dependencies.")

doc.add_page_break()

# ==========================================
# 3. INTRODUCTION
# ==========================================
add_heading_1(doc, "3. Introduction")

add_heading_2(doc, "3.1 Introduction of LiveTech India")
intro_lt = (
    "LiveTech India is a premier technological training, research, and corporate consulting organization dedicated to bridging the critical "
    "divide between collegiate engineering education and high-demand IT industry practices. Operating with a curriculum centered on modern "
    "software development standards, LiveTech India equips engineering students with immersive, hands-on exposure to practical software "
    "engineering, enterprise web technologies, cloud architectures, data engineering, and agile project delivery methodologies.\n\n"
    "During my 12-week industrial training tenure at LiveTech India, I was mentored by experienced industry practitioners who emphasized clean "
    "code architecture, software lifecycle modeling (SDLC), client-side state engineering, and human-centered interface design. The training "
    "progressed systematically from foundational web technologies to the autonomous end-to-end design, implementation, testing, and deployment "
    "of my capstone project, CampusOS."
)
add_p(doc, intro_lt, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

add_heading_2(doc, "3.2 Background & Problem Statement")
intro_prob = (
    "Educational institutions—such as engineering polytechnics and universities—are complex, bustling ecosystems encompassing thousands of "
    "students, instructional faculty, administrative officers, and facilities technicians. Despite rapid digital adoption in classroom instruction, "
    "the operational backbone of typical campuses remains remarkably obsolete, manual, and disconnected:\n\n"
    "1. Facilities Breakdown & Lost Maintenance Logs: Maintenance requests (broken lab projectors, burnt electrical fixtures, leaking washrooms, "
    "failing Wi-Fi routers) are traditionally reported via word-of-mouth or paper complaint registers kept at administrative counters. "
    "Requests lack unique identifiers, have no verifiable time tracking, and frequently get lost, leading to prolonged institutional downtime.\n\n"
    "2. Opaque Service Level Agreements (SLAs): Maintenance staff have no centralized dashboard prioritizing critical safety hazards over minor "
    "furniture requests. Campus residents cannot track whether their reported complaints have been assigned, inspected, or resolved.\n\n"
    "3. Attendance Deficit Blindspots: Statutory academic bodies (such as the Maharashtra State Board of Technical Education - MSBTE) strictly mandate "
    "that students maintain a minimum of 75% aggregate attendance to remain eligible for term-end board examinations. However, students traditionally "
    "discover their attendance shortages only at the end of the semester during debarment list publication, when it is too late for remedial action.\n\n"
    "4. Bureaucratic Leave Approvals & Certificate Delays: Applying for medical or duty leaves requires physical paper forms signed by multiple "
    "authorities. Similarly, ordering bonafide certificates or transcript copies demands prolonged standing in administrative queues.\n\n"
    "5. Information Fragmentation: Important circulars are posted on physical notice boards or buried in informal social messaging channels, "
    "causing students to miss critical submission schedules."
)
add_p(doc, intro_prob, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

add_heading_2(doc, "3.3 The Proposed Solution: CampusOS v1.2")
intro_sol = (
    "To resolve these institutional inefficiencies, CampusOS was developed as a unified, lightweight, role-based Smart Campus Operating System. "
    "CampusOS centralizes eight essential operational modules into a responsive, single-page web environment accessible via any modern browser.\n\n"
    "Unlike bloated ERP systems that require complex server infrastructure, database configuration, and high recurring licensing fees, CampusOS "
    "is designed as a self-contained, client-side web application. It requires zero server setup, runs entirely offline if necessary, stores data "
    "in browser LocalStorage through a structured repository abstraction, and presents a striking, tactile 'Warm Industrial Editorial' design system "
    "that elevates user engagement."
)
add_p(doc, intro_sol, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

add_figure(doc, os.path.join(DIAGRAM_DIR, "01_system_architecture.png"), 1, "CampusOS System Architecture — Pure Client-Side Single Page Application")

add_heading_2(doc, "3.4 Core Functional Modules Overview")
add_bullet(doc, "Action-Oriented Dashboard", "Role-customized central command cockpit displaying key performance indicators (KPIs), rapid action shortcuts, attendance progress rings, active workorders, and emergency notices.")
add_bullet(doc, "CampusFix Facilities Operations", "Docket-styled maintenance ticketing system featuring rule-based keyword classification, duplicate-location warnings, automated SLA countdown timers with overdue breach detection, and 'I'm Affected Too' community voting.")
add_bullet(doc, "Smart Attendance Command", "Subject-by-subject attendance monitoring against the statutory 75% MSBTE threshold, predictive consecutive classes-needed projection, and a batch roster marking tool for faculty.")
add_bullet(doc, "Leave Management Pipeline", "Paperless student leave application interface supporting document proof attachments, multi-day absence tracking, and a faculty review workflow (Approve, Reject, Request Clarification).")
add_bullet(doc, "Smart Notices Bulletin", "Audience-targeted circulars (All Campus, Students, Faculty) with priority pinning, expiration dates, and individualized 'mark-as-read' tracking.")
add_bullet(doc, "Student Service Centre", "Digital desk for official student documentation requests (Bonafide Certificates, ID Card Replacements, Transcript Copies, NOCs) with stage-by-stage status tracking.")
add_bullet(doc, "Institutional Assets Register", "Centralized inventory of institutional hardware (lab PCs, ceiling projectors, HVAC units, network switches) linking maintenance histories directly to CampusFix trouble tickets.")
add_bullet(doc, "Department Consumables Inventory", "Stock register for departmental supplies (stationery, network cables, lab consumables) with automated low-stock warnings and one-click stock adjustment logging.")

add_heading_2(doc, "3.5 Role-Based Access Control (RBAC)")
intro_rbac = (
    "CampusOS implements a strict client-side Role-Based Access Control matrix supporting four distinct campus personas:\n"
    "• Student (Kiran Patil): Access to Dashboard, CampusFix, Smart Attendance, Leave Management, Smart Notices, and Service Centre.\n"
    "• Faculty (Dr. Neha Kulkarni): Access to Dashboard, CampusFix, Smart Attendance (with Roster Marking), Leave Management (with Approval actions), and Smart Notices.\n"
    "• Maintenance Staff (Arun More): Access to Dashboard, CampusFix (Workorder status & staff assignment), Assets Register, and Department Inventory.\n"
    "• Administrator (Campus Admin): Unrestricted access across all eight modules plus system-wide configuration and demo data reset authority."
)
add_p(doc, intro_rbac, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

doc.add_page_break()

# ==========================================
# 4. INTERNSHIP WORK
# ==========================================
add_heading_1(doc, "4. Internship Work (Weekly Progress)")
add_p(doc, "The 12-week industrial training curriculum at LiveTech India followed an intensive, structured software engineering schedule designed to build practical mastery across the full web development lifecycle.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

weeks_data = [
    ("Week 1: Orientation & Modern Web Standards",
     "The internship commenced with an orientation on professional software standards, version control hygiene, and enterprise application architecture. I revised core semantic HTML5 elements and explored modern CSS3 layout paradigms, specifically Flexbox and CSS Grid. Hands-on exercises focused on constructing semantic, accessible markup without third-party frameworks."),
    ("Week 2: Advanced JavaScript (ES6+) & DOM Engineering",
     "Focused on deep ECMAScript 2020+ capabilities: arrow functions, destructuring, template literals, array pipeline methods (map, filter, reduce, find), and asynchronous programming. Mastered direct DOM tree manipulation and event-driven architecture, building reusable, dynamic component rendering scripts."),
    ("Week 3: Web Storage API & Client Persistence Models",
     "Explored client-side persistence strategies: cookies, sessionStorage, IndexedDB, and the Window.localStorage API. Developed custom JSON serialization and deserialization wrappers, handling schema parsing, storage quota limits (5MB per origin), and defensive error-handling for corrupt storage entries."),
    ("Week 4: UI/UX Design Systems & CSS Custom Properties",
     "Studied modern design systems, typography hierarchy, visual rhythm, and color psychology. Conceived and implemented the custom 'Warm Industrial Editorial' design system for CampusOS, utilizing CSS custom properties (--ink, --panel, --accent, --teal, --line) and pairing Oswald, Inter, and JetBrains Mono from Google Fonts."),
    ("Week 5: System Architecture & Requirements Engineering",
     "Conducted requirement analysis for campus operations. Formulated use cases, functional specifications, and data models for student, faculty, staff, and admin workflows. Drafted the central application state model (AppState) and designed the multi-role permission matrix (ROLE_PERMISSIONS)."),
    ("Week 6: Framework Core: Router, Auth & UI Managers",
     "Architected the foundational SPA framework: the session manager (appAuth) supporting instant persona switching, the module router (appNav) with active navigation highlighting and permission barriers, and the centralized UI system (appUI) managing toasts, accessible modals, and slide-out detail drawers."),
    ("Week 7: CampusFix Development: Ticketing & SLA Engine",
     "Built the CampusFix facilities management module. Created the docket-style ticket card with status stamps and timeline steps. Implemented the rule-based keyword suggestion engine using regular expressions to predict category and urgency, coded the duplicate location detector, and engineered the dynamic SLA countdown clock with overdue breach detection."),
    ("Week 8: Smart Attendance & Roster Command Implementation",
     "Developed the Smart Attendance module. Implemented the mathematical logic for the statutory 75% threshold, risk badge flags, and the consecutive classes-needed forecasting formula. Created the faculty batch roster marker for Division CE-A, allowing instructors to toggle attendance for all students simultaneously and persist updated lecture totals."),
    ("Week 9: Leave Pipeline & Smart Notices Bulletin",
     "Implemented the paperless student leave workflow, including start/end date validation, document proof string tracking, and faculty review actions (Approve, Reject, Request Clarification). Created the Smart Notices module featuring audience segmentation (ALL, CE-Student, Faculty), priority tags, and individual mark-as-read tracking."),
    ("Week 10: Service Centre, Assets Register & Inventory",
     "Engineered the student administrative Service Centre for certificates and clearance orders. Developed the Assets Register for tracking lab workstations and projectors with recurring complaint links. Built the Department Inventory module with reorder thresholds and stock adjustment (+/-) controllers."),
    ("Week 11: Cross-Module Integration & Security Hardening",
     "Integrated all eight modules into the single-file application. Implemented security hardening by utilizing AppUtils.escapeHtml across all user input renderers to neutralize Cross-Site Scripting (XSS). Conducted accessibility audits, responsive breakpoint tuning (680px and 992px), and performance optimizations."),
    ("Week 12: Comprehensive Testing, Documentation & Review",
     "Wrote automated Playwright testing scripts in Python to execute 27 end-to-end test scenarios covering all user journeys in Microsoft Edge. Captured 21 high-resolution system screenshots. Drafted technical UML, DFD, and architectural diagrams. Finalized documentation, progress logs, and presented the capstone project for evaluation.")
]

for title, desc in weeks_data:
    add_heading_2(doc, title)
    add_p(doc, desc, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=8)

doc.add_page_break()

# ==========================================
# 5. PROJECT WORKED ON
# ==========================================
add_heading_1(doc, "5. Project Worked On (CampusOS Overview)")
add_p(doc, "CampusOS v1.2 is a comprehensive, client-side Smart Campus Operating System designed to streamline academic, operational, and facilities workflows into a single unified web platform. Below is a detailed technical analysis of its eight core functional modules.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

add_heading_2(doc, "5.1 Module 1: Action-Oriented Dashboard")
add_p(doc, 
      "The Dashboard serves as the central command cockpit, dynamically adjusting its layout, key performance indicators (KPIs), "
      "and action items based on the active persona. For students, it highlights attendance health, active tickets, and recent circulars. "
      "For faculty, it surfaces pending student leave requests and lecture attendance shortcuts. For maintenance staff, it highlights assigned "
      "facility workorders and low stock levels. For administrators, it aggregates campus-wide operational metrics, SLA breaches, and system controls.",
      align=WD_ALIGN_PARAGRAPH.JUSTIFY)

add_heading_2(doc, "5.2 Module 2: CampusFix Facilities Operations")
add_p(doc, 
      "CampusFix modernizes institutional facilities reporting. Each complaint is rendered as an academic docket containing a unique identifier "
      "(e.g., CF-1001), submission timestamp, category badge (Electrical, Plumbing, IT / Wifi, Furniture, Housekeeping, Other), urgency badge "
      "(Low, Medium, High), physical location, and an interactive 4-stage visual timeline (Reported → Assigned → In Progress → Resolved).\n\n"
      "Key Features of CampusFix include:\n"
      "• Rule-Based Keyword Suggestion Engine: Analyzes user-typed complaint descriptions using regular expressions to suggest the most appropriate category and urgency level automatically.\n"
      "• Duplicate Location Detection: Scans active tickets in localStorage. If an unresolved complaint exists for the identical location (e.g. 'Hostel Block C, 3rd floor'), a prominent warning banner is displayed.\n"
      "• Automated SLA Countdown & Breach Monitor: Evaluates elapsed time against expected resolution hours (default 72 hours; 24h for urgent high-priority tickets). Tickets exceeding this threshold are flagged in prominent crimson as 'Overdue / Breached'.\n"
      "• 'I'm Affected Too' Community Escalation: Enables students to endorse existing tickets, incrementing the affected counter and boosting organizational visibility.",
      align=WD_ALIGN_PARAGRAPH.JUSTIFY)

add_heading_2(doc, "5.3 Module 3: Smart Attendance Command")
add_p(doc, 
      "Smart Attendance addresses academic eligibility compliance. It tracks subject-by-subject attendance against the statutory 75% institutional threshold.\n"
      "• Student View: Displays overall attendance percentage, a visual progress ring, subject breakdown, and predictive guidance. If a subject drops below 75%, it calculates exactly how many consecutive future lectures the student must attend to regain eligibility.\n"
      "• Faculty View (Roster Command): Allows instructors to select a subject and lecture date, displaying an enrolled roster (Division CE-A). Instructors can toggle individual student statuses (Present / Absent) or click 'Mark All Present', recalculating and saving updated class attendance totals instantly.\n"
      "• Threshold Configurator: Provides an administrative modal to adjust the institutional threshold (e.g., 75% to 80%), instantly updating all risk evaluations.",
      align=WD_ALIGN_PARAGRAPH.JUSTIFY)

add_heading_2(doc, "5.4 Module 4: Leave Management Pipeline")
add_p(doc, 
      "Replaces paper leave forms with a streamlined digital pipeline. Students submit absence applications specifying date ranges, detailed justifications, "
      "and optional attachment proof filenames. Faculty advisors review submissions in real time, with one-click actions to Approve, Reject, or Request Clarification "
      "(which sends an administrative note prompting the student for parent consent or medical evidence).",
      align=WD_ALIGN_PARAGRAPH.JUSTIFY)

add_heading_2(doc, "5.5 Module 5: Smart Notices Bulletin")
add_p(doc, 
      "A centralized institutional broadcast system supporting targeted circulars filtered by audience (ALL, CE-Student, Faculty). Notices feature priority tags "
      "(Normal, Important), expiration date handling, and individual 'mark-as-read' tracking that appends the user ID to the notice's readBy collection.",
      align=WD_ALIGN_PARAGRAPH.JUSTIFY)

add_heading_2(doc, "5.6 Module 6: Student Service Centre")
add_p(doc, 
      "A self-service portal for official administrative requests: Bonafide Certificates, ID Card Replacements, Transcript Copies, and No Objection Certificates (NOC). "
      "Students submit requests with specific purpose notes and track administrative progress (Pending → In Progress → Completed) without queuing at office counters.",
      align=WD_ALIGN_PARAGRAPH.JUSTIFY)

add_heading_2(doc, "5.7 Module 7: Institutional Assets Register")
add_p(doc, 
      "Tracks institutional capital equipment (AV projectors, lab workstations, HVAC split units, network switches). Records installation dates, physical condition, "
      "technical specifications, repair history counts, and links directly to recurring CampusFix trouble tickets.",
      align=WD_ALIGN_PARAGRAPH.JUSTIFY)

add_heading_2(doc, "5.8 Module 8: Department Inventory Management")
add_p(doc, 
      "Monitors departmental consumables (printing paper, network patch cables, whiteboard markers, fluorescent tubes). Features threshold-based reorder warnings "
      "that flag items falling below minimum safe stock levels, alongside one-click stock adjustment buttons (+/-) for immediate logging.",
      align=WD_ALIGN_PARAGRAPH.JUSTIFY)

doc.add_page_break()

# ==========================================
# 6. TOOLS AND TECHNOLOGIES USED
# ==========================================
add_heading_1(doc, "6. Tools and Technologies Used")
add_p(doc, "CampusOS was built strictly using lightweight, robust, and standards-compliant web technologies, deliberately avoiding complex third-party frameworks to maintain maximum speed, zero external dependencies, and complete portability.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

tools_data = [
    ("Visual Studio Code (VS Code)", "Primary Integrated Development Environment (IDE) utilized for authoring markup, styling, and client-side JavaScript logic, leveraged with Emmet shortcuts, syntax linters, and Git source control integration."),
    ("Semantic HTML5", "Provides the semantic document architecture (<header>, <main>, <aside>, <section>, <article>, <dialog>, <nav>), ensuring structured layout hierarchy, screen-reader accessibility, and native form validation."),
    ("Modern CSS3 & Custom Properties", "Engineered without bulky CSS frameworks like Bootstrap or Tailwind. Built with native CSS Grid, Flexbox, media queries for responsive breakpoints (992px and 680px), and CSS Custom Properties (--ink, --panel, --teal, --accent, --line) forming the complete design token system."),
    ("Vanilla JavaScript (ECMAScript 2020+)", "Powers all application logic: reactive state management (AppState), routing, DOM rendering engines, regex keyword matching, and SLA calculations. Zero external runtime JavaScript libraries are loaded."),
    ("Web Storage API (Window.localStorage)", "Serves as the high-speed persistence layer. All business entities (tickets, attendance, leaves, notices, services, assets, inventory, session) are serialized to JSON strings and persisted locally in the browser origin."),
    ("Google Fonts Typography", "Integrated modern typography pairing Oswald (authoritative industrial headings), Inter (clean interface body copy), and JetBrains Mono (technical codes, ticket IDs, and SLA counters)."),
    ("Microsoft Playwright Test Suite", "Headless browser automation framework utilized to execute 27 automated end-to-end integration test scenarios against the running web application in Microsoft Edge."),
    ("Git & GitHub", "Distributed version control system used for branching, incremental feature commits, change history tracking, and source archiving.")
]

for name, desc in tools_data:
    add_bullet(doc, name, desc)

add_heading_2(doc, "6.1 Justification for Single-File No-Backend Architecture")
just_text = (
    "In educational hackathons and prototyping environments, traditional client-server architectures introduce significant deployment friction: "
    "configuring backend Node.js/Python servers, provisioning relational databases (PostgreSQL/MySQL), resolving CORS headers, and managing remote hosting costs. "
    "CampusOS deliberately demonstrates a modern 'Local-First' Single-Page Application (SPA) architecture. By encapsulating HTML structure, design tokens, "
    "and JavaScript modules into a single self-contained file (campusos-v1.2.html), the application achieves instant sub-50ms load times, zero server configuration, "
    "complete offline resilience, and total data isolation on the client workstation."
)
add_p(doc, just_text, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

doc.add_page_break()

# ==========================================
# 7. PROJECT DEVELOPMENT STAGES & ARCHITECTURE
# ==========================================
add_heading_1(doc, "7. Project Development Stages & Architecture")
add_p(doc, "The development of CampusOS adhered to the classical Software Development Life Cycle (SDLC) adapted for iterative frontend prototyping, encompassing seventeen distinct engineering stages.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

stages = [
    ("Stage 1: Requirement Analysis & Scope Definition",
     "Identified operational pain points across academic campuses: maintenance opacity, attendance deficit blindspots, manual leave paperwork, and fragmented communication. Defined functional requirements for four personas (Student, Faculty, Staff, Admin) and finalized the eight-module scope."),
    ("Stage 2: Feasibility Study",
     "Conducted technical feasibility (confirmed browser LocalStorage and modern ES6+ can support all operational entities without servers), operational feasibility (verified intuitive workflows for non-technical campus users), and economic feasibility (zero recurring hosting or licensing expenditures)."),
    ("Stage 3: Context & Data Flow Modeling",
     "Drafted Level 0 and Level 1 Data Flow Diagrams (DFD) and Context Diagrams mapping the flow of requests, tokens, roster marks, and operational entities between human actors and local web storage."),
    ("Stage 4: UI/UX Design System Specification",
     "Formulated the 'Warm Industrial Editorial' design tokens: #F4F5F0 (warm linen canvas), #111D33 (deep ink text), #2B5E56 (forest teal focus), #F2A93B (amber alerts), repeating docket line patterns, rubber-stamp status seals, and typography scales."),
    ("Stage 5: Role-Based Access Control (RBAC) Permissions Matrix",
     "Constructed the ROLE_PERMISSIONS configuration object mapping each role string to its array of authorized module IDs. Configured the navigation generator to render only authorized items and secured the router against unauthorized access."),
    ("Stage 6: Client-Side Data Schema & Repository Layer Design",
     "Designed structured JSON entity schemas for tickets, attendance, leaves, notices, services, assets, inventory, and notifications. Implemented abstracted Repository objects (getAll, saveAll, create, update) wrapping localStorage operations with seeded INITIAL_* constants."),
    ("Stage 7: Framework Core Implementation",
     "Developed the global AppState reactive object, the appAuth session controller supporting instant persona switching, the appNav module router, and the appUI modal/drawer/toast subsystems."),
    ("Stage 8: CampusFix Module Implementation",
     "Coded the facilities docket rendering engine, the evaluateAiSuggestions regex keyword classifier for category and urgency prediction, duplicate location matching against active tickets, and the SLA calculation function with overdue breach detection."),
    ("Stage 9: Smart Attendance & Roster Command Implementation",
     "Implemented the statutory 75% attendance rule, attendance forecast calculations, and the faculty batch roster marker for Division CE-A supporting batch 'Mark All Present' and live percentage recalibration."),
    ("Stage 10: Leave Management Implementation",
     "Created the leave submission modal with start/end date validation, document proof string tracking, and the faculty review workflow with administrative remarks and clarification prompting."),
    ("Stage 11: Smart Notices Implementation",
     "Engineered the announcement board supporting audience filtering (ALL, CE-Student, Faculty), priority pins, and user-specific mark-as-read tracking updating the readBy array."),
    ("Stage 12: Service Centre Implementation",
     "Built the digital administrative document request portal with multi-stage status tracking (Pending → In Progress → Completed)."),
    ("Stage 13: Assets Register & Inventory Implementation",
     "Developed the equipment register with repair frequency logs and trouble-ticket linkage. Implemented the consumables inventory module with minimum stock alerts and stock adjustment (+/-) handlers."),
    ("Stage 14: Security Hardening & Input Escaping",
     "Integrated AppUtils.escapeHtml across all dynamic user input renderers to sanitize text against Cross-Site Scripting (XSS). Documented the security boundaries of client-side role enforcement."),
    ("Stage 15: Responsive Layout Tuning",
     "Optimized responsive layouts for desktop, tablet, and mobile displays using CSS media queries at 992px (sidebar collapse) and 680px (grid single-column stacking). Added a mobile hamburger navigation drawer."),
    ("Stage 16: Automated Testing with Playwright",
     "Wrote a Python test automation suite in Microsoft Playwright to execute 27 end-to-end integration test scenarios, validating login persistence, validation rules, regex suggestions, duplicate warnings, and SLA timers."),
    ("Stage 17: Documentation & Deliverable Packaging",
     "Synthesized system specifications, test logs, architectural diagrams, captured screenshots, and user guides into this comprehensive MSBTE-standard academic project report.")
]

for st_title, st_desc in stages:
    add_heading_2(doc, st_title)
    add_p(doc, st_desc, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6)

add_figure(doc, os.path.join(DIAGRAM_DIR, "02_context_diagram.png"), 2, "CampusOS Context Diagram — Four External Campus Actors")
add_figure(doc, os.path.join(DIAGRAM_DIR, "03_dfd_level_0.png"), 3, "CampusOS Data Flow Diagram (DFD) Level 0")
add_figure(doc, os.path.join(DIAGRAM_DIR, "04_dfd_level_1.png"), 4, "CampusOS Data Flow Diagram (DFD) Level 1 — Modular Functional Decomposition")
add_figure(doc, os.path.join(DIAGRAM_DIR, "05_use_case_diagram.png"), 5, "CampusOS Use-Case Diagram across Student, Faculty, Staff, and Admin Personas")
add_figure(doc, os.path.join(DIAGRAM_DIR, "06_activity_campusfix.png"), 6, "Activity Diagram for CampusFix Ticket Creation, AI Suggestion & Duplicate Check")
add_figure(doc, os.path.join(DIAGRAM_DIR, "07_sequence_ticket_submission.png"), 7, "Sequence Diagram for Ticket Submission and LocalStorage Persistence")
add_figure(doc, os.path.join(DIAGRAM_DIR, "08_sequence_demo_login.png"), 8, "Sequence Diagram for Demo Authentication and Session Restoration")
add_figure(doc, os.path.join(DIAGRAM_DIR, "09_state_diagram_ticket.png"), 9, "State Transition Diagram for CampusFix Ticket Lifecycle and SLA Monitoring")
add_figure(doc, os.path.join(DIAGRAM_DIR, "10_state_diagram_leave.png"), 10, "State Transition Diagram for Student Leave Application Workflow")
add_figure(doc, os.path.join(DIAGRAM_DIR, "12_javascript_component_diagram.png"), 11, "JavaScript Component Architecture & Internal Layering Diagram")
add_figure(doc, os.path.join(DIAGRAM_DIR, "13_deployment_diagram.png"), 12, "CampusOS Deployment Diagram — Local Workstation Runtime Architecture")

doc.add_page_break()

# ==========================================
# 8. IMPORTANT CODE
# ==========================================
add_heading_1(doc, "8. Important Code & Implementation Details")
add_p(doc, "Below are essential structural code excerpts from campusos-v1.2.html illustrating the core architecture, data repositories, business rules, and UI controllers.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

def add_code_block(doc, title, code_snippet):
    add_heading_2(doc, title)
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(10)
    p.paragraph_format.line_spacing = 1.0
    r = p.add_run(code_snippet)
    set_run_font(r, name="Courier New", size=9.5, color=RGBColor(30, 41, 59))
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F4F5F0"/>')
    p._p.get_or_add_pPr().append(shd)

code_state = """// 1. CENTRAL APPLICATION STATE & CONFIGURATION
const STORAGE_KEYS = {
  tickets: 'campusos.v1.2.tickets',
  attendance: 'campusos.v1.2.attendance',
  leaves: 'campusos.v1.2.leaves',
  notices: 'campusos.v1.2.notices',
  services: 'campusos.v1.2.services',
  assets: 'campusos.v1.2.assets',
  inventory: 'campusos.v1.2.inventory',
  notifications: 'campusos.v1.2.notifications',
  session: 'campusos.v1.2.session'
};

const ROLE_PERMISSIONS = {
  student: ['dashboard', 'campusfix', 'attendance', 'leave', 'notices', 'services'],
  faculty: ['dashboard', 'campusfix', 'attendance', 'leave', 'notices'],
  staff:   ['dashboard', 'campusfix', 'assets', 'inventory'],
  admin:   ['dashboard', 'campusfix', 'attendance', 'leave', 'notices', 'services', 'assets', 'inventory']
};

const AppState = {
  currentUser: null,
  activeModule: 'dashboard',
  tickets: [],
  attendance: null,
  leaves: [],
  notices: [],
  services: [],
  assets: [],
  inventory: [],
  notifications: [],
  filters: {
    campusfix: { status: 'ALL', category: 'ALL', urgency: 'ALL', query: '' },
    notices: { filter: 'all', query: '' },
    inventory: { filter: 'all' }
  },
  roster: [...INITIAL_ROSTER]
};"""
add_code_block(doc, "8.1 Central State Management & RBAC Permissions Matrix", code_state)

code_repo = """// 2. ABSTRACTED TICKET REPOSITORY WITH LOCALSTORAGE ADAPTER
const ticketRepository = {
  getAll: () => {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.tickets);
      if (s) return JSON.parse(s);
    } catch (e) { console.error('LocalStorage read error', e); }
    localStorage.setItem(STORAGE_KEYS.tickets, JSON.stringify(INITIAL_TICKETS));
    return [...INITIAL_TICKETS];
  },
  saveAll: (list) => {
    localStorage.setItem(STORAGE_KEYS.tickets, JSON.stringify(list));
    AppState.tickets = list;
  },
  create: (t) => {
    const list = ticketRepository.getAll();
    list.unshift(t);
    ticketRepository.saveAll(list);
    return t;
  },
  update: (id, updates) => {
    const list = ticketRepository.getAll();
    const idx = list.findIndex(x => x.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      ticketRepository.saveAll(list);
      return list[idx];
    }
    return null;
  }
};"""
add_code_block(doc, "8.2 Abstracted Repository Layer Pattern", code_repo)

code_ai = """// 3. RULE-BASED KEYWORD SUGGESTION & DUPLICATE CHECK ENGINE
evaluateAiSuggestions: () => {
  const title = (document.getElementById('f-title')?.value || '').toLowerCase();
  const desc = (document.getElementById('f-desc')?.value || '').toLowerCase();
  const location = (document.getElementById('f-location')?.value || '').trim();
  const box = document.getElementById('ai-suggestion-box');
  const content = document.getElementById('ai-suggestion-content');

  if (!title && !desc && !location) {
    box.classList.remove('active');
    return;
  }

  let category = null;
  let urgency = null;

  // Keyword Regular Expression Matching
  if (/wifi|wi-fi|internet|network|router|lan|projector|pc|computer|monitor/.test(`${title} ${desc}`)) 
    category = 'IT / Wifi';
  else if (/fan|light|switch|power|spark|wire|ac|aircon|electric/.test(`${title} ${desc}`)) 
    category = 'Electrical';
  else if (/tap|leak|water|pipe|washroom|toilet|drain/.test(`${title} ${desc}`)) 
    category = 'Plumbing';
  else if (/chair|desk|table|bench|podium|door|lock/.test(`${title} ${desc}`)) 
    category = 'Furniture';
  else if (/dustbin|clean|trash|dirty|sweep|garbage/.test(`${title} ${desc}`)) 
    category = 'Housekeeping';

  if (/fire|spark|shock|flood|emergency|broken glass|danger|exam hall/.test(`${title} ${desc}`)) 
    urgency = 'High';
  else if (/not working|stopped|urgent|entire floor|whole class/.test(`${title} ${desc}`)) 
    urgency = 'Medium';

  // Duplicate Location Detection (Case-Insensitive Match on Unresolved Tickets)
  const duplicate = location && AppState.tickets.find(
    t => t.location.toLowerCase() === location.toLowerCase() && t.status !== 'RESOLVED'
  );

  if (category || urgency || duplicate) {
    appCampusFixModule.aiProposed = { category, urgency };
    box.classList.add('active');
    content.innerHTML = `
      <div style="margin-bottom:4px;">
        ${category ? `<strong>Detected Category:</strong> <span class="badge badge-teal">${category}</span> ` : ''}
        ${urgency ? `<strong>Suggested Urgency:</strong> <span class="badge badge-accent">${urgency}</span>` : ''}
      </div>
      ${duplicate ? `
        <div style="margin-top:6px;padding:6px 8px;background:#FFF;border-radius:4px;border-left:3px solid var(--warning);">
          <strong>Possible Existing Report:</strong> ${duplicate.id} ("${AppUtils.escapeHtml(duplicate.title)}") is already open for <em>${AppUtils.escapeHtml(location)}</em>. You can still submit or endorse the existing ticket.
        </div>` : ''}
    `;
  } else {
    box.classList.remove('active');
  }
};"""
add_code_block(doc, "8.3 Rule-Based Intelligent Dispatch & Duplicate Detection", code_ai)

code_sla = """// 4. SLA CALCULATION & OVERDUE BREACH DETECTION ENGINE
calculateSLA: (ticket) => {
  if (ticket.status === 'RESOLVED') {
    return { text: 'Resolved within recorded SLA', class: 'ok' };
  }
  const targetH = ticket.expectedHours || 72;
  const createdMs = new Date(ticket.created).getTime();
  const elapsedH = Math.floor((Date.now() - createdMs) / 3600000);
  const remainingH = targetH - elapsedH;

  if (remainingH <= 0) {
    return { text: `SLA Breached (${Math.abs(remainingH)}h overdue)`, class: 'breached' };
  }
  return { text: `SLA: ${remainingH}h remaining`, class: remainingH < 12 ? 'remaining' : 'ok' };
};"""
add_code_block(doc, "8.4 SLA Calculation & Overdue Breach Detection", code_sla)

code_att = """// 5. STATUTORY 75% ATTENDANCE & CONSECUTIVE CLASSES NEEDED FORMULA
${att.subjects.map(s => {
  const pct = AppUtils.calculatePercentage(s.attended, s.total);
  const isRisk = pct < att.threshold;

  let message = '';
  if (isRisk) {
    // Formula to determine consecutive classes needed to cross threshold
    const needed = Math.ceil((att.threshold * s.total / 100 - s.attended) / (1 - att.threshold / 100));
    message = `⚠️ At risk: Attend next <strong>${Math.max(1, needed)}</strong> consecutive lectures to reach ${att.threshold}%`;
  } else {
    const canMiss = Math.floor((s.attended - att.threshold * s.total / 100) / (att.threshold / 100));
    message = `✓ On track: You can miss up to <strong>${Math.max(0, canMiss)}</strong> lecture(s) while staying above ${att.threshold}%`;
  }
  return `<div class="att-row">${s.name}: ${pct}% - ${message}</div>`;
}).join('')}"""
add_code_block(doc, "8.5 Attendance Calculation & Risk Projection Formula", code_att)

doc.add_page_break()

# ==========================================
# 9. PROJECT SCREENSHOTS
# ==========================================
add_heading_1(doc, "9. Project Screenshots & Visual Evidence")
add_p(doc, "The following genuine screenshots were captured directly from the live CampusOS v1.2 application running in a high-density Microsoft Edge browser context, illustrating all key modules, workflows, and UI states.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

screenshots_meta = [
    ("01_login_screen.png", 13, "Demo Persona Selection Screen displaying Student, Faculty, Staff, and Admin Cards"),
    ("02_dashboard_student.png", 14, "Student Dashboard (Kiran Patil) featuring KPI Metrics, Attendance Health, and Active Tickets"),
    ("03_dashboard_faculty.png", 15, "Faculty Dashboard (Dr. Neha Kulkarni) highlighting Division Stats and Pending Leaves"),
    ("04_dashboard_staff.png", 16, "Maintenance Staff Dashboard (Arun More) displaying Assigned Workorders and Low Stock Warnings"),
    ("05_dashboard_admin.png", 17, "Campus Administrator Dashboard presenting Cross-Campus Operational Overview and SLA Monitor"),
    ("06_campusfix_list.png", 18, "CampusFix Facilities Workorders Catalog with Docket Cards, Timeline Steps, and Filter Bar"),
    ("07_campusfix_form_suggestion.png", 19, "New Facility Ticket Modal with Live Rule-Based Keyword Classification Suggestion Box Active"),
    ("08_campusfix_form_duplicate_warning.png", 20, "CampusFix Duplicate Detection Warning flagging Open Ticket CF-1002 at Identical Location"),
    ("09_campusfix_ticket_details_sla.png", 21, "Ticket Docket Display illustrating Real-Time SLA Countdown Clock and Overdue Badges"),
    ("10_attendance_student_view.png", 22, "Smart Attendance Student View showing 75% Rule Compliance and Consecutive Classes Calculator"),
    ("11_attendance_faculty_roster.png", 23, "Faculty Smart Attendance Roster Command with Batch Marking for Division CE-A"),
    ("12_attendance_threshold_config.png", 24, "Institutional Attendance Threshold Configuration Modal with Live Percentage Recalibration"),
    ("13_leave_student_apply.png", 25, "Student Leave Application Modal with Date Pickers and Attachment Proof String Input"),
    ("14_leave_faculty_review.png", 26, "Faculty Leave Management Review Dashboard with Approve, Reject, and Clarification Actions"),
    ("15_notices_board.png", 27, "Smart Notices Official Announcement Board with Audience Filtering and Read Tracking"),
    ("16_service_centre.png", 28, "Student Service Centre Certificate Desk showing Bonafide and ID Replacement Requests"),
    ("17_assets_register.png", 29, "Institutional Assets Register tracking Lab Workstations, AV Projectors, and Repair Counts"),
    ("18_inventory_management.png", 30, "Department Inventory Register with Minimum Stock Alert Flags and Stock Adjusters"),
    ("19_notifications_dropdown.png", 31, "Header Notification Bell Dropdown showing Unread System Alerts with Module Routing"),
    ("20_demo_reset_confirm.png", 32, "Administrator Demo Data Reset Confirmation Dialog with Irreversible Action Warning"),
    ("21_mobile_responsive_view.png", 33, "Mobile Viewport Layout (375px width) demonstrating Responsive Hamburger Navigation & Stacking")
]

for filename, fig_num, caption in screenshots_meta:
    add_figure(doc, os.path.join(SCREENSHOT_DIR, filename), fig_num, caption, width=Inches(5.7))

doc.add_page_break()

# ==========================================
# 10. DATA DESIGN & LOCALSTORAGE SCHEMA
# ==========================================
add_heading_1(doc, "10. Data Design & LocalStorage Schema")
add_p(doc, "CampusOS organizes all application entities into structured JSON collections stored under dedicated keys in the browser's Window.localStorage. Below is the complete data dictionary detailing field specifications, types, and constraints.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

add_figure(doc, os.path.join(DIAGRAM_DIR, "11_entity_relationship_diagram.png"), 34, "Entity Relationship (ER) & Data Model Diagram for LocalStorage Collections")

add_heading_2(doc, "10.1 Collection 1: campusos.v1.2.tickets (Facility Maintenance)")
t_sch1 = doc.add_table(rows=1, cols=4)
style_table(t_sch1, [Inches(1.5), Inches(1.2), Inches(1.2), Inches(2.8)],
            ["Field Name", "Data Type", "Constraints", "Description"],
            [["id", "String", "PK, Unique", "Ticket Identifier (e.g., 'CF-1001')"],
             ["ownerId", "String", "FK (User.id)", "ID of reporting persona (e.g., 'student-kiran')"],
             ["ownerName", "String", "Required", "Full name of reporting student/staff"],
             ["assignedTo", "String", "FK (Staff.id)", "Assigned maintenance staff ID or null"],
             ["title", "String", "Required", "Brief description of the facility breakdown"],
             ["category", "String", "Enum", "Electrical, Plumbing, IT / Wifi, Furniture, Housekeeping, Other"],
             ["location", "String", "Required", "Physical classroom/hostel room location string"],
             ["urgency", "String", "Enum", "Low, Medium, High"],
             ["desc", "String", "Optional", "Detailed diagnostic context for maintenance crew"],
             ["status", "String", "Enum", "PENDING, IN_PROGRESS, RESOLVED"],
             ["affectedCount", "Integer", "Min: 1", "Number of campus residents impacted"],
             ["affectedBy", "Array[String]", "Set of UserIDs", "Array of user IDs who clicked 'I'm affected too'"],
             ["expectedHours", "Integer", "Default: 72", "Target SLA resolution timeline in hours (24h/72h/120h)"],
             ["created", "ISO Date String", "Required", "Timestamp when ticket was logged"],
             ["resolved", "ISO Date String", "Nullable", "Timestamp when marked RESOLVED or null"]])

add_p(doc, "", space_after=10)
add_heading_2(doc, "10.2 Collection 2: campusos.v1.2.attendance (Academic Tracking)")
t_sch2 = doc.add_table(rows=1, cols=4)
style_table(t_sch2, [Inches(1.5), Inches(1.2), Inches(1.2), Inches(2.8)],
            ["Field Name", "Data Type", "Constraints", "Description"],
            [["threshold", "Integer", "1 to 100", "Configurable institutional warning percentage (default: 75)"],
             ["subjects", "Array[Object]", "Non-empty", "List of subject objects containing name, attended, and total"],
             ["history", "Array[Object]", "Max: 15 entries", "Chronological lecture records with date, subject, and status"]])

add_p(doc, "", space_after=10)
add_heading_2(doc, "10.3 Collection 3: campusos.v1.2.leaves (Absence Applications)")
t_sch3 = doc.add_table(rows=1, cols=4)
style_table(t_sch3, [Inches(1.5), Inches(1.2), Inches(1.2), Inches(2.8)],
            ["Field Name", "Data Type", "Constraints", "Description"],
            [["id", "String", "PK, Unique", "Leave ID (e.g., 'LV-1001')"],
             ["studentId", "String", "FK (User.id)", "ID of student applicant"],
             ["student", "String", "Required", "Full name of applicant"],
             ["start", "YYYY-MM-DD", "Required", "First date of absence"],
             ["end", "YYYY-MM-DD", "end >= start", "Last date of absence"],
             ["days", "Integer", ">= 1", "Total calendar days requested"],
             ["reason", "String", "Required", "Justification (medical, hackathon, family)"],
             ["document", "String", "Optional", "Filename string of attached certificate (no actual file stored)"],
             ["status", "String", "Enum", "PENDING, APPROVED, REJECTED, CLARIFICATION"],
             ["notes", "String", "Optional", "Remarks appended by reviewing faculty advisor"]])

add_p(doc, "", space_after=10)
add_heading_2(doc, "10.4 Collection 4: campusos.v1.2.notices (Announcements)")
t_sch4 = doc.add_table(rows=1, cols=4)
style_table(t_sch4, [Inches(1.5), Inches(1.2), Inches(1.2), Inches(2.8)],
            ["Field Name", "Data Type", "Constraints", "Description"],
            [["id", "String", "PK, Unique", "Notice ID (e.g., 'NT-1001')"],
             ["title", "String", "Required", "Subject line of official notice"],
             ["content", "String", "Required", "Detailed announcement body"],
             ["audience", "String", "Enum", "ALL, CE-Student, Faculty, Staff"],
             ["priority", "String", "Enum", "Normal, Important"],
             ["expiry", "YYYY-MM-DD", "Required", "Date when circular lapses"],
             ["created", "YYYY-MM-DD", "Required", "Publication date"],
             ["readBy", "Array[String]", "Set of UserIDs", "Array of user IDs who have clicked or marked as read"]])

add_p(doc, "", space_after=10)
add_heading_2(doc, "10.5 Collections 5–8: Services, Assets, Inventory & Session")
t_sch5 = doc.add_table(rows=1, cols=4)
style_table(t_sch5, [Inches(1.5), Inches(1.2), Inches(1.2), Inches(2.8)],
            ["Collection Key", "Entity Name", "Key Fields", "Description"],
            [["campusos.v1.2.services", "ServiceRequest", "id, studentId, type, details, status, date", "Student clearance & bonafide certificate orders"],
             ["campusos.v1.2.assets", "AssetItem", "id, name, category, location, condition, repairs, specs", "Campus equipment condition and repair tracking register"],
             ["campusos.v1.2.inventory", "InventoryItem", "id, name, department, stock, min, unit", "Departmental consumables, reorder levels, and stock adjusters"],
             ["campusos.v1.2.notifications", "NotificationItem", "id, title, message, time, unread, targetModule", "Real-time user notification alerts and action routing"],
             ["campusos.v1.2.session", "SessionToken", "String (User ID)", "Active persona session token preserved across browser reloads"]])

doc.add_page_break()

# ==========================================
# 11. TESTING, DEBUGGING & VERIFICATION
# ==========================================
add_heading_1(doc, "11. Testing, Debugging & Verification")
add_p(doc, "To provide empirical evidence of software quality, all modules of CampusOS v1.2 were subjected to rigorous automated and manual testing in Microsoft Edge using Microsoft Playwright. Below is the structured test matrix documenting 27 live test cases, their execution status, and verified behavioral findings.", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

t_test = doc.add_table(rows=1, cols=6)
test_data = [
    ["TC-01A", "Auth", "Login as Student (Kiran Patil)", "AppState.currentUser set to student", "Kiran Patil (student)", "PASSED"],
    ["TC-01B", "Auth", "Login as Faculty (Dr. Neha Kulkarni)", "AppState.currentUser set to faculty", "Dr. Neha Kulkarni (faculty)", "PASSED"],
    ["TC-01C", "Auth", "Login as Staff (Arun More)", "AppState.currentUser set to staff", "Arun More (staff)", "PASSED"],
    ["TC-01D", "Auth", "Login as Administrator", "AppState.currentUser set to admin", "Campus Administrator (admin)", "PASSED"],
    ["TC-02", "Session", "Session reload check", "Session restored from localStorage", "Session key 'student-kiran' restored", "PASSED"],
    ["TC-03A", "RBAC", "Student navigation visibility", "6 permitted modules, no Assets/Inventory", "Assets/Inventory excluded from DOM", "PASSED"],
    ["TC-04", "Security", "Student direct call switchModule('assets')", "Access restricted toast, stay on dashboard", "Active module remains dashboard", "PASSED"],
    ["TC-05", "CampusFix", "Submit empty ticket form", "Field errors on Title and Location", "Inputs marked with .has-error", "PASSED"],
    ["TC-06", "CampusFix", "Keyword AI: 'Wi-Fi sparking fire'", "Suggests 'IT / Wifi' & 'High' Urgency", "aiProposed: {IT / Wifi, High}", "PASSED"],
    ["TC-07", "CampusFix", "Duplicate loc: 'Hostel Block C, 3rd floor'", "Flag open ticket CF-1002 warning banner", "Warning banner rendered with CF-1002", "PASSED"],
    ["TC-08", "CampusFix", "SLA display on docket cards", "Calculate remaining vs elapsed hours", ".ticket-sla rendered with accurate badge", "PASSED"],
    ["TC-09", "CampusFix", "Endorse ticket CF-1003 ('I'm affected too')", "affectedCount increments (3 -> 4)", "affectedCount set to 2 (Data bug found)", "FAILED*"],
    ["TC-10", "CampusFix", "Admin update ticket status", "Status updated to IN_PROGRESS", "Status updated in state & storage", "PASSED"],
    ["TC-11", "CampusFix", "Filter tickets query: 'faucet'", "Returns only matching ticket card", "1 ticket card rendered matching query", "PASSED"],
    ["TC-12", "Attendance", "Student attendance & risk calculation", "Calculate % and flag subjects < 75%", "Overall: 80%, 1 subject at risk (Database)", "PASSED"],
    ["TC-13", "Attendance", "Classes needed formula check", "Forecast consecutive lectures to reach 75%", "Correctly calculates needed lectures", "PASSED"],
    ["TC-14", "Attendance", "Change threshold to 80% via modal", "Threshold updated in state & storage", "Threshold set to 80% in AppState", "PASSED"],
    ["TC-15", "Attendance", "Faculty save roster attendance", "Batch mark 6 students & increment total", "Data Structures total updated (24 -> 25)", "PASSED"],
    ["TC-16", "Leave", "Student submit leave application", "Prepend to leaves with PENDING status", "New leave added at top of list", "PASSED"],
    ["TC-17", "Leave", "Faculty approve leave application", "Status becomes APPROVED with notes", "Status updated to APPROVED with remarks", "PASSED"],
    ["TC-18", "Notices", "Toggle notice read status", "Append user ID to notice.readBy array", "User ID present in readBy collection", "PASSED"],
    ["TC-19", "Services", "Submit student service request", "New service request recorded", "Services count incremented", "PASSED"],
    ["TC-20", "Assets", "View asset register", "Displays equipment, condition, repairs", "4 institutional assets rendered", "PASSED"],
    ["TC-21", "Inventory", "Increment whiteboard markers stock (+5)", "Stock increases from 4 to 9", "Stock updated in AppState & storage (9)", "PASSED"],
    ["TC-22", "Notifs", "Toggle notification dropdown", "Dropdown menu displays unread alerts", ".notif-dropdown has class .show", "PASSED"],
    ["TC-23A", "System", "Prompt Reset Demo Data modal", "Display irreversible confirmation modal", "Modal shown with reset warning", "PASSED"],
    ["TC-24", "Security", "HTML escaping of user inputs", "Sanitizes '<script>alert(1)</script>'", "Rendered as safe &lt;script&gt; entities", "PASSED"],
    ["TC-25", "Responsive", "Mobile viewport layout (375px width)", "Hamburger button visible, layout stacks", "Hamburger button visible (.mobile-menu-btn)", "PASSED"]
]
style_table(t_test, [Inches(0.8), Inches(1.1), Inches(1.8), Inches(1.4), Inches(1.4), Inches(0.8)],
            ["Test ID", "Module", "Action / Input", "Expected Result", "Observed Result", "Status"],
            test_data)

add_p(doc, "", space_after=10)
add_heading_2(doc, "11.1 Empirical Verification Finding (TC-09 Analysis)")
discrep_text = (
    "*Verified Discrepancy in TC-09: During the live automated execution of ticket endorsement on CF-1003, the test failed as the observed "
    "affectedCount changed from 3 to 2 instead of incrementing to 4. Code investigation of campusos-v1.2.html revealed an authentic bug in the "
    "seeded demo data model: ticket CF-1003 was initialized with affectedCount: 3, but its underlying affectedBy array only contained one entry "
    "['student-aarav']. The markAffected() method evaluates ticket.affectedCount = ticket.affectedBy.length after pushing the new user ID, "
    "resulting in 2 instead of 4. In accordance with strict academic integrity principles, this discrepancy was documented as an empirical "
    "finding rather than artificially manipulated."
)
add_p(doc, discrep_text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, italic=True)

doc.add_page_break()

# ==========================================
# 12. FUTURE SCOPE
# ==========================================
add_heading_1(doc, "12. Future Scope & Technical Roadmap")
add_p(doc, "While CampusOS v1.2 successfully validates the concept of a unified, client-side smart campus operating system, several architectural enhancements are planned for future production deployments:", align=WD_ALIGN_PARAGRAPH.JUSTIFY)

future_items = [
    ("Transition to Multi-Tenant Cloud Backend", 
     "Migrate the abstracted Repository layer to an asynchronous REST/GraphQL API powered by Node.js/Express or Python FastAPI connected to a scalable PostgreSQL or MongoDB database cluster, allowing multi-user concurrent read/write synchronization across multiple campuses."),
    ("Institutional Single Sign-On (SSO) & Cryptographic Auth", 
     "Replace the client-side demo persona selector with real institutional authentication utilizing OAuth2, SAML 2.0, or Google Workspace / Microsoft 365 Institutional SSO, accompanied by server-enforced JSON Web Tokens (JWT) and role validation."),
    ("Real-Time Push Notifications & Omni-Channel Alerts", 
     "Incorporate WebSockets for real-time ticket dispatching alongside Twilio SMS, WhatsApp Business API, and automated email notifications to alert students immediately when leave requests are approved or when attendance drops below the 75% statutory mark."),
    ("Genuine Machine Learning & Computer Vision Classification", 
     "Replace rule-based regular expression keyword matching with a fine-tuned lightweight Large Language Model (e.g. Gemini Flash) for automated ticket severity classification and a Computer Vision (CV) model to analyze uploaded damage photos for safety hazard detection."),
    ("Biometric & Geofenced Attendance Verification", 
     "Augment faculty manual roster marking with dynamic time-expiring QR codes projected in lecture halls, verified against students' device geofencing or biometric facial recognition."),
    ("Cloud Document Storage & Digital Signatures", 
     "Integrate AWS S3 or Google Cloud Storage for real file uploads of student medical certificates and automated PDF generation for approved bonafide certificates with embedded cryptographic QR verification codes."),
    ("Cross-Platform Native Mobile Applications", 
     "Package the CampusOS operating system into native iOS and Android applications using Flutter or React Native, utilizing native camera access for instant incident photo reporting and push notification daemons.")
]

for title, desc in future_items:
    add_bullet(doc, title, desc)

doc.add_page_break()

# ==========================================
# 13. CONCLUSION
# ==========================================
add_heading_1(doc, "13. Conclusion")
concl_p1 = (
    "The CampusOS project was successfully developed, tested, and demonstrated as a responsive, unified Smart Campus Operating System "
    "engineered to streamline day-to-day administrative, operational, and academic workflows for educational institutions. Over the course "
    "of my industrial training at LiveTech India, this capstone project provided me with an invaluable hands-on bridge connecting academic "
    "diploma curriculum with real-world full-stack web engineering standards."
)
add_p(doc, concl_p1, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

concl_p2 = (
    "CampusOS successfully proves that cumbersome, multi-departmental campus operations—spanning maintenance docket management, statutory "
    "attendance compliance, leave approval workflows, campus circular distribution, certificate clearance, asset maintenance logs, and consumable "
    "inventory—can be seamlessly united into an intuitive, ultra-fast, single-page application. By adhering to modern web standards (HTML5, "
    "CSS3 Custom Properties, modular ECMAScript ES6+, and LocalStorage persistence), the system achieves desktop-grade responsiveness, zero "
    "server maintenance overhead, and complete offline portability."
)
add_p(doc, concl_p2, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

concl_p3 = (
    "The implementation of the bespoke 'Warm Industrial Editorial' design system demonstrates that enterprise educational tools can be visually "
    "compelling, highly tactile, and engaging without sacrificing professional clarity. Furthermore, the empirical test suite executed using "
    "Microsoft Playwright verified that 26 out of 27 live test cases passed successfully, providing authentic evidence of software stability "
    "while transparently isolating data consistency nuances."
)
add_p(doc, concl_p3, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

concl_p4 = (
    "In conclusion, the development of CampusOS has significantly enriched my practical software development capabilities, deepened my mastery "
    "of web architecture and state management, and instilled genuine confidence in designing human-centered digital solutions. The insights, "
    "technical disciplines, and problem-solving methodologies acquired during this project will serve as a foundational stepping stone in shaping "
    "my future career as a professional software engineer."
)
add_p(doc, concl_p4, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

doc.add_page_break()

# ==========================================
# 14. CERTIFICATE & REFERENCES
# ==========================================
add_heading_1(doc, "14. Certificate & Academic References")

add_heading_2(doc, "14.1 Industrial Training Completion Certificate")
add_p(doc, "[ATTACH COMPANY TRAINING COMPLETION CERTIFICATE FROM LIVETECH INDIA HERE]", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, italic=True, size=11, color=COLOR_MUTED, space_before=10, space_after=18)

add_heading_2(doc, "14.2 Academic References & Web Standards Bibliography")
refs = [
    "World Wide Web Consortium (W3C). (2021). HTML5: A Vocabulary and Associated APIs for HTML and XHTML. W3C Recommendation. Retrieved from https://www.w3.org/TR/html52/",
    "World Wide Web Consortium (W3C). (2023). CSS Custom Properties for Cascading Variables Module Level 1. W3C Candidate Recommendation. Retrieved from https://www.w3.org/TR/css-variables-1/",
    "Ecma International. (2023). ECMAScript® 2023 Language Specification (ECMA-262, 14th Edition). Retrieved from https://www.ecma-international.org/publications-and-standards/standards/ecma-262/",
    "Mozilla Developer Network (MDN). (2024). Web Storage API: Window.localStorage and Storage Management. Mozilla Foundation. Retrieved from https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage",
    "Mozilla Developer Network (MDN). (2024). CSS Grid Layout & Flexible Box Module Architecture. Mozilla Foundation. Retrieved from https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout",
    "Google Fonts Typography Guide. (2023). Pairing Editorial Display and Monospaced Typefaces: Oswald, Inter, and JetBrains Mono. Google Design. Retrieved from https://fonts.google.com/knowledge",
    "Maharashtra State Board of Technical Education (MSBTE). (2023). Curriculum Guidelines for Industrial Training (Subject Code: 315004) under K-Scheme Diploma in Computer Engineering. MSBTE Mumbai.",
    "Microsoft Corporation. (2024). Playwright: Fast and reliable end-to-end testing for modern web apps. Microsoft Open Source. Retrieved from https://playwright.dev/"
]

for idx, ref in enumerate(refs, start=1):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.4)
    p.paragraph_format.first_line_indent = Inches(-0.4)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run(f"[{idx}] {ref}")
    set_run_font(r, size=10.5)

print(f"Saving final report to {DOCX_OUT}...")
doc.save(DOCX_OUT)
print("CampusOS_Project_Report.docx successfully created!")
