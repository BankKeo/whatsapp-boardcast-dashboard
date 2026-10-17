# Implementation Prompt: Partner Club WhatsApp Marketing System

## Enterprise Admin Dashboard — Data-Dense Design System

### 1. Role and Objective

Act as a senior frontend engineer and enterprise product designer.

Build a polished, responsive admin dashboard for the **Partner Club WhatsApp Marketing System** for Lao Brewery Co., Ltd. (Carlsberg Group).

The application helps marketing staff manage outlet contacts, segment outlets by province and category, create targeted WhatsApp promotional campaigns, and monitor campaign performance.

The immediate goal is to deliver a visually impressive, interactive frontend prototype that can be demonstrated to a non-technical business customer.

Prioritize the visual dashboard and core workflows first. Use realistic mock data. Do not block UI development on backend APIs, database access, or WhatsApp credentials.

### 2. Required Technology Stack

Use the following stack exclusively for the main application:

- **Next.js** with App Router.
- **TypeScript** with strict typing.
- **Tailwind CSS** for styling.
- **shadcn/ui** for UI primitives and accessible components.
- **Zod** for schemas and validation.
- **React Hook Form** for form state and validation integration.
- **Lucide React** for icons.
- **Recharts** for dashboard charts, if charting is needed.

Use the existing package versions and project conventions where possible. If the repository is empty, initialize a compatible Next.js application and install the required dependencies.

Use shadcn/ui components such as:

- Button
- Card
- Input
- Label
- Select
- Checkbox
- Dropdown Menu
- Dialog
- Sheet
- Table
- Tabs
- Badge
- Tooltip
- Popover
- Calendar
- Command
- Separator
- Sidebar
- Breadcrumb
- Skeleton
- Alert Dialog
- Sonner for toast notifications, if installed

Do not introduce another component library such as Material UI, Ant Design, or Chakra UI.

### 3. Design Direction

Implement an **Enterprise Admin Dashboard — Data-Dense Design System**.

The design should communicate professionalism, operational efficiency, reliability, and clarity.

Design principles:

- High information density without visual clutter.
- Data tables and filtering controls are the main interface elements.
- Compact, consistent spacing.
- Clear hierarchy between page titles, metrics, filters, tables, and actions.
- Restrained green accents inspired by Carlsberg branding.
- White surfaces, neutral gray backgrounds, subtle borders, and dark readable text.
- Consistent typography, button sizing, icons, status badges, and spacing.
- Professional enterprise SaaS appearance.
- Responsive layouts for desktop, tablet, and mobile.
- Light theme by default.

Avoid:

- Excessive whitespace.
- Oversized decorative cards.
- Large gradient backgrounds.
- Glassmorphism.
- Excessive rounded corners.
- Unnecessary animations.
- Decorative illustrations that reduce usable screen space.
- Fake functionality or buttons that do nothing.

Use Inter or a comparable clean sans-serif font.

### 4. Application Structure

Use Next.js App Router and organize the application into maintainable routes.

Suggested structure:

app/
layout.tsx
page.tsx
globals.css
outlets/
page.tsx
segments/
page.tsx
campaigns/
page.tsx
new/
page.tsx
[id]/
page.tsx
templates/
page.tsx
reports/
page.tsx
team/
page.tsx
settings/
page.tsx

components/
layout/
app-sidebar.tsx
app-header.tsx
page-header.tsx
dashboard/
kpi-card.tsx
campaign-performance-chart.tsx
recent-campaigns-table.tsx
audience-overview.tsx
recent-activity.tsx
outlets/
outlet-table.tsx
outlet-filters.tsx
outlet-form.tsx
import-outlets-dialog.tsx
segments/
segment-builder.tsx
saved-segments-table.tsx
campaigns/
campaign-wizard.tsx
audience-selector.tsx
message-composer.tsx
whatsapp-preview.tsx
campaign-review.tsx
shared/
data-table.tsx
status-badge.tsx
confirm-dialog.tsx
empty-state.tsx
loading-state.tsx

