import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { resolveAddonLogo } from "@/components/addon-logo";
import { useAuth } from "@/lib/auth";
import type { Meta } from "@/lib/cinemeta";
import { useDebridClients } from "@/lib/debrid/registry";
import { useTogether } from "@/lib/together/provider";
import { buildPlayInvite } from "@/lib/together/build-invite";
import { consumeRecentStubEvent, isStreamDead } from "@/lib/dead-streams";
import { readPlayback } from "@/lib/playback-history";
import { useSettings } from "@/lib/settings";
import type { ScoredStream, Tier } from "@/lib/streams/types";
import { useView, type PlayEpisode } from "@/lib/view";
import { AutoExhaustedModal } from "./play-picker/auto-exhausted-modal";
import { AutoPlayTransition } from "./play-picker/auto-play-transition";
import { BackdropLayer } from "./play-picker/backdrop-layer";
import { CinematicLoader } from "./play-picker/cinematic-loader";
import { DebridDownModal } from "./play-picker/debrid-down-modal";
import { EmptyState, FilteredOutState, NoSourcesState, TheatresEmptyState } from "./play-picker/empty-states";
import { CachedFilterPill, LanguageFilterPill } from "./play-picker/filter-pills";
import { NoSourcesConfiguredModal } from "./play-picker/no-sources-modal";
import {
  hasInstantMarker,
  isWatchHub,
  needsDownload,
  normalizeLangCode,
  streamMatchesLangs,
} from "./play-picker/picker-utils";
import { PickerHeader } from "./play-picker/picker-header";
import { PrimaryCard } from "./play-picker/primary-card";
import { SourceDiagnostic } from "./play-picker/source-diagnostic";
import { StremioLayout } from "./play-picker/stremio-layout";
import { SourceDrawer } from "./play-picker/source-drawer";
import { TierStrip } from "./play-picker/tier-strip";
import { usePickHandler } from "./play-picker/use-pick-handler";
import { useTopStreamVerify } from "./play-picker/use-top-stream-verify";
import { useAddons } from "./play-picker/use-addons";
import { useImdbId } from "./play-picker/use-imdb-id";
import { usePipelineResult } from "./play-picker/use-pipeline-result";
import { useStreamIds } from "./play-picker/use-stream-ids";

const TIER_ORDER: Tier[] = ["4K_DV", "4K_HDR", "4K", "1080p_HDR", "1080p", "720p", "SD", "ROUGH"];
const AUTO_SETTLE_MS = 1500;
const HIGH_CONFIDENCE_GRACE_MS = 350;

