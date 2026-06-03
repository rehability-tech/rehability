"use client";

import { useEffect, useRef } from "react";
import { Plus, Trash } from "@phosphor-icons/react/dist/ssr";

// Model danych tabeli:
//   { caption?: string, headers: string[], rows: string[][] }
// Każdy wiersz (row) ma DOKŁADNIE tyle komórek, ile jest nagłówków.
// Komórki mogą zawierać HTML (np. <span style="color:#287D88"> z AI). Renderujemy
// je przez contentEditable, dzięki czemu w edytorze wyglądają TAK SAMO jak na
// froncie bloga (BlogBlockRenderer renderuje je przez dangerouslySetInnerHTML),
// a nie jako surowe tagi <span>.

interface BlogTableBlockProps {
  content: any;
  onChange: (newContent: any) => void;
}

// Edytowalna komórka renderująca sformatowany HTML (kolory, pogrubienia z AI).
// Niekontrolowana (TipTap-style): treść ustawiamy do DOM-u tylko gdy zmieni się
// z zewnątrz i pole nie jest aktywne — dzięki temu kursor nie skacze przy pisaniu.
function EditableCell({
  html,
  onChange,
  className,
  placeholder,
}: {
  html: string;
  onChange: (value: string) => void;
  className: string;
  placeholder: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next = html ?? "";
    if (document.activeElement !== el && el.innerHTML !== next) {
      el.innerHTML = next;
    }
  }, [html]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      data-placeholder={placeholder}
      onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
      onKeyDown={(e) => {
        // Komórki tabeli są jednoliniowe — Enter nie ma tworzyć nowych linii.
        if (e.key === "Enter") e.preventDefault();
      }}
      className={className}
    />
  );
}

export default function BlogTableBlock({
  content,
  onChange,
}: BlogTableBlockProps) {
  const caption: string = content?.caption ?? "";
  const headers: string[] =
    Array.isArray(content?.headers) && content.headers.length > 0
      ? content.headers
      : ["Kolumna 1", "Kolumna 2"];
  const rows: string[][] = Array.isArray(content?.rows) ? content.rows : [];

  const colCount = headers.length;

  // Normalizuje wiersz do aktualnej liczby kolumn (dopełnia/przycina).
  const normalizeRow = (row: string[]): string[] => {
    const next = [...(row || [])];
    while (next.length < colCount) next.push("");
    return next.slice(0, colCount);
  };

  const commit = (next: {
    caption?: string;
    headers?: string[];
    rows?: string[][];
  }) =>
    onChange({
      caption: next.caption ?? caption,
      headers: next.headers ?? headers,
      rows: (next.rows ?? rows).map(normalizeRow),
    });

  const setCaption = (value: string) => commit({ caption: value });

  const setHeader = (col: number, value: string) => {
    const nextHeaders = [...headers];
    nextHeaders[col] = value;
    commit({ headers: nextHeaders });
  };

  const setCell = (rowIdx: number, col: number, value: string) => {
    const nextRows = rows.map(normalizeRow);
    if (!nextRows[rowIdx]) return;
    nextRows[rowIdx][col] = value;
    commit({ rows: nextRows });
  };

  const addColumn = () => {
    commit({
      headers: [...headers, `Kolumna ${colCount + 1}`],
      rows: rows.map((r) => [...normalizeRow(r), ""]),
    });
  };

  const removeColumn = (col: number) => {
    if (colCount <= 1) return;
    commit({
      headers: headers.filter((_, i) => i !== col),
      rows: rows.map((r) => normalizeRow(r).filter((_, i) => i !== col)),
    });
  };

  const addRow = () => {
    commit({ rows: [...rows, Array(colCount).fill("")] });
  };

  const removeRow = (rowIdx: number) => {
    commit({ rows: rows.filter((_, i) => i !== rowIdx) });
  };

  // Wspólne style komórek edytowalnych. `empty:before` pokazuje placeholder gdy
  // komórka jest pusta. `[&_span]:text-inherit` zachowuje się jak na froncie
  // (kolory z inline style i tak wygrywają nad tą regułą).
  const cellCls =
    "flex-1 min-w-0 bg-transparent outline-none font-montserrat text-sm px-2 py-1.5 rounded-md focus:bg-brand-primary/5 transition-colors [&_span]:text-inherit empty:before:content-[attr(data-placeholder)] before:text-gray-300 before:pointer-events-none before:font-normal";

  return (
    <div className="w-full flex flex-col gap-3">
      <input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Tytuł / opis tabeli (opcjonalnie, pomaga SEO i AI)…"
        className="w-full bg-transparent outline-none font-jakarta font-semibold text-[#0B3B4C] text-sm px-2 py-1 placeholder:text-gray-300 placeholder:font-normal"
      />

      <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-brand-primary/5">
              {headers.map((h, col) => (
                <th
                  key={col}
                  className="border-b border-r border-gray-200 last:border-r-0 align-top group/col"
                >
                  <div className="flex items-center">
                    <EditableCell
                      html={h}
                      onChange={(value) => setHeader(col, value)}
                      placeholder={`Nagłówek ${col + 1}`}
                      className={`${cellCls} font-semibold text-[#0B3B4C]`}
                    />
                    {colCount > 1 && (
                      <button
                        onClick={() => removeColumn(col)}
                        className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/col:opacity-100 transition-opacity shrink-0"
                        title="Usuń kolumnę"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const cells = normalizeRow(row);
              return (
                <tr key={rowIdx} className="group/row hover:bg-gray-50/60">
                  {cells.map((cell, col) => (
                    <td
                      key={col}
                      className="border-b border-r border-gray-100 last:border-r-0 align-top"
                    >
                      <div className="flex items-center">
                        <EditableCell
                          html={cell}
                          onChange={(value) => setCell(rowIdx, col, value)}
                          placeholder="—"
                          className={`${cellCls} text-gray-600`}
                        />
                        {col === colCount - 1 && (
                          <button
                            onClick={() => removeRow(rowIdx)}
                            className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
                            title="Usuń wiersz"
                          >
                            <Trash size={14} weight="bold" />
                          </button>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 text-xs font-montserrat font-medium text-brand-primary hover:text-[#0B3B4C] px-2.5 py-1.5 rounded-lg hover:bg-brand-primary/10 transition-colors cursor-pointer"
        >
          <Plus size={14} weight="bold" /> Wiersz
        </button>
        <button
          onClick={addColumn}
          className="flex items-center gap-1.5 text-xs font-montserrat font-medium text-brand-primary hover:text-[#0B3B4C] px-2.5 py-1.5 rounded-lg hover:bg-brand-primary/10 transition-colors cursor-pointer"
        >
          <Plus size={14} weight="bold" /> Kolumna
        </button>
      </div>
    </div>
  );
}
