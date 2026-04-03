import { useState, useMemo, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useYouTubeAPI } from "@/hooks/useYouTubeAPI";
import { fmtNum } from "@/utils/numbers";
import { downloadFile } from "@/utils/exportData";

const PANEL_WIDTH = 360;

const DEFAULT_WIDTHS = {
  cb: 32,
  idx: 40,
  title: 220,
  date: 90,
  views: 80,
  length: 70,
  chMult: 70,
  qual: 60,
  actions: 70,
};

function videosToCSV(videos) {
  const cols = [
    "title",
    "channel",
    "subs",
    "views",
    "length",
    "date",
    "chMedian",
    "chMult",
    "qualifies",
    "videoId",
  ];
  const hdr = cols.join(",");
  const rows = videos.map((v) =>
    cols
      .map((c) => {
        let val = v[c] === undefined ? "" : v[c];
        if (c === "subs") val = (val || 0) * 1000;
        val = String(val);
        return '"' + val.replace(/"/g, '""') + '"';
      })
      .join(","),
  );
  return [hdr, ...rows].join("\n");
}

function videosToJSON(videos) {
  return videos.map((v) => ({
    ...v,
    subs: (v.subs || 0) * 1000,
  }));
}

export function ChannelAnalysis() {
  const { addEntry, outlierThreshold } = useStore();
  const { fetchChannel } = useYouTubeAPI();

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [channelURL, setChannelURL] = useState("");
  const [timeValue, setTimeValue] = useState("12");
  const [timeUnit, setTimeUnit] = useState("months");
  const [minLength, setMinLength] = useState("7");
  const [fetching, setFetching] = useState(false);
  const [fetchLog, setFetchLog] = useState(
    "// Enter a channel URL and fetch to begin",
  );
  const [fetchLogType, setFetchLogType] = useState("info");
  const [channelInfo, setChannelInfo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [afterFilterCount, setAfterFilterCount] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [sortCol, setSortCol] = useState("views");
  const [sortDir, setSortDir] = useState("desc");
  const [filterQual, setFilterQual] = useState("all");
  const [colWidths, setColWidths] = useState(DEFAULT_WIDTHS);
  const resizing = useRef(null);

  function log(msg, type = "info") {
    setFetchLog(msg);
    setFetchLogType(type);
  }

  function toMonths() {
    const v = parseFloat(timeValue) || 1;
    if (timeUnit === "days") return Math.max(1, Math.ceil(v / 30));
    if (timeUnit === "weeks") return Math.max(1, Math.ceil(v / 4));
    return Math.round(v);
  }

  async function handleFetch() {
    if (!channelURL.trim()) return;
    setFetching(true);
    setVideos([]);
    setChannelInfo(null);
    setSelected(new Set());
    log("Resolving channel...");
    try {
      const months = toMonths();
      const result = await fetchChannel(channelURL.trim(), months);
      const minLen = parseFloat(minLength) || 0;
      const filtered = result.videos.filter((v) => v.length >= minLen);
      setChannelInfo(result.channelInfo);
      setAfterFilterCount(filtered.length);
      setVideos(filtered);
      log(
        `✓ ${result.channelInfo.totalFetched} in period → ${filtered.length} after filter. ${filtered.filter((v) => v.qualifies).length} qualify.`,
        "ok",
      );
    } catch (e) {
      log("✗ " + e.message, "err");
    }
    setFetching(false);
  }

  const startResize = useCallback(
    (col, e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = colWidths[col];
      resizing.current = { col, startX, startW };
      function onMove(ev) {
        if (!resizing.current) return;
        const delta = ev.clientX - resizing.current.startX;
        const newW = Math.max(40, resizing.current.startW + delta);
        setColWidths((w) => ({ ...w, [resizing.current.col]: newW }));
      }
      function onUp() {
        resizing.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [colWidths],
  );

  const rows = useMemo(() => {
    let r = [...videos];
    if (filterQual === "yes") r = r.filter((v) => v.qualifies);
    if (filterQual === "no") r = r.filter((v) => !v.qualifies);
    r.sort((a, b) => {
      let av = a[sortCol],
        bv = b[sortCol];
      if (typeof av === "string")
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return r;
  }, [videos, sortCol, sortDir, filterQual]);

  function toggleSort(col) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  function toggleAll() {
    if (rows.every((r) => selected.has(r.videoId))) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.videoId)));
  }

  function toggleRow(id) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function logVideo(v) {
    addEntry({
      search: channelInfo?.name || "",
      searchTerms: "From Channel",
      title: v.title,
      channel: v.channel,
      subs: v.subs,
      views: v.views,
      length: v.length,
      date: v.date,
      chMedian: v.chMedian,
      chMult: v.chMult,
      median: v.chMedian,
      searchMult: 0,
      comments: "No",
      titleType: "",
      emotion: "",
      thumbnail: "",
      hook: "",
      pacing: "",
      arc: "",
      insight: "",
      transcript: "",
    });
  }

  function logSelected() {
    rows.filter((v) => selected.has(v.videoId)).forEach(logVideo);
    log(`✓ Logged ${selected.size} videos to Outlier Research.`, "ok");
    setSelected(new Set());
  }

  function logAllQualified() {
    const q = videos.filter((v) => v.qualifies);
    q.forEach(logVideo);
    log(`✓ Logged ${q.length} qualified videos to Outlier Research.`, "ok");
  }

  function handleExport(format) {
    if (!videos.length) return;
    const date = new Date().toISOString().slice(0, 10);
    const name = (channelInfo?.name || "channel").replace(/\s+/g, "_");
    if (format === "json") {
      downloadFile(
        JSON.stringify(videosToJSON(rows), null, 2),
        `${name}_${date}.json`,
        "application/json",
      );
    } else {
      downloadFile(videosToCSV(rows), `${name}_${date}.csv`, "text/csv");
    }
  }

  function clearResults() {
    if (!videos.length) return;
    if (confirm("Clear all channel results?")) {
      setVideos([]);
      setChannelInfo(null);
      setAfterFilterCount(0);
      setSelected(new Set());
      log("// Results cleared", "info");
    }
  }

  function rowBg(v, i) {
    if (selected.has(v.videoId)) return "bg-primary/5";
    return i % 2 === 0 ? "bg-background" : "bg-muted/20";
  }

  function Th({ col, label }) {
    const w = colWidths[col];
    const active = sortCol === col;
    return (
      <th
        style={{
          width: w,
          minWidth: w,
          maxWidth: w,
          position: "relative",
          userSelect: "none",
        }}
        className={`px-2 py-2 text-[10px] font-head font-semibold tracking-widest uppercase cursor-pointer whitespace-nowrap transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        onClick={() => toggleSort(col)}
      >
        <span>
          {label}
          {active ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
        </span>
        <span
          onMouseDown={(e) => {
            e.stopPropagation();
            startResize(col, e);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: "col-resize",
            zIndex: 2,
          }}
          className="hover:bg-primary/40 transition-colors"
        />
      </th>
    );
  }

  const logColor =
    fetchLogType === "ok"
      ? "text-green-400"
      : fetchLogType === "err"
        ? "text-destructive"
        : "text-primary";

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT PANEL */}
      <div
        className="flex-shrink-0 flex-grow-0 border-r border-border flex flex-col transition-all duration-200"
        style={{
          width: leftCollapsed ? 0 : PANEL_WIDTH,
          minWidth: leftCollapsed ? 0 : PANEL_WIDTH,
          maxWidth: PANEL_WIDTH,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          className="px-3 py-2.5 border-b border-border bg-card flex-shrink-0 flex items-center justify-between"
          style={{ width: PANEL_WIDTH }}
        >
          <div className="min-w-0 overflow-hidden">
            <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary truncate">
              Channel Analysis
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Find outliers from any channel
            </p>
          </div>
          <button
            onClick={() => setLeftCollapsed(true)}
            className="text-muted-foreground hover:text-primary transition-colors p-1 flex-shrink-0 ml-2"
            title="Collapse panel"
          >
            <PanelLeftClose size={14} />
          </button>
        </div>

        <ScrollArea className="flex-1" style={{ width: PANEL_WIDTH }}>
          <div
            style={{ width: PANEL_WIDTH, boxSizing: "border-box" }}
            className="p-3 flex flex-col gap-3"
          >
            <div
              className="border border-primary/30 bg-card"
              style={{ width: "100%", boxSizing: "border-box" }}
            >
              <div className="px-3 py-2 border-b border-primary/20 bg-primary/5">
                <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary">
                  ⚡ Channel Fetch
                </p>
              </div>
              <div
                className="p-3 flex flex-col gap-3"
                style={{ width: "100%", boxSizing: "border-box" }}
              >
                <div className="flex flex-col gap-1">
                  <Label>Channel URL or Handle</Label>
                  <Input
                    value={channelURL}
                    onChange={(e) => setChannelURL(e.target.value)}
                    placeholder="@channelname or youtube.com/channel/UC..."
                    className="w-full text-[10px]"
                  />
                  <p className="text-[9px] text-muted-foreground">
                    Accepts @handle, /channel/UCxxx, or bare channel ID
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Time Range</Label>
                  <div className="flex gap-2">
                    <Input
                      value={timeValue}
                      onChange={(e) => setTimeValue(e.target.value)}
                      placeholder="12"
                      className="flex-1 min-w-0 text-[10px]"
                      type="number"
                      min="1"
                    />
                    <Select value={timeUnit} onValueChange={setTimeUnit}>
                      <SelectTrigger className="text-[10px] w-[90px] flex-shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days" className="text-[10px]">
                          Days
                        </SelectItem>
                        <SelectItem value="weeks" className="text-[10px]">
                          Weeks
                        </SelectItem>
                        <SelectItem value="months" className="text-[10px]">
                          Months
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Minimum Video Length (min)</Label>
                  <Input
                    value={minLength}
                    onChange={(e) => setMinLength(e.target.value)}
                    placeholder="7"
                    className="w-full text-[10px]"
                    type="number"
                    min="0"
                  />
                </div>
                <Button
                  className="w-full text-xs"
                  onClick={handleFetch}
                  disabled={fetching || !channelURL.trim()}
                >
                  {fetching ? "Fetching..." : "Fetch Channel"}
                </Button>
                <div
                  className={`p-2 bg-background border border-border text-[10px] font-mono min-h-[28px] break-all ${logColor}`}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    overflowWrap: "break-word",
                  }}
                >
                  {fetchLog}
                </div>
              </div>
            </div>

            {channelInfo && (
              <div
                className="border border-border"
                style={{ width: "100%", boxSizing: "border-box" }}
              >
                <div className="px-3 py-2 bg-card border-b border-border">
                  <p className="font-head font-semibold text-xs tracking-widest uppercase text-primary truncate">
                    {channelInfo.name}
                  </p>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {[
                    [
                      "Subscribers",
                      channelInfo.subs ? channelInfo.subs + "K" : "—",
                    ],
                    ["Total in Period", channelInfo.totalFetched],
                    ["After Filter", afterFilterCount],
                    ["Channel Median", fmtNum(channelInfo.chMedian)],
                    ["Qualified", channelInfo.qualified],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="border border-border bg-background p-2"
                    >
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                        {label}
                      </p>
                      <p className="text-primary font-bold text-xs mt-0.5">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {leftCollapsed && (
        <button
          onClick={() => setLeftCollapsed(false)}
          className="flex-shrink-0 flex items-center justify-center w-6 bg-card border-r border-border text-muted-foreground hover:text-primary transition-colors"
          title="Expand panel"
        >
          <PanelLeftOpen size={14} />
        </button>
      )}

      {/* RIGHT PANEL */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card flex-shrink-0 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="checkbox"
              className="accent-primary w-3 h-3 cursor-pointer"
              checked={
                rows.length > 0 && rows.every((r) => selected.has(r.videoId))
              }
              onChange={toggleAll}
            />
            {selected.size > 0 && (
              <span className="text-[10px] text-primary whitespace-nowrap">
                {selected.size} selected
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">Filter</span>
            <Select value={filterQual} onValueChange={setFilterQual}>
              <SelectTrigger className="h-6 text-[10px] w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px]">
                  All
                </SelectItem>
                <SelectItem value="yes" className="text-[10px]">
                  Qualified only
                </SelectItem>
                <SelectItem value="no" className="text-[10px]">
                  Not qualified
                </SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[10px] text-muted-foreground">Sort</span>
            <Select
              value={sortCol}
              onValueChange={(v) => {
                setSortCol(v);
                setSortDir("desc");
              }}
            >
              <SelectTrigger className="h-6 text-[10px] w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["views", "chMult", "date", "length", "title"].map((c) => (
                  <SelectItem key={c} value={c} className="text-[10px]">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="text-muted-foreground hover:text-primary text-xs border border-border px-1.5 py-0.5"
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {selected.size > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="text-[10px] h-6 px-2"
                onClick={logSelected}
              >
                Log Selected ({selected.size})
              </Button>
            )}
            {videos.filter((v) => v.qualifies).length > 0 && (
              <Button
                size="sm"
                className="text-[10px] h-6 px-2"
                onClick={logAllQualified}
              >
                Log All Qualified ({videos.filter((v) => v.qualifies).length})
              </Button>
            )}
            {videos.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] h-6 px-2"
                  onClick={() => handleExport("json")}
                >
                  JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] h-6 px-2"
                  onClick={() => handleExport("csv")}
                >
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-[10px] h-6 px-2"
                  onClick={clearResults}
                >
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
              <span className="text-2xl opacity-30">◈</span>
              <span className="text-xs tracking-widest">
                {videos.length === 0
                  ? "FETCH A CHANNEL TO SEE RESULTS"
                  : "NO VIDEOS MATCH CURRENT FILTER"}
              </span>
            </div>
          ) : (
            <table
              className="border-collapse"
              style={{
                tableLayout: "fixed",
                width: Object.values(colWidths).reduce((a, b) => a + b, 0),
              }}
            >
              <thead className="sticky top-0 z-10">
                <tr className="bg-card border-b border-border">
                  <th style={{ width: colWidths.cb }} className="px-2 py-2">
                    <input
                      type="checkbox"
                      className="accent-primary w-3 h-3"
                      checked={
                        rows.length > 0 &&
                        rows.every((r) => selected.has(r.videoId))
                      }
                      onChange={toggleAll}
                    />
                  </th>
                  <Th col="idx" label="#" />
                  <Th col="title" label="Title" />
                  <Th col="date" label="Date" />
                  <Th col="views" label="Views" />
                  <Th col="length" label="Mins" />
                  <Th col="chMult" label="Ch.×" />
                  <Th col="qual" label="Qual" />
                  <th
                    style={{ width: colWidths.actions }}
                    className="px-2 py-2 text-[10px] font-head font-semibold tracking-widest uppercase text-muted-foreground"
                  >
                    Log
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v, i) => (
                  <tr
                    key={v.videoId}
                    className={`border-b border-border hover:bg-primary/5 transition-colors ${rowBg(v, i)}`}
                  >
                    <td style={{ width: colWidths.cb }} className="px-2 py-1.5">
                      <input
                        type="checkbox"
                        className="accent-primary w-3 h-3"
                        checked={selected.has(v.videoId)}
                        onChange={() => toggleRow(v.videoId)}
                      />
                    </td>
                    <td
                      style={{ width: colWidths.idx }}
                      className="px-2 py-1.5 text-[10px] text-muted-foreground"
                    >
                      {i + 1}
                    </td>
                    <td
                      style={{
                        width: colWidths.title,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      className="px-2 py-1.5 text-[10px] text-foreground"
                      title={v.title}
                    >
                      {v.title}
                    </td>
                    <td
                      style={{ width: colWidths.date }}
                      className="px-2 py-1.5 text-[10px] text-muted-foreground"
                    >
                      {v.date}
                    </td>
                    <td
                      style={{ width: colWidths.views }}
                      className="px-2 py-1.5 text-[10px]"
                    >
                      {fmtNum(v.views)}
                    </td>
                    <td
                      style={{ width: colWidths.length }}
                      className="px-2 py-1.5 text-[10px] text-muted-foreground"
                    >
                      {v.length}m
                    </td>
                    <td
                      style={{ width: colWidths.chMult }}
                      className="px-2 py-1.5 text-[10px]"
                    >
                      <span
                        className={
                          v.chMult >= 6
                            ? "text-yellow-300 font-bold"
                            : v.chMult >= 4
                              ? "text-primary font-bold"
                              : "text-muted-foreground"
                        }
                      >
                        {v.chMult}x
                      </span>
                    </td>
                    <td
                      style={{ width: colWidths.qual }}
                      className="px-2 py-1.5"
                    >
                      <Badge
                        variant={v.qualifies ? "success" : "destructive"}
                        className="text-[9px]"
                      >
                        {v.qualifies ? "YES" : "NO"}
                      </Badge>
                    </td>
                    <td
                      style={{ width: colWidths.actions }}
                      className="px-2 py-1.5"
                    >
                      <button
                        onClick={() => {
                          logVideo(v);
                          log(`✓ Logged: ${v.title.slice(0, 40)}...`, "ok");
                        }}
                        className="text-[9px] font-head font-semibold tracking-wider uppercase text-muted-foreground hover:text-primary border border-border hover:border-primary px-1.5 py-0.5 transition-colors"
                      >
                        LOG
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
