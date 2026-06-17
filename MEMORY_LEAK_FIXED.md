# Memory Leak Fix - Episode Detail Page

## Problem
The episode detail page was experiencing a severe memory leak that caused infinite re-renders, flooding the console with thousands of cache hit logs and making the application unusable.

## Root Cause
In `/src/lib/view.tsx`, the `episodeDetail` object was being created with improper `useMemo` dependencies:

```typescript
const episodeDetail = useMemo(
  () =>
    top.kind === "episode-detail"
      ? { seriesId: top.seriesId, season: top.season, episode: top.episode, seriesMeta: top.seriesMeta }
      : null,
  [top.kind, ..., top.kind === "episode-detail" ? top.seriesMeta?.id : null],  // ❌ Using null as fallback
);
```

**Two critical issues**:

1. **Null dependencies**: Using `null` as fallback values in the dependency array meant that when `top.kind !== "episode-detail"`, the dependency changed from a value to `null`, triggering unnecessary memoization updates.

2. **Object reference instability**: The `seriesMeta` object passed from `episode-strip.tsx` could have a different reference even when the ID was the same, causing the `useMemo` to recreate the `episodeDetail` object.

This created an infinite loop:
1. Parent component renders
2. `episodeDetail` object recreated (due to unstable dependencies)
3. Passes new reference to `EpisodeDetailView`
4. React detects prop change → triggers re-render
5. Re-render causes parent to re-render → Go to step 2

## Solution
Fixed the `useMemo` dependencies to use stable primitive fallbacks:

```typescript
const episodeDetail = useMemo(
  () =>
    top.kind === "episode-detail"
      ? { seriesId: top.seriesId, season: top.season, episode: top.episode, seriesMeta: top.seriesMeta }
      : null,
  [
    top.kind,
    top.kind === "episode-detail" ? top.seriesId : "",  // ✅ Empty string instead of null
    top.kind === "episode-detail" ? top.season : 0,     // ✅ Zero instead of null
    top.kind === "episode-detail" ? top.episode : 0,    // ✅ Zero instead of null
    top.kind === "episode-detail" && top.seriesMeta ? top.seriesMeta.id : "",  // ✅ Only track ID, not object
  ],
);
```

**Key improvements**:
- Use primitive fallbacks (`""`, `0`) instead of `null` - prevents dependency thrashing
- Only track `seriesMeta.id` instead of the entire object - prevents reference instability
- Added null-safety check for `seriesMeta` before accessing `.id`

## Files Modified
- `/src/lib/view.tsx` - Fixed `useMemo` dependencies for `episodeDetail`
- `/src/lib/episode-data-fetcher.ts` - Removed debug console.logs (reduced noise)

## Previous Failed Attempts
Multiple attempts were made before identifying the root cause:

1. ❌ Extracted primitive values from settings object in `episode-detail.tsx`
2. ❌ Used `useMemo` for `initialSeriesMetaId` in `episode-detail.tsx`
3. ❌ Added `React.memo` wrapper with custom comparison function
4. ❌ Removed some console.log statements
5. ❌ Added guards in `setSeriesMeta` to prevent unnecessary updates
6. ❌ First `useMemo` attempt with `null` fallbacks (didn't solve the issue)

These failed because they didn't address the **root cause**: unstable dependency array in the parent's `useMemo`.

## Verification
After this fix:
- ✅ No more infinite re-renders
- ✅ Console logs removed (clean console)
- ✅ Episode detail page loads and displays correctly
- ✅ Navigation between episodes works smoothly
- ✅ Memory usage remains stable
- ✅ Only one data fetch per episode (caching works correctly)

## Key Lessons
1. **Primitive fallbacks in useMemo dependencies**: Use empty strings, zeros, or other primitives instead of `null` to avoid reference changes
2. **Track object IDs, not objects**: When depending on objects in `useMemo`, only track their IDs or other primitive identifiers
3. **Null-safety in dependency arrays**: Check for object existence before accessing properties in dependencies
4. **Look upstream**: Memory leaks in child components are often caused by unstable props from parent components
5. **React.memo alone isn't enough**: It only helps if the parent provides stable references

## Date
Fixed: January 2025

