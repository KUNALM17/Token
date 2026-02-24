# 🏥 TokenQ — Hospital Token Management System
### MVP Development Proposal & Phased Implementation Plan

---

> **Prepared by:** TokenQ Development Team  
> **Date:** February 2026  
> **Version:** 1.0  
> **Status:** Proposal — Awaiting Approval

---

## 📌 Executive Summary

Long wait times at hospitals frustrate patients, overwhelm staff, and hurt the hospital's reputation. **TokenQ** is a smart, digital token-based queue management system that replaces chaotic manual registers with a seamless mobile-first experience — for patients, doctors, and administrators alike.

We propose building the MVP in **two focused phases**, delivering a working product in **Phase 1 within 4–5 weeks**, and layering on advanced capabilities in **Phase 2 over the following 3–4 weeks**.

---

## 🎯 Problem Statement

| Pain Point | Who It Affects |
|---|---|
| Patients wait 1–3 hours with no visibility on their turn | Patients |
| No way to book or pay in advance — everything happens at the counter | Patients |
| Doctors have no control over their appointment queue | Doctors |
| Hospital admins rely on pen-and-paper or Excel for tracking | Hospital Admins |
| No centralized view for management across multiple hospitals | Super Admins |

**Result:** Patient drop-offs, revenue leakage, poor experience, and zero data to optimize operations.

---

## 💡 Proposed Solution — TokenQ

A **web-based platform** (mobile-responsive) where:

- **Patients** book appointments, pay online, and track their live token status from home
- **Doctors** manage their daily queue digitally — call next, skip, complete — one tap at a time
- **Hospital Admins** onboard doctors, monitor queues in real-time, and export reports
- **Super Admins** manage the entire multi-hospital network from a single dashboard

---

## 🏗️ Phased Implementation Plan

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### 📦 PHASE 1 — Core MVP (Weeks 1–5)
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Goal:** Deliver a fully functional booking + queue management system with payments.

---

#### 🔐 1.1 — Authentication & User Onboarding
| Feature | Details |
|---|---|
| OTP-Based Login | Phone number → OTP → Verified. No passwords. |
| New User Registration | Collect Name, Age, Gender, Weight, City during first login |
| Returning User Login | Phone + OTP only — no re-entering profile details |
| Role-Based Access | 4 roles: Patient, Doctor, Hospital Admin, Super Admin |
| JWT Token Auth | Secure session management with expiring tokens |

**Flow:**
```
Landing Page → Enter Phone → Receive OTP → Verify
   ├── New User → Fill Profile (Name, Age, Gender, Weight, City) → Dashboard
   └── Existing User → Straight to Dashboard
```

---

#### 🗓️ 1.2 — Patient Booking & Payment Flow
| Feature | Details |
|---|---|
| Browse Hospitals | View all active hospitals on the platform |
| Browse Doctors | See doctors by hospital — with specialization & fees |
| Check Availability | Real-time token availability for each doctor per day |
| Book Appointment | Select doctor + date → Get assigned a token number |
| Online Payment | Pay consultation fee via Razorpay (UPI/Cards/NetBanking) |
| Payment-First Booking | Appointment stays `PENDING` until payment is confirmed → then `BOOKED` |
| Booking History | View past & upcoming appointments with live status |

**Flow:**
```
Select Hospital → Select Doctor → Check Slots → Book
   → Appointment Created (Status: PENDING)
   → Pay via Razorpay
   → Payment Verified → Status: BOOKED → Token Assigned ✅
```

**Statuses:**
```
PENDING → BOOKED → CALLED → COMPLETED
                          → SKIPPED (re-enters queue)
                 → CANCELLED
```

---

#### 👨‍⚕️ 1.3 — Doctor Queue Management
| Feature | Details |
|---|---|
| Today's Queue View | See all booked patients for the day, ordered by token |
| Start Appointments | One-click to begin the day's session |
| Call Next Patient | Automatically pulls the next `BOOKED` patient |
| Patient Profile Card | View patient's Name, Phone, Age, Gender, Weight, City |
| Complete Appointment | Mark current patient as done → auto-calls next |
| Skip Patient | Move to next → skipped patient goes back into queue |
| Smart Re-queue | Skipped patients are auto-recalled after all booked patients are seen |
| Session Summary | Live stats: Total, Booked, Serving, Completed, Skipped |

