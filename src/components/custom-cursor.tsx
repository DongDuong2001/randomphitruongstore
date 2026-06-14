"use client";

import { useEffect, useState } from "react";

type CursorState = {
  x: number;
  y: number;
  visible: boolean;
  pressed: boolean;
  enabled: boolean;
};

export function CustomCursor() {
  const [cursor, setCursor] = useState<CursorState>({
    x: 0,
    y: 0,
    visible: false,
    pressed: false,
    enabled: false
  });

  useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function updateEnabled() {
      setCursor((current) => ({
        ...current,
        enabled: pointerQuery.matches && !reducedMotionQuery.matches
      }));
    }

    function move(event: PointerEvent) {
      if (event.pointerType !== "mouse") {
        return;
      }
      setCursor((current) => ({
        ...current,
        x: event.clientX,
        y: event.clientY,
        visible: true
      }));
    }

    function leave() {
      setCursor((current) => ({ ...current, visible: false }));
    }

    function press() {
      setCursor((current) => ({ ...current, pressed: true }));
    }

    function release() {
      setCursor((current) => ({ ...current, pressed: false }));
    }

    updateEnabled();
    pointerQuery.addEventListener("change", updateEnabled);
    reducedMotionQuery.addEventListener("change", updateEnabled);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    document.documentElement.addEventListener("mouseleave", leave);

    return () => {
      pointerQuery.removeEventListener("change", updateEnabled);
      reducedMotionQuery.removeEventListener("change", updateEnabled);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);

  if (!cursor.enabled) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-[80] hidden md:block ${
        cursor.visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`
      }}
    >
      <span
        className={`absolute left-0 top-0 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#a72b1f]/70 transition-transform duration-150 ${
          cursor.pressed ? "scale-75" : "scale-100"
        }`}
      />
      <span
        className={`absolute left-0 top-0 grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#a72b1f] text-[7px] font-black leading-none text-white shadow-[0_0_18px_rgba(167,43,31,0.35)] transition-transform duration-150 ${
          cursor.pressed ? "scale-125" : "scale-100"
        }`}
      >
        粋
      </span>
    </div>
  );
}
