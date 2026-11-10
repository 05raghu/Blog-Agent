# Gen UI Infrastructure

Generative UI for Blog Agent - AI-powered, dynamically-generated React components streamed from Claude.

## Architecture

```
User Actions
    ↓
Frontend Component (performance-dashboard-stream.tsx)
    ↓
POST /api/gen-ui/performance-dashboard
    ↓
Fetch Article + Metrics Data
    ↓
Claude API (streaming)
    ├─ System: Design token prompt + component rules
    ├─ User: Article context + metrics data
    └─ Tools: fetch_metric_history, generate_healing_proposal, check_index_status
    ↓
Stream JSX Response
    ↓
Safe Renderer (validate + render)
    ↓
Interactive Dashboard UI
```

## Files

### Core Infrastructure
- **types.ts** - TypeScript interfaces for Gen UI context and data structures
- **claude-dashboard.ts** - Claude integration with tools and streaming
- **safe-renderer.tsx** - Component validation, sanitization, and error boundaries

### Frontend
- **components/gen-ui/performance-dashboard-stream.tsx** - Streaming consumer component
- **app/performance-gen-ui/page.tsx** - Test page for dashboard

### API
- **app/api/gen-ui/performance-dashboard/route.ts** - Streaming endpoint

## Usage

### Basic Example

```tsx
import { PerformanceDashboardStream } from '@/components/gen-ui/performance-dashboard-stream';

export default function Page() {
  return (
    <PerformanceDashboardStream
      articleId="article-uuid"
      onError={(error) => console.error(error)}
    />
  );
}
```

### Test the Dashboard

1. Navigate to `/performance-gen-ui`
2. Enter an article ID or select from recent articles
3. Claude generates a dashboard in real-time

## How It Works

### 1. Frontend Initiates Request
```tsx
const response = await fetch('/api/gen-ui/performance-dashboard', {
  method: 'POST',
  body: JSON.stringify({ articleId })
});
```

### 2. API Fetches Context Data
- Article details from Supabase
- Latest metric snapshot (GA4, GSC data)
- Historical metrics (7-day trends)
- Calculates trend percentages

### 3. Claude Generates JSX
The API calls Claude with:
- **System prompt**: Design tokens, component rules, Tailwind classes
- **User prompt**: Article title, metrics, trends, data completeness
- **Tools**: Optional tool calls for advanced proposals

Claude returns React JSX components like:
```jsx
<div className="grid grid-cols-4 gap-4">
  <div className="bg-white rounded-lg p-4 border border-slate-200">
    <p className="text-xs text-slate-600">Impressions</p>
    <p className="text-2xl font-bold text-ink-950">12,543</p>
    <p className="text-xs text-green-600">+12% vs last week</p>
  </div>
  {/* More cards... */}
</div>
```

### 4. Streaming Response
The API streams JSX text back to the client:
- Shows loading spinner during generation
- Accumulates JSX chunks in real-time
- Displays progress bar

### 5. Safe Rendering
The `GenUIErrorBoundary` wrapper:
- Catches rendering errors
- Validates component names against allowlist
- Sanitizes props (removes dangerous attributes)
- Blocks javascript: and data: URLs

## Security

### Component Allowlist
Only these HTML elements are allowed in Gen UI:
- Semantic: div, p, span, section, article, header, footer
- Headings: h1–h6
- Lists: ul, ol, li
- Tables: table, thead, tbody, tr, td, th
- Links/Media: a, img, svg (with svg sub-elements)
- Buttons and interactive elements

### Attribute Allowlist
Safe attributes include:
- Styling: className, style, id
- Accessibility: aria-label, aria-describedby, role, tabIndex
- Data: data-testid
- Event handlers: onClick, onMouseEnter, onMouseLeave, onFocus, onBlur
- Element-specific: src, alt, href, target, rel, etc.

### Dangerous Patterns Blocked
- eval()
- Function()
- setTimeout/setInterval
- fetch() (only allowed via controlled tools)
- window, document access
- innerHTML, dangerouslySetInnerHTML
- javascript: and data: URLs

## Next Steps

### Phase 1: Safe JSX Rendering (In Progress)
- [ ] Integrate @babel/parser to parse JSX strings
- [ ] Create React Element tree from parsed JSX
- [ ] Render safely without eval()
- [ ] Add unit tests for component validation

### Phase 2: Interactive Components
- [ ] Make metric cards clickable (drill-down to sources)
- [ ] Add healing proposal approval UI
- [ ] Build action buttons (refresh links, update CTA, etc.)
- [ ] Real-time metric updates via websocket/polling

### Phase 3: Advanced Features
- [ ] Tool-calling UI (healing proposals, link checks)
- [ ] Export dashboard as PDF/screenshot
- [ ] A/B test different dashboard layouts via prompt variations
- [ ] Cache generated components per (article, metrics_version) tuple

### Phase 4: Performance Optimization
- [ ] Memoize components to avoid re-renders
- [ ] Lazy load metrics on demand
- [ ] Cache metric snapshots
- [ ] Implement request deduplication

## API Reference

### POST /api/gen-ui/performance-dashboard

**Request:**
```json
{
  "articleId": "uuid"
}
```

**Response:**
```
Content-Type: text/event-stream

<div className="grid...">
  <!-- Streamed React JSX -->
</div>
```

**Tools Available to Claude:**
- `get_metric_history(articleId, window: '7d'|'30d'|'90d')`
- `generate_healing_proposal(articleId, issueType)`
- `check_index_status(articleId)`

## Testing

### Manual Testing
1. Go to `/performance-gen-ui`
2. Paste an article UUID
3. Wait for dashboard generation
4. Check browser console for errors
5. Review generated JSX in details section

### Unit Testing
```tsx
import { GenUIErrorBoundary } from '@/lib/gen-ui/safe-renderer';

test('sanitizes dangerous attributes', () => {
  // Test attribute filtering
});

test('blocks javascript: URLs', () => {
  // Test URL validation
});
```

## Troubleshooting

### Dashboard Not Generating
- Check that article has metrics data (may take 24 hours after publishing)
- Verify ANTHROPIC_API_KEY is set in environment
- Check browser console for errors
- Verify workspace authentication token

### JSX Not Rendering
- Gen UI currently shows JSX code, not rendered components
- Safe rendering system in development
- Check "View Generated JSX Code" section for errors

### Metrics Data Missing
- Ensure GA4 and GSC integrations are configured
- Run metric sync manually if needed
- Check metric_snapshots table in Supabase

## Design Tokens

Gen UI uses Codewave design tokens (from `codewave.tokens.json`):

**Colors:**
- Primary: `signal` (#A8DDE8) - highlights, active states
- Dark: `ink-950` (#0A0A0B) - text, headers
- Light: `paper` (#F7F6F2) - backgrounds
- Neutral: `slate-*` - borders, secondary text

**Spacing:**
- Base unit: 4px (Tailwind default)
- Use: p-4, gap-4, rounded-lg

**Typography:**
- Bold headers: font-bold, text-2xl
- Medium weight: font-semibold
- Regular: default

## Related Files

- Brand guidelines: `/docs/brand/BRAND-CONTEXT.md`
- Image generation: `/packages/integrations/src/image-model/`
- Text model provider: `/packages/integrations/src/text-model/`
- Metrics schema: `/packages/db/src/schema.ts` (metric_snapshots)
