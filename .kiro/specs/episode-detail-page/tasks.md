# Implementation Plan: Episode Detail Page

## Overview

This implementation plan creates a new Episode Detail Page for Harbor that displays comprehensive episode information before playback. The page will fetch data from TMDB API with Cinemeta fallback, reuse existing UI components from detail.tsx, and integrate with the existing navigation system.

## Tasks

- [x] 1. Set up data models and types
  - Create TypeScript types for episode data structures
  - Define `EpisodeDetail`, `GuestStar`, `CrewMember`, `StillImage` types
  - Define `EpisodeCacheEntry` type for caching
  - Define TMDB API response types (`TmdbEpisodeResponse`)
  - _Requirements: 3, 4, 5, 7_

- [x] 2. Implement TMDB episode API integration
  - [x] 2.1 Create TMDB episode details fetcher
    - Create `src/lib/providers/tmdb/tmdb-episode-details.ts`
    - Implement `tmdbEpisodeDetail()` function to fetch episode metadata from TMDB API
    - Include `append_to_response=credits,images` parameter
    - Transform TMDB response to `EpisodeDetail` type
    - Limit stills to 12 images
    - Handle errors and return null on failure
    - _Requirements: 4.1, 4.2, 4.3, 5.1_
  
  - [x] 2.2 Implement episode data caching
    - Create `src/lib/providers/tmdb/tmdb-episode-cache.ts`
    - Implement `getCachedEpisode()` function with cache key format `episode:${seriesId}:${season}:${episode}`
    - Implement `cacheEpisode()` function with 24-hour TTL
    - Implement `clearEpisodeCache()` function
    - Add cache size limit (100 entries with LRU eviction)
    - _Requirements: 4.5_
  
  - [x] 2.3 Create Cinemeta fallback handler
    - Create `src/lib/cinemeta-episode.ts`
    - Implement `cinemetaEpisodeDetail()` function to extract episode data from series meta
    - Map Cinemeta video data to partial `EpisodeDetail` structure
    - Handle missing fields gracefully with defaults
    - _Requirements: 10.1, 10.2_
  
  - [x] 2.4 Implement unified data fetcher
    - Create `src/lib/episode-data-fetcher.ts`
    - Implement `fetchEpisodeData()` function that orchestrates cache → TMDB → Cinemeta fallback
    - Implement `extractTmdbId()` helper for ID extraction from different formats
    - Add comprehensive error handling with logging
    - Cache successful fetches from both TMDB and Cinemeta
    - _Requirements: 4.1, 4.4, 10.1, 10.2, 10.3_

- [ ]* 2.5 Write integration tests for data fetching
  - Test cache hit/miss scenarios
  - Test TMDB fetch success and failure
  - Test Cinemeta fallback logic
  - Test data transformation and validation
  - Test cache TTL expiration
  - _Requirements: 4, 10_

- [x] 3. Checkpoint - Verify data fetching
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4 Update ViewProvider for episode detail navigation
  - [x] 4.1 Add episode detail frame type
    - Open `src/lib/view.tsx`
    - Add `{ kind: "episode-detail"; seriesId: string; season: number; episode: number; seriesMeta?: Meta }` to `Frame` union type
    - _Requirements: 1.1, 1.2_
  
  - [x] 4.2 Add episode detail navigation helpers
    - Add `episodeDetail` state to `ViewValue` type
    - Implement `openEpisodeDetail(seriesId, season, episode, seriesMeta?)` function
    - Add computed `episodeDetail` value from frame stack
    - Export in context provider
    - _Requirements: 2.2, 9.3, 9.4_

- [ ]* 4.3 Write unit tests for navigation helpers
  - Test `openEpisodeDetail()` pushes correct frame
  - Test `episodeDetail` state extraction
  - Test navigation state management
  - _Requirements: 1, 2, 9_

