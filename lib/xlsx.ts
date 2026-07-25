export interface SpreadsheetDateCell {
  kind: "date";
  serial: number;
  display: string;
}

export type SpreadsheetCell =
  | string
  | number
  | SpreadsheetDateCell
  | null
  | undefined;

export interface SpreadsheetColumn {
  header: string;
  width?: number;
}

export interface SpreadsheetOptions {
  sheetName: string;
  columns: SpreadsheetColumn[];
  rows: SpreadsheetCell[][];
}

interface ZipEntry {
  name: string;
  contents: Uint8Array;
}

const encoder = new TextEncoder();

function xmlText(value: unknown): string {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnName(index: number): string {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function normalizeSheetName(value: string): string {
  const normalized = value.replace(/[\\/*?:[\]]/g, " ").trim();
  return (normalized || "Dữ liệu").slice(0, 31);
}

function cellXml(
  reference: string,
  value: SpreadsheetCell,
  header = false,
): string {
  if (
    value &&
    typeof value === "object" &&
    value.kind === "date" &&
    Number.isFinite(value.serial)
  ) {
    return `<c r="${reference}" s="3"><v>${value.serial}</v></c>`;
  }
  const style = header ? 1 : typeof value === "number" ? 2 : 0;
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${reference}" s="${style}"><v>${value}</v></c>`;
  }

  return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlText(value)}</t></is></c>`;
}

function worksheetXml(options: SpreadsheetOptions): string {
  const allRows: SpreadsheetCell[][] = [
    options.columns.map((column) => column.header),
    ...options.rows,
  ];
  const lastColumn = columnName(Math.max(options.columns.length - 1, 0));
  const lastRow = Math.max(allRows.length, 1);
  const dimension = `A1:${lastColumn}${lastRow}`;
  const columns = options.columns
    .map((column, index) => {
      const width = Math.min(60, Math.max(6, Number(column.width || 16)));
      const position = index + 1;
      return `<col min="${position}" max="${position}" width="${width}" customWidth="1"/>`;
    })
    .join("");
  const rows = allRows
    .map((row, rowIndex) => {
      const position = rowIndex + 1;
      const cells = options.columns
        .map((_, columnIndex) =>
          cellXml(
            `${columnName(columnIndex)}${position}`,
            row[columnIndex],
            rowIndex === 0,
          ),
        )
        .join("");
      const height = rowIndex === 0 ? ' ht="28" customHeight="1"' : "";
      return `<row r="${position}"${height}>${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="${dimension}"/>
  <sheetViews>
    <sheetView workbookViewId="0" tabSelected="1">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
      <selection pane="bottomLeft" activeCell="A2" sqref="A2"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  <cols>${columns}</cols>
  <sheetData>${rows}</sheetData>
  <autoFilter ref="${dimension}"/>
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="dd/mm/yyyy hh:mm:ss"/>
  </numFmts>
  <fonts count="2">
    <font><sz val="11"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/><family val="2"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF3A2D27"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left/><right/><top/><bottom style="thin"><color rgb="FFD8CBC0"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1">
      <alignment vertical="top" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1">
      <alignment vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1">
      <alignment horizontal="center" vertical="top"/>
    </xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1">
      <alignment horizontal="left" vertical="top"/>
    </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;

function workbookXml(sheetName: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView activeTab="0"/></bookViews>
  <sheets><sheet name="${xmlText(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
}

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const WORKBOOK_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(chunks: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function writeUint16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

function writeUint32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, true);
}

function zip(entries: ZipEntry[]): ArrayBuffer {
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const checksum = crc32(entry.contents);
    const localHeader = new Uint8Array(30 + name.length);
    const localView = new DataView(localHeader.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0x0800);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, 0);
    writeUint16(localView, 12, 33);
    writeUint32(localView, 14, checksum);
    writeUint32(localView, 18, entry.contents.length);
    writeUint32(localView, 22, entry.contents.length);
    writeUint16(localView, 26, name.length);
    writeUint16(localView, 28, 0);
    localHeader.set(name, 30);

    const centralHeader = new Uint8Array(46 + name.length);
    const centralView = new DataView(centralHeader.buffer);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0x0800);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, 0);
    writeUint16(centralView, 14, 33);
    writeUint32(centralView, 16, checksum);
    writeUint32(centralView, 20, entry.contents.length);
    writeUint32(centralView, 24, entry.contents.length);
    writeUint16(centralView, 28, name.length);
    writeUint16(centralView, 30, 0);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint32(centralView, 38, 0);
    writeUint32(centralView, 42, localOffset);
    centralHeader.set(name, 46);

    localChunks.push(localHeader, entry.contents);
    centralChunks.push(centralHeader);
    localOffset += localHeader.length + entry.contents.length;
  }

  const centralDirectory = concatBytes(centralChunks);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, entries.length);
  writeUint16(endView, 10, entries.length);
  writeUint32(endView, 12, centralDirectory.length);
  writeUint32(endView, 16, localOffset);
  writeUint16(endView, 20, 0);

  return concatBytes([...localChunks, centralDirectory, end]).buffer;
}

export function createSpreadsheet(options: SpreadsheetOptions): ArrayBuffer {
  if (options.columns.length === 0) {
    throw new Error("Spreadsheet requires at least one column.");
  }

  const sheetName = normalizeSheetName(options.sheetName);
  const entries: ZipEntry[] = [
    {
      name: "[Content_Types].xml",
      contents: encoder.encode(CONTENT_TYPES_XML),
    },
    { name: "_rels/.rels", contents: encoder.encode(ROOT_RELS_XML) },
    {
      name: "xl/workbook.xml",
      contents: encoder.encode(workbookXml(sheetName)),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      contents: encoder.encode(WORKBOOK_RELS_XML),
    },
    { name: "xl/styles.xml", contents: encoder.encode(STYLES_XML) },
    {
      name: "xl/worksheets/sheet1.xml",
      contents: encoder.encode(worksheetXml(options)),
    },
  ];

  return zip(entries);
}

export function spreadsheetDate(
  timestamp: number,
  display: string,
  utcOffsetMinutes = 420,
): SpreadsheetDateCell {
  return {
    kind: "date",
    serial:
      (timestamp + utcOffsetMinutes * 60_000) / 86_400_000 + 25_569,
    display,
  };
}