**Flow:**
```
Doctor Logs In → Sees Today's Queue → Clicks "Start Appointments"
   → Patient #1 Called (profile visible)
   → Doctor: [Complete] or [Skip]
   → Next patient auto-called
   → ... until all done → "All Done! 🎉" screen
```

---

#### 🏢 1.4 — Hospital Admin Dashboard
| Feature | Details |
|---|---|
| Doctor Management | Add doctors by phone number (auto-linked to existing users) |
| Set Specialization & Fees | Configure each doctor's specialty, consultation fee, daily token limit |
| Today's Overview | See all appointments across all doctors for the day |
| CSV Export | Download appointment data as CSV for record-keeping |
| Doctor List | View all doctors with their details and status |

---

#### 👑 1.5 — Super Admin Dashboard
| Feature | Details |
|---|---|
| Create Hospitals | Add new hospitals with name, address, city, state, phone |
| Manage Hospitals | View all hospitals, toggle active/inactive status |
| Assign Admins | Link Hospital Admin users to specific hospitals |
| Platform Overview | Bird's eye view of the entire multi-hospital network |

---

#### 🎨 1.6 — Landing Page & UI/UX
| Feature | Details |
|---|---|
| Hero Section | Tagline: "Skip the Wait, Not the Care" with CTA |
| Feature Highlights | 4 key benefits: Digital Tokens, Zero Wait, Secure Payments, Live Tracking |
| How It Works | 3-step visual guide: Book → Pay → Walk In |
| Mobile Responsive | Fully functional on phones, tablets, and desktops |
| Modern UI | Clean, professional healthcare-themed design with Tailwind CSS |

---

### 📦 PHASE 1 — Deliverables Summary

| # | Deliverable | Priority |
|---|---|---|
| 1 | Landing page with hero + feature showcase | 🟢 High |
| 2 | OTP login + new user registration flow | 🟢 High |
| 3 | Patient dashboard — book, pay, track | 🟢 High |
| 4 | Doctor dashboard — queue management with call/skip/complete | 🟢 High |
| 5 | Hospital Admin dashboard — doctor CRUD + today's overview | 🟢 High |
| 6 | Super Admin dashboard — hospital + admin management | 🟡 Medium |
| 7 | Razorpay payment integration | 🟢 High |
| 8 | Responsive UI across all pages | 🟢 High |

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### 🚀 PHASE 2 — Advanced Features (Weeks 6–9)
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Goal:** Enhance the MVP with real-time updates, notifications, analytics, and operational tools.

---

#### 📡 2.1 — Real-Time Live Token Tracking
| Feature | Details |
|---|---|
| WebSocket Integration | Patients see live updates without refreshing the page |
| Live Token Counter | "Now Serving: Token #5 — You are #3 in line" |
| Push Notifications | Browser notification when patient's turn is approaching |
| Estimated Wait Time | Auto-calculated based on average consultation duration |

---

#### 📲 2.2 — SMS/WhatsApp Notifications
| Feature | Details |
|---|---|
| Booking Confirmation | SMS sent on successful booking + payment |
| Turn Approaching Alert | "Your turn is in 2 patients — please proceed to the clinic" |
| Appointment Reminder | Morning-of reminder for upcoming appointments |
| Completion Receipt | Digital receipt with doctor name, token, amount paid |

---

#### 📊 2.3 — Analytics & Reporting Dashboard
| Feature | Details |
|---|---|
| Hospital Admin Analytics | Daily/weekly/monthly appointment trends, revenue summaries |
| Doctor Performance | Average consultation time, patients seen per day |
| Patient Insights | Repeat visit rate, popular time slots, peak hours |
| Super Admin Reports | Cross-hospital comparison, platform-wide KPIs |
| Exportable Reports | PDF/Excel download for management review |

