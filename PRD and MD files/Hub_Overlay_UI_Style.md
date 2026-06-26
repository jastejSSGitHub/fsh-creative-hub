# Hub Overlay UI Style Guide

Reference for overlay modals, compact forms, and inline controls. Established from the **Members** dialog (`HubDialog` + `InviteMembersDialog`).

Use these tokens when building new dialogs, popovers, and compact UI so surfaces feel consistent across the app.

---

## Design intent

- **Compact and precise** — Figma-inspired density; nothing oversized or pill-heavy.
- **Soft contrast** — warm paper background, subtle borders, muted secondary text.
- **One accent blue** — reserved for links, focus rings, and avatars (`#18a0fb`).
- **6px controls, 12px shells** — small radius on inputs/buttons; larger radius only on the modal container.

---

## Color palette

| Token | Value | Usage |
|-------|-------|--------|
| `hub-paper` | `#fbf7ee` | Modal / page background |
| `hub-espresso` | `#0b0b0b` | Primary text, dark UI elements |
| `hub-link` | `#18a0fb` | Copy link, focus rings, avatar fills |
| `hub-espresso/12` | border | Input & control borders |
| `hub-espresso/45` | text | Section labels, role text, placeholders |
| `hub-espresso/40` | text | Close icon, chevrons |
| `hub-espresso/08` | bg | Secondary CTA background (Invite button) |
| `hub-espresso/04` | bg | Row hover, menu item hover |
| `hub-espresso/10` | border | Modal shell border |
| `hub-rejected` | `#ef4444` | Errors, destructive actions |
| `hub-approved` | `#22c55e` | Success borders |

---

## Corner radius

| Element | Radius | Tailwind |
|---------|--------|----------|
| Modal shell | **12px** | `rounded-[12px]` |
| Inputs, buttons, menu panels, row hovers | **6px** | `rounded-[6px]` |
| Avatars | **full** | `rounded-full` |

Do **not** use large pill radii (`rounded-2xl`, `rounded-full` buttons) in overlay controls.

---

## Modal shell (`HubDialog`)

| Property | Value |
|----------|-------|
| Max width | `min(100vw - 2rem, 30rem)` (~480px) |
| Background | `bg-hub-paper` |
| Border | `border-hub-espresso/10` |
| Shadow | `shadow-2xl` |
| Backdrop | `backdrop:bg-hub-espresso/50` |
| Header padding | `px-4 py-3.5` |
| Body padding | `px-4 pb-4` |
| Section spacing | `space-y-4` between major blocks |

---

## Typography

| Role | Size | Weight | Color | Notes |
|------|------|--------|-------|-------|
| Modal title | `0.9375rem` (15px) | `font-semibold` | `hub-espresso` | `leading-snug tracking-tight` |
| Modal description | `text-xs` (12px) | normal | `hub-espresso/55` | Optional, below title |
| Body / input text | `0.8125rem` (13px) | normal | `hub-espresso` | Inputs, member names, menu items |
| Section label | `0.6875rem` (11px) | `font-medium` | `hub-espresso/45` | e.g. "Who has access" — sentence case, not uppercase |
| Role / meta text | `0.8125rem` (13px) | normal | `hub-espresso/45` | Lowercase display for roles |
| Header action (Copy link) | `0.8125rem` (13px) | `font-medium` | `#18a0fb` | With `size-3.5` icon |
| Secondary CTA | `0.8125rem` (13px) | `font-medium` | `hub-espresso` | Invite button |
| Feedback messages | `text-xs` (12px) | normal | contextual | Error / success banners |
| Avatar initials | `0.625rem` (10px) | `font-semibold` | white on `#18a0fb` | Inside `size-6` circle |
| Destructive inline | `0.6875rem` (11px) | normal | `hub-rejected` | e.g. Remove on row hover |

**Font family:** Geist Sans (`font-sans`) for all overlay UI. Avoid mono uppercase labels in overlays.

---

## Header layout

```
[ Title · context          Copy link  ✕ ]
```

- Title left-aligned, truncates if long.
- Header action (Copy link) sits between title and close button.
- Close button: `size-6`, icon `size-3.5`, `text-hub-espresso/40`, hover `bg-hub-espresso/5`.

---

## Text inputs

