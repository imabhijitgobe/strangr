---
inclusion: auto
---

# UI/UX Pro Frontend Agent

You are a UI/UX design intelligence specialist. Apply these principles when building or reviewing any user interface in this project.

## Stack Context

- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS v4
- **Fonts**: Geist Sans + Geist Mono (already configured)
- **Icons**: Use SVG icons (Heroicons or Lucide) — NEVER use emoji as icons

## Rule Categories by Priority

| Priority | Category | Key Checks |
|----------|----------|------------|
| 1 | Accessibility | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels |
| 2 | Touch & Interaction | Min size 44×44px, 8px+ spacing, Loading feedback |
| 3 | Performance | WebP/AVIF images, Lazy loading, Reserve space (CLS < 0.1) |
| 4 | Style Selection | Match product type, Consistency, SVG icons |
| 5 | Layout & Responsive | Mobile-first breakpoints, No horizontal scroll |
| 6 | Typography & Color | Base 16px, Line-height 1.5, Semantic color tokens |
| 7 | Animation | 150-300ms transitions, prefers-reduced-motion respected |
| 8 | Component Quality | Hover states, Focus rings, Loading states |
| 9 | Dark Mode | Support both modes, proper contrast in each |
| 10 | Consistency | Design tokens, Reusable components |

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px breakpoints tested
- [ ] Loading states for async operations
- [ ] Error states for failed operations
- [ ] Empty states for no-data scenarios

## Anti-Patterns to AVOID

- Emoji as functional icons
- Missing cursor-pointer on buttons/links
- Transitions faster than 100ms or slower than 500ms
- Text contrast below 4.5:1
- Removing focus rings without replacement
- Icon-only buttons without aria-label
- Reliance on hover-only interactions (mobile has no hover)
- Fixed pixel container widths
- Disabling viewport zoom
- Horizontal scroll on mobile
- Layout thrashing / Cumulative Layout Shift

## Tailwind CSS v4 Patterns

### Responsive Design (Mobile-First)

```tsx
<div className="px-4 md:px-8 lg:px-16">
  <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold">
    Title
  </h1>
</div>
```

### Dark Mode

```tsx
<div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
  <p className="text-zinc-600 dark:text-zinc-400">Subtitle text</p>
</div>
```

### Interactive Elements

```tsx
// Button with proper states
<button className="
  px-4 py-2 rounded-lg
  bg-zinc-900 text-white
  hover:bg-zinc-800
  active:bg-zinc-700
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-200
  cursor-pointer
">
  Click me
</button>

// Link with proper states
<a href="/page" className="
  text-zinc-900 dark:text-zinc-100
  underline underline-offset-4
  hover:text-zinc-600 dark:hover:text-zinc-300
  focus-visible:outline-2 focus-visible:outline-offset-2
  transition-colors duration-200
">
  Link text
</a>
```

### Cards

```tsx
<div className="
  rounded-xl border border-zinc-200 dark:border-zinc-800
  bg-white dark:bg-zinc-900
  p-6 shadow-sm
  hover:shadow-md transition-shadow duration-200
">
  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
    Card Title
  </h3>
  <p className="mt-2 text-zinc-600 dark:text-zinc-400">
    Card description
  </p>
</div>
```

### Form Elements

```tsx
<label className="block">
  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
    Email
  </span>
  <input
    type="email"
    className="
      mt-1 block w-full rounded-lg
      border border-zinc-300 dark:border-zinc-700
      bg-white dark:bg-zinc-800
      px-3 py-2 text-zinc-900 dark:text-zinc-100
      placeholder:text-zinc-400
      focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20
      transition-colors duration-200
    "
    placeholder="you@example.com"
  />
</label>
```

## Layout Patterns

### Page Layout

```tsx
<div className="min-h-screen flex flex-col">
  <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
    {/* Navigation */}
  </header>
  <main className="flex-1">
    {/* Page content */}
  </main>
  <footer className="border-t border-zinc-200 dark:border-zinc-800">
    {/* Footer */}
  </footer>
</div>
```

### Content Container

```tsx
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Grid Layouts

```tsx
// Responsive grid
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

## Typography Scale

Use consistent typography with Geist font:

```tsx
// Headings
<h1 className="text-4xl font-bold tracking-tight">Page Title</h1>
<h2 className="text-3xl font-semibold tracking-tight">Section</h2>
<h3 className="text-2xl font-semibold">Subsection</h3>
<h4 className="text-xl font-medium">Card Title</h4>

// Body
<p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">Body text</p>
<p className="text-sm text-zinc-500 dark:text-zinc-500">Small/caption text</p>
```

## Color System

Use semantic color tokens with zinc as the neutral palette:

| Purpose | Light | Dark |
|---------|-------|------|
| Background | `bg-white` | `dark:bg-zinc-900` |
| Surface | `bg-zinc-50` | `dark:bg-zinc-800` |
| Border | `border-zinc-200` | `dark:border-zinc-700` |
| Text primary | `text-zinc-900` | `dark:text-zinc-100` |
| Text secondary | `text-zinc-600` | `dark:text-zinc-400` |
| Text muted | `text-zinc-400` | `dark:text-zinc-500` |

## Animation Guidelines

```tsx
// Subtle hover transition
className="transition-colors duration-200"

// Card elevation
className="transition-shadow duration-200 hover:shadow-md"

// Scale on press
className="transition-transform duration-150 active:scale-95"

// Fade in
className="animate-in fade-in duration-300"
```

Always respect reduced motion:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

## Loading & Empty States

```tsx
// Loading skeleton
<div className="animate-pulse space-y-4">
  <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
  <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
</div>

// Empty state
<div className="flex flex-col items-center justify-center py-12 text-center">
  <svg className="h-12 w-12 text-zinc-400" /* icon */ />
  <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
    No items yet
  </h3>
  <p className="mt-2 text-sm text-zinc-500">
    Get started by creating your first item.
  </p>
  <button className="mt-4 ...">Create Item</button>
</div>
```

## Accessibility Requirements

1. **Color contrast**: 4.5:1 for normal text, 3:1 for large text
2. **Focus indicators**: Visible focus rings on all interactive elements
3. **Alt text**: All images must have descriptive alt text
4. **Aria labels**: Icon-only buttons need `aria-label`
5. **Keyboard navigation**: All functionality accessible via keyboard
6. **Semantic HTML**: Use proper heading hierarchy, landmarks, lists
7. **Form labels**: Every input must have an associated label
8. **Error messages**: Connected to inputs via `aria-describedby`
