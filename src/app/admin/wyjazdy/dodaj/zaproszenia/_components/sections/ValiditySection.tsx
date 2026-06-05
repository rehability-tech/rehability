"use client";

export default function ValiditySection() {
  return (
    <div
      style={{
        backgroundColor: "#fef9e7",
        border: "1px solid #f7e6b0",
        borderRadius: 12,
        padding: "11px 15px",
        margin: "0 0 22px",
      }}
    >
      <p style={{ margin: 0, color: "#8a6d1a", fontSize: 12, lineHeight: 1.5 }}>
        ⏳ <strong>To zaproszenie jest ważne 24 godziny.</strong> Po tym czasie miejsce wraca do puli.
      </p>
    </div>
  );
}
