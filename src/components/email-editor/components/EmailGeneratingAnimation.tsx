"use client";

import { Sparkle, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { motion } from "framer-motion";

const PARTICLES = [
  { x: "8%",  y: "14%", color: "#287d88", size: 4, delay: 0    },
  { x: "91%", y: "9%",  color: "#f2d967", size: 3, delay: 0.45 },
  { x: "77%", y: "43%", color: "#287d88", size: 5, delay: 0.9  },
  { x: "14%", y: "62%", color: "#f2d967", size: 3, delay: 0.2  },
  { x: "89%", y: "70%", color: "#287d88", size: 4, delay: 1.1  },
  { x: "43%", y: "7%",  color: "#f2d967", size: 5, delay: 0.6  },
  { x: "5%",  y: "83%", color: "#287d88", size: 3, delay: 1.4  },
  { x: "64%", y: "86%", color: "#f2d967", size: 4, delay: 0.75 },
  { x: "31%", y: "33%", color: "#287d88", size: 3, delay: 1.65 },
  { x: "54%", y: "74%", color: "#f2d967", size: 5, delay: 1.05 },
];

export default function EmailGeneratingAnimation() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        minHeight: 560,
        background:
          "linear-gradient(145deg,rgba(3,12,28,.92) 0%,rgba(2,32,52,.90) 55%,rgba(3,12,28,.92) 100%)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1px solid rgba(40,125,136,.40)",
        boxShadow:
          "0 0 0 1px rgba(40,125,136,.12)," +
          "0 0 48px rgba(40,125,136,.22)," +
          "inset 0 0 80px rgba(40,125,136,.06)",
      }}
    >
      {/* ── Neon corner brackets ─────────────────────────────────────────── */}
      <NeonCorner pos="tl" color="#287d88" />
      <NeonCorner pos="tr" color="#287d88" />
      <NeonCorner pos="bl" color="#f2d967" />
      <NeonCorner pos="br" color="#f2d967" />

      {/* ── Neon scan line ────────────────────────────────────────────────── */}
      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg,transparent 0%,rgba(40,125,136,.85) 20%,rgba(40,125,136,1) 50%,rgba(40,125,136,.85) 80%,transparent 100%)",
          boxShadow: "0 0 8px #287d88, 0 0 22px rgba(40,125,136,.55)",
        }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 0.6 }}
      />

      {/* ── Background glow blobs ─────────────────────────────────────────── */}
      <motion.div
        className="absolute -top-28 -left-28 pointer-events-none"
        style={{
          width: 360, height: 360, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(40,125,136,.18) 0%,transparent 70%)",
          filter: "blur(50px)",
        }}
        animate={{ x: [0, 40, 0], y: [0, 25, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 -right-20 pointer-events-none"
        style={{
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(242,217,103,.14) 0%,transparent 70%)",
          filter: "blur(50px)",
        }}
        animate={{ x: [0, -35, 0], y: [0, -20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* ── Floating neon particles ───────────────────────────────────────── */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.x, top: p.y,
            width: p.size, height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size * 7}px ${p.color}55`,
          }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.6, 0.5], y: [0, -18, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: p.delay }}
        />
      ))}

      {/* ── Email skeleton ────────────────────────────────────────────────── */}
      <div className="relative z-10 p-4">

        {/* Hero glass */}
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            aspectRatio: "600/200",
            background: "rgba(255,255,255,.04)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(40,125,136,.28)",
            boxShadow: "inset 0 0 30px rgba(40,125,136,.06)",
          }}
        >
          {/* Shifting neon gradient */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "linear-gradient(135deg,rgba(40,125,136,.09) 0%,rgba(3,63,99,.13) 50%,rgba(40,125,136,.07) 100%)",
                "linear-gradient(135deg,rgba(3,63,99,.13) 0%,rgba(40,125,136,.11) 50%,rgba(3,63,99,.08) 100%)",
                "linear-gradient(135deg,rgba(40,125,136,.09) 0%,rgba(3,63,99,.13) 50%,rgba(40,125,136,.07) 100%)",
              ],
            }}
            transition={{ duration: 3.5, repeat: Infinity }}
          />
          {/* Neon sweep */}
          <motion.div
            className="absolute inset-y-0 w-2/5"
            style={{
              background:
                "linear-gradient(90deg,transparent 0%,rgba(40,125,136,.28) 50%,transparent 100%)",
            }}
            animate={{ x: ["-100%", "360%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
          />
          {/* Center icon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
              style={{
                filter: "drop-shadow(0 0 6px #f2d967) drop-shadow(0 0 14px rgba(242,217,103,.65))",
              }}
            >
              <Sparkle size={34} weight="fill" color="#f2d967" />
            </motion.div>
            <motion.p
              style={{
                color: "rgba(40,125,136,.85)",
                fontSize: 9, margin: 0,
                fontFamily: "Montserrat,sans-serif",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                textShadow: "0 0 10px rgba(40,125,136,.8)",
              }}
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              AI buduje e-mail
            </motion.p>
          </div>
        </div>

        {/* Glass card */}
        <div
          className="rounded-b-2xl px-6 pt-6 pb-8"
          style={{
            background: "rgba(255,255,255,.05)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,.07)",
            borderTop: "none",
          }}
        >
          <NeonBar w="60%" h={18} neon="teal" delay={0}    center />
          <div style={{ marginBottom: 20 }} />
          <NeonBar w="100%" h={10} neon="teal" delay={0.10} />
          <NeonBar w="88%"  h={10} neon="teal" delay={0.20} />
          <NeonBar w="93%"  h={10} neon="teal" delay={0.30} />
          <div style={{ marginBottom: 26 }} />

          {/* Highlights */}
          <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 26 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <NeonCircle size={48} delay={0.38 + i * 0.12} />
                <NeonBar w={58} h={9} neon="teal" delay={0.50 + i * 0.12} />
              </div>
            ))}
          </div>

          <NeonBar w="100%" h={10} neon="teal" delay={0.72} />
          <NeonBar w="68%"  h={10} neon="teal" delay={0.82} />
          <div style={{ marginBottom: 26 }} />

          <div style={{ display: "flex", justifyContent: "center" }}>
            <NeonBar w={164} h={40} neon="yellow" delay={1.0} rounded={10} center />
          </div>
        </div>
      </div>

      {/* ── Status pill ───────────────────────────────────────────────────── */}
      <motion.div
        className="absolute bottom-5 left-0 right-0 flex justify-center z-20"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div
          className="flex items-center gap-3 px-5 py-2.5 rounded-full"
          style={{
            background: "rgba(3,12,28,.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(40,125,136,.50)",
            boxShadow:
              "0 0 14px rgba(40,125,136,.30)," +
              "0 0 30px rgba(40,125,136,.14)," +
              "inset 0 0 16px rgba(40,125,136,.06)",
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            style={{ filter: "drop-shadow(0 0 4px #287d88)" }}
          >
            <CircleNotch size={15} weight="bold" color="#287d88" />
          </motion.div>
          <span
            style={{
              color: "#287d88",
              fontSize: 12, fontWeight: 700,
              fontFamily: "Montserrat,sans-serif",
              letterSpacing: "0.03em",
              textShadow: "0 0 10px rgba(40,125,136,.85)",
            }}
          >
            Gemini generuje e-mail zaproszenia
          </span>
          <Dots />
        </div>
      </motion.div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function NeonCorner({ pos, color }: { pos: "tl" | "tr" | "bl" | "br"; color: string }) {
  const glow = `0 0 8px ${color}, 0 0 18px ${color}88`;
  const top = pos.startsWith("t");
  const left = pos.endsWith("l");
  return (
    <div
      className="absolute w-10 h-10 pointer-events-none"
      style={{
        top:    top  ? 0 : undefined,
        bottom: !top ? 0 : undefined,
        left:   left ? 0 : undefined,
        right:  !left ? 0 : undefined,
      }}
    >
      <div style={{
        position: "absolute",
        top: top ? 0 : undefined, bottom: !top ? 0 : undefined,
        left: left ? 0 : undefined, right: !left ? 0 : undefined,
        width: 28, height: 2,
        background: color, boxShadow: glow,
      }} />
      <div style={{
        position: "absolute",
        top: top ? 0 : undefined, bottom: !top ? 0 : undefined,
        left: left ? 0 : undefined, right: !left ? 0 : undefined,
        width: 2, height: 28,
        background: color, boxShadow: glow,
      }} />
    </div>
  );
}

function NeonBar({
  w, h, neon, delay = 0, center = false, rounded = 6,
}: {
  w: number | string; h: number; neon: "teal" | "yellow"; delay?: number; center?: boolean; rounded?: number;
}) {
  const color = neon === "teal" ? "#287d88" : "#f2d967";
  return (
    <motion.div
      style={{
        width: w, height: h, borderRadius: rounded,
        marginBottom: 10,
        marginLeft:  center ? "auto" : 0,
        marginRight: center ? "auto" : 0,
        background: neon === "teal"
          ? "rgba(40,125,136,.13)"
          : "rgba(242,217,103,.10)",
        border: `1px solid ${neon === "teal" ? "rgba(40,125,136,.22)" : "rgba(242,217,103,.20)"}`,
      }}
      animate={{
        boxShadow: [
          "0 0 0 0 transparent",
          `0 0 8px ${color}66, 0 0 18px ${color}22`,
          "0 0 0 0 transparent",
        ],
        opacity: [0.45, 1, 0.45],
      }}
      transition={{ duration: 2.2, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

function NeonCircle({ size, delay = 0 }: { size: number; delay?: number }) {
  return (
    <motion.div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "rgba(242,217,103,.08)",
        border: "1px solid rgba(242,217,103,.28)",
      }}
      animate={{
        boxShadow: [
          "0 0 0 0 transparent",
          "0 0 12px rgba(242,217,103,.55), 0 0 26px rgba(242,217,103,.22)",
          "0 0 0 0 transparent",
        ],
        opacity: [0.45, 1, 0.45],
      }}
      transition={{ duration: 2.4, repeat: Infinity, delay }}
    />
  );
}

function Dots() {
  return (
    <div className="flex gap-[2px]">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          style={{
            color: "#287d88", fontWeight: 900, fontSize: 18, lineHeight: 1,
            textShadow: "0 0 8px rgba(40,125,136,.85)",
          }}
          animate={{ opacity: [0.12, 1, 0.12] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22 }}
        >
          ·
        </motion.span>
      ))}
    </div>
  );
}
