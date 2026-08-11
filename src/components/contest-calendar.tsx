"use client";

import { useEffect, useState, useCallback } from "react";
import { useTerminalTheme } from "./theme-provider";
import { Terminal, ExternalLink, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

interface Contest {
  name: string;
  url: string;
  start_time: string;
  duration: string;
  site: string;
  rated?: string;
  code?: string;
}

const PLATFORMS = [
  { key: "codeforces", label: "Codeforces", color: "blue" },
  { key: "atcoder", label: "AtCoder", color: "neutral" },
  { key: "leetcode", label: "LeetCode", color: "amber" },
  { key: "codechef", label: "CodeChef", color: "emerald" },
] as const;

type PlatformKey = (typeof PLATFORMS)[number]["key"];

const PLATFORM_STYLES: Record<PlatformKey, { tab: string; activeTab: string; badge: string }> = {
  codeforces: {
    tab: "text-blue-400/50 hover:text-blue-400 hover:bg-blue-500/5",
    activeTab: "text-blue-400 bg-blue-500/10 border-b-blue-400",
    badge: "border-blue-500/40 bg-blue-500/5 text-blue-400",
  },
  atcoder: {
    tab: "text-neutral-400/50 hover:text-neutral-300 hover:bg-neutral-500/5",
    activeTab: "text-neutral-300 bg-neutral-500/10 border-b-neutral-400",
    badge: "border-neutral-500/40 bg-neutral-500/5 text-neutral-400",
  },
  leetcode: {
    tab: "text-amber-400/50 hover:text-amber-400 hover:bg-amber-500/5",
    activeTab: "text-amber-400 bg-amber-500/10 border-b-amber-400",
    badge: "border-amber-500/40 bg-amber-500/5 text-amber-400",
  },
  codechef: {
    tab: "text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/5",
    activeTab: "text-emerald-400 bg-emerald-500/10 border-b-emerald-400",
    badge: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400",
  },
};

export function ContestCalendar() {
  const { playClick } = useTerminalTheme();
  const [activeTab, setActiveTab] = useState<PlatformKey>("codeforces");

  const formatDuration = (secondsStr: string) => {
    const secs = parseFloat(secondsStr);
    if (isNaN(secs)) return secondsStr;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (m === 0) return `${h}h`;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const getGCalUrl = (c: Contest) => {
    const platformName = PLATFORMS.find((p) => p.key === activeTab)?.label || activeTab;
    const start = new Date(c.start_time);
    const durationSecs = parseFloat(c.duration);
    const end = new Date(start.getTime() + (isNaN(durationSecs) ? 2 * 3600 : durationSecs) * 1000);

    const formatToGCalDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const startISO = formatToGCalDate(start);
    const endISO = formatToGCalDate(end);

    const title = `[${platformName}] ${c.name}`;
    
    const startLocal = start.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    });
    const startUTC = start.toUTCString();
    const description = `<b><u>Competitive Programming Contest Details</u></b>

<b>Contest:</b>      ${c.name}
<b>Platform:</b>     ${platformName}
<b>Duration:</b>     ${formatDuration(c.duration)}
<b>Rated:</b>        ${c.rated || "Yes / See contest site"}
${c.code ? `<b>Contest Code:</b> ${c.code}\n` : ""}
<b>Start Time:</b>
- Local:      ${startLocal}
- UTC:        ${startUTC}

<b>Contest Link:</b> ${c.url}

<b>Reference & Boilerplates:</b>
https://itl-hub.vercel.app/`;

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${startISO}/${endISO}&details=${encodeURIComponent(
      description
    )}&location=${encodeURIComponent(c.url)}&sf=true&output=xml`;
  };

  const handleDownloadICS = (c: Contest) => {
    const platformName = PLATFORMS.find((p) => p.key === activeTab)?.label || activeTab;
    const start = new Date(c.start_time);
    const durationSecs = parseFloat(c.duration);
    const end = new Date(start.getTime() + (isNaN(durationSecs) ? 2 * 3600 : durationSecs) * 1000);

    const formatToGCalDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const startISO = formatToGCalDate(start);
    const endISO = formatToGCalDate(end);
    const stampISO = formatToGCalDate(new Date());

    const title = `[${platformName}] ${c.name}`;
    
    const startLocal = start.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    });
    const startUTC = start.toUTCString();

    const plainDescription = `Competitive Programming Contest Details

Contest:      ${c.name}
Platform:     ${platformName}
Duration:     ${formatDuration(c.duration)}
Rated:        ${c.rated || "Yes / See contest site"}
${c.code ? `Contest Code: ${c.code}\n` : ""}
Start Time:
- Local:      ${startLocal}
- UTC:        ${startUTC}

Contest Link: ${c.url}

Reference & Boilerplates:
https://itl-hub.vercel.app/`;

    const htmlDescription = `<!DOCTYPE html><html><body><b><u>Competitive Programming Contest Details</u></b><br><br><b>Contest:</b>      ${c.name}<br><b>Platform:</b>     ${platformName}<br><b>Duration:</b>     ${formatDuration(c.duration)}<br><b>Rated:</b>        ${c.rated || "Yes / See contest site"}<br>${c.code ? `<b>Contest Code:</b> ${c.code}<br>` : ""}<b>Start Time:</b><br>- Local:      ${startLocal}<br>- UTC:        ${startUTC}<br><br><b>Contest Link:</b> <a href="${c.url}">${c.url}</a><br><br><b>Reference & Boilerplates:</b><br><a href="https://itl-hub.vercel.app/">https://itl-hub.vercel.app/</a></body></html>`;

    const escapedPlainDesc = plainDescription
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
      
    const escapedHtmlDesc = htmlDescription
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

    const escapedTitle = title.replace(/[,;]/g, (m) => `\\${m}`);

    const uid = `${activeTab}-${startISO}-${c.name.replace(/[^a-zA-Z0-9]/g, "")}`.toLowerCase().substring(0, 64) + "@itl";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ITL//Contest Calendar//EN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stampISO}`,
      `DTSTART:${startISO}`,
      `DTEND:${endISO}`,
      `SUMMARY:${escapedTitle}`,
      `DESCRIPTION:${escapedPlainDesc}`,
      `X-ALT-DESC;FMTTYPE=text/html:${escapedHtmlDesc}`,
      `LOCATION:${c.url}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${c.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const [contestsByPlatform, setContestsByPlatform] = useState<Record<PlatformKey, Contest[]>>({
    codeforces: [],
    atcoder: [],
    leetcode: [],
    codechef: [],
  });
  const [loading, setLoading] = useState<Record<PlatformKey, boolean>>({
    codeforces: true,
    atcoder: true,
    leetcode: true,
    codechef: true,
  });
  const [now, setNow] = useState<number>(() => Date.now());

  const fetchPlatform = useCallback((platform: PlatformKey) => {
    fetch(`/api/contests?platform=${platform}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setContestsByPlatform((prev) => ({ ...prev, [platform]: data }));
        setLoading((prev) => ({ ...prev, [platform]: false }));
      })
      .catch(() => {
        setLoading((prev) => ({ ...prev, [platform]: false }));
      });
  }, []);

  useEffect(() => {
    PLATFORMS.forEach((p) => fetchPlatform(p.key));
  }, [fetchPlatform]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);



  const getCountdown = (startTimeStr: string) => {
    const start = new Date(startTimeStr).getTime();
    const diff = start - now;
    if (diff <= 0) return "LIVE";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${mins}m`);
    return parts.join(" ");
  };

  const contests = contestsByPlatform[activeTab];
  const isLoading = loading[activeTab];
  const styles = PLATFORM_STYLES[activeTab];

  return (
    <div className="border border-border bg-card/20 backdrop-blur-sm shadow-xl font-mono relative overflow-hidden">
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2 bg-muted/15 text-[10px] text-muted-foreground/35 select-none">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive/60" />
            <span className="h-1.5 w-1.5 rounded-full bg-warning/60" />
            <span className="h-1.5 w-1.5 rounded-full bg-success/60" />
          </div>
          <span className="ml-2 tracking-wider text-primary/75">CONTESTS_MONITOR v2.0</span>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-success flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-success rounded-full animate-ping" />
          <span>synced</span>
        </span>
      </div>

      {/* Platform Tabs */}
      <div className="flex border-b border-border/40 bg-muted/5 overflow-x-auto scrollbar-thin select-none">
        {PLATFORMS.map((p) => {
          const isActive = activeTab === p.key;
          const pStyles = PLATFORM_STYLES[p.key];
          const count = contestsByPlatform[p.key].length;
          const pLoading = loading[p.key];

          return (
            <button
              key={p.key}
              onClick={() => {
                playClick();
                setActiveTab(p.key);
              }}
              className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 shrink-0 flex items-center gap-2 ${
                isActive
                  ? `${pStyles.activeTab}`
                  : `border-b-transparent ${pStyles.tab}`
              }`}
            >
              <span>{p.label}</span>
              {!pLoading && (
                <span className={`text-[8px] px-1 py-0 border ${pStyles.badge} font-mono`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50 animate-pulse">
            <Terminal className="h-4 w-4 animate-spin text-primary/70" />
            <span>QUERYING_{activeTab.toUpperCase()}_API...</span>
          </div>
        </div>
      ) : contests.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-xs text-muted-foreground/40">[INFO] No upcoming contests found for {PLATFORMS.find((p) => p.key === activeTab)?.label}</div>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-[11px] border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-border/40 bg-muted/5 text-muted-foreground/40 font-bold uppercase select-none text-[9px]">
                <th className="py-2.5 px-4">Contest</th>
                <th className="py-2.5 px-3 w-[150px]">Start</th>
                <th className="py-2.5 px-3 w-[80px]">Duration</th>
                {activeTab === "atcoder" && <th className="py-2.5 px-3 w-[100px]">Rated</th>}
                {activeTab === "codechef" && <th className="py-2.5 px-3 w-[100px]">Code</th>}
                <th className="py-2.5 px-3 w-[110px] text-right">Starts In</th>
                <th className="py-2.5 px-4 w-[110px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/25">
              {contests.map((c, idx) => {
                const countdown = getCountdown(c.start_time);
                const isLive = countdown === "LIVE";

                return (
                  <tr key={idx} className="hover:bg-primary/[0.01] transition-colors leading-relaxed">
                    <td className="py-3 px-4 font-semibold text-foreground max-w-xs truncate">
                      {c.name}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground/50">
                      {new Date(c.start_time).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground/50">
                      {formatDuration(c.duration)}
                    </td>
                    {activeTab === "atcoder" && (
                      <td className="py-3 px-3 text-muted-foreground/50 text-[10px]">
                        {c.rated || "-"}
                      </td>
                    )}
                    {activeTab === "codechef" && (
                      <td className="py-3 px-3 text-muted-foreground/50 text-[10px] font-mono">
                        {c.code || "-"}
                      </td>
                    )}
                    <td className="py-3 px-3 text-right font-bold">
                      <span className={isLive ? "text-success animate-pulse glow-text-strong" : "text-primary/80"}>
                        {isLive ? "[ LIVE ]" : countdown}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      <div className="inline-flex items-center gap-1.5 justify-end relative">
                        {/* Contest Link */}
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={playClick}
                          title="Open Contest Link"
                          className={`inline-flex items-center gap-1 px-2 py-0.5 border ${styles.badge} hover:brightness-125 transition-all text-[10px] uppercase font-bold`}
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>

                        {/* Add to Calendar Button */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            onClick={playClick}
                            title="Add to Calendar"
                            className={`inline-flex items-center gap-1 px-2 py-0.5 border ${styles.badge} hover:brightness-125 transition-all text-[10px] uppercase font-bold cursor-pointer outline-none`}
                          >
                            <Calendar className="h-2.5 w-2.5" />
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="bg-background/95 border border-border/80 backdrop-blur-md font-mono text-left p-1 shadow-2xl z-50 w-44 rounded"
                          >
                            <div className="px-2 py-1 text-[8px] uppercase tracking-widest text-muted-foreground/50 font-bold select-none border-b border-border/20 mb-1 font-mono">
                              Add Event
                            </div>
                            <DropdownMenuItem
                              onClick={() => {
                                playClick();
                                window.open(getGCalUrl(c), "_blank", "noopener,noreferrer");
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-[9px] text-foreground hover:bg-primary/10 transition-colors uppercase font-semibold cursor-pointer rounded-md focus:bg-primary/10 focus:text-foreground focus:outline-none"
                            >
                              Google Calendar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                playClick();
                                handleDownloadICS(c);
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-[9px] text-foreground hover:bg-primary/10 transition-colors uppercase font-semibold cursor-pointer rounded-md focus:bg-primary/10 focus:text-foreground focus:outline-none"
                            >
                              iCal / ICS File
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