lib/
utils.ts
schemas/
outlet.ts
campaign.ts
segment.ts
data/
mock-outlets.ts
mock-campaigns.ts
mock-templates.ts
services/
outlet-service.ts
campaign-service.ts

types/
outlet.ts
campaign.ts
template.ts

This is a suggested organization, not a reason to refactor an existing working project unnecessarily. Adapt it to the repository if it already has a structure.

### 5. Shared Application Layout

Build a persistent application shell.

#### Sidebar navigation

Include:

- Dashboard
- Outlet Database
- Audience Segments
- Campaigns
- Message Templates
- Campaign Reports
- Team & Permissions
- Settings

Requirements:

- Lucide icons.
- Active route highlighting.
- Collapsible desktop sidebar.
- Mobile navigation through a Sheet.
- Consistent alignment and compact spacing.
- User profile section at the bottom.

#### Header

Include:

- Breadcrumbs.
- Current page title where appropriate.
- Global search interface.
- Notifications menu.
- Help entry.
- User avatar and dropdown.
- Contextual primary action.

Ensure the navigation links lead to implemented pages.

### 6. Dashboard Page

Make the dashboard the initial landing page.

Page title: **Partner Club Overview**

Description: Manage outlets, target the right audience, and track WhatsApp campaigns from one place.

Primary actions:

- Create Campaign
- Import Outlet Data

#### KPI cards

Display:

- Total Outlets: 12,480
- Eligible WhatsApp Contacts: 10,860
- Campaigns This Month: 18
- Messages Delivered: 42,650
- Delivery Rate: 96.8%
- Failed Messages: 1,412

These are illustrative demo values only. Clearly mark demo data in the prototype. Keep related metrics logically consistent and avoid presenting sample figures as actual results.

Use compact shadcn/ui Card components with subtle icons, labels, values, and optional comparison indicators.

#### Campaign performance chart

Use Recharts for a responsive line or area chart.

Display:

- Messages sent.
- Messages delivered.
- Failed messages.

Add date-range controls:

- 7 days
- 30 days
- 90 days

The selected period must update the displayed mock data.

#### Recent campaigns table

Columns:

- Campaign Name
- Audience
- Recipients
- Sent Date
- Delivery Rate
- Status
- Actions

Include realistic examples involving Vientiane Capital, Savannakhet, On-Trade, and seasonal promotions.

#### Additional dashboard sections

Include:

- Outlet distribution by province.
- Outlet distribution by category.
- Contact data quality summary.
- Recent activity feed.
- Quick action to import contacts.
- Quick action to create an audience segment.

Keep the layout compact, aligned, and information-rich.

### 7. Outlet Database

Build a functional contact management page.

#### Table columns

- Selection checkbox
- Outlet Name
- Owner Name
- Phone Number
- Province
- District
- Outlet Category
- WhatsApp Eligibility
- Last Updated
- Actions

#### Features

Implement:

- Search by outlet name, owner, or phone number.
- Province filter.
- Category filter.
- Eligibility filter.
- Data-quality filter.
- Sortable columns.
- Pagination.
- Page-size selector.
- Row selection.
- Bulk selection and deselection.
- Clear filters.
- Add outlet dialog.
- Edit outlet dialog.
- Outlet detail Sheet.
- Delete confirmation.
- CSV export of filtered records.
- CSV import with validation and preview.
- Duplicate phone-number detection.
- Missing or invalid phone-number warnings.

Use realistic mock records with Lao provinces and districts.

Outlet categories should include On-Trade and Off-Trade, while allowing future categories.

Use Zod schemas to validate outlet data. Use React Hook Form with zodResolver for create/edit forms.

For CSV import, use a small, maintained CSV parsing library if needed. If Excel import is required, use a compatible spreadsheet parsing library. Do not claim Excel support if only CSV is implemented.

### 8. Audience Segments

Create a visual filter builder for non-technical users.

Users must be able to select:

- One or multiple provinces.
- One or multiple outlet categories.
- WhatsApp eligibility.
- Marketing consent status.