---

#### 🔄 2.4 — Appointment Management Enhancements
| Feature | Details |
|---|---|
| Reschedule Appointment | Patient can change date (subject to availability) |
| Cancel & Refund | Cancel appointment → auto-trigger partial/full refund |
| Recurring Bookings | Book weekly/monthly follow-ups in one flow |
| Doctor Availability Calendar | Doctors set their available days/hours |
| Holiday & Leave Management | Admin marks doctor leave → auto-blocks bookings |

---

#### 🔒 2.5 — Security & Infrastructure
| Feature | Details |
|---|---|
| Rate Limiting | Prevent OTP spam and API abuse |
| Redis Session Cache | Fast session validation + OTP storage |
| Audit Logging | Track all admin actions for compliance |
| Data Encryption | Encrypt sensitive patient data at rest |
| Role Permissions Refinement | Granular permission matrix per role |

---

#### 📱 2.6 — Progressive Web App (PWA)
| Feature | Details |
|---|---|
| Install on Phone | "Add to Home Screen" prompt for app-like experience |
| Offline Support | View upcoming appointments without internet |
| Push Notifications | Native-style notifications on mobile |
| Fast Loading | Service worker caching for instant loads |

---

### 📦 PHASE 2 — Deliverables Summary

| # | Deliverable | Priority |
|---|---|---|
| 1 | WebSocket live token tracking | 🟢 High |
| 2 | SMS/WhatsApp notifications | 🟢 High |
| 3 | Analytics dashboard for all roles | 🟡 Medium |
| 4 | Reschedule, cancel, refund flows | 🟡 Medium |
| 5 | Doctor availability & leave management | 🟡 Medium |
| 6 | Security hardening (rate limiting, Redis, audit logs) | 🟢 High |
| 7 | PWA support | 🟡 Medium |

---

## 🛠️ Proposed Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | Fast, modern, type-safe UI development |
| **Styling** | Tailwind CSS | Rapid, responsive, consistent design system |
| **Backend** | Node.js + Express + TypeScript | Battle-tested, scalable, huge ecosystem |
| **Database** | PostgreSQL (Supabase) | Reliable, relational, managed hosting with auto-backups |
| **ORM** | Prisma | Type-safe database queries, easy migrations |
| **Auth** | JWT + OTP (Fast2SMS) | Passwordless, mobile-first, secure |
| **Payments** | Razorpay | UPI, Cards, NetBanking, Wallets — all-in-one |
| **Real-Time** | Socket.io *(Phase 2)* | Live queue updates without page refresh |
| **Caching** | Redis *(Phase 2)* | Session management, OTP store, rate limiting |
| **Hosting** | Vercel (frontend) + Railway/Render (backend) | Scalable, affordable, CI/CD built-in |

---

## 🗄️ Database Architecture

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User       │       │   Hospital    │       │    Doctor     │
│──────────────│       │──────────────│       │──────────────│
│ id (PK)       │       │ id (PK)       │       │ id (PK)       │
│ phone (unique)│       │ name          │       │ userId (FK)   │
│ name          │◄──────│ address       │◄──────│ hospitalId(FK)│
│ age           │       │ city, state   │       │ specialization│
│ gender        │       │ phone         │       │ consultFee    │
│ weight        │       │ isActive      │       │ dailyTokenLmt │
│ city          │       └──────────────┘       └──────┬───────┘
│ role          │                                       │
│ hospitalId(FK)│                                       │
└──────┬───────┘                                       │
       │               ┌──────────────┐                │
       │               │ Appointment   │                │
       └──────────────►│──────────────│◄───────────────┘
                        │ id (PK)       │
                        │ patientId(FK) │       ┌──────────────┐
                        │ doctorId (FK) │       │   Payment     │
                        │ hospitalId(FK)│       │──────────────│
                        │ date          │──────►│ id (PK)       │
                        │ tokenNumber   │       │ appointmentId │
                        │ status        │       │ amount        │
                        │ paymentStatus │       │ provider      │
                        └──────────────┘       │ status        │
                                                └──────────────┘
