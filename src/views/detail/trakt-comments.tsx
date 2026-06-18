import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, ChevronDown, Settings } from "lucide-react";
import { useT } from "@/lib/i18n";
import { fetchComments, type TraktComment } from "@/lib/trakt/comments";
import type { IdResolution } from "@/lib/trakt/ids";
import { useSettings } from "@/lib/settings";
import { useView } from "@/lib/view";
import { openUrl } from "@/lib/window";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function CommentCard({ comment }: { comment: TraktComment }) {
  const avatar = comment.user.avatar;
  const initial = (comment.user.name ?? comment.user.username).charAt(0).toUpperCase();

  return (
    <div className="flex gap-3 rounded-xl bg-elevated p-4 ring-1 ring-edge">
      <div className="shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={comment.user.username}
            className="h-9 w-9 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-muted/20 text-[14px] font-semibold text-ink-muted">
            {initial}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-ink">
            {comment.user.name ?? comment.user.username}
          </span>
          <span className="text-[11px] text-ink-muted">{timeAgo(comment.createdAt)}</span>
          {comment.userRating != null && (
            <span className="ml-auto flex items-center gap-1 text-[12px] font-medium text-accent">
              <span className="text-[10px]">★</span>
              {comment.userRating}/10
            </span>
          )}
        </div>
        <p className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink">
          {comment.comment}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[12px] text-ink-muted">
          <span className="flex items-center gap-1">
            <Heart size={12} />
            {comment.likes}
          </span>
          {comment.replies > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle size={12} />
              {comment.replies}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const SORTS = ["likes", "newest", "oldest"] as const;

export function TraktComments({ resolution }: { resolution: IdResolution | null }) {
  const t = useT();
  const [comments, setComments] = useState<TraktComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<string>("likes");
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  const { openSettings } = useView();
  const connected = !!(settings.traktAccessToken || settings.traktRefreshToken);

  const target = resolution?.ok ? resolution.target : null;

  useEffect(() => {
    if (!target) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    fetchComments(target, sort).then((data) => {
      if (cancelled) return;
      setComments(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [target, sort]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSort(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpenTrakt = useCallback(() => {
    if (!target) return;
    const id = target.kind === "episode" ? target.show.ids : target.ids;
    const provider = id.tmdb ? "tmdb" : "imdb";
    const val = provider === "tmdb" ? String(id.tmdb) : id.imdb;
    if (target.kind === "episode") {
      openUrl(`https://trakt.tv/search/${provider}/${val}?season=${target.season}&episode=${target.number}`);
    } else if (target.kind === "movie") {
      openUrl(`https://trakt.tv/search/${provider}/${val}`);
    } else {
      openUrl(`https://trakt.tv/search/${provider}/${val}`);
    }
  }, [target]);

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[20px] font-bold text-ink">{t("Trakt Comments")}</h2>
        {target && connected && (
          <div className="flex items-center gap-3">
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-medium text-ink-muted ring-1 ring-edge transition-colors hover:bg-elevated hover:text-ink"
              >
                {sort}
                <ChevronDown size={12} />
              </button>
              {showSort && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[100px] overflow-hidden rounded-xl bg-elevated ring-1 ring-edge shadow-lg">
                  {SORTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSort(s); setShowSort(false); }}
                      className={`block w-full px-3 py-2 text-left text-[12px] transition-colors hover:bg-raised ${
                        s === sort ? "font-semibold text-ink" : "text-ink-muted"
                      }`}
                    >
                      {t(s.charAt(0).toUpperCase() + s.slice(1))}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleOpenTrakt}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-medium text-ink-muted ring-1 ring-edge transition-colors hover:bg-elevated hover:text-ink"
            >
              {t("Open on Trakt")}
            </button>
          </div>
        )}
      </div>

      {resolution && !resolution.ok && (
        <p className="rounded-xl bg-elevated p-4 text-[13px] text-ink-muted ring-1 ring-edge">
          {resolution.reason === "anime"
            ? t("Trakt comments are not available for anime titles.")
            : t("Could not identify this title on Trakt.")}
        </p>
      )}

      {target && !connected && (
        <div className="rounded-xl border border-edge-soft bg-elevated/60 p-5 text-center">
          <p className="text-[14px] text-ink-muted">
            {t("Connect your Trakt account to see comments and reviews.")}
          </p>
          <p className="mt-3">
            <button
              onClick={() => openSettings("trakt")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-canvas transition-transform hover:scale-[1.02]"
            >
              <Settings size={14} strokeWidth={2.2} />
              {t("Connect Trakt")}
            </button>
          </p>
        </div>
      )}

      {connected && target && loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 rounded-xl bg-elevated p-4 ring-1 ring-edge">
              <div className="h-9 w-9 animate-pulse rounded-full bg-ink-muted/20" />
              <div className="flex-1">
                <div className="mb-2 h-3 w-24 animate-pulse rounded bg-ink-muted/20" />
                <div className="mb-1 h-3 w-full animate-pulse rounded bg-ink-muted/20" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-ink-muted/20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {connected && target && !loading && comments.length === 0 && (
        <p className="text-[14px] text-ink-muted">{t("No comments yet")}</p>
      )}

      {connected && target && !loading && comments.length > 0 && (
        <div className="flex flex-col gap-3">
          {comments.map((c) => (
            <CommentCard key={c.id} comment={c} />
          ))}
        </div>
      )}
    </section>
  );
}
