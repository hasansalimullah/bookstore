// Small RFC-4180 style parser. Handles quotes, escaped quotes, CRLF, BOM, and comma / tab / semicolon delimiters
// (tab = what you get when you copy cells straight out of Google Sheets).
export function parseDelimited(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const header = (text.split(/\r?\n/, 1)[0] ?? "").replace(/"[^"]*"/g, "");
  const n = (ch: string) => header.split(ch).length - 1;
  const delim = n("\t") > n(",") && n("\t") >= n(";") ? "\t" : n(";") > n(",") ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQ = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQ = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"' && field === "") {
      inQ = true;
      i++;
      continue;
    }
    if (c === delim) {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}
