import { CalendarClock, Check, Eye, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Poster } from "@/components/poster";
import type { Meta } from "@/lib/cinemeta";
import { formatAirDate } from "@/lib/dates";
import { formatRelativeWatched } from "@/lib/episode-progress";
import type { Episode } from "@/lib/providers/tmdb";
import { useSettings } from "@/lib/settings";
import { SPOILER_TEXT_CLASS, SPOILER_THUMB_CLASS, type SpoilerMask } from "@/lib/spoilers";
import { useView } from "@/lib/view";
import { useT } from "@/lib/i18n";
import { NewBadge, UpcomingBadge } from "./badges";
import { EpisodeDownloadButton } from "./episode-download-button";
import { isNewEpisode, isUpcomingEpisode } from "./helpers";

export function EpisodeRow({
  meta,
  ep,
  progress,
  cinemetaThumbnail,
  spoiler,
  onContextMenu,
}: {
  meta: Meta;
  ep: Episode;
  progress: { ratio: number; watched: boolean; startedAt: number };
  cinemetaThumbnail?: string;
  spoiler?: SpoilerMask;
  onContextMenu?: (e: React.MouseEvent, season: number, episode: number, watched: boolean) => void;
}) {
  const t = useT();
  const { openPicker, openEpisodeDetail } = useView();
  const { settings } = useSettings();
  const tmdbStill = ep.stillPath ? `https://image.tmdb.org/t/p/w300${ep.stillPath}` : undefined;
  const candidates = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const u of [tmdbStill, cinemetaThumbnail]) {
      if (!u || seen.has(u)) continue;
      seen.add(u);
      out.push(u);
    }
    return out;
  }, [tmdbStill, cinemetaThumbnail]);
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => {
    setImgIdx(0);
  }, [ep.id]);
  const still = candidates[imgIdx];
  const watchedAgo = progress.startedAt > 0 ? formatRelativeWatched(progress.startedAt) : "";
  const playEpisode = {
    season: ep.seasonNumber,
    episode: ep.episodeNumber,
    name: ep.name || undefined,
    still,
    overview: ep.overview || undefined,
  };

  const isUpcoming = isUpcomingEpisode(ep);
  
  // Click handlers
  const handleEpisodeClick = () => {
    if (!isUpcoming) {
      openEpisodeDetail(meta.id, ep.seasonNumber, ep.episodeNumber, meta);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openPicker(meta, playEpisode, { autoPlay: settings.instantPlay });
  };

  return (
    <div
      data-ep={ep.episodeNumber}
      data-no-card-ring
      onContextMenu={(e) => onContextMenu?.(e, ep.seasonNumber, ep.episodeNumber, progress.watched)}
      className={`group flex gap-6 rounded-2xl px-4 py-5 transition-colors ${isUpcoming ? "opacity-75 hover:bg-elevated/30" : "hover:bg-elevated/30"}`}
    >
      {/* Episode clickable area - navigates to episode detail page */}
      <button
        onClick={handleEpisodeClick}
        disabled={isUpcoming}
        className="flex min-w-0 flex-1 gap-6 text-start"
      >
        <div className="relative w-[200px] shrink-0 overflow-hidden rounded-lg">
          {isUpcoming ? (
            <div className="flex aspect-[16/9] w-full flex-col items-center justify-center bg-canvas/60 text-ink-subtle">
              <CalendarClock size={28} strokeWidth={1.5} />
            </div>
          ) : (
            <div className={spoiler?.thumb ? SPOILER_THUMB_CLASS : undefined}>
              <Poster
                src={still}
                seed={String(ep.id)}
                ratio="landscape"
                onError={() => setImgIdx((i) => i + 1)}
              />
            </div>
          )}
          {!isUpcoming && (
            <div className="absolute inset-0 flex items-center justify-center bg-canvas/40 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/10 text-ink backdrop-blur-sm">
                <Eye size={20} />
              </div>
            </div>
          )}
          <span className="absolute start-2 top-2 rounded-md bg-canvas/95 px-1.5 py-0.5 text-[11px] font-semibold text-ink">
            {ep.episodeNumber}
          </span>
          {progress.watched && (
            <span className="absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/22 text-emerald-200 ring-1 ring-emerald-400/40 backdrop-blur-sm">
              <Check size={12} strokeWidth={3} />
            </span>
          )}
          {progress.ratio > 0.01 && (
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-black/55">
              <div
                className="h-full bg-accent"
                style={{ width: `${Math.max(2, progress.ratio * 100)}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h4 className="flex items-center gap-2 truncate text-[16px] font-semibold text-ink">
            <span className={`truncate ${spoiler?.title ? SPOILER_TEXT_CLASS : ""}`}>
              {ep.name || t("Episode {n}", { n: ep.episodeNumber })}
            </span>
            {isUpcomingEpisode(ep) ? <UpcomingBadge /> : isNewEpisode(ep) && <NewBadge />}
          </h4>
          <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-ink-subtle">
            <span>
              {[
                t("S{s} E{e}", { s: ep.seasonNumber, e: ep.episodeNumber }),
                ep.runtime ? t("{n} min", { n: ep.runtime }) : null,
                formatAirDate(ep.airDate) || null,
                ep.voteAverage && ep.voteAverage > 0 ? `★ ${ep.voteAverage.toFixed(1)}` : null,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </span>
            {progress.watched && watchedAgo && (
              <span className="text-emerald-300/85">· {t("Watched {ago}", { ago: watchedAgo })}</span>
            )}
            {!progress.watched && progress.ratio > 0.01 && watchedAgo && (
              <span className="text-accent/85">
                · {t("{pct}% watched", { pct: Math.round(progress.ratio * 100) })} · {watchedAgo}
              </span>
            )}
          </p>
          {ep.overview && (
            <p
              className={`line-clamp-2 text-[13.5px] leading-relaxed text-ink-muted ${
                spoiler?.desc ? SPOILER_TEXT_CLASS : ""
              }`}
            >
              {ep.overview}
            </p>
          )}
        </div>
      </button>
      
      {/* Separate play button - navigates directly to play picker */}
      {!isUpcoming && (
        <button
          onClick={handlePlayClick}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-edge bg-elevated/60 transition-colors hover:bg-elevated"
        >
          <Play size={18} fill="currentColor" />
        </button>
      )}
      
      <EpisodeDownloadButton meta={meta} episode={playEpisode} />
    </div>
  );
}
