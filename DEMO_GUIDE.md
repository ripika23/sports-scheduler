# 🎬 Sports Scheduler - Comprehensive Video Demo & Evaluation Guide

This document provides complete instructions, test accounts, step-by-step flows, and a grading verification checklist for demonstrating the **Sports Scheduler** web platform.

---

## 🔑 Demo Access Credentials

The platform includes seeded accounts covering both **Administrator** and **Player** user roles.

| Role | Name | Email Address | Password | Permissions & Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | System Administrator | `admin@sportsscheduler.com` | `AdminPassword123!` | Create/edit/delete sports categories, inspect analytics reports, schedule & join matches |
| **Player (Host)** | Alice Walker | `alice@example.com` | `PlayerPassword123!` | Schedule matches, configure team rosters, cancel own matches, join open matches |
| **Player (Participant)** | Bob Johnson | `bob@example.com` | `PlayerPassword123!` | Browse open games, join sessions in 1-click, view registered matches |
| **Player (Participant)** | Charlie Brown | `charlie@example.com` | `PlayerPassword123!` | Standard player participant |

> [!TIP]
> On the **Login Page** (`/auth/login`), convenient quick-fill buttons (`Fill Admin`, `Fill Player (Alice)`, `Fill Player (Bob)`) are provided for instantaneous 1-click credential entry during presentations or evaluations.

---

## 📋 Capstone Video Demo Checklist

Use this structured sequence when recording a live demonstration video or conducting an evaluation walkthrough.

| Step | Feature / View | Primary Actions & Demonstration Notes | Target Screen |
| :---: | :--- | :--- | :--- |
| **1** | **Landing Page** | Showcase athletic branding, value proposition cards, demo account quick links. | `/` |
| **2** | **Admin Authentication** | Log in with `admin@sportsscheduler.com`. Highlight the `ADMIN` role badge and Admin Tools banner. | `/auth/login` &rarr; `/dashboard` |
| **3** | **Sport Creation** | Click **+ Add Sport**. Enter a new sport (e.g., `Pickleball` or `Table Tennis`) with description. Verify it appears in the Sports Catalog. | `/sports/new` &rarr; `/sports` |
| **4** | **Duplicate Sport Prevention** | Attempt to create another sport with the name `pickleball` (case-insensitive). Confirm error alert is displayed. | `/sports/new` |
| **5** | **Sports Management** | Show Edit and Delete options for sports. | `/sports` |
| **6** | **Player Authentication** | Log out, then log in as **Alice Walker** (`alice@example.com`). Observe player view on Dashboard. | `/auth/login` &rarr; `/dashboard` |
| **7** | **Session Creation** | Click **+ Schedule Match**. Demonstrate that the newly created sport appears in the dropdown. Fill venue, date, time, starting rosters for Team A and Team B, and slot count (e.g., 4). Submit form. | `/sessions/new` &rarr; `/sessions/:id` |
| **8** | **Session Details** | Show confirmed Team A and Team B rosters, venue, organizer badge, and remaining slots countdown. | `/sessions/:id` |
| **9** | **Player Participation** | In an incognito or second window, log in as **Bob Johnson** (`bob@example.com`). Navigate to **Available Sessions**. Click **Join Match**. | `/sessions/available` |
| **10** | **Roster & Slot Verification** | Verify remaining slots decrement from 4 to 3, and Bob Johnson's name immediately appears under **Registered Participants**. | `/sessions/:id` |
| **11** | **Separate Views** | Navigate to **My Joined Sessions** (`/sessions/joined`) and **My Created Sessions** (`/sessions/my-sessions`) to demonstrate complete view separation. | `/sessions/joined` & `/sessions/my-sessions` |
| **12** | **Session Cancellation** | As Alice (creator), click **Cancel Match**. Emphasize the mandatory cancellation reason modal. Submit reason: `Inclement weather conditions`. | `/sessions/my-sessions` |
| **13** | **Cancellation Visibility** | View session page as Bob. Verify the prominent `CANCELLED` badge and host reason banner are displayed. | `/sessions/:id` |
| **14** | **Admin Analytics Reports** | Log back in as Admin. Navigate to **Reports**. Showcase summary cards (Total, Active, Cancelled, Player Joins), popularity rankings, and dynamic Date-Range filtering. | `/reports` |
| **15** | **Security & Authorization** | Attempt to visit `/sports/new` or `/reports` while logged in as a Player. Demonstrate HTTP 403 Access Denied. | `/sports/new` |

---

## 🚶 Detailed Step-by-Step Demo Flow

### Phase 1: Platform Overview & Admin Sports Governance
1. **Open the application**:
   - Navigate to `http://localhost:3000` (or the deployed Render URL).
   - Point out the clean athletic styling, feature overview cards, and clear navigation bar.
2. **Sign in as Admin**:
   - Click **Sign In**. Click the **Fill Admin** button to populate credentials.
   - Click **Sign In**.
   - Notice the **Admin Dashboard** displays metrics (Available Sessions, Created Sessions, Joined Sessions, Sports Categories) and the **Administrator Tools** banner.
3. **Add a new sport category**:
   - Click **+ Add Sport** or navigate to `/sports/new`.
   - Enter:
     - **Sport Name**: `Pickleball`
     - **Description**: `Fast-growing paddle sport combining elements of tennis, badminton, and ping-pong.`
   - Click **Create Sport**.
   - You are redirected to `/sports` with a success alert: `Sport "Pickleball" has been successfully added!`.
