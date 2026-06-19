import { useMemo, useState } from "react";
import { useSettings } from "@/lib/settings";
import { useT } from "@/lib/i18n";
import { settingsAnchor, type SectionId } from "./shared";

type IconProps = { size?: number; strokeWidth?: number };

const IconBase = ({
  size = 20,
  strokeWidth = 1.7,
  children,
}: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

function IconAccount(p: IconProps) {
  return (
    <IconBase {...p}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
      <circle cx="12" cy="9.8" r="2.6" />
      <path d="M7.6 17.6c.9-2 2.6-3 4.4-3s3.5 1 4.4 3" />
    </IconBase>
  );
}

function IconLibrary(p: IconProps) {
  return (
    <IconBase {...p}>
      <rect x="3.5" y="3.5" width="7.5" height="9" rx="1.4" />
      <rect x="13" y="3.5" width="7.5" height="6" rx="1.4" />
      <rect x="3.5" y="14.5" width="7.5" height="6" rx="1.4" />
      <rect x="13" y="11" width="7.5" height="9.5" rx="1.4" />
    </IconBase>
  );
}

function IconRelay(p: IconProps) {
  return (
    <IconBase {...p}>
      <path d="M10.5 10 Q 12 8 13.5 10" strokeWidth="1.4" />
      <path d="M8 7.5 Q 12 4.5 16 7.5" strokeWidth="1.4" />
      <path d="M5.5 5 Q 12 1 18.5 5" strokeWidth="1.4" />
      <path d="M8 12 V 20" strokeWidth="2.4" />
      <path d="M16 12 V 20" strokeWidth="2.4" />
      <path d="M8 16 H 16" strokeWidth="2.4" />
    </IconBase>
  );
}

function IconStreaming(p: IconProps) {
  return (
    <IconBase {...p}>
      <path d="M12 5v14" strokeWidth={p.strokeWidth ?? 2} />
      <path d="M5 12h14" strokeWidth={p.strokeWidth ?? 2} />
    </IconBase>
  );
}

function IconLanguages(p: IconProps) {
  return (
    <IconBase {...p}>
      <path d="M3.5 6.5h7" />
      <path d="M7 4.5v2" />
      <path d="M9.5 6.5c-.5 4-2.4 6.5-6 7.5" />
      <path d="M4 11.5c1.6 1.5 3.6 2.5 6 2.8" />
      <path d="M13 20l3.5-9 3.5 9" />
      <path d="M14.2 17.2h4.6" />
    </IconBase>
  );
}

function IconPlayer(p: IconProps) {
  return (
    <IconBase {...p}>
      <rect x="3" y="4.5" width="18" height="13" rx="2" />
      <path d="M10 9.2l4.8 2.8-4.8 2.8z" fill="currentColor" stroke="none" />
      <path d="M7 20.5h10" />
    </IconBase>
  );
}

function IconPlayerLayout(p: IconProps) {
  return (
    <IconBase {...p}>
      <rect x="3" y="4.5" width="18" height="13" rx="2" />
      <path d="M3 14.5h18" />
      <circle cx="7" cy="17" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="17" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14" cy="17" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function IconHotkeys(p: IconProps) {
  return (
    <IconBase {...p}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M6 14h12" strokeLinecap="round" />
    </IconBase>
  );
}

function IconAdvanced(p: IconProps) {
  return (
    <IconBase {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 5.5l2.6 6.5L12 18.5l-2.6-6.5z" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="var(--color-canvas)" stroke="none" />
    </IconBase>
  );
}

function IconBug(p: IconProps) {
  return (
    <IconBase {...p}>
      <rect x="7.5" y="7.5" width="9" height="11" rx="4.5" />
      <path d="M9 4.5l1.5 2.5M15 4.5l-1.5 2.5" />
      <path d="M3.5 11.5h4M16.5 11.5h4" />
      <path d="M3.5 16.5l3-1.5M16.5 15l4 1.5" />
      <path d="M3.5 7l3 2M20.5 7l-3 2" />
    </IconBase>
  );
}

function IconTheme(p: IconProps) {
  return (
    <IconBase {...p}>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17 2.5 2.5 0 0 0 2.5-2.5c0-.7-.3-1.3-.7-1.8-.4-.5-.7-1-.7-1.7a2.5 2.5 0 0 1 2.5-2.5h1.4a4 4 0 0 0 4-4 8.5 8.5 0 0 0-9-4.5z" />
      <circle cx="7.5" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function IconWebhooks(p: IconProps) {
  return (
    <IconBase {...p}>
      <circle cx="6" cy="17.5" r="2.4" />
      <circle cx="18" cy="17.5" r="2.4" />
      <circle cx="12" cy="6.5" r="2.4" />
      <path d="M10.4 8.4 7.2 15.4" />
      <path d="M13.6 8.4 16.8 15.4" />
      <path d="M8.4 17.5h7.2" />
    </IconBase>
  );
}

function IconTrakt(p: IconProps) {
  return (
    <IconBase {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M6 13.5l4-4 6 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 9.5l4-4 8 8" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

function IconAnilist(p: IconProps) {
  return (
    <IconBase {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <path d="M8 16.5l3-9 3 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13.5h4" strokeLinecap="round" />
      <path d="M15.5 7.5v9h2" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

function IconSimkl(p: IconProps) {
  return (
    <IconBase {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M15 9c-2.4-1.3-4.8-.4-4.8 1.5 0 2.4 4.6 1.8 4.6 4 0 1.8-2.6 2.4-5 1" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

const LANG_ABBR: Record<string, string> = {
  English: "EN",
  Spanish: "ES",
  French: "FR",
  German: "DE",
  Italian: "IT",
  Portuguese: "PT",
  Russian: "RU",
  Japanese: "JA",
  Korean: "KO",
  Chinese: "ZH",
  Hindi: "HI",
  Arabic: "AR",
  Turkish: "TR",
  Dutch: "NL",
  Polish: "PL",
  Ukrainian: "UK",
  Czech: "CS",
  Hungarian: "HU",
  Romanian: "RO",
  Swedish: "SV",
  Norwegian: "NO",
  Danish: "DA",
  Finnish: "FI",
  Hebrew: "HE",
  Thai: "TH",
  Vietnamese: "VI",
};

type NavItem = {
  id: SectionId;
  label: string;
  Icon: (p: IconProps) => React.ReactElement;
  keywords?: string[];
};

const NAV_GROUPS: Array<{ heading: string | null; items: NavItem[] }> = [
  {
    heading: "Account",
    items: [
      {
        id: "account",
        label: "Account",
        Icon: IconAccount,
        keywords: ["stremio", "sign in", "login", "profile", "logout"],
      },
      {
        id: "library",
        label: "Library & metadata",
        Icon: IconLibrary,
        keywords: ["tmdb", "omdb", "rpdb", "fanart", "tvdb", "metadata", "api key", "ratings", "posters"],
      },
      {
        id: "trakt",
        label: "Trakt",
        Icon: IconTrakt,
        keywords: ["scrobble", "history", "sync", "watchlist"],
      },
      {
        id: "anilist",
        label: "AniList",
        Icon: IconAnilist,
        keywords: ["anime", "lists", "watching", "mal", "kitsu"],
      },
      {
        id: "simkl",
        label: "Simkl",
        Icon: IconSimkl,
        keywords: ["scrobble", "sync", "watched", "history", "watchlist", "anime"],
      },
    ],
  },
  {
    heading: "Streaming",
    items: [
      {
        id: "relay",
        label: "Harbor Relay",
        Icon: IconRelay,
        keywords: ["together", "watch party", "p2p", "host", "share"],
      },
      {
        id: "streaming",
        label: "Streaming sources",
        Icon: IconStreaming,
        keywords: [
          "debrid",
          "real-debrid",
          "alldebrid",
          "premiumize",
          "torbox",
          "torrentio",
          "mediafusion",
          "scrapers",
          "addons",
          "iptv",
          "m3u",
          "xtream",
        ],
      },
    ],
  },
  {
    heading: "Playback",
    items: [
      {
        id: "player",
        label: "Player & quality",
        Icon: IconPlayer,
        keywords: ["mpv", "html5", "engine", "quality", "hdr", "passthrough", "audio", "transcode"],
      },
      {
        id: "playerLayout",
        label: "Player layout",
        Icon: IconPlayerLayout,
        keywords: ["controls", "ui", "overlay", "skip", "trickplay", "thumbnail"],
      },
      {
        id: "hotkeys",
        label: "Hotkeys",
        Icon: IconHotkeys,
        keywords: ["shortcuts", "keys", "keyboard", "bindings"],
      },
      {
        id: "language",
        label: "Languages",
        Icon: IconLanguages,
        keywords: ["subtitles", "audio", "preferred", "tracks", "opensubtitles"],
      },
    ],
  },
  {
    heading: "Appearance",
    items: [
      {
        id: "theme",
        label: "Theme & appearance",
        Icon: IconTheme,
        keywords: ["theme", "color", "font", "layout", "wallpaper", "card", "minui", "aurora", "velvet", "custom"],
      },
    ],
  },
  {
    heading: "Notifications",
    items: [
      {
        id: "webhooks",
        label: "Webhooks",
        Icon: IconWebhooks,
        keywords: ["discord", "telegram", "calendar", "alerts", "notifications", "rules"],
      },
    ],
  },
  {
    heading: "Help",
    items: [
      { id: "bug", label: "Report a bug", Icon: IconBug, keywords: ["report", "feedback", "issue", "crash"] },
    ],
  },
  {
    heading: "System",
    items: [
      {
        id: "advanced",
        label: "Advanced",
        Icon: IconAdvanced,
        keywords: ["dev", "logs", "cache", "reset", "experimental", "ffmpeg", "yt-dlp"],
      },
    ],
  },
];

type SettingsOption = { label: string; section: SectionId; anchorTitle?: string; keywords?: string[] };

const SETTINGS_OPTIONS: SettingsOption[] = [
  { label: "Picture-in-Picture subtitles", section: "player", anchorTitle: "Subtitle style", keywords: ["pip", "picture in picture", "subtitles in pip", "subs"] },
  { label: "Subtitle size", section: "player", anchorTitle: "Subtitle style", keywords: ["sub", "subtitle", "caption", "font size"] },
  { label: "Subtitle opacity", section: "player", anchorTitle: "Subtitle style", keywords: ["sub", "subtitle", "transparency"] },
  { label: "Subtitle background opacity", section: "player", anchorTitle: "Subtitle style", keywords: ["sub", "subtitle", "box", "background"] },
  { label: "Subtitle outline thickness", section: "player", anchorTitle: "Subtitle style", keywords: ["sub", "subtitle", "border"] },
  { label: "Subtitle distance from bottom", section: "player", anchorTitle: "Subtitle style", keywords: ["sub", "subtitle", "position", "margin"] },
  { label: "Player engine (mpv / HTML5)", section: "player", anchorTitle: "Player engine", keywords: ["mpv", "html5", "engine", "playback"] },
  { label: "HDR-to-SDR tonemapping", section: "player", anchorTitle: "Player engine", keywords: ["hdr", "sdr", "tonemap", "color"] },
  { label: "HDR display mode", section: "player", anchorTitle: "Player engine", keywords: ["hdr", "passthrough", "display", "stage", "opaque", "color"] },
  { label: "Anime4K upscaling", section: "player", anchorTitle: "Player engine", keywords: ["anime4k", "upscale", "shader", "quality"] },
  { label: "Seek bar style", section: "player", anchorTitle: "Seek bar", keywords: ["seek", "scrubber", "progress", "bar", "timeline"] },
  { label: "Play button behavior", section: "player", anchorTitle: "Play button behavior", keywords: ["autoplay", "instant", "manual", "picker", "play mode"] },
  { label: "Stream format chips", section: "player", anchorTitle: "Stream format chips", keywords: ["chips", "badges", "4k", "hdr", "codec", "quality badge"] },
  { label: "Poster size", section: "player", anchorTitle: "Poster size", keywords: ["poster", "card", "size", "scale", "4k", "bigger"] },
  { label: "Row title & player title size", section: "player", anchorTitle: "Title text", keywords: ["title", "text size", "row title", "player title", "bigger", "series first", "font size", "episode name", "header"] },
  { label: "Trailer quality", section: "player", anchorTitle: "Trailer quality", keywords: ["trailer", "quality", "youtube", "ytdl"] },
  { label: "Next episode prompt timing", section: "player", anchorTitle: "Next episode prompt", keywords: ["next episode", "up next", "autoplay", "pill", "credits"] },
  { label: "Downloads folder", section: "player", anchorTitle: "Downloads", keywords: ["download", "folder", "save", "directory"] },
  { label: "Built-in torrent engine", section: "player", anchorTitle: "Local engine", keywords: ["torrent", "p2p", "local engine", "librqbit", "stream"] },
  { label: "Remote streaming server", section: "player", anchorTitle: "Remote streaming server", keywords: ["remote", "server", "stremio service", "strict", "home server", "streaming server", "vpn"] },
  { label: "Your streaming server address", section: "player", anchorTitle: "Your streaming server address", keywords: ["address", "ip", "localhost", "11470", "lan", "wifi", "share", "web instance", "url", "where"] },
  { label: "Harbor in your browser", section: "player", anchorTitle: "Your streaming server address", keywords: ["web", "browser", "web version", "web app", "serve", "phone", "tablet", "11471"] },
  { label: "Custom CSS / JS code", section: "player", anchorTitle: "Custom code", keywords: ["custom", "css", "js", "javascript", "inject", "power user"] },
  { label: "Home layout", section: "library", anchorTitle: "Home layout", keywords: ["home", "rails", "rows", "layout"] },
  { label: "Show every addon row", section: "library", anchorTitle: "Home layout", keywords: ["addon", "rows", "duplicate", "rails"] },
  { label: "Show Playlists tab", section: "library", anchorTitle: "Home layout", keywords: ["playlist", "m3u", "xtream", "vod", "nav"] },
  { label: "Keep anime in the Anime room only", section: "library", anchorTitle: "Home layout", keywords: ["anime", "continue watching", "home", "hide", "room"] },
  { label: "Advance Continue Watching to next episode", section: "library", anchorTitle: "Home layout", keywords: ["continue watching", "next episode", "advance", "auto", "home"] },
  { label: "Blur spoilers", section: "library", anchorTitle: "Spoilers", keywords: ["spoiler", "blur", "hide", "thumbnails", "titles", "episodes"] },
  { label: "Continue Watching screenshots", section: "library", anchorTitle: "Continue Watching screenshots", keywords: ["continue watching", "screenshot", "snapshot", "frame"] },
  { label: "Hide anime / Live TV / sports / adult", section: "library", anchorTitle: "Content filters", keywords: ["hide", "content filter", "anime", "live tv", "sports", "adult", "age"] },
  { label: "Region", section: "library", anchorTitle: "Region", keywords: ["region", "country", "availability"] },
  { label: "TMDB / OMDb / RPDB / Fanart / TVDB keys", section: "library", anchorTitle: "Metadata providers", keywords: ["tmdb", "omdb", "rpdb", "fanart", "tvdb", "api key", "metadata", "ratings"] },
  { label: "IMDb / Rotten Tomatoes / MAL scores on cards", section: "library", anchorTitle: "Metadata providers", keywords: ["imdb", "rotten tomatoes", "rt", "mal", "score", "rating", "badge"] },
  { label: "Hover preview on posters", section: "library", anchorTitle: "Metadata providers", keywords: ["hover", "preview", "peek", "popup", "poster", "card", "dwell"] },
  { label: "Subtitle languages", section: "language", anchorTitle: "Subtitle languages", keywords: ["subtitle", "language", "sub", "default"] },
  { label: "Audio languages", section: "language", anchorTitle: "Audio languages", keywords: ["audio", "language", "dub", "track"] },
  { label: "Preferred languages", section: "language", anchorTitle: "Preferred languages", keywords: ["language", "preferred", "region"] },
  { label: "Stream safety filter", section: "streaming", anchorTitle: "Stream safety filter", keywords: ["safety", "filter", "scam", "fake", "shady", "mismatched"] },
  { label: "Picker layout (Condensed / Stremio)", section: "streaming", anchorTitle: "Picker layout", keywords: ["picker", "layout", "condensed", "stremio", "list", "drawer"] },
  { label: "Result order (Harbor ranking / Addon order)", section: "streaming", anchorTitle: "Result order", keywords: ["order", "sort", "addon order", "ranking", "stremio", "vidi", "sequence"] },
  { label: "Debrid keys (RealDebrid / TorBox / AllDebrid / Premiumize)", section: "streaming", anchorTitle: "Debrid services", keywords: ["debrid", "realdebrid", "torbox", "alldebrid", "premiumize", "rd", "tb"] },
  { label: "Usenet (Easynews+)", section: "streaming", anchorTitle: "Usenet", keywords: ["usenet", "easynews", "nzb"] },
  { label: "Streaming catalogs", section: "streaming", anchorTitle: "Streaming catalogs", keywords: ["netflix", "disney", "hulu", "streaming", "providers", "catalogs"] },
  { label: "Watch Together relay", section: "relay", anchorTitle: "Harbor Relay", keywords: ["watch together", "party", "relay", "p2p", "host", "cloudflare"] },
  { label: "Theme preset", section: "theme", anchorTitle: "Theme", keywords: ["theme", "color", "preset", "dark", "appearance"] },
  { label: "Background wallpaper", section: "theme", anchorTitle: "Background image", keywords: ["background", "wallpaper", "image", "dim"] },
  { label: "Typography and custom fonts", section: "theme", anchorTitle: "Typography", keywords: ["font", "typography", "display", "body", "typeface", "custom font"] },
  { label: "Keyboard shortcuts", section: "hotkeys", keywords: ["hotkey", "keybind", "shortcut", "keyboard"] },
  { label: "Player layout / chrome", section: "playerLayout", keywords: ["layout", "chrome", "controls", "player ui", "trickplay", "thumbnail"] },
  { label: "Webhooks (Discord / Telegram)", section: "webhooks", keywords: ["webhook", "discord", "telegram", "notify", "alerts"] },
  { label: "Updates", section: "advanced", anchorTitle: "Updates", keywords: ["update", "version", "upgrade", "auto update"] },
  { label: "Backup & restore", section: "advanced", anchorTitle: "Backup & restore", keywords: ["backup", "restore", "export", "import", "settings file"] },
  { label: "System tray", section: "advanced", anchorTitle: "System tray", keywords: ["tray", "close to tray", "minimize", "background"] },
  { label: "Discord Rich Presence", section: "advanced", anchorTitle: "Discord Rich Presence", keywords: ["discord", "rich presence", "status", "now watching"] },
  { label: "Privacy & tracker blocking", section: "advanced", anchorTitle: "Privacy", keywords: ["privacy", "telemetry", "tracker", "ads", "analytics", "block"] },
];

export function SettingsNav({
  active,
  onChange,
}: {
  active: SectionId;
  onChange: (id: SectionId, anchor?: string) => void;
}) {
  const { settings } = useSettings();
  const t = useT();
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();
  const sectionLabel = useMemo(() => {
    const m = new Map<SectionId, string>();
    for (const group of NAV_GROUPS) for (const item of group.items) m.set(item.id, item.label);
    return m;
  }, []);
  const matches = useMemo<NavItem[] | null>(() => {
    if (!trimmed) return null;
    const out: NavItem[] = [];
    for (const group of NAV_GROUPS) {
      const groupHit = group.heading?.toLowerCase().includes(trimmed) ?? false;
      for (const item of group.items) {
        const hit =
          groupHit ||
          item.label.toLowerCase().includes(trimmed) ||
          (item.keywords ?? []).some((k) => k.toLowerCase().includes(trimmed));
        if (hit) out.push(item);
      }
    }
    return out;
  }, [trimmed]);
  const optionMatches = useMemo<SettingsOption[] | null>(() => {
    if (!trimmed) return null;
    return SETTINGS_OPTIONS.filter(
      (o) =>
        o.label.toLowerCase().includes(trimmed) ||
        (o.keywords ?? []).some((k) => k.toLowerCase().includes(trimmed)),
    );
  }, [trimmed]);

  const libraryKeys = [
    settings.tmdbKey,
    settings.omdbKey,
    settings.rpdbKey,
    settings.fanartKey,
    settings.tvdbKey,
  ].filter(Boolean).length;

  const debridKeys = [
    settings.rdKey,
    settings.tbKey,
    settings.adKey,
    settings.pmKey,
    settings.dlKey,
  ].filter(Boolean).length;

  const debridChip = libraryKeys > 0 ? `${libraryKeys}/5` : null;

  const relayLive = settings.togetherRelayUrl ? "live" : null;
  const langChip =
    settings.preferredLanguages.length === 0
      ? null
      : settings.preferredLanguages.length > 1
      ? "MULTI"
      : LANG_ABBR[settings.preferredLanguages[0]] ??
        settings.preferredLanguages[0].slice(0, 3).toUpperCase();

  const webhookActive =
    (settings.webhooks.discordUrl || settings.webhooks.telegramUrl) &&
    Object.values(settings.webhooks.sources).some(Boolean);

  const status: Record<SectionId, string | null> = {
    account: null,
    library: libraryKeys > 0 ? `${libraryKeys}/5` : null,
    trakt: null,
    anilist: null,
    simkl: null,
    relay: relayLive,
    streaming: debridChip,
    language: langChip,
    player: settings.playerEngine === "auto" ? null : settings.playerEngine,
    playerLayout: null,
    theme: settings.theme.preset === "cool-grey" && settings.theme.fontPair === "sentient-switzer" ? null : "•",
    webhooks: webhookActive ? "live" : null,
    hotkeys: null,
    bug: null,
    advanced: null,
  };

  const renderItem = ({ id, label, Icon }: NavItem) => {
    const isActive = id === active;
    const chip = status[id];
    const debridChipLocal = id === "streaming" && debridKeys > 0 ? `${debridKeys}D` : null;
    return (
      <button
        key={id}
        onClick={() => {
          onChange(id);
          setQuery("");
        }}
        className={`group flex h-14 w-full items-center gap-3 rounded-xl px-2.5 text-start transition-colors ${
          isActive
            ? "bg-raised text-ink shadow-[inset_0_0_0_1px_var(--color-edge)]"
            : "text-ink-muted hover:bg-elevated/70 hover:text-ink"
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
            isActive
              ? "bg-elevated text-ink shadow-[inset_0_0_0_1px_var(--color-edge-soft)]"
              : "bg-canvas/60 text-ink-subtle group-hover:text-ink-muted"
          }`}
        >
          <Icon size={20} strokeWidth={1.6} />
        </span>
        <span className="flex-1 truncate text-[14.5px] font-medium">{t(label)}</span>
        {(chip || debridChipLocal) && (
          <span className="flex shrink-0 gap-1">
            {debridChipLocal && (
              <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent">
                {debridChipLocal}
              </span>
            )}
            {chip && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide ${
                  chip === "live" || chip === "via relay"
                    ? "bg-accent/15 text-accent"
                    : "bg-canvas/70 text-ink-subtle"
                }`}
              >
                {chip}
              </span>
            )}
          </span>
        )}
      </button>
    );
  };

  return (
    <nav className="relative flex w-72 shrink-0 flex-col bg-surface pt-24 shadow-[1px_0_0_var(--color-edge)]">
      <div data-tauri-drag-region className="h-3 shrink-0" />
      <div className="px-3 pb-3">
        <div className="flex h-10 items-center gap-2 rounded-xl bg-elevated/70 px-3 shadow-[inset_0_0_0_1px_var(--color-edge-soft)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-subtle">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search settings")}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-subtle"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (matches && matches.length > 0) {
                  onChange(matches[0].id);
                  setQuery("");
                } else if (optionMatches && optionMatches.length > 0) {
                  const o = optionMatches[0];
                  onChange(o.section, o.anchorTitle ? settingsAnchor(o.anchorTitle) : undefined);
                  setQuery("");
                }
              } else if (e.key === "Escape") {
                setQuery("");
              }
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="shrink-0 text-ink-subtle transition-colors hover:text-ink"
              aria-label={t("Clear")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pb-8">
        {matches && (
          <div className="flex flex-col gap-1">
            {matches.length === 0 && (!optionMatches || optionMatches.length === 0) && (
              <div className="px-3.5 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-subtle/80">
                {t("No matches")}
              </div>
            )}
            {matches.length > 0 && (
              <>
                <div className="px-3.5 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-subtle/80">
                  {matches.length === 1 ? t("{n} tab", { n: matches.length }) : t("{n} tabs", { n: matches.length })}
                </div>
                {matches.map(renderItem)}
              </>
            )}
            {optionMatches && optionMatches.length > 0 && (
              <>
                <div className="px-3.5 pb-1.5 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-subtle/80">
                  {optionMatches.length === 1 ? t("{n} option", { n: optionMatches.length }) : t("{n} options", { n: optionMatches.length })}
                </div>
                {optionMatches.map((o) => (
                  <button
                    key={`${o.section}-${o.label}`}
                    onClick={() => {
                      onChange(o.section, o.anchorTitle ? settingsAnchor(o.anchorTitle) : undefined);
                      setQuery("");
                    }}
                    className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start text-ink-muted transition-colors hover:bg-elevated/70 hover:text-ink"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-canvas/60 text-ink-subtle group-hover:text-ink-muted">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">{t(o.label)}</span>
                      <span className="block truncate text-[11px] text-ink-subtle">
                        {t(sectionLabel.get(o.section) ?? o.section)}
                      </span>
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
        {!matches && NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-1">
            {group.heading && (
              <div className="px-3.5 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-subtle/80">
                {t(group.heading)}
              </div>
            )}
            {group.items.map(({ id, label, Icon }) => {
              const isActive = id === active;
              const chip = status[id];
              const debridChip = id === "streaming" && debridKeys > 0 ? `${debridKeys}D` : null;
              return (
                <button
                  key={id}
                  onClick={() => onChange(id)}
                  className={`group flex h-14 w-full items-center gap-3 rounded-xl px-2.5 text-start transition-colors ${
                    isActive
                      ? "bg-raised text-ink shadow-[inset_0_0_0_1px_var(--color-edge)]"
                      : "text-ink-muted hover:bg-elevated/70 hover:text-ink"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isActive
                        ? "bg-elevated text-ink shadow-[inset_0_0_0_1px_var(--color-edge-soft)]"
                        : "bg-canvas/60 text-ink-subtle group-hover:text-ink-muted"
                    }`}
                  >
                    <Icon size={20} strokeWidth={1.6} />
                  </span>
                  <span className="flex-1 truncate text-[14.5px] font-medium">{t(label)}</span>
                  {(chip || debridChip) && (
                    <span className="flex shrink-0 gap-1">
                      {debridChip && (
                        <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent">
                          {debridChip}
                        </span>
                      )}
                      {chip && (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide ${
                            chip === "live" || chip === "via relay"
                              ? "bg-accent/15 text-accent"
                              : "bg-canvas/70 text-ink-subtle"
                          }`}
                        >
                          {chip}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