- [x] 5. Create EpisodeDetailView main component
  - [x] 5.1 Create main view component structure
    - Create `src/views/episode-detail.tsx`
    - Define `EpisodeDetailViewProps` interface
    - Implement component scaffold with state management (loading, error, episodeData, seriesMeta)
    - Add data fetching effect with cleanup
    - Add loading skeleton component
    - Add error display component with retry and back actions
    - _Requirements: 3, 10.3, 10.4_
  
  - [x] 5.2 Implement series metadata fetching
    - Fetch series meta if not provided in props
    - Handle series fetch errors
    - Set loading state appropriately
    - _Requirements: 10.2_
  
  - [x] 5.3 Implement episode data fetching
    - Call `fetchEpisodeData()` with all required parameters
    - Handle loading states
    - Handle error states with user-friendly messages
    - Implement effect cleanup to prevent state updates on unmounted component
    - _Requirements: 4, 10_

- [ ]* 5.4 Write unit tests for EpisodeDetailView
  - Test loading state display
  - Test successful data fetch and render
  - Test error state display
  - Test navigation interactions
  - Test effect cleanup
  - _Requirements: 3, 4, 10_

- [x] 6. Implement EpisodeHero component
  - [x] 6.1 Create hero component
    - Create `EpisodeHero` component in `src/views/episode-detail.tsx`
    - Define `EpisodeHeroProps` interface
    - Reuse hero section layout pattern from `detail.tsx`
    - Display episode backdrop/still as background with gradient overlays
    - Display series name as clickable breadcrumb
    - Display episode title in format "S{season}E{episode} - {title}"
    - Add metadata pills for air date, rating, runtime
    - Add primary play button with `PlayModeHint`
    - Implement click handlers for series navigation and play action
    - _Requirements: 3.1, 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.4, 9.1, 9.2_

- [ ]* 6.2 Write unit tests for EpisodeHero
  - Test rendering with complete data
  - Test rendering with missing optional fields
  - Test series name click navigation
  - Test play button click behavior
  - Test metadata display formatting
  - _Requirements: 3, 6, 8, 9_

- [x] 7. Implement episode information sections
  - [x] 7.1 Create EpisodeInfoSection component
    - Create `EpisodeInfoSection` component in `src/views/episode-detail.tsx`
    - Define `EpisodeInfoSectionProps` interface
    - Reuse `Synopsis` component for episode overview
    - Display formatted metadata (season, episode, air date, runtime, rating)
    - Implement expandable description for long text
    - Add responsive layout
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 12.3_
  
  - [x] 7.2 Create EpisodeStillsGallery component
    - Create `EpisodeStillsGallery` component in `src/views/episode-detail.tsx`
    - Define `EpisodeStillsGalleryProps` interface
    - Reuse `MediaGallery` component from `detail.tsx`
    - Display up to 12 episode stills
    - Implement lazy loading for images
    - Add lightbox functionality on click
    - Use grid layout with responsive sizing
    - Conditionally render only when stills are available
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 12.5_
  
  - [x] 7.3 Create GuestStarsSection component
    - Create `GuestStarsSection` component in `src/views/episode-detail.tsx`
    - Define `GuestStarsSectionProps` interface
    - Reuse `CastCard` component from `detail.tsx`
    - Display guest stars in horizontal scrollable row
    - Show character names alongside actor names
    - Add profile images with fallback
    - Link to person detail pages
    - Conditionally render only when guest stars are available
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 12.4_

- [ ]* 7.4 Write unit tests for episode sections
  - Test EpisodeInfoSection with complete and partial data
  - Test EpisodeStillsGallery rendering and interactions
  - Test GuestStarsSection rendering and navigation
  - Test conditional rendering of optional sections
  - _Requirements: 3, 5, 7, 12_

- [x] 8 Assemble complete EpisodeDetailView layout
  - Wire all section components together in main view
  - Add section headings with i18n
  - Implement responsive layout with proper spacing
  - Add graceful degradation for missing sections
  - Pass navigation callbacks to interactive elements
  - _Requirements: 3, 5, 6, 7, 10.4, 12_

