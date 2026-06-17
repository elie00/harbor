# Memory Leak Fix - Episode Detail Page

## Issue Summary
Severe memory leak causing infinite re-renders in `/src/views/episode-detail.tsx`:
- Console flooded with continuous "Cache hit" logs
- App crashes due to infinite render loop
- Previous partial fix (extracting primitive values from settings) did not resolve the issue

## Root Cause Analysis

### Primary Issue: Unstable Object Reference in Dependencies
The main culprit was in the first `useEffect` that handles series metadata:

```typescript
useEffect(() => {
  if (initialSeriesMeta) {
    setSeriesMeta(initialSeriesMeta);  // ← Triggers re-render
    return;
  }
  // ...
}, [seriesId, initialSeriesMeta, t]);  // ← initialSeriesMeta is a full object
```

**The Problem:**
1. Parent component passes `initialSeriesMeta` as a prop
2. If the parent re-renders, it may pass a new object reference (even with identical content)
3. Effect detects dependency change → runs again
4. Calls `setSeriesMeta(initialSeriesMeta)` → triggers re-render
5. Parent passes new reference again → **infinite loop**

This is a classic React pitfall: object dependencies in `useEffect` must be stable references.

## Applied Fixes

### Fix 1: Extract Stable ID from Object
```typescript
// Before
useEffect(() => {
  // ...
}, [seriesId, initialSeriesMeta, t]);

// After
const initialSeriesMetaId = initialSeriesMeta?.id;

useEffect(() => {
  // ...
}, [seriesId, initialSeriesMetaId, t]);  // ← Now depends on string, not object
```

### Fix 2: Conditional setState to Prevent Unnecessary Updates
```typescript
if (initialSeriesMeta) {
  setSeriesMeta(prev => {
    // Only update if ID actually changed
    if (prev?.id === initialSeriesMeta.id) {
      return prev;  // ← Prevents setState if content is same
    }
    return initialSeriesMeta;
  });
  return;
}
```

This ensures we don't trigger a state update if we already have the correct data.

### Fix 3: Extract Primitive Values from Settings (Already Applied)
```typescript
// Extract stable primitive values instead of using entire settings object
const tmdbKey = settings.tmdbKey;
const mdblistKey = settings.mdblistKey;
const instantPlay = settings.instantPlay;
const showRtBadge = settings.showRtBadge;
```

### Fix 4: Use seriesMetaId Instead of Full seriesMeta Object
```typescript
// Before
useEffect(() => {
  if (!seriesMeta) return;
  // ...
}, [seriesId, seriesMeta, season, episode, settings, t]);

// After  
const seriesMetaId = seriesMeta?.id;

useEffect(() => {
  if (!seriesMeta || !seriesMetaId) return;
  // ...
}, [seriesId, seriesMetaId, season, episode, tmdbKey, t]);
```

## Debug Logging Added

Comprehensive debug logs have been added to track:
- Render count
- Effect triggers
- State changes
- Hook execution

To view the logs:
1. Open the episode detail page
2. Open browser DevTools console
3. Look for `[DEBUG]` prefixed messages

Example output:
```
[DEBUG] ===== RENDER #1 =====
[DEBUG] EpisodeDetailView render
[DEBUG] State values { hasSeriesMeta: true, ... }
[DEBUG] Effect 1: Fetch series metadata - triggered
[DEBUG] Effect 1: SeriesMeta already set with same ID, skipping setState
[DEBUG] Rating hooks about to run
```

## Testing the Fix

### Success Criteria
✅ No infinite re-renders
✅ Console logs stabilize (no continuous output)
✅ App remains stable when viewing episode details
✅ All functionality continues to work:
   - TMDB data loads correctly
   - Ratings display properly
   - Play button functions
   - Navigation works

### How to Test
1. Navigate to any episode detail page
2. Open browser console
3. Verify render count stabilizes (should be ~2-3 renders, not hundreds)
4. Verify "Cache hit" logs stop appearing continuously
5. Test all features (play, navigation, ratings, etc.)

## Additional Observations

### Why "Cache hit" Was Flooding the Console
The `useMdblistScores` hook was logging "Cache hit" every time it ran. With infinite re-renders, this created the flood of console logs. The hook itself was not the problem - it was being called repeatedly due to the parent component's render loop.

### Future Prevention
To prevent similar issues:

1. **Always use primitive values in dependencies when possible**
   ```typescript
   // ❌ Bad
   useEffect(() => {}, [object]);
   
   // ✅ Good
   const objectId = object?.id;
   useEffect(() => {}, [objectId]);
   ```

2. **Use useMemo for derived objects**
   ```typescript
   const stableObject = useMemo(() => ({
     key1: value1,
     key2: value2,
   }), [value1, value2]);
   ```

3. **Use useCallback for function dependencies**
   ```typescript
   const stableHandler = useCallback(() => {
     // ...
   }, [dependencies]);
   ```

4. **Guard against unnecessary setState calls**
   ```typescript
   setState(prev => {
     if (prev === newValue) return prev;
     return newValue;
   });
   ```

## Removal of Debug Logs

Once the fix is confirmed working, remove all debug console.log statements:
- Search for `console.log('[DEBUG]')`
- Remove all matching lines
- Keep only the original error logging

## Related Files
- `/src/views/episode-detail.tsx` - Fixed file
- `/src/lib/settings.tsx` - Settings provider (already uses useMemo)
- `/src/lib/providers/mdblist.ts` - MDBList hook (not the problem)
- `/src/lib/providers/omdb.ts` - OMDB hook (not the problem)
