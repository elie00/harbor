import type { PlayerSrc, PlayEpisode } from "@/lib/view";
import type { useSettings } from "@/lib/settings";
import type { useDebridClients } from "@/lib/debrid/registry";
import { buildStreamIds } from "@/lib/streams/stream-ids";

export async function buildEpisodePlayerSrc(
  meta: PlayerSrc["meta"],
  episode: PlayEpisode,
  settings: ReturnType<typeof useSettings>["settings"],
  debrids: ReturnType<typeof useDebridClients>,
  authKey: string | null,
): Promise<PlayerSrc | null> {
  const { runPipeline } = await import("@/lib/streams/pipeline");
  const { resolveStream } = await import("@/lib/streams/resolve");
  const { userAddons } = await import("@/lib/addons");
  const { registerStreamProxy } = await import("@/lib/stream-proxy");
  const { tmdbImdbId } = await import("@/lib/providers/tmdb");

  let imdbId = meta.id;
  if (!imdbId.startsWith("tt") && settings.tmdbKey) {
    const resolved = await tmdbImdbId(settings.tmdbKey, meta.id).catch(() => null);
    if (resolved) imdbId = resolved;
  }

  const addons = authKey ? await userAddons(authKey).catch(() => []) : [];
  const ids = buildStreamIds(meta.id, episode, imdbId);
  const ac = new AbortController();
  const result = await runPipeline(
    {
      request: { type: "series", ids },
      query: {
        type: "series",
        imdbId,
        title: meta.name,
        year: meta.releaseInfo ? parseInt(meta.releaseInfo, 10) || undefined : undefined,
        season: episode.season,
        episode: episode.episode,
      },
      addons,
      debrids,
      isAnime: imdbId.startsWith("kitsu:") || imdbId.startsWith("mal:"),
      trust: {
        kind: "series",
        expectedTitle: meta.name,
        releaseDate: meta.releaseDate ?? null,
        expectedYear: meta.releaseInfo ? parseInt(meta.releaseInfo, 10) || null : null,
        expectedSeason: episode.season,
        expectedEpisode: episode.episode,
        strict: settings.streamFilterLevel === "strict",
        disabled: settings.streamFilterLevel === "off",
        preferredLanguages: settings.preferredLanguages,
        preferredAudioLangs: settings.preferredAudioLangs,
        requirePreferredLanguage: settings.requirePreferredLanguage,
        isAnime: imdbId.startsWith("kitsu:") || imdbId.startsWith("mal:"),
      },
      score: {
        activeDebrids: debrids.map((d) => d.slug),
        preferredLanguages: settings.preferredLanguages,
        releaseDate: meta.releaseDate ?? null,
        mediaKind: "series",
        runtimeMinutes: meta.runtime ? parseInt(meta.runtime, 10) || undefined : undefined,
        inTheaters: false,
        bandwidthMbps: settings.bandwidthMbps > 0 ? settings.bandwidthMbps : undefined,
        preferSingleAudioTrack:
          !("__TAURI_INTERNALS__" in window) || settings.playerEngine === "html5",
      },
    },
    ac.signal,
  );
  const { preflightCheck } = await import("@/lib/streams/preflight");
  const ranked = [
    result.picker.primary,
    ...result.picker.all.filter((s) => s !== result.picker.primary),
  ].filter((s): s is NonNullable<typeof s> => !!s);
  const activeSlugs = debrids.map((d) => d.slug);
  const playable = ranked.filter(
    (s) =>
      !!s.url ||
      activeSlugs.some(
        (slug) =>
          s.cached?.[slug] === true ||
          (s as { inLibrary?: Record<string, boolean> }).inLibrary?.[slug] === true,
      ),
  );
  for (const candidate of playable.slice(0, 6)) {
    const r = await resolveStream(candidate, debrids, ac.signal, false);
    if (!r.ok) continue;
    let playUrl = r.data.url;
    if (r.data.headers && Object.keys(r.data.headers).length > 0) {
      try {
        const proxied = await registerStreamProxy(r.data.url, r.data.headers);
        playUrl = proxied.url;
      } catch {
        continue;
      }
    }
    const preflight =
      r.via === "stremio-server" || r.via === "direct"
        ? ({ ok: true } as const)
        : await preflightCheck(playUrl, ac.signal).catch(() => ({ ok: true } as const));
    if (!preflight.ok && preflight.reason === "stub") continue;
    return {
      meta,
      imdbId: imdbId.startsWith("tt") ? imdbId : undefined,
      episode,
      url: playUrl,
      title: meta.name,
      subtitle: `S${episode.season} · E${String(episode.episode).padStart(2, "0")}${episode.name ? ` · ${episode.name}` : ""}`,
      notWebReady: r.data.notWebReady,
      subtitles: r.data.subtitles,
      streamRef: {
        infoHash: candidate.infoHash ?? null,
        fileIdx: candidate.fileIdx ?? null,
        addonId: candidate.addonId ?? null,
        title: candidate.title ?? null,
        parsedTitle: candidate.parsedTitle ?? null,
        resolution: candidate.resolution ?? null,
        source: candidate.source ?? null,
        size: candidate.size ?? null,
        cachedSlugs: Object.entries(candidate.cached ?? {})
          .filter(([, v]) => v === true)
          .map(([k]) => k),
      },
    };
  }
  return null;
}
