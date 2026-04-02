// Subs are stored internally as K (e.g. 22 = 22,000).
// prepareForExport expands to raw so exported files are unambiguous.
// Import logic normalises back to K on the way in.
export function prepareForExport(entries) {
  return entries.map((e) => ({
    ...e,
    subs: (e.subs || 0) * 1000,
  }));
}

export function toCSV(entries) {
  const prepared = prepareForExport(entries);
  const cols = [
    "title",
    "channel",
    "subs",
    "views",
    "chMult",
    "searchMult",
    "qualifies",
    "date",
    "length",
    "chMedian",
    "comments",
    "titleType",
    "emotion",
    "hook",
    "pacing",
    "arc",
    "insight",
    "search",
    "searchTerms",
  ];
  const hdr = cols.join(",");
  const rows = prepared.map((e) =>
    cols
      .map((c) => {
        const v = e[c] === undefined ? "" : String(e[c]);
        return '"' + v.replace(/"/g, '""') + '"';
      })
      .join(","),
  );
  return [hdr, ...rows].join("\n");
}

export function downloadFile(content, filename, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
}
