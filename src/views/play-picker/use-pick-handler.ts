import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { Meta } from "@/lib/cinemeta";
import type { DebridStore } from "@/lib/debrid/types";
import { markStreamDead, recordStubEvent, STUB_TTL_MS } from "@/lib/dead-streams";
import { preflightCheck } from "@/lib/streams/preflight";
import { resolveStream } from "@/lib/streams/resolve";
import { registerStreamProxy } from "@/lib/stream-proxy";
import type { ScoredStream } from "@/lib/streams/types";
import type { PlayInvite } from "@/lib/together/protocol";
import { buildPlayInvite } from "@/lib/together/build-invite";
import { type PlayEpisode, type PlayerSrc } from "@/lib/view";
import { openUrl } from "@/lib/window";
import { humanError, isDebridFailure } from "./picker-utils";

export function usePickHandler({
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
  autoCandidatesLength,
  autoFiredRef,
  setAutoAttemptIdx,
  setAutoExhausted,
  setFailedStreams,
  setResolveError,
  setResolving,
}: {
  meta: Meta;
  imdbId?: string | null;
  episode?: PlayEpisode;
  attempt?: number;
  debrids: DebridStore[];
  inSession: boolean;
  canInvite: boolean;
  inviteSentRef: React.MutableRefObject<string | null>;
  sendInvite: (invite: PlayInvite) => void;
  claimHost: (fresh: boolean) => void;
  openPlayer: (src: PlayerSrc) => void;
  autoActive: boolean;
  autoAttemptIdx: number;
  autoCandidatesLength: number;
  autoFiredRef: React.MutableRefObject<boolean>;
  setAutoAttemptIdx: Dispatch<SetStateAction<number>>;
  setAutoExhausted: Dispatch<SetStateAction<boolean>>;
  setFailedStreams: Dispatch<SetStateAction<Set<ScoredStream>>>;
  setResolveError: (msg: string | null) => void;
  setResolving: Dispatch<SetStateAction<{ stream: ScoredStream } | null>>;
}) {
  const [queuedHash, setQueuedHash] = useState<string | null>(null);
  const [debridDown, setDebridDown] = useState(false);
  const debridFailStreakRef = useRef(0);
  const resolveAcRef = useRef<AbortController | null>(null);

  const advanceAuto = () => {
    if (!autoActive) return;
    const nextIdx = autoAttemptIdx + 1;
    if (nextIdx < autoCandidatesLength) {
      autoFiredRef.current = false;
      setAutoAttemptIdx(nextIdx);
    } else {
      setAutoExhausted(true);
    }
  };

  const resolveAndOpen = async (stream: ScoredStream, userCommitted: boolean) => {
    const ac = new AbortController();
    resolveAcRef.current?.abort();
    resolveAcRef.current = ac;
    let opened = false;
    try {
      const r = await resolveStream(stream, debrids, ac.signal, userCommitted);
      if (ac.signal.aborted) return;
      if (!r.ok) {
        setFailedStreams((prev) => new Set(prev).add(stream));
        const isDebridSide = isDebridFailure(r.code, r.tried);
        if (isDebridSide && debrids.length > 0) {
          debridFailStreakRef.current += 1;
          if (debridFailStreakRef.current >= 2) {
            setDebridDown(true);
            if (autoActive) setAutoExhausted(true);
            return;
          }
        } else {
          debridFailStreakRef.current = 0;
        }
        const willRetry = autoActive && autoAttemptIdx + 1 < autoCandidatesLength;
        if (!willRetry) setResolveError(humanError(r.code));
        advanceAuto();
        return;
      }
      debridFailStreakRef.current = 0;
      let playUrl = r.data.url;
      if (r.data.headers && Object.keys(r.data.headers).length > 0) {
        try {
          const proxied = await registerStreamProxy(r.data.url, r.data.headers);
          playUrl = proxied.url;
        } catch (e) {
          setFailedStreams((prev) => new Set(prev).add(stream));
          const willRetry = autoActive && autoAttemptIdx + 1 < autoCandidatesLength;
          if (!willRetry) setResolveError("Could not start the local stream proxy. Pick another stream.");
          advanceAuto();
          return;
        }
      }
      const preflight =
        r.via === "stremio-server" || r.via === "direct"
          ? ({ ok: true } as const)
          : await preflightCheck(playUrl, ac.signal);
      if (ac.signal.aborted) return;
      if (!preflight.ok && preflight.reason === "stub") {
        setFailedStreams((prev) => new Set(prev).add(stream));
        const sf = {
          infoHash: stream.infoHash ?? undefined,
          fileIdx: stream.fileIdx ?? undefined,
          url: r.data.url,
          addonId: stream.addonId ?? "",
          title: stream.parsedTitle ?? stream.title ?? stream.name ?? "",
        };
        const reasonStr = `preflight_stub_${preflight.sizeBytes ?? 0}b`;
        markStreamDead(sf, reasonStr, STUB_TTL_MS);
        recordStubEvent(reasonStr);
        console.warn(
          `[picker] preflight detected stub (${preflight.sizeBytes ?? "unknown"} bytes); skipping`,
        );
        const willRetry = autoActive && autoAttemptIdx + 1 < autoCandidatesLength;
        advanceAuto();
        if (!willRetry && !autoActive) {
          setResolveError("This source isn't actually cached on your debrid yet. Try another.");
        }
        return;
      }
      if (inSession && canInvite && inviteSentRef.current == null) {
        claimHost(true);
        sendInvite(buildPlayInvite(meta, episode));
        inviteSentRef.current = `${meta.id}|${episode?.season ?? ""}|${episode?.episode ?? ""}`;
      }
      openPlayer({
        meta,
        imdbId: imdbId ?? undefined,
        episode,
        url: playUrl,
        title: episode ? episode.name || `Episode ${episode.episode}` : meta.name,
        subtitle: episode
          ? `${meta.name} · S${episode.season} · E${episode.episode}`
          : meta.releaseInfo,
        notWebReady: r.data.notWebReady,
        subtitles: r.data.subtitles,
        attempt: attempt ?? 0,
        streamRef: {
          infoHash: stream.infoHash ?? null,
          fileIdx: stream.fileIdx ?? null,
          addonId: stream.addonId ?? null,
          title: stream.title ?? null,
          parsedTitle: stream.parsedTitle ?? null,
          resolution: stream.resolution ?? null,
          source: stream.source ?? null,
          size: stream.size ?? null,
          cachedSlugs: Object.entries(stream.cached ?? {})
            .filter(([, v]) => v === true)
            .map(([k]) => k),
        },
      });
      opened = true;
    } finally {
      if (!opened && !ac.signal.aborted) {
        setResolving(null);
      }
    }
  };

  const onPlay = (stream: ScoredStream, committed = true) => {
    if (!stream.url && stream.externalUrl) {
      openUrl(stream.externalUrl);
      return;
    }
    if (!stream.url && stream.ytId) {
      openUrl(`https://www.youtube.com/watch?v=${stream.ytId}`);
      return;
    }
    setResolveError(null);
    setQueuedHash(null);
    setResolving({ stream });
    void resolveAndOpen(stream, committed);
  };

  const onCache = async (stream: ScoredStream) => {
    setResolveError(null);
    setQueuedHash(null);
    if (!stream.infoHash) {
      setResolveError(humanError("no-source"));
      return;
    }
    const target = debrids.find((d) => d.queueCache);
    if (!target?.queueCache) {
      setResolveError("Your debrid service doesn't support queueing torrents from Harbor yet.");
      return;
    }
    setResolving({ stream });
    const ac = new AbortController();
    resolveAcRef.current?.abort();
    resolveAcRef.current = ac;
    const r = await target.queueCache(stream.infoHash, ac.signal);
    if (ac.signal.aborted) return;
    setResolving(null);
    if (!r.ok) {
      setResolveError(humanError(r.code));
      return;
    }
    setQueuedHash(stream.infoHash);
  };

  useEffect(() => () => resolveAcRef.current?.abort(), []);

  const resetDebridDown = () => {
    debridFailStreakRef.current = 0;
    setDebridDown(false);
  };

  const abortResolve = () => resolveAcRef.current?.abort();

  return { onPlay, onCache, queuedHash, debridDown, resetDebridDown, abortResolve };
}