export function PlayPicker({
  meta,
  episode,
  autoPlay,
  attempt,
}: {
  meta: Meta;
  episode?: PlayEpisode;
  autoPlay?: boolean;
  attempt?: number;
}) {
  const { openPlayer, openSettings, exitPickerToDetail } = useView();
  const backToDetail = () => exitPickerToDetail(meta);
  const { settings } = useSettings();
  const { authKey } = useAuth();
  const debrids = useDebridClients();
  const { snapshot: roomSnapshot, sendInvite, claimHost, wasInvitedTo } = useTogether();
  const inSession = roomSnapshot.state === "joined";
  const imdbId = useImdbId(meta, settings.tmdbKey);
  const streamIds = useStreamIds(meta, episode, imdbId);
  const { addons, userHasStreamAddons } = useAddons(authKey, settings);
  const [resolving, setResolving] = useState<{ stream: ScoredStream } | null>(null);
  const [failedStreams, setFailedStreams] = useState<Set<ScoredStream>>(new Set());
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [strictMode, setStrictMode] = useState(settings.streamFilterLevel === "strict");
  const [forceShowAll, setForceShowAll] = useState(false);
  const filterDisabled = settings.streamFilterLevel === "off" || forceShowAll;
  const {
    result,
    loading,
    pipelineDone,
    firstResultAt,
    autoSettleReady,
    resolveError,
    setAutoSettleReady,
    setResolveError,
  } = usePipelineResult({
    meta,
    episode,
    imdbId,
    streamIds,
    addons,
    debrids,
    settings,
    strictMode,
    filterDisabled,
  });
  const baseLangs = settings.preferredLanguages ?? [];
  const isAnimeRequest = useMemo(
    () => (streamIds ?? []).some((id) => id.startsWith("kitsu:") || id.startsWith("mal:")),
    [streamIds],
  );
  const preferredLangs = useMemo(() => {
    const codes = settings.preferredAudioLangs ?? [];
    const animeAdd = isAnimeRequest ? ["Japanese"] : [];
    const all = [...baseLangs, ...codes, ...animeAdd];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const lang of all) {
      const code = normalizeLangCode(lang);
      if (!isAnimeRequest && code === "ja") continue;
      if (seen.has(code)) continue;
      seen.add(code);
      out.push(lang);
    }
    return out;
  }, [baseLangs, settings.preferredAudioLangs, isAnimeRequest]);
  const [langFilter, setLangFilter] = useState(
    settings.requirePreferredLanguage === true && baseLangs.length > 0,
  );
  const [cachedOnly, setCachedOnly] = useState(false);

  const inviteKey = `${meta.id}|${episode?.season ?? ""}|${episode?.episode ?? ""}`;
  const canInvite = inSession && !wasInvitedTo(inviteKey);
  const inviteSentRef = useRef<string | null>(null);
  useEffect(() => {
    if (!canInvite) return;
    if (inviteSentRef.current === inviteKey) return;
    inviteSentRef.current = inviteKey;
    claimHost(true);
    sendInvite(buildPlayInvite(meta, episode));
  }, [canInvite, inviteKey, sendInvite, claimHost, meta, episode]);

  useEffect(() => {
    setStrictMode(settings.streamFilterLevel === "strict");
    setForceShowAll(false);
  }, [meta.id, episode?.season, episode?.episode, settings.streamFilterLevel]);

  const isCached = useCallback(
    (s: ScoredStream) =>
      s.url != null ||
      debrids.some((d) => s.cached[d.slug] === true || s.inLibrary[d.slug] === true),
    [debrids],
  );
  const hasStrongAddon = useMemo(
    () => (addons ?? []).some((a) => /mediafusion|comet/i.test(a.manifest?.name ?? "")),
    [addons],
  );
  const isTorrentioStream = useCallback(
    (s: ScoredStream) => /torrentio/i.test(s.addonName ?? ""),
    [],
  );

  const filteredPicker = useMemo(() => {
    if (!result) return null;
    let all = result.picker.all;
    if (langFilter && preferredLangs.length > 0) {
      const langFiltered = all.filter((s) => streamMatchesLangs(s, preferredLangs));
      if (langFiltered.length > 0) all = langFiltered;
    }
    if (cachedOnly && debrids.length > 0) {
      const cached = all.filter(isCached);
      if (cached.length > 0) all = cached;
    }
    const byTier: Partial<Record<Tier, ScoredStream>> = {};
    for (const s of all) if (!byTier[s.tier]) byTier[s.tier] = s;
    const primaryCandidates = [result.picker.primary, ...all].filter(
      (s): s is ScoredStream => s != null && all.includes(s),
    );
    const primary = primaryCandidates[0] ?? null;
    return { primary, byTier, all };
  }, [result, langFilter, preferredLangs, cachedOnly, debrids.length, isCached]);

  const langHiddenCount = useMemo(() => {
    if (!result || preferredLangs.length === 0) return 0;
    return result.picker.all.filter((s) => !streamMatchesLangs(s, preferredLangs)).length;
  }, [result, preferredLangs]);

  const uncachedHiddenCount = useMemo(() => {
    if (!result || debrids.length === 0) return 0;
    return result.picker.all.filter((s) => !isCached(s)).length;
  }, [result, debrids.length, isCached]);

  const populatedTiers = useMemo(
    () => TIER_ORDER.filter((t) => filteredPicker?.byTier[t]),
    [filteredPicker],
  );

  useEffect(() => {
    if (!filteredPicker?.primary) return;
    setSelectedTier((s) => s ?? filteredPicker.primary!.tier);
  }, [filteredPicker]);

  const previousPlayback = useMemo(
    () => readPlayback(meta.id, episode?.season, episode?.episode),
    [meta.id, episode?.season, episode?.episode],
  );

  // Auto candidates = same set the Stremio-style manual layout would surface,
  // top-down. We use the SAME sort the manual list uses (WatchHub last,
  // download/uncached last, then addon rank, then instant marker), then keep
  // only cached entries the picker can actually open without a download wait.
  // If the user rolls back to manual mode, the order they see matches what
  // instant mode just tried.
  const autoCandidates = useMemo<ScoredStream[]>(() => {
    if (!filteredPicker) return [];
    const key = (s: ScoredStream) => s.url ?? s.infoHash ?? `${s.addonId}:${s.title ?? ""}`;
    const addonRank = new Map<string, number>();
    (addons ?? []).forEach((a, i) => {
      if (a.manifest?.id) addonRank.set(a.manifest.id, i);
    });
    const previousMatch = previousPlayback
      ? filteredPicker.all.find((s) => {
          if (
            previousPlayback.infoHash &&
            s.infoHash &&
            s.infoHash.toLowerCase() === previousPlayback.infoHash.toLowerCase()
          ) {
            if (previousPlayback.fileIdx == null || s.fileIdx == null) return true;
            return s.fileIdx === previousPlayback.fileIdx;
          }
          return false;
        }) ?? null
      : null;
    const sorted = filteredPicker.all.slice().sort((a, b) => {
      const aw = isWatchHub(a) ? 1 : 0;
      const bw = isWatchHub(b) ? 1 : 0;
      if (aw !== bw) return aw - bw;
      const ad = needsDownload(a) ? 1 : 0;
      const bd = needsDownload(b) ? 1 : 0;
      if (ad !== bd) return ad - bd;
      if (hasStrongAddon) {
        const at = isTorrentioStream(a) ? 1 : 0;
        const bt = isTorrentioStream(b) ? 1 : 0;
        if (at !== bt) return at - bt;
      }
      if (preferredLangs.length > 0) {
        const al = streamMatchesLangs(a, preferredLangs) ? 0 : 1;
        const bl = streamMatchesLangs(b, preferredLangs) ? 0 : 1;
        if (al !== bl) return al - bl;
      }
      const ar = addonRank.get(a.addonId) ?? 9999;
      const br = addonRank.get(b.addonId) ?? 9999;
      if (ar !== br) return ar - br;
      const ai = hasInstantMarker(a) ? 1 : 0;
      const bi = hasInstantMarker(b) ? 1 : 0;
      if (ai !== bi) return bi - ai;
      return 0;
    });
    const out: ScoredStream[] = [];
    const seen = new Set<string>();
    const push = (s: ScoredStream | null | undefined) => {
      if (!s) return;
      if (isStreamDead(s)) return;
      if (isWatchHub(s)) return;
      if (!isCached(s) && !s.url) return;
      const k = key(s);
      if (seen.has(k)) return;
      seen.add(k);
      out.push(s);
    };
    push(previousMatch);
    for (const s of sorted) push(s);
    return out;
  }, [filteredPicker, previousPlayback, isCached, addons, debrids, hasStrongAddon, isTorrentioStream]);

  const { verifiedUrls, rejectedUrls, verifying } = useTopStreamVerify({
    enabled: pipelineDone && autoCandidates.length > 0,
    candidates: autoCandidates,
  });
  void verifiedUrls;
  void rejectedUrls;

  useEffect(() => {
    if (!autoPlay || autoSettleReady || pipelineDone) return;
    if (firstResultAt == null) return;
    const elapsed = performance.now() - firstResultAt;
    const remaining = Math.max(0, AUTO_SETTLE_MS - elapsed);
    const t = window.setTimeout(() => setAutoSettleReady(true), remaining);
    return () => window.clearTimeout(t);
  }, [autoPlay, autoSettleReady, pipelineDone, firstResultAt]);

  const autoFiredRef = useRef(false);
  const [autoAttemptIdx, setAutoAttemptIdx] = useState(0);
  const [autoExhausted, setAutoExhausted] = useState(false);
  const [autoCancelled, setAutoCancelled] = useState(false);
  const autoActive = !!(autoPlay || wasInvitedTo(inviteKey)) && !autoCancelled && !autoExhausted;
  useEffect(() => {
    if (!autoActive) return;
    const t = window.setTimeout(() => setAutoCancelled(true), 45_000);
    return () => window.clearTimeout(t);
  }, [autoActive]);
  const highConfidenceSinceRef = useRef<number | null>(null);
  const [highConfidenceTick, setHighConfidenceTick] = useState(0);
  useEffect(() => {
    if (!autoActive || autoFiredRef.current || pipelineDone || autoSettleReady) return;
    const top = autoCandidates[0];
    const langOk = preferredLangs.length === 0 || (top != null && streamMatchesLangs(top, preferredLangs));
    if (!top || !hasInstantMarker(top) || !isCached(top) || !langOk || (hasStrongAddon && isTorrentioStream(top))) {
      highConfidenceSinceRef.current = null;
      return;
    }
    const t = window.setTimeout(() => setHighConfidenceTick((n) => n + 1), HIGH_CONFIDENCE_GRACE_MS + 20);
    return () => window.clearTimeout(t);
  }, [autoActive, pipelineDone, autoSettleReady, autoCandidates, isCached, preferredLangs, hasStrongAddon, isTorrentioStream]);
  void highConfidenceTick;
  useEffect(() => {
    if (!autoActive || autoFiredRef.current) return;
    const top = autoCandidates[0];
    const isFirstAttempt = (attempt ?? 0) === 0 && autoAttemptIdx === 0;
    const langOk = preferredLangs.length === 0 || (top != null && streamMatchesLangs(top, preferredLangs));
    const highConfidenceTop =
      top != null && hasInstantMarker(top) && isCached(top) && langOk &&
      (!hasStrongAddon || !isTorrentioStream(top));
    if (isFirstAttempt && !pipelineDone) {
      if (highConfidenceTop) {
        const now = performance.now();
        if (highConfidenceSinceRef.current == null) highConfidenceSinceRef.current = now;
        if (now - highConfidenceSinceRef.current < HIGH_CONFIDENCE_GRACE_MS) return;
      } else {
        highConfidenceSinceRef.current = null;
        if (!autoSettleReady) return;
      }
    }
    if (autoCandidates.length === 0) return;
    if (resolving) return;
    const idx = Math.min((attempt ?? 0) + autoAttemptIdx, autoCandidates.length - 1);
    const pick = autoCandidates[idx];
    if (!pick) return;
    const pickIsCached = isCached(pick);
    const pickInstant = pickIsCached || !!pick.url;
    if (!pickInstant) {
      if (pipelineDone) setAutoCancelled(true);
      return;
    }
    if (
      pipelineDone &&
      pick.url &&
      verifying &&
      !verifiedUrls.has(pick.url) &&
      !rejectedUrls.has(pick.url)
    ) {
      return;
    }
    autoFiredRef.current = true;
    onPlay(pick, false);
  }, [autoActive, attempt, autoCandidates, resolving, autoAttemptIdx, autoSettleReady, pipelineDone, isCached, verifying, verifiedUrls, rejectedUrls, highConfidenceTick, hasStrongAddon, isTorrentioStream]);

  const previousMatch: ScoredStream | null = useMemo(() => {
    if (!filteredPicker || !previousPlayback) return null;
    return (
      filteredPicker.all.find((s) => {
        if (previousPlayback.infoHash && s.infoHash) {
          if (s.infoHash.toLowerCase() !== previousPlayback.infoHash.toLowerCase()) return false;
          if (previousPlayback.fileIdx == null || s.fileIdx == null) return true;
          return s.fileIdx === previousPlayback.fileIdx;
        }
        if (previousPlayback.url && s.url) {
          return s.url === previousPlayback.url;
        }
        return false;
      }) ?? null
    );
  }, [filteredPicker, previousPlayback]);

  const currentPick: ScoredStream | null = useMemo(() => {
    if (!filteredPicker) return null;
    if (selectedTier && filteredPicker.byTier[selectedTier]) {
      return filteredPicker.byTier[selectedTier]!;
    }
    if (previousMatch) return previousMatch;
    return filteredPicker.primary;
  }, [filteredPicker, selectedTier, previousMatch]);

  const { onPlay, onCache, queuedHash, debridDown, resetDebridDown, abortResolve } = usePickHandler({
    meta,
    imdbId,
    episode,
    attempt,
    debrids,
    inSession,
    canInvite,
    inviteSentRef,
    sendInvite,
    claimHost,
    openPlayer,
    autoActive,
    autoAttemptIdx,
    autoCandidatesLength: autoCandidates.length,
    autoFiredRef,
    setAutoAttemptIdx,
    setAutoExhausted,
    setFailedStreams,
    setResolveError,
    setResolving,
  });

  const allCount = filteredPicker?.all.length ?? 0;
  const rawCount =
    (result?.raw.addon.length ?? 0) +
    (result?.raw.library.length ?? 0);
  const addonCount = useMemo(() => {
    if (!filteredPicker) return 0;
    return new Set(filteredPicker.all.map((s) => s.addonId)).size;
  }, [filteredPicker]);
  const addonLogoMap = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const a of addons ?? []) m.set(a.manifest.id, resolveAddonLogo(a.manifest.logo, a.transportUrl));
    return m;
  }, [addons]);
  const lookupLogo = (id: string): string | null => addonLogoMap.get(id) ?? null;
  const usedAddons = useMemo(() => {
    if (!filteredPicker) return [];
    const seen = new Map<string, { id: string; name: string; logo: string | null }>();
    for (const s of filteredPicker.all) {
      if (seen.has(s.addonId)) continue;
      seen.set(s.addonId, { id: s.addonId, name: s.addonName, logo: addonLogoMap.get(s.addonId) ?? null });
    }
    return [...seen.values()];
  }, [result, addonLogoMap]);
  const isStillInTheatres = useMemo(() => {
    if (!result || meta.type !== "movie") return false;
    if (allCount > 0) return false;
    if (rawCount === 0) return false;
    const recentRelease = (() => {
      if (meta.releaseDate) {
        const d = new Date(meta.releaseDate);
        if (!Number.isNaN(d.getTime())) {
          const days = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
          return days >= -30 && days < 90;
        }
      }
      return meta.inTheaters === true;
    })();
    if (!recentRelease) return false;
    const rejected = result.rejected;
    const trashRejections = rejected.filter(
      (r) =>
        r.reason.startsWith("cinema-window-") ||
        r.reason.startsWith("scam-score-") ||
        r.reason.startsWith("size-too-small-") ||
        r.reason === "dead-torrent-zero-seeders" ||
        r.reason.startsWith("suspicious-extension:"),
    ).length;
    return trashRejections >= Math.max(3, Math.floor(rawCount * 0.5));
  }, [result, meta.type, meta.inTheaters, meta.releaseDate, allCount, rawCount]);
  const backdropSrc = episode?.still || meta.background || meta.poster;

  const [maxWaitElapsed, setMaxWaitElapsed] = useState(false);
  useEffect(() => {
    setMaxWaitElapsed(false);
    const t = window.setTimeout(() => setMaxWaitElapsed(true), 30_000);
    return () => window.clearTimeout(t);
  }, [streamIds]);
  const addonsSettled = pipelineDone || maxWaitElapsed;

  const noStreamIds = addonsSettled && (!streamIds || streamIds.length === 0);
  const noDebrids = addonsSettled && !!streamIds && streamIds.length > 0 && debrids.length === 0;
  const noResults =
    addonsSettled && !!streamIds && streamIds.length > 0 && allCount === 0 && debrids.length > 0;
  const terminalEmpty = noStreamIds || noDebrids || noResults;
  const [stubBanner, setStubBanner] = useState<string | null>(null);
  useEffect(() => {
    const ev = consumeRecentStubEvent(8000);
    if (!ev) return;
    setStubBanner(
      "Last source wasn't actually cached on your debrid yet. Pick another from the list.",
    );
    const t = window.setTimeout(() => setStubBanner(null), 6000);
    return () => window.clearTimeout(t);
  }, [streamIds]);
  useEffect(() => {
    if (
      autoPlay &&
      pipelineDone &&
      autoCandidates.length === 0 &&
      !autoExhausted &&
      !autoCancelled
    ) {
      setAutoExhausted(true);
    }
  }, [autoPlay, pipelineDone, autoCandidates.length, autoExhausted, autoCancelled]);

  const showAutoTransition =
    !resolveError &&
    ((autoActive && (streamIds === null || loading || autoCandidates.length > 0)) ||
      resolving != null);
  void terminalEmpty;

  const noSourcesConfigured =
    addons !== null && !userHasStreamAddons && debrids.length === 0;

  if (noSourcesConfigured) {
    return <NoSourcesConfiguredModal meta={meta} />;
  }

  if (showAutoTransition) {
    return (
      <AutoPlayTransition
        meta={meta}
        episode={episode}
        resolving={resolving != null}
        attemptIdx={autoAttemptIdx}
        onCancel={() => {
          abortResolve();
          setResolving(null);
          setAutoCancelled(true);
          backToDetail();
        }}
      />
    );
  }

  if (debridDown) {
    return (
      <DebridDownModal
        meta={meta}
        onTryAgain={resetDebridDown}
        onBack={() => backToDetail()}
      />
    );
  }

  if (autoExhausted) {
    return (
      <AutoExhaustedModal
        meta={meta}
        episode={episode}
        triedCount={autoCandidates.length}
        onBrowseManually={() => {
          setAutoCancelled(true);
          setAutoExhausted(false);
        }}
      />
    );
  }

  return (
    <main className="absolute inset-0 z-50 overflow-y-auto bg-canvas">
      <BackdropLayer src={backdropSrc} />

      {createPortal(
        <button
          type="button"
          onClick={() => backToDetail()}
          aria-label="Back"
          className="fixed left-5 top-5 z-[200] flex h-11 w-11 items-center justify-center rounded-full border border-edge bg-canvas/80 text-ink backdrop-blur-md transition-colors hover:bg-elevated"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>,
        document.body,
      )}

      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col gap-12 px-12 pb-32 pt-32">
        <PickerHeader meta={meta} episode={episode} />

        {stubBanner && (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 px-5 py-4 text-[13.5px] text-amber-100">
            {stubBanner}
          </div>
        )}

        {!addonsSettled && (!filteredPicker || filteredPicker.all.length === 0) && (
          <CinematicLoader meta={meta} />
        )}

        {addonsSettled && (!streamIds || streamIds.length === 0) && (
          <EmptyState
            message="Harbor couldn't resolve a usable ID for this title. Add a TMDB key in Library settings or sign in to Stremio to broaden coverage."
            action={{ label: "Open Library settings", onClick: () => openSettings("library") }}
          />
        )}
        {addonsSettled && streamIds && streamIds.length > 0 && debrids.length === 0 && allCount === 0 && (
          <EmptyState
            message="No playable streams turned up, and no debrid is configured. Real-Debrid, TorBox, AllDebrid, Premiumize, or Debrid-Link will unlock raw torrent results. Some addons bake debrid in (Sootio, Comet/ElfHosted, MediaFusion/ElfHosted) and play without your own keys."
            action={{ label: "Set up a debrid", onClick: () => openSettings("streaming") }}
          />
        )}
        {addonsSettled && streamIds && streamIds.length > 0 && allCount === 0 && debrids.length > 0 && rawCount === 0 && (
          <NoSourcesState
            addonCount={addons?.length ?? 0}
            streamIds={streamIds}
            isAnime={meta.id.startsWith("kitsu:") || meta.id.startsWith("mal:")}
          />
        )}
        {addonsSettled && streamIds && streamIds.length > 0 && allCount === 0 && debrids.length > 0 && rawCount > 0 && isStillInTheatres && (
          <TheatresEmptyState
            meta={meta}
            onShowAll={() => setForceShowAll(true)}
            showingAll={forceShowAll}
          />
        )}
        {addonsSettled && streamIds && streamIds.length > 0 && allCount === 0 && debrids.length > 0 && rawCount > 0 && !isStillInTheatres && (
          <FilteredOutState
            rawCount={rawCount}
            rejected={result?.rejected ?? []}
            strictMode={strictMode || !forceShowAll}
            onSearchWider={() => {
              if (strictMode) setStrictMode(false);
              else setForceShowAll(true);
            }}
          />
        )}

        {pipelineDone && allCount > 0 && allCount <= 2 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/[0.06] px-5 py-3.5 text-[13px] text-ink">
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="font-semibold text-amber-200">
                {allCount === 1 ? "Only 1 source after filtering" : "Only 2 sources after filtering"}
              </p>
              <p className="text-[12.5px] leading-snug text-ink-muted">
                {allCount === 1
                  ? "Clean releases for this title haven't surfaced yet. The result below may not match the title you're looking for, so confirm the filename and size before playing."
                  : "Clean releases for this title are still scarce. Confirm the filename and size before playing."}
                {rawCount - allCount > 0 && !forceShowAll
                  ? ` Harbor dropped ${rawCount - allCount} suspicious or mismatched result${rawCount - allCount === 1 ? "" : "s"}.`
                  : ""}
              </p>
            </div>
            {rawCount - allCount > 0 && !forceShowAll && (
              <button
                onClick={() => setForceShowAll(true)}
                className="shrink-0 rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-[12.5px] font-semibold text-amber-100 transition-[transform,background-color] hover:scale-[1.02] hover:bg-amber-300/20 active:scale-[0.98]"
              >
                Show everything anyway
              </button>
            )}
          </div>
        )}

        {settings.pickerLayout === "stremio" && filteredPicker && filteredPicker.all.length > 0 ? (
          <StremioLayout
            streams={filteredPicker.all}
            addons={addons}
            pipelineDone={pipelineDone}
            loadingAddonCount={Math.max(0, (addons?.length ?? 0) - addonCount)}
            failedStreams={failedStreams}
            onPlay={onPlay}
          />
        ) : (
          <>
            {!loading && result && (
              <SourceDiagnostic result={result} debrids={debrids} />
            )}

            {!loading && currentPick && (
              <PrimaryCard
                meta={meta}
                episode={episode}
                stream={currentPick}
                debrids={debrids}
                addonLogo={lookupLogo(currentPick.addonId)}
                onPlay={() => onPlay(currentPick)}
                onCache={() => onCache(currentPick)}
                resolving={resolving?.stream === currentPick}
                queued={
                  currentPick.infoHash != null && queuedHash === currentPick.infoHash
                }
                inSession={inSession}
                isPreviouslyPlayed={previousMatch === currentPick}
              />
            )}

            {!loading && populatedTiers.length > 1 && filteredPicker && (
              <TierStrip
                tiers={populatedTiers}
                selected={selectedTier}
                onSelect={setSelectedTier}
                byTier={filteredPicker.byTier}
                debrids={debrids}
                langFilterSlot={
                  <div className="ml-auto flex items-center gap-2">
                    {uncachedHiddenCount > 0 && (
                      <CachedFilterPill
                        on={cachedOnly}
                        hiddenCount={uncachedHiddenCount}
                        onToggle={() => setCachedOnly((v) => !v)}
                      />
                    )}
                    {preferredLangs.length > 0 && langHiddenCount > 0 && (
                      <LanguageFilterPill
                        languages={preferredLangs}
                        on={langFilter}
                        hiddenCount={langHiddenCount}
                        onToggle={() => setLangFilter((v) => !v)}
                        isAnime={isAnimeRequest}
                      />
                    )}
                  </div>
                }
              />
            )}

            {!loading && allCount > 0 && filteredPicker && (
              <SourceDrawer
                open={drawerOpen}
                onToggle={() => setDrawerOpen((o) => !o)}
                count={allCount}
                addonCount={addonCount}
                usedAddons={usedAddons}
                streams={filteredPicker.all}
                debrids={debrids}
                getAddonLogo={lookupLogo}
                onPlay={onPlay}
                resolvingId={resolving?.stream.infoHash ?? null}
                showName={meta.name}
                episode={episode}
              />
            )}
          </>
        )}

        {resolveError && (
          <div className="rounded-2xl border border-danger/30 bg-danger/15 px-5 py-4 text-[13.5px] text-ink">
            {resolveError}
          </div>
        )}
      </div>
    </main>
  );
}

