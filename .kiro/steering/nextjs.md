---
inclusion: auto
---

# Next.js 16 Agent

You are a Next.js 16 specialist. Apply these best practices when writing or reviewing Next.js code in this project.

## Critical Warning

This project uses **Next.js 16.2.6** which has breaking changes from earlier versions. Always consult `node_modules/next/dist/docs/` when unsure about APIs.

## File Conventions

### Project Structure

```
src/app/
├── layout.tsx          # Root layout (required)
├── page.tsx            # Home page (/)
├── loading.tsx         # Loading UI (Suspense boundary)
├── error.tsx           # Error UI (Error boundary)
├── not-found.tsx       # 404 UI
├── global-error.tsx    # Global error UI
├── route.ts            # API endpoint
├── template.tsx        # Re-rendered layout
├── default.tsx         # Parallel route fallback
├── blog/
│   ├── page.tsx        # /blog
│   └── [slug]/
│       └── page.tsx    # /blog/:slug
└── (group)/            # Route group (no URL impact)
    └── page.tsx
```

### Route Segments

```
[slug]/             # Dynamic segment: /:slug
[...slug]/          # Catch-all: /a/b/c
[[...slug]]/        # Optional catch-all: / or /a/b/c
(marketing)/        # Route group (ignored in URL)
_components/        # Private folder (not a route)
```

## RSC Boundaries

### Async Client Components Are INVALID

Client components **cannot** be async. Only Server Components can be async.

```tsx
// BAD: async client component
'use client'
export default async function UserProfile() {
  const user = await getUser() // CANNOT await in client component
  return <div>{user.name}</div>
}

// GOOD: Fetch in server parent, pass data down
// page.tsx (server component)
export default async function Page() {
  const user = await getUser()
  return <UserProfile user={user} />
}

// UserProfile.tsx (client component)
'use client'
export function UserProfile({ user }: { user: User }) {
  return <div>{user.name}</div>
}
```

### Non-Serializable Props

Props passed from Server → Client must be JSON-serializable:

| Pattern | Valid? | Fix |
|---------|--------|-----|
| Pass `() => {}` to client | No | Define in client or use server action |
| Pass `new Date()` to client | No | Use `.toISOString()` |
| Pass `new Map()` to client | No | Convert to object/array |
| Pass class instance to client | No | Pass plain object |
| Pass server action to client | Yes | Functions with `'use server'` are OK |
| Pass `string/number/boolean` | Yes | — |
| Pass plain object/array | Yes | — |

## Async Patterns (Next.js 15+)

`params` and `searchParams` are now async:

```tsx
// Page with dynamic params
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <div>{slug}</div>
}

// Page with search params
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  return <div>Search: {q}</div>
}
```

`cookies()` and `headers()` are also async:

```tsx
import { cookies, headers } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const headersList = await headers()
  // ...
}
```

## Middleware / Proxy (v16)

In Next.js 16, middleware is renamed to proxy:

| Version | File | Export | Config |
|---------|------|--------|--------|
| v14-15 | `middleware.ts` | `middleware()` | `config` |
| v16+ | `proxy.ts` | `proxy()` | `config` |

**Note**: This project currently uses `middleware.ts` with Clerk. If upgrading, rename to `proxy.ts`.

```typescript
// proxy.ts (Next.js 16+)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## Directives

```tsx
'use client'   // Mark as Client Component (React)
'use server'   // Mark as Server Action (React)
'use cache'    // Enable caching (Next.js)
```

## Data Patterns

### Server Components (preferred for data fetching)

```tsx
// Direct data fetching in Server Components
export default async function Page() {
  const data = await db.query.posts.findMany()
  return <PostList posts={data} />
}
```

### Server Actions (for mutations)

```tsx
// src/app/actions.ts
'use server'

import { db } from '@/db'
import { posts } from '@/db/schema'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  await db.insert(posts).values({
    title: formData.get('title') as string,
  })
  revalidatePath('/posts')
}
```

### Route Handlers (for external APIs)

```tsx
// src/app/api/posts/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'

export async function GET() {
  const posts = await db.query.posts.findMany()
  return NextResponse.json(posts)
}
```

### Avoiding Data Waterfalls

```tsx
// BAD: Sequential fetches
const user = await getUser()
const posts = await getPosts(user.id) // Waits for user

// GOOD: Parallel fetches
const [user, posts] = await Promise.all([
  getUser(),
  getPosts(userId),
])
```

## Error Handling

```tsx
// src/app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

```tsx
// src/app/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find the requested resource.</p>
    </div>
  )
}
```

## Image Optimization

Always use `next/image` over `<img>`:

```tsx
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority  // For above-the-fold images (LCP)
  className="rounded-lg"
/>

// Responsive
<Image
  src="/photo.jpg"
  alt="Photo"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
/>
```

## Font Optimization

This project uses `next/font` with Geist (already configured in layout.tsx):

```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
```

## Metadata

```tsx
// Static metadata
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
}

// Dynamic metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  return {
    title: post.title,
    description: post.excerpt,
  }
}
```

## Loading UI

```tsx
// src/app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 p-8">
      <div className="h-8 w-1/3 rounded bg-zinc-200" />
      <div className="h-4 w-2/3 rounded bg-zinc-200" />
    </div>
  )
}
```

## Parallel Routes

```tsx
// src/app/layout.tsx with parallel routes
export default function Layout({
  children,
  analytics,
  sidebar,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  sidebar: React.ReactNode
}) {
  return (
    <div className="flex">
      <aside>{sidebar}</aside>
      <main>{children}</main>
      {analytics}
    </div>
  )
}
```

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| "async client component" error | `'use client'` + `async function` | Fetch in server parent |
| Hydration mismatch | Browser-only APIs in SSR | Use `useEffect` or dynamic import |
| `params` type error | Not awaiting params | Add `await` — params is a Promise |
| Stale data after mutation | Missing revalidation | Call `revalidatePath()` or `revalidateTag()` |
| Route handler conflicts | `route.ts` + `page.tsx` in same dir | Move one to a different segment |
| Middleware not running | Wrong file location | Must be in project root (or `src/`) |

## Path Alias

This project uses `@/*` → `./src/*`:

```tsx
import { db } from "@/db"
import { users } from "@/db/schema"
```

## Build & Dev Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```
