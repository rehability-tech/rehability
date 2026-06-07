"use client";

import React from "react";

export const EditableSpan = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>((props, ref) => (
  <span
    ref={ref}
    contentEditable
    suppressContentEditableWarning
    {...props}
    style={{
      outline: "none",
      borderBottom: "2px dashed rgba(40,125,136,0.45)",
      cursor: "text",
      minWidth: "4px",
      display: "inline",
      ...props.style,
    }}
    title="Kliknij, aby edytować"
  />
));
EditableSpan.displayName = "EditableSpan";