| Property | Value |
|----------|-------|
| Height | `min-h-8` (32px) |
| Padding | `px-2.5` |
| Radius | `rounded-[6px]` |
| Border | `border-hub-espresso/12` |
| Background | `bg-white` |
| Font | `text-[0.8125rem]` |
| Placeholder | `text-hub-espresso/40` |
| Focus | `border-[#18a0fb]/50 ring-1 ring-[#18a0fb]/40` |

---

## Custom select (`HubSelect`)

Use `HubSelect` instead of native `<select>` in overlays.

### Field variant (invite row)

| Property | Value |
|----------|-------|
| Height | `min-h-8` |
| Padding | `pl-2.5 pr-6` |
| Border / bg / radius | Same as text inputs |
| Chevron | `ChevronRight` rotated 90°, `size-3`, `text-hub-espresso/35` |

### Inline variant (member row role)

| Property | Value |
|----------|-------|
| Background | transparent |
| Text | `text-hub-espresso/45`, hover `text-hub-espresso/70` |
| Chevron | `ChevronRight` `size-3`, right of label |

### Dropdown menu panel

| Property | Value |
|----------|-------|
| Radius | `rounded-[6px]` |
| Border | `border-hub-espresso/12` |
| Background | `bg-white` |
| Shadow | `shadow-xl` |
| Padding | `py-1` |
| Min width | `7.5rem` |
| z-index | `z-50` on the menu, positioned `absolute` inside a `relative` wrapper |

**Important:** Never portal dropdown menus to `document.body` or use `position: fixed` inside a native `<dialog>` — both cause the modal to grow scrollbars. Keep the menu as an absolutely positioned child of the trigger wrapper.

### Menu items

| Property | Value |
|----------|-------|
| Padding | `px-2.5 py-1.5` |
| Font | `text-[0.8125rem]` |
| Hover | `bg-hub-espresso/[0.04]` |
| Selected | `bg-[#18a0fb]/10 text-hub-espresso font-medium` |

---

## Buttons

### Secondary CTA (Invite)

| Property | Value |
|----------|-------|
| Radius | `rounded-[6px]` |
| Background | `bg-hub-espresso/[0.08]` |
| Hover | `bg-hub-espresso/[0.12]` |
| Padding | `px-3` |
| Height | matches input row (`min-h-8`) |
| Font | `text-[0.8125rem] font-medium` |

### Header text button (Copy link)

| Property | Value |
|----------|-------|
| Color | `text-[#18a0fb]` |
| Hover | `bg-[#18a0fb]/10` |
| Padding | `px-1.5 py-1` |
| Icon gap | `gap-1` |

---

## Member list rows

| Property | Value |
|----------|-------|
| Layout | avatar · name · role (right-aligned) |
| Row padding | `py-1.5 pr-1` |
| Row gap | `gap-2.5` |
| Row hover | `bg-hub-espresso/[0.04] rounded-[6px]` |
| Avatar | `size-6`, `bg-[#18a0fb]`, `rounded-full` |
| Name | `text-[0.8125rem]`, truncate |
| List spacing | `space-y-0.5` |
| Max height | `max-h-56 overflow-y-auto` |

---

## Invite row layout

Single horizontal row — no stacked labels:

```
[ email input (flex-1) ] [ role select ] [ Invite ]
```

- Gap between controls: `gap-2`
- Align: `items-stretch`

---

## Feedback banners

| Property | Value |
|----------|-------|
| Radius | `rounded-[6px]` |
| Padding | `px-3 py-2` |
| Font | `text-xs` |
| Error | `border-hub-rejected/30 bg-hub-rejected/10 text-hub-rejected` |
| Success | `border-hub-approved/30 bg-hub-approved/10 text-hub-espresso` |

---

## Icons

| Context | Size | Stroke |
|---------|------|--------|
| Header / inline | `size-3.5` | `strokeWidth={2}` |
| Chevrons | `size-3` | default |

---

## Reference components

- `src/components/projects/hub-dialog.tsx` — modal shell
- `src/components/projects/invite-members-dialog.tsx` — full overlay example
- `src/components/ui/hub-select.tsx` — branded dropdown

---

## Do / Don't

**Do**
- Keep controls at 32px height in compact rows.
- Use sentence-case section labels.
- Portal dropdown menus so they aren't clipped by scroll containers.
- Match focus blue to link blue (`#18a0fb`).

**Don't**
- Use native `<select>` in overlays.
- Use uppercase mono labels (`EMAIL`, `ROLE`).
- Use full-width pill buttons below stacked fields.
- Use `rounded-xl` or larger on inputs/buttons inside overlays.
