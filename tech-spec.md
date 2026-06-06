# VendorBridge Nexus — Technical Specification

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.0 | UI framework |
| react-dom | ^18.3.0 | React DOM renderer |
| react-router-dom | ^6.26.0 | Multi-view routing (Dashboard, Vendor Wizard) |
| framer-motion | ^11.3.0 | Wizard step transitions, AnimatePresence, modal animations |
| gsap | ^3.12.0 | Core animation engine (bar charts, progress ring, staggered tables, loading wave) |
| recharts | ^2.12.0 | Donut chart (Order Tracking Widget) |
| lucide-react | ^0.428.0 | Icon library (sidebar icons, notifications, action icons) |
| tailwindcss | ^3.4.10 | Utility-first CSS |
| @radix-ui/react-dialog | ^1.1.0 | Accessible modal primitive (Post-submission success overlay) |
| @radix-ui/react-select | ^2.1.0 | Accessible select/dropdown primitive (Business Type, Vendor Assignment) |
| @radix-ui/react-tabs | ^1.1.0 | Accessible tabs primitive |

**Dev Dependencies**: typescript, vite, @vitejs/plugin-react, postcss, autoprefixer, @types/react, @types/react-dom

---

## Component Inventory

### Layout Components (shared across views)

| Component | Source | Reuse |
|-----------|--------|-------|
| `AppLayout` | Custom | Shell wrapper — renders Sidebar + Header + main content area. Used by all routes. |
| `Sidebar` | Custom | Fixed 240px left nav. Accepts `activeItem` prop. Contains nav items with indigo active state. |
| `Header` | Custom | Sticky 64px top bar with backdrop-blur. Contains search, notifications, user avatar. |
| `GlobalSearch` | Custom | Glassmorphic pill input inside Header. Debounced search callback. |

### Page-Section Components (Dashboard view)

| Component | Source | Notes |
|-----------|--------|-------|
| `KpiCardsGrid` | Custom | 3-column grid wrapper. Mounts 3 KPI cards. |
| `ActiveVendorsChart` | Custom + GSAP | Bar chart inside KPI card. `BlockLoader` compatible. See Core Effects. |
| `VendorRatingRing` | Custom + GSAP | SVG progress ring inside KPI card. See Core Effects. |
| `ActiveOrdersSparkline` | Custom | Simple sparkline (canvas or SVG path). Self-contained. |
| `RecentPaymentsTable` | Custom + GSAP | Data table with staggered row entrance. See Core Effects. |
| `OrderTrackingWidget` | Custom + Recharts | Donut chart + legend + "View Report" link. |

### Page-Section Components (Vendor Wizard view)

| Component | Source | Notes |
|-----------|--------|-------|
| `VendorWizard` | Custom + Framer Motion | Orchestrates 5-step wizard. Manages step state, direction, form data. |
| `StepIndicator` | Custom | Horizontal progress bar with 5 segments. Glowing indigo active fill. |
| `Step1VendorProfile` | Custom | 2-column form grid with standard inputs. |
| `Step2Compliance` | Custom | Form fields (implied from flow, not detailed in design). |
| `Step3BankingDetails` | Custom | Banking form fields. Previous + Next actions. |
| `Step4ProductSelection` | Custom | 4-column selectable product card grid. Search bar + selection pills. |
| `ProductCard` | Custom | Individual product card with toggle state (indigo border + checkmark). |
| `Step5TermsSignature` | Custom | Text area + digital signature canvas pad. |
| `SuccessOverlay` | Custom + GSAP | Modal overlay with `SuccessCheck` animation. Radix Dialog underneath. |

### Reusable Components

| Component | Source | Used By |
|-----------|--------|---------|
| `Button` | Custom | Everywhere. Variants: primary (indigo), secondary, ghost, outline. Hover scale + glow. |
| `Input` | Custom | All forms. Focus border indigo + box-shadow ring. |
| `Select` | Radix + Custom | Step 1 (Business Type). Styled wrapper on Radix Select. |
| `Badge` | Custom | Table status pills, notification dots. Variants by color. |
| `Card` | Custom | KPI cards, Order Tracking Widget, Product cards. `bg-[#111827]`, rounded-xl. |
| `Toast` | Custom | Success/error notifications. Framer Motion slide-down, auto-dismiss 4s. |
| `BlockLoader` | Custom + GSAP | Full-page transition loader. Block wave animation. See Core Effects. |
| `SuccessCheck` | Custom + GSAP | SVG stroke-draw animation. See Core Effects. |

### Hooks

| Hook | Purpose |
|------|---------|
| `useFormState` | Multi-step form data accumulation. Merges partial data across wizard steps. |
| `useSignaturePad` | Canvas-based signature capture. Exposes `clear()`, `toDataURL()`. |

---

## Animation Implementation Plan