4. **Demonstrate duplicate sport validation**:
   - Click **+ Add New Sport**.
   - Enter `pickleball` (lowercase).
   - Click **Create Sport**.
   - A friendly error banner appears: `A sport named "pickleball" already exists.`

---

### Phase 2: Player Match Scheduling & Starting Rosters
1. **Switch to a Player account**:
   - In the user menu, click **Sign Out**.
   - On the login screen, click **Fill Player (Alice)** and sign in.
   - You arrive on Alice's personalized dashboard (`Hello, Alice Walker! [PLAYER]`).
2. **Create a new match**:
   - Click **+ Schedule Match** (`/sessions/new`).
   - Notice the **Sport Category** dropdown includes all administrator-configured sports, including the newly added `Pickleball`!
   - Enter session details:
     - **Sport**: `Football`
     - **Session Title**: `Sunday Sunset 7v7 Turf Derby`
     - **Venue Location**: `Riverside Park, Turf 1`
     - **Match Date**: Select an upcoming weekend date (e.g. 3 days ahead).
     - **Start Time**: `17:30`
     - **Team A Players**: `Alice Walker, Marcus Reed, Leo Messi`
     - **Team B Players**: `David Silva, Sergio Ramos`
     - **Additional Players Needed**: `4`
   - Click **Schedule Session**.
   - The application creates the match and redirects to the **Session Details** page (`/sessions/:id`).
   - Note the confirmed rosters for Team A and Team B, the slots badge (4 slots remaining), and Alice identified as match organizer.

---

### Phase 3: Player Discovery & Instant Match Registration
1. **Switch to Bob Johnson**:
   - Sign out of Alice's account.
   - Sign in as **Bob Johnson** (`bob@example.com`).
2. **Discover open matches**:
   - Click **Available Sessions** in the top navbar.
   - Bob sees Alice's `Sunday Sunset 7v7 Turf Derby` showing `4 slots remaining` and a green **Join Match** button.
3. **Register for the match**:
   - Click **Join Match**.
   - The session updates immediately:
     - Open slots automatically decrement from `4` to `3`.
     - Bob Johnson is officially enrolled and his avatar and name appear under **Registered Participants**.
     - Bob sees the green confirmation banner: `You are confirmed on the roster for this session!`.
4. **Verify View Separation**:
   - Click **Joined Sessions** in the navbar (`/sessions/joined`). Alice's session appears in Bob's dedicated joined matches view with a `Registered ✓` tag.
   - Click **Available Sessions** (`/sessions/available`). The session now displays a `Joined ✓` badge with a **View** button, preventing duplicate joins.

---

### Phase 4: Match Cancellation with Mandatory Reason
1. **Log back in as Alice (the Host)**:
   - Sign out of Bob's account and sign in as Alice.
   - Click **My Sessions** in the navbar (`/sessions/my-sessions`).
   - Alice sees `Sunday Sunset 7v7 Turf Derby` listed under matches she organized.
2. **Initiate Cancellation**:
   - Click the red **Cancel Match** button.
   - A modal dialog appears requesting a mandatory cancellation reason.
   - Try submitting with an empty reason &rarr; browser/server validation prevents empty cancellations.
   - Enter: `Severe thunderstorm advisory and electrical safety warning.`
   - Click **Confirm Cancellation**.
3. **Inspect the Cancelled State**:
   - The session detail page now prominently displays a large red **CANCELLED** badge.
   - A high-visibility warning banner highlights the host's cancellation reason:
     `Reason: Severe thunderstorm advisory and electrical safety warning.`
   - The Join button is disabled and replaced with: `This session was cancelled and is no longer accepting players.`

---

### Phase 5: Admin Reporting & Dynamic Analytics
1. **Sign in as Admin**:
   - Sign in as `admin@sportsscheduler.com`.
   - Click **Reports** in the navbar (`/reports`).
2. **Inspect KPI Summary Cards**:
   - **Total Sessions**: Displays count of all sessions in the selected window.
   - **Active Sessions**: Real-time count of active matches.
   - **Cancelled Sessions**: Shows matches cancelled with reasons logged.
   - **Total Player Joins**: Total community participation count.
3. **Inspect the Sports Popularity Table**:
   - Ranks sports by player engagement and match volume.
   - Displays popularity percentage share with visual progress bars.
4. **Apply Date-Range Filtering**:
   - Choose a **Start Date** and **End Date** in the filter card.
   - Click **Filter Reports**.
   - The metrics dynamically recompute based exclusively on matches within that time window.
   - Click **Reset Filter** to return to the full overview.

---

### Phase 6: Security, CSRF & Role Guards Demonstration
1. **Role Guard Verification**:
   - While signed in as Player Bob, navigate directly to `/reports` or `/sports/new`.
   - The application immediately blocks access and renders an **Access Denied (403)** security page.
2. **CSRF Protection**:
   - All state-altering POST requests (`/auth/login`, `/sports`, `/sessions`, `/sessions/:id/join`, `/sessions/:id/cancel`) embed a hidden `_csrf` token verified by session middleware.
   - Any external forgery without this token is rejected with HTTP 403.