```

**6 Core Tables** with proper indexing, constraints, and cascading relationships.

---

## 👥 User Roles & Access Matrix

| Feature | Patient | Doctor | Hospital Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|
| Browse hospitals & doctors | ✅ | — | — | — |
| Book appointments | ✅ | — | — | — |
| Make payments | ✅ | — | — | — |
| View own appointments | ✅ | — | — | — |
| View today's queue | — | ✅ | ✅ | — |
| Call / Skip / Complete patients | — | ✅ | — | — |
| Manage doctors | — | — | ✅ | — |
| Export reports (CSV) | — | — | ✅ | — |
| Create hospitals | — | — | — | ✅ |
| Assign hospital admins | — | — | — | ✅ |
| Toggle hospital status | — | — | — | ✅ |

---

## 📅 Estimated Timeline

```
PHASE 1 — Core MVP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 1  │████████│  Auth + DB Schema + Landing Page
Week 2  │████████│  Patient Booking + Payment Flow
Week 3  │████████│  Doctor Queue Management Dashboard
Week 4  │████████│  Admin + Super Admin Dashboards
Week 5  │████████│  Testing, Bug Fixes, Polish, Deploy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        ✅ MVP LAUNCH — Live & Usable

PHASE 2 — Advanced Features
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 6  │████████│  WebSocket Live Tracking + SMS
Week 7  │████████│  Analytics Dashboard + Reports
Week 8  │████████│  Reschedule/Cancel + Doctor Calendar
Week 9  │████████│  Security Hardening + PWA + Deploy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        🚀 FULL PRODUCT LAUNCH
```

---

## 💰 Value Proposition

| Metric | Before TokenQ | After TokenQ |
|---|---|---|
| Average patient wait time | 1–3 hours | 10–15 minutes |
| No-show rate | ~30% | ~8% (paid in advance) |
| Revenue leakage (cash handling) | High | Near zero (digital payments) |
| Admin workload (manual tracking) | 4+ hours/day | Automated |
| Patient satisfaction | Low | Significantly higher |
| Data & insights | None | Full analytics dashboard |

---

## 🔑 Key Differentiators

1. **Payment-First Model** — Booking is confirmed only after payment, reducing no-shows by 70%+
2. **Doctor-Controlled Queue** — Doctors manage their own flow, not admin. Skip, recall, complete — at their pace
3. **Zero Wait at Clinic** — Patients arrive near their turn, not hours early
4. **Smart Re-queue** — Skipped patients automatically get recalled (not lost forever)
5. **Multi-Hospital Ready** — Super Admin can manage 1 or 100 hospitals from Day 1
6. **No App Download** — Web-based, works on any phone with a browser
7. **Built for India** — Razorpay (UPI + all methods), Fast2SMS, Hindi-ready architecture

---

## 🤝 What We Need From You

| # | Item | Details |
|---|---|---|
| 1 | Razorpay Account | Test + Live API keys (we'll set up the integration) |
| 2 | SMS Provider | Fast2SMS or preferred bulk SMS gateway credentials |
| 3 | Domain Name | For production deployment (e.g., tokenq.in) |
| 4 | Hospital Details | Name, address, list of doctors + specializations for initial setup |
| 5 | Branding Assets | Logo, brand colors, tagline (if any) |
| 6 | Feedback Cycles | Weekly 30-min review calls during development |

---

## 📞 Next Steps

1. **✅ Approve this proposal** — Confirm scope and phases
2. **🔧 Kick off Phase 1** — Development begins immediately
3. **📅 Weekly demos** — See progress every Friday
4. **🚀 Phase 1 launch** — Live MVP in 5 weeks
5. **📈 Phase 2 planning** — Refine advanced features based on real usage data

---

> *"We're not just building a queue system — we're building the operating system for your hospital's front desk."*

---

**Let's build this. 🚀**