- [x] 9 Checkpoint - Verify episode detail view
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update episode card components for navigation
  - [x] 10.1 Update EpisodeRow component
    - Open `src/views/detail/series-episode-row.tsx`
    - Add `openEpisodeDetail` from `useView()` hook
    - Split click handlers: episode clickable area → `openEpisodeDetail()`, play button → `openPicker()`
    - Add visual hover states to distinguish clickable areas
    - Add Eye icon overlay on thumbnail hover
    - Maintain episode number badge
    - Use `e.stopPropagation()` on play button to prevent bubbling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 11.2_
  
  - [x] 10.2 Update EpisodeStrip component
    - Open `src/views/detail/episode-strip.tsx`
    - Add `openEpisodeDetail` from `useView()` hook
    - Split click handlers: card click → `openEpisodeDetail()`, play button overlay → `openPicker()`
    - Add play button overlay that appears on hover
    - Maintain episode number badge and watch status indicator
    - Use `e.stopPropagation()` on play button to prevent bubbling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 11.3_
  
  - [x] 10.3 Update Series Episodes component
    - Open `src/views/detail/series-episodes.tsx` (or main episode list component)
    - Verify integration with updated episode card components
    - Ensure episode cards receive correct click handler props
    - _Requirements: 11.1_

- [ ]* 10.4 Write unit tests for updated episode cards
  - Test episode area click navigation
  - Test play button click behavior
  - Test click event propagation prevention
  - Test hover state visual feedback
  - _Requirements: 2, 11_

- [x] 11. Integrate EpisodeDetailView into App.tsx
  - [x] 11.1 Add lazy import for EpisodeDetailView
    - Open `src/App.tsx`
    - Add lazy import: `const EpisodeDetailView = lazy(() => import("@/views/episode-detail").then((m) => ({ default: m.EpisodeDetailView })))`
    - _Requirements: 1.2_
  
  - [x] 11.2 Add episode detail to Shell component
    - Extract `episodeDetail` and `stackKinds` from `useView()`
    - Add `episodeDetailTop` and `episodeDetailAlive` state using `useKeepAlive()`
    - Add conditional render block for episode detail view with Suspense
    - Use unique key based on `seriesId-season-episode` for proper remounting
    - Apply proper layering with `layer()` helper
    - _Requirements: 1.2, 9.4_

- [ ]* 11.3 Write integration tests for App.tsx routing
  - Test episode detail route rendering
  - Test view lifecycle management
  - Test navigation between views
  - _Requirements: 1_

- [x] 12 Add internationalization strings
  - Open `src/lib/i18n/locales/en.ts` (and other locale files)
  - Add strings for: "Episode Not Found", "Episode information is not available", "Unable to connect", "Stills", "Guest Stars", "Overview", "Go Back", "Retry"
  - Add Arabic translations if Arabic locale is supported
  - _Requirements: 3, 10_

- [x] 13. Final checkpoint and verification
  - [x] 13.1 Manual testing checklist
    - Test direct navigation to episode detail route
    - Test navigation from episode cards (name/image click)
    - Test play button behavior (direct to picker)
    - Test series name breadcrumb navigation
    - Test back button behavior
    - Test TMDB data display (stills, guest stars, metadata)
    - Test fallback to Cinemeta when TMDB unavailable
    - Test error states and retry functionality
    - Test loading states
    - Test responsive layout on different screen sizes
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10_
  
  - [x] 13.2 Cross-browser verification
    - Test in Chrome, Firefox, Safari, Edge
    - Verify image loading and lazy loading
    - Verify hover states and interactions
    - _Requirements: All_
  
  - [x] 13.3 Performance verification
    - Verify cache is working (check network tab for duplicate requests)
    - Verify lazy loading of images
    - Verify component reuse (check console for unnecessary re-renders)
    - _Requirements: 4.5, 5.4, 12_

- [x] 14 Final checkpoint - Complete feature verification
  - Ensure all manual tests pass and feature works end-to-end
  - Ensure all automatic tests pass
  - Ask the user if any issues or questions arise

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP delivery
- The implementation reuses existing components (Hero, Synopsis, CastCard, MediaGallery) from detail.tsx for consistency
- TMDB API integration includes automatic fallback to Cinemeta for robustness
- Caching strategy reduces API calls and improves performance
- All navigation updates maintain backward compatibility with existing play button behavior
- Component-level error handling ensures graceful degradation when data is unavailable
- The route pattern `/detail/:seriesId/episode/:season/:episode` integrates naturally with the existing routing structure
