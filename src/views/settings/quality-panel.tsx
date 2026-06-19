import { FormatBadge, type BadgeKind } from "@/components/format-badge";
import { useSettings } from "@/lib/settings";
import {
  CustomCodeCard,
  DownloadsSection,
  LocalEngineSection,
  PlayModePanel,
  PlayerEnginePanel,
  RemoteServerSection,
  SeekBarPanel,
  ServerAddressSection,
  SubtitleStylePanel,
} from "./player-panel";
import { Section, ToggleRow } from "./shared";
import { useT } from "@/lib/i18n";

export function QualityPanel() {
  const t = useT();
  const { settings, update } = useSettings();
  return (
    <>
      <Section
        title={t("Play button behavior")}
        subtitle={t("Choose what happens when you hit Play on a title. Manual gives you full control over quality and source.")}
      >
        <PlayModePanel />
      </Section>

      <Section
        title={t("Player engine")}
        subtitle={t("HTML5 plays everything WebView2 supports. mpv handles TrueHD, DTS-HD, AV1, weird containers, and HDR. Auto picks based on the source.")}
      >
        <PlayerEnginePanel />
      </Section>

      <Section
        title={t("Seek bar")}
        subtitle={t("Style the timeline at the bottom of the player. Swap the dot for a sticker, change the bar height, recolor it. Settings live-preview right here.")}
      >
        <SeekBarPanel />
      </Section>

      <Section
        title={t("Subtitle style")}
        subtitle={t("How subtitles look during playback. Live preview below.")}
      >
        <SubtitleStylePanel />
      </Section>

      <Section
        title={t("Stream format chips")}
        subtitle={t("The little 4K · HDR · codec · audio chips that ride along each stream in the play picker.")}
      >
        <ToggleRow
          label={t("Show format chips on stream rows")}
          sub={t("The picker tags each stream with resolution, HDR flavor, codec, and audio format. Off hides them all.")}
          value={settings.showQualityBadge}
          onChange={(v) => update({ showQualityBadge: v })}
        />
        <QualityPreview />
      </Section>

      <Section
        title={t("Poster size")}
        subtitle={t("Scale every poster and card across Home, Discover, and your library. Bump it up on a 4K or large display where the defaults feel small, or shrink it for a denser grid.")}
      >
        <Segmented
          value={posterSizeKey(settings.posterScale)}
          options={POSTER_SIZES.map((p) => ({ value: p.value, label: p.label }))}
          onChange={(v) =>
            update({ posterScale: POSTER_SIZES.find((p) => p.value === v)?.scale ?? 1 })
          }
        />
      </Section>

      <Section
        title={t("Title text")}
        subtitle={t("Resize the row titles on Home and the title shown in the player, without scaling the rest of the interface. You can also lead the player title with the series name instead of the episode.")}
      >
        <SizeSlider
          label={t("Row titles")}
          value={settings.rowTitleScale}
          onChange={(v) => update({ rowTitleScale: v })}
        />
        <SizeSlider
          label={t("Player title")}
          value={settings.playerTitleScale}
          onChange={(v) => update({ playerTitleScale: v })}
        />
        <ToggleRow
          label={t("Show series name first in the player")}
          sub={t("Lead with the show name instead of the episode title at the top of the player.")}
          value={settings.playerTitleSeriesFirst}
          onChange={(v) => update({ playerTitleSeriesFirst: v })}
        />
      </Section>

      <Section
        title={t("Accessibility")}
        subtitle={t("Make everything bigger and easier to read: sidebar, menus, popups, every page. The whole interface scales live as you drag, so you can see the change right here. Great on 4K and ultrawide monitors, or whenever the text feels small.")}
      >
        <div className="flex items-center gap-4 px-1 py-1.5">
          <span className="w-32 shrink-0 text-[13.5px] font-medium text-ink">{t("Interface scale")}</span>
          <input
            type="range"
            min={0.8}
            max={1.6}
            step={0.05}
            value={settings.uiScale}
            onChange={(e) => update({ uiScale: parseFloat(e.target.value) })}
            className="h-1 flex-1 appearance-none rounded-full bg-edge-soft accent-ink"
          />
          <span className="w-14 shrink-0 text-end text-[13px] tabular-nums text-ink-muted">
            {Math.round(settings.uiScale * 100)}%
          </span>
          {settings.uiScale !== 1 && (
            <button
              onClick={() => update({ uiScale: 1 })}
              className="shrink-0 text-[12.5px] font-medium text-ink-subtle transition-colors hover:text-ink"
            >
              {t("Reset")}
            </button>
          )}
        </div>
      </Section>

      <Section
        title={t("Trailer quality")}
        subtitle={t("How sharp the trailer is when you hit the preview button. Auto picks from your connection speed. 1080p and Best merge separate video and audio with the bundled ffmpeg, so they take a beat longer to start.")}
      >
        <Segmented
          value={settings.trailerQuality}
          options={[
            { value: "auto", label: "Auto" },
            { value: "360p", label: "360p" },
            { value: "720p", label: "720p" },
            { value: "1080p", label: "1080p" },
            { value: "best", label: "Best" },
          ]}
          onChange={(v) => update({ trailerQuality: v })}
        />
      </Section>

      <Section
        title={t("Audio")}
        subtitle={t("Shape the sound without touching your system EQ. Applies on the mpv engine; the HTML5 engine plays audio untouched.")}
      >
        <ToggleRow
          label={t("Normalize loudness")}
          sub={t("Evens out quiet dialogue and loud action scenes with a dynamic normalizer.")}
          value={settings.audioNormalize}
          onChange={(v) => update({ audioNormalize: v })}
        />
        <div>
          <Segmented
            value={settings.audioProfile}
            options={[
              { value: "off", label: "Flat" },
              { value: "bass", label: "Bass boost" },
              { value: "voice", label: "Vocal clarity" },
              { value: "bass-reduce", label: "Less bass" },
              { value: "night", label: "Night mode" },
            ]}
            onChange={(v) => update({ audioProfile: v })}
          />
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-subtle">
            {t("Night mode gently compresses loud moments for late-night watching. Profiles take effect when the next track loads and stack with the normalizer.")}
          </p>
        </div>
      </Section>

      <Section
        title={t("Skip intros")}
        subtitle={t("Harbor finds intro and credits timing from AniSkip, TheIntroDB, and the file's own chapters, then shows a Skip button at the right moment.")}
      >
        <ToggleRow
          label={t("Auto-skip intros")}
          sub={t("Jump past openings automatically the moment one starts. The Skip button still shows either way, and seeking back into an intro replays it without skipping again.")}
          value={settings.autoSkipIntro}
          onChange={(v) => update({ autoSkipIntro: v })}
        />
      </Section>

      <Section
        title={t("Next episode prompt")}
        subtitle={t("When the Up Next pill appears before an episode ends. Auto scales to the episode length, so short episodes stop prompting so early. Off hides it.")}
      >
        <Segmented
          value={nextEpLeadKey(settings.nextEpisodeLeadSec)}
          options={NEXT_EP_LEADS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(v) =>
            update({ nextEpisodeLeadSec: NEXT_EP_LEADS.find((o) => o.value === v)?.sec ?? -1 })
          }
        />
      </Section>

      <Section
        title={t("Downloads")}
        subtitle={t("Where Harbor saves videos when you hit Download in the player. Pick any folder, including one on a different drive.")}
      >
        <DownloadsSection />
      </Section>

      <LocalEngineSection />

      <ServerAddressSection />

      <RemoteServerSection />

      <CustomCodeCard />
    </>
  );
}

function SizeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const t = useT();
  return (
    <div className="flex items-center gap-4 px-1 py-1.5">
      <span className="w-32 shrink-0 text-[13.5px] font-medium text-ink">{label}</span>
      <input
        type="range"
        min={0.8}
        max={1.6}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 flex-1 appearance-none rounded-full bg-edge-soft accent-ink"
      />
      <span className="w-14 shrink-0 text-end text-[13px] tabular-nums text-ink-muted">
        {Math.round(value * 100)}%
      </span>
      {value !== 1 && (
        <button
          onClick={() => onChange(1)}
          className="shrink-0 text-[12.5px] font-medium text-ink-subtle transition-colors hover:text-ink"
        >
          {t("Reset")}
        </button>
      )}
    </div>
  );
}

const POSTER_SIZES = [
  { value: "compact", label: "Compact", scale: 0.85 },
  { value: "default", label: "Default", scale: 1 },
  { value: "large", label: "Large", scale: 1.25 },
  { value: "huge", label: "Huge", scale: 1.55 },
] as const;

function posterSizeKey(scale: number): string {
  let best: (typeof POSTER_SIZES)[number] = POSTER_SIZES[0];
  for (const p of POSTER_SIZES) {
    if (Math.abs(p.scale - scale) < Math.abs(best.scale - scale)) best = p;
  }
  return best.value;
}

const NEXT_EP_LEADS = [
  { value: "auto", label: "Auto", sec: -1 },
  { value: "off", label: "Off", sec: 0 },
  { value: "30", label: "30s", sec: 30 },
  { value: "45", label: "45s", sec: 45 },
  { value: "60", label: "1 min", sec: 60 },
  { value: "90", label: "1.5 min", sec: 90 },
  { value: "120", label: "2 min", sec: 120 },
] as const;

function nextEpLeadKey(sec: number): string {
  return NEXT_EP_LEADS.find((o) => o.sec === sec)?.value ?? "auto";
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  const t = useT();
  return (
    <div className="flex w-fit flex-wrap gap-1 rounded-full bg-elevated/40 p-1 ring-1 ring-edge-soft/60">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${
            value === o.value
              ? "bg-ink text-canvas"
              : "text-ink-muted hover:bg-raised hover:text-ink"
          }`}
        >
          {t(o.label)}
        </button>
      ))}
    </div>
  );
}

function QualityPreview() {
  const samples: BadgeKind[] = [
    "8k",
    "4k-uhd",
    "uhd",
    "2k-qhd",
    "1080p",
    "1080i",
    "720p",
    "576p",
    "480p",
    "360p",
    "hd",
    "sd",
    "dvd",
    "imax",
    "3d",
    "bluray",
    "remux",
    "webdl",
    "webrip",
    "hdtv",
    "dvb",
    "cam",
    "hdcam",
    "telesync",
    "hdts",
    "telecine",
    "scr",
    "wp",
    "hevc",
    "av1",
    "dv",
    "hdr10-plus",
    "hdr10",
    "hdr",
    "hlg",
    "sdr",
    "atmos",
    "atmos-912",
    "truehd",
    "dts-hd-ma",
    "dts-hd",
    "dts-x",
    "dts",
    "ddp",
    "dd",
    "eac3",
    "ac3",
    "aac",
    "flac",
    "mp3",
    "opus",
    "lpcm",
    "pcm",
    "7.1",
    "5.1",
    "stereo",
    "mono",
    "extended",
    "remastered",
    "repack",
  ];
  return (
    <div className="flex flex-wrap items-center gap-0 rounded-xl border border-edge-soft bg-canvas/40 px-4 py-3.5">
      {samples.map((k) => (
        <FormatBadge key={k} kind={k} />
      ))}
    </div>
  );
}