Example:

- Province is Vientiane Capital OR Savannakhet.
- Category is On-Trade.
- Contact is eligible for marketing.

Features:

- Live matching count.
- Preview matching outlets.
- Save segment.
- Rename segment.
- Edit segment.
- Duplicate segment.
- Delete segment with confirmation.
- Clear filters.
- Reuse saved segments in campaign creation.

Use Zod schemas for segment definitions and validation.

All filters must work against the local mock dataset.

### 9. Campaign Creation Wizard

This is the primary business workflow. Make it intuitive for non-technical marketing staff.

Use a stepper with clear progress indicators.

#### Step 1: Campaign details

Fields:

- Campaign name.
- Campaign objective.
- Internal description.
- Campaign owner.

Use React Hook Form and Zod validation.

#### Step 2: Audience selection

Allow users to:

- Select a saved segment.
- Select provinces.
- Select outlet categories.
- Apply marketing consent and eligibility filters.
- Preview matching contacts.
- See total eligible recipients.

Example audience:

- Vientiane Capital and Savannakhet.
- On-Trade outlets only.
- Eligible marketing contacts only.

Calculate the audience count from the mock dataset rather than hardcoding the number.

#### Step 3: Compose message

Include:

- Approved template selector.
- Message editor for supported template variables.
- Language selection for Lao and English.
- Promotional image preview.
- Template approval status.
- WhatsApp message preview.

Use realistic placeholder promotional copy without inventing actual product offers, prices, or approved claims.

#### Step 4: Review

Display:

- Campaign details.
- Selected provinces.
- Selected categories.
- Eligible recipient count.
- Template information.
- Message preview.
- Scheduled date/time, if selected.
- Estimated cost only if configured pricing data exists.

Display clear warnings for:

- No eligible recipients.
- Missing marketing consent.
- Invalid phone numbers.
- Unapproved templates.
- Incomplete campaign details.

Require explicit confirmation before simulation.

#### Step 5: Send or schedule

Provide:

- Save Draft.
- Submit for Approval.
- Schedule Campaign.
- Simulate Send.

In prototype mode, sending must only update local mock state and show a clear “Demo mode — no real WhatsApp messages sent” notice.

Never pretend that an actual campaign has been sent.

### 10. Campaign Management

Build a filterable campaign table with:

- Campaign name.
- Audience segment.
- Province.
- Outlet category.
- Recipient count.
- Campaign owner.
- Created date.
- Scheduled date.
- Status.
- Actions.

Support:

- Search.
- Status filtering.
- Date filtering.
- Province filtering.
- View campaign details.
- Edit drafts.
- Duplicate campaigns.
- Cancel scheduled campaigns.
- View reports.

Use consistent status badges for Draft, Pending Approval, Scheduled, Sending, Completed, Cancelled, and Failed.

### 11. Message Templates

Create a searchable template library.

Include:

- Template name.
- Category.
- Language.
- Approval status.
- Last updated.
- Usage count.
- Actions.

Support:

- Search.
- Filter by status and language.
- Create template draft.
- Preview.
- Edit drafts.
- Duplicate templates.
- Display template variables.
- Show approval requirements.

Use sample templates for Seasonal Promotion, New Product Announcement, Partner Club Update, and Promotional Reminder.

Do not imply that locally created templates are automatically approved by WhatsApp.

### 12. Campaign Reports

Include summary metrics:

- Messages attempted.
- Messages sent.
- Messages delivered.
- Messages read, when available.
- Failed messages.
- Delivery rate.

Provide charts for:

- Campaign performance over time.
- Performance by province.
- Performance by outlet category.
- Campaign comparison.

Include a filterable results table and CSV export.

Distinguish clearly between sent, delivered, read, and failed. Use only mock metrics in the prototype and real provider data after integration.

### 13. Team and Settings

#### Team

Include:

- Team member table.
- Name and email.
- Role.
- Status.
- Last active.
- Invite member dialog.
- Edit role.
- Deactivate confirmation.

Roles:

- Administrator.
- Marketing Manager.
- Campaign Creator.
- Read-Only Analyst.

Implement role-based UI states in the prototype without claiming backend-enforced authorization.

#### Settings

Organize into sections:

- Company profile.
- WhatsApp Business connection.
- Outlet database integration.
- Province and category settings.
- User permissions.
- Approval workflow.
- Messaging limits.
- Contact consent.
- Audit logs.

Show connection statuses honestly. Use disconnected or demo states until real integrations are configured.

Never expose API keys or access tokens in client-side code.

### 14. Form and Validation Standards

Use Zod and React Hook Form consistently for all forms that need validation.

Create reusable schemas for:

- Outlet records.
- Campaign details.
- Audience segments.
- Message templates.
- Team members.

Requirements:

- TypeScript types inferred from Zod schemas where appropriate.
- Clear field-level validation messages.
- Required-field indicators.
- Valid phone-number checks appropriate for the selected country.
- Safe handling of empty, invalid, and duplicate records.
- Accessible labels and keyboard navigation.
- Consistent error and success feedback.

Use shadcn/ui Form components when compatible with the installed version.

### 15. Data and State Management

For the initial prototype:

- Use typed mock datasets.
- Keep mock data separate from presentation components.
- Build small service functions for outlet, segment, campaign, and template operations.
- Use local React state or an appropriate lightweight state-management approach.
- Persist demo changes in localStorage only when appropriate.
- Provide a reset-demo-data action if persistence is implemented.
- Ensure filters, pagination, forms, and campaign workflows are genuinely interactive.

Avoid unnecessary global state and overengineering.

Use server components by default in Next.js. Add "use client" only to interactive components that require browser-side state or event handlers.

Keep chart components and interactive data tables in client components where needed.

### 16. Accessibility and Responsive Behavior

Ensure:

- Semantic HTML.
- Accessible names for icon-only buttons.
- Keyboard-accessible dialogs and menus.
- Visible focus states.
- Adequate text contrast.
- Responsive tables with usable overflow or mobile alternatives.
- No horizontal overflow across the entire application.
- Useful empty, loading, and error states.

### 17. Development Workflow

Before implementing:

1. Inspect the existing repository and package.json.
2. Confirm the Next.js, Tailwind CSS, shadcn/ui, Zod, and React Hook Form versions.
3. Inspect existing UI components and configuration.
4. Reuse compatible dependencies and existing conventions.
5. Identify missing dependencies before installing anything.

Then implement in this order:

**Phase 1 — Customer Demo**

1. Application shell and sidebar.
2. Dashboard with KPIs, charts, and recent campaigns.
3. Outlet Database with search, filters, and pagination.
4. Audience Segments with live matching counts.
5. Campaign Creation Wizard with WhatsApp preview.

**Phase 2 — Supporting Screens** 6. Campaign Management. 7. Message Templates. 8. Campaign Reports. 9. Team and Settings. 10. Responsive behavior and interaction polish.

**Phase 3 — Integration Preparation** 11. Document database integration requirements. 12. Define the WhatsApp Business Platform integration boundary. 13. Prepare consent and eligibility validation. 14. Document environment variables and deployment requirements.

### 18. Definition of Done

The prototype is complete when:

- The application runs successfully.
- All primary navigation routes work.
- The dashboard looks polished and enterprise-ready.
- Mock data appears realistic and consistent.
- Search, filters, sorting, and pagination work.
- Outlet creation and editing work with Zod validation.
- Audience segments can be saved and reused.
- Campaign creation works from start to review.
- WhatsApp message preview is realistic.
- Demo campaign actions update the local UI correctly.
- Reports and charts display the selected demo data.
- No major buttons are inert.
- No real WhatsApp messages are sent.
- No fake database or WhatsApp connection is shown as active.
- There are no avoidable TypeScript errors, broken routes, or console errors.

**Begin with the existing repository, implement Phase 1 first, run the application, verify the main workflows, and fix any issues before continuing. Deliver a working application, not just a design description or static mockup.**