| Animation | Library | Implementation Approach | Complexity |
|-----------|---------|------------------------|------------|
| Block wave loading (BlockLoader) | GSAP | `timeline({ repeat: -1 })` + `fromTo` on 25 box elements with `yPercent: -100` → `100`, staggered `each: dur * 0.5`, `yoyo: true`. 5 columns × 5 rows. | **High** 🔒 |
| Form submission success check (SuccessCheck) | GSAP + DrawSVG | `gsap.timeline`: `drawSVG: '0%'` → `'100%'` on circle (0.75s) then path (0.5s, `-=0.25`). Requires DrawSVG plugin. | **High** 🔒 |
| Interactive bar chart (ActiveVendorsChart) | GSAP | Mount: `fromTo` each bar with `scaleY: 0` → `1`, staggered delay `i * 0.15`, `ease: 'back.out(1.7)'`. Hover: `gsap.to` all bars — hovered bar scales to `val + 0.1`, others to `val * 0.8`. | **Medium** |
| Staggered table row entrance (DataTable) | GSAP | `fromTo(rowRefs, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, delay: 0.2 })` | **Low** |
| Glowing progress ring (VendorRatingRing) | GSAP | `fromTo` circle `strokeDashoffset` from `circumference` to target (calculated from `4.6/5.0`). Duration 1.5s, delay 0.5s. | **Low** |
| Wizard step transitions | Framer Motion | `AnimatePresence` with `custom={direction}` prop. Enter: `x: direction * 100, opacity: 0` → `x: 0, opacity: 1`. Exit: `x: direction * -100, opacity: 0`. Duration 300ms, `ease: [0.4, 0, 0.2, 1]`. | **Medium** |
| Success overlay entrance | Framer Motion | Scale from 0.9 → 1.0 + opacity 0 → 1 with spring `{ stiffness: 300, damping: 25 }`. Backdrop fade. | **Low** |
| Toast notifications | Framer Motion | `initial={{ y: -50, opacity: 0 }}` → `animate={{ y: 0, opacity: 1 }}` with spring physics. `exit={{ y: -50, opacity: 0 }}`. | **Low** |
| Button hover (global) | CSS/Tailwind | `hover:scale-[1.02]` + `transition-all duration-150`. Glow via `hover:shadow-glow`. | **Low** |
| Input focus (global) | CSS/Tailwind | `focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20` transition. | **Low** |
| Card hover (global) | CSS/Tailwind | `hover:translate-y-[-2px] hover:shadow-md transition-all duration-150`. | **Low** |

---

## State & Logic Plan

### Multi-Step Wizard State Machine

The wizard requires bidirectional navigation (Next/Previous) with accumulated form state:

- **Step state**: `currentStep: number (1–5)`, `direction: 1 | -1` (controls slide direction in Framer Motion).
- **Form data**: Single object `wizardData` that accumulates across steps. Each step writes its field values into the shared object on "Next". No per-step isolation — all data lives in one state container to allow "Previous" to restore already-filled values.
- **Validation trigger**: Step-level validation runs on "Next" click. If invalid, block transition and show field-level error states. No step can be skipped forward.
- **Submission**: Step 5 "Submit for Approval" sends accumulated `wizardData` to API, then triggers `SuccessOverlay` with `setShowSuccess(true)`.

### Product Selection Toggle (Step 4)

- **Selection state**: `selectedProductIds: Set<string>`.
- **Toggle behavior**: Clicking a `ProductCard` adds/removes its ID from the Set. Card visual state derived from Set membership (indigo border + checkmark icon).
- **Selection pills**: Derived from `selectedProductIds` mapped back to product objects. Each pill has a remove button that deletes from the Set.
- **Search filter**: Client-side text filter on product name/category. Applied before rendering the grid.

### Signature Capture (Step 5)

- **Canvas ref**: Raw HTML5 `<canvas>` element accessed via ref.
- **Drawing logic**: Track `mousedown`/`mousemove`/`mouseup` (and touch equivalents). Draw line segments between consecutive points using `canvas.getContext('2d')`.
- **Clear**: Reset canvas to blank state.
- **Export**: `canvas.toDataURL('image/png')` attached to `wizardData` on submit.

---

## Other Key Decisions

### Routing Structure

| Route | View |
|-------|------|
| `/` | Procurement Dashboard |
| `/vendors/new` | Vendor Onboarding Wizard |
| `/vendors` | Vendor list (placeholder for future scope) |
| `/orders` | Orders list (placeholder) |

React Router v6 with `<BrowserRouter>`. `AppLayout` wraps all routes via a layout route.

### Data Architecture

All dashboard data (KPIs, table rows, chart data) is **static mock data** in this implementation. No API integration. Data lives in `src/data/mockData.ts` as plain objects/arrays.

### DrawSVG Plugin Strategy

GSAP's DrawSVG is a Club GreenSock plugin. Two implementation paths:

1. **If DrawSVG available**: Use `gsap.fromTo(el, { drawSVG: '0%' }, { drawSVG: '100%' })` as specified.
2. **If DrawSVG unavailable**: Fallback to manual `stroke-dasharray` + `stroke-dashoffset` manipulation with `gsap.to` on the numeric offset. The design file's `SuccessCheck` already uses this fallback pattern — implement it directly.

### Canvas Signature — Touch Support

The signature pad must handle both mouse and touch events. Register `{ passive: false }` touch listeners and call `e.preventDefault()` to prevent page scrolling while drawing.
