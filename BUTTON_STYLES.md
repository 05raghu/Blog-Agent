# Button Style Guide

## Overview

This document defines button styles based on functionality to ensure consistency across the Blog Agent application.

## Button Classes & Usage

### 🟦 btn-primary
**Use for:** Create/Add actions, Save/Submit, Next/Continue

**Color:** Signal Blue (--cw-signal)

**Examples:**
- "Create New Strategy"
- "Save Strategy & Generate Topics"
- "Generate 10 Topics"
- "Save Changes"

```jsx
<button className="btn-primary">Create New Strategy</button>
```

---

### 🟩 btn-secondary
**Use for:** Back/Navigate, View/Open, Cancel

**Color:** Outline (border only)

**Examples:**
- "← Back to Overview"
- "← Back to Strategies"
- "→ Go to Strategy"
- "View Details"
- "Cancel"

```jsx
<button className="btn-secondary">← Back to Overview</button>
```

---

### 🔴 btn-danger
**Use for:** Delete/Remove (destructive actions)

**Color:** Ember Red (--cw-ember)

**Important:** Pair with existing delete icon; do NOT replace the icon

**Examples:**
- Delete buttons with trash icon
- Remove SME button
- Remove topic button

```jsx
<button className="btn-danger">
  🗑️ Delete Strategy
</button>
```

---

### 📝 btn-text
**Use for:** Links, inline actions, skip buttons

**Color:** Underlined text

**Examples:**
- "Learn more"
- "Skip"
- "View more options"

```jsx
<button className="btn-text">Learn more</button>
```

---

## Functionality Matrix

| Action | Button Class | Icon | Color | Notes |
|--------|--|--|--|--|
| Create/Add | `btn-primary` | ✅ Optional (+) | Signal Blue | Main positive action |
| Save/Submit | `btn-primary` | ✅ Optional (💾) | Signal Blue | Confirm action |
| Edit | Icon only | 🖊️ | - | Use existing edit icon, no button class |
| Delete | `btn-danger` | 🗑️ | Ember Red | Pair icon with button class |
| Back/Navigate | `btn-secondary` | ✅ Optional (←/→) | Outline | Secondary navigation |
| View/Open | `btn-secondary` | ✅ Optional | Outline | View data/details |
| Cancel | `btn-secondary` | None | Outline | Dismiss action |
| Link | `btn-text` | None | Underline | Minimal priority |

---

## Current Implementation Status

### ✅ Completed
- Overview page: "→ Go to Strategy" (btn-secondary)
- Strategy page: "← Back to Overview" (btn-secondary)
- Create Strategy page: "← Back to Strategies" (btn-secondary)
- Create Strategy page: "Save Strategy & Generate Topics" (btn-primary)

### ⏳ To Be Applied
- Delete buttons across all pages → use `btn-danger`
- Ensure all Create/Add buttons → use `btn-primary`
- Ensure all Back/Cancel buttons → use `btn-secondary`

---

## Design Tokens Used

All buttons use CSS variables from the Codewave brand system:

- Signal Blue: `var(--cw-signal)` (#a8dde8)
- Ember Red: `var(--cw-ember)` (#e66d3a)
- Ink 950: `var(--cw-ink-950)` (#0a0a0b)
- Parchment: `var(--cw-parchment)` (#ede7da)
- Control Height: `var(--cw-control-height)` (52px)
- Control Radius: `var(--cw-control-radius)` (45px)

---

## Animation & Interaction

All buttons use smooth transitions with cubic-bezier easing:

- **Transition duration:** 240ms
- **Easing:** cubic-bezier(0.4, 0, 0.2, 1)
- **Hover effect:** Opacity + slight translate
- **Active effect:** Scale or translate
- **Disabled state:** 50% opacity, cursor not-allowed

---

## Icon Pairing Guidelines

### ✅ DO
- Pair delete icon (🗑️) with `btn-danger` class
- Pair edit icon (🖊️) standalone (no button class)
- Add arrow icons (←/→) to navigation buttons (optional)
- Add (+) icon to create buttons (optional)

### ❌ DON'T
- Remove or change existing edit/delete icons
- Use buttons without appropriate class
- Mix button classes for same functionality
- Create custom button styles outside this guide

---

## Questions?

Refer to `apps/web/app/globals.css` for the CSS implementation and comments.
