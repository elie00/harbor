import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, ChevronDown, Settings, Loader2, Send, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  fetchComments,
  likeComment,
  unlikeComment,
  postComment,
  rateContent,
  removeRating,
  type TraktComment,
} from "@/lib/trakt/comments";
import { traktRequest, TraktApiError } from "@/lib/trakt/client";
import type { IdResolution } from "@/lib/trakt/ids";
import { getSession, subscribeSession } from "@/lib/trakt/session";
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

function UserAvatar({ username, size = "sm" }: { username?: string | null; size?: "sm" | "md" }) {
  const [error, setError] = useState(false);
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const font = size === "sm" ? "text-[12px]" : "text-[14px]";
  const initial = username ? username.charAt(0).toUpperCase() : "?";

  return (
    <div className={`shrink-0 ${dim}`}>
      {error || !username ? (
        <div className={`flex ${dim} items-center justify-center rounded-full bg-ink-muted/20 ${font} font-semibold text-ink-muted`}>
          {initial}
        </div>
      ) : (
        <img
          src={`https://walter.trakt.tv/users/${username}/avatars/medium`}
          alt={username}
          className={`${dim} rounded-full object-cover`}
          loading="lazy"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

function CommentCard({
  comment,
  connected,
}: {
  comment: TraktComment;
  connected: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const [liking, setLiking] = useState(false);
  const [likes, setLikes] = useState(comment.likes);

  const avatar = (() => {
    if (comment.user.avatar) return comment.user.avatar;
    if (comment.user.slug) return `https://walter.trakt.tv/users/${comment.user.slug}/avatars/medium`;
    return null;
  })();
  const initial = (comment.user.name ?? comment.user.username).charAt(0).toUpperCase();
  const showImg = avatar && !imgError;

  const handleLike = useCallback(async () => {
    if (liking || !connected) return;
    setLiking(true);
    const wasLiked = likes !== comment.likes;
    if (wasLiked) {
      setLikes((l) => l - 1);
      await unlikeComment(comment.id);
    } else {
      setLikes((l) => l + 1);
      try {
        await likeComment(comment.id);
      } catch {
        setLikes((l) => l - 1);
      }
    }
    setLiking(false);
  }, [liking, connected, likes, comment.id, comment.likes]);

  return (
    <div className="flex gap-3 rounded-xl bg-elevated p-4 ring-1 ring-edge">
      <div className="shrink-0">
        {showImg ? (
          <img
            src={avatar!}
            alt={comment.user.username}
            className="h-9 w-9 rounded-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
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
        <p className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink" dir="auto">
          {comment.comment}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[12px] text-ink-muted">
          <button
            onClick={handleLike}
            disabled={liking || !connected}
            className={`flex items-center gap-1 transition-colors ${
              likes !== comment.likes
                ? "text-red-400"
                : "text-ink-muted hover:text-red-400"
            } ${!connected ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {liking ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Heart
                size={12}
                fill={likes !== comment.likes ? "currentColor" : "none"}
              />
            )}
            {likes}
          </button>
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
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [ratinging, setRatinging] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const sortRef = useRef<HTMLDivElement>(null);
  const { openSettings } = useView();
  const [session, setSessionState] = useState(() => getSession());
  const connected = !!session;
  const username = session?.username ?? null;
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    return subscribeSession(() => {
      setSessionState(getSession());
    });
  }, []);

  useEffect(() => {
    if (!connected) return;
    let cancelled = false;
    traktRequest<{ username: string; images?: { avatar?: { full?: string } } }>(
      "/users/me?extended=images",
    )
      .then((data) => {
        if (cancelled) return;
        setUserAvatar(data.images?.avatar?.full ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [connected]);

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

  const handlePost = useCallback(async () => {
    if (!target || !text.trim() || posting) return;
    setPostError(null);
    setPosting(true);
    try {
      const created = await postComment(target, text.trim());
      setComments((prev) => [created, ...prev]);
      setText("");
    } catch (e) {
      console.error("Post comment error:", e);
      if (e instanceof TraktApiError) {
        try {
          const parsed = JSON.parse(e.body);
          let msg = "";
          if (parsed.errors && typeof parsed.errors === "object") {
            const first = Object.values(parsed.errors)[0];
            if (Array.isArray(first) && first.length > 0) msg = first[0];
          }
          if (!msg) msg = parsed.error_description ?? parsed.error ?? `HTTP ${e.status}`;
          setPostError(msg.replace(/^\w+\s*-\s*/, ""));
        } catch {
          setPostError(`HTTP ${e.status}: ${e.body.slice(0, 100) || "(empty body)"}`);
        }
      } else {
        setPostError(e instanceof TypeError ? "Network error" : "Failed to post comment");
      }
    }
    setPosting(false);
  }, [target, text, posting]);

  const handleRate = useCallback(async (rating: number) => {
    if (!target || ratinging) return;
    setRatinging(true);
    try {
      if (rating === userRating) {
        await removeRating(target);
        setUserRating(0);
      } else {
        await rateContent(target, rating);
        setUserRating(rating);
      }
    } catch {}
    setRatinging(false);
  }, [target, ratinging, userRating]);

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[20px] font-bold text-ink">{t("Trakt Comments")}</h2>
        {target && (
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

      {target && connected && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[12px] font-medium text-ink-muted">{t("Your Rating")}:</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const active = hoverRating ? n <= hoverRating : n <= userRating;
              return (
                <button
                  key={n}
                  onClick={() => handleRate(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={ratinging}
                  className={`h-5 w-5 text-[14px] transition-colors ${
                    ratinging ? "cursor-wait opacity-50" : "cursor-pointer"
                  } ${
                    active ? "text-yellow-400" : "text-ink-muted/30"
                  }`}
                >
                  ★
                </button>
              );
            })}
          </div>
          {userRating > 0 && (
            <>
              <span className="text-[12px] font-medium text-ink-muted">{userRating}/10</span>
              <button
                onClick={() => handleRate(userRating)}
                disabled={ratinging}
                className="text-[11px] text-ink-muted/50 underline transition-colors hover:text-ink-muted"
              >
                {t("Remove")}
              </button>
            </>
          )}
        </div>
      )}

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

      {target && connected && (
        <div className="mb-5">
          <div className="flex items-start gap-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={username ?? ""}
                className="h-8 w-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <UserAvatar username={username} size="sm" />
            )}
            <div className="flex flex-1 items-start gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("Write a comment...")}
                rows={1}
                className="min-h-[36px] max-h-32 flex-1 resize-none overflow-y-auto rounded-xl bg-elevated px-3.5 py-2 text-[13px] text-ink outline-none ring-1 ring-edge placeholder:text-ink-muted/50 focus:ring-2 focus:ring-ink/20"
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
                }}
              />
              <button
                onClick={handlePost}
                disabled={!text.trim() || posting}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-semibold transition-all ${
                  !text.trim() || posting
                    ? "bg-ink-muted/20 text-ink-muted/50 cursor-not-allowed"
                    : "bg-ink text-canvas hover:scale-[1.02]"
                }`}
              >
                {posting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </div>
          {postError && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
              <AlertCircle size={12} />
              {postError}
            </div>
          )}
        </div>
      )}

      {target && loading && (
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

      {target && !loading && comments.length === 0 && (
        <p className="text-[14px] text-ink-muted">{t("No comments yet")}</p>
      )}

      {target && !loading && comments.length > 0 && (
        <div className="flex flex-col gap-3">
          {comments.map((c) => (
            <CommentCard key={c.id} comment={c} connected={connected} />
          ))}
        </div>
      )}
    </section>
  );
}
