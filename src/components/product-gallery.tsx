"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function ProductGallery({
  images
}: {
  images: Array<{ url: string; alt: string }>;
}) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const selected = images[active];

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        setActive((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setActive((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, images.length]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="relative block w-full aspect-[4/5] overflow-hidden bg-zinc-200 cursor-zoom-in"
        aria-label="Zoom product image"
      >
        {selected ? (
          <Image
            alt={selected.alt}
            className="object-cover"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            src={selected.url}
          />
        ) : null}
      </button>
      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              aria-label={`View image ${index + 1}`}
              className={`relative aspect-square overflow-hidden border ${
                active === index ? "border-black" : "border-transparent"
              }`}
              key={`${image.url}-${index}`}
              onClick={() => setActive(index)}
              type="button"
            >
              <Image
                alt={image.alt}
                className="object-cover"
                fill
                sizes="120px"
                src={image.url}
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* Lightbox Modal */}
      {lightboxOpen && selected && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 md:p-8 text-white select-none">
          {/* Header */}
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-bold text-zinc-400">
              {active + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="p-2 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full transition-colors"
              aria-label="Close details"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Content */}
          <div className="relative flex-1 flex items-center justify-center w-full max-h-[80vh] my-4">
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                }}
                className="absolute left-2 sm:left-4 z-10 p-3 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <div className="relative w-full h-full flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.url}
                alt={selected.alt}
                className="max-w-full max-h-full object-contain pointer-events-none"
              />
            </div>

            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-2 sm:right-4 z-10 p-3 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full transition-colors"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 ? (
            <div className="flex justify-center gap-2 overflow-x-auto pb-2 max-w-full">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`lightbox-${image.url}-${index}`}
                  onClick={() => setActive(index)}
                  className={`relative w-14 h-14 shrink-0 overflow-hidden border-2 ${
                    active === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                  } transition-all`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : <div className="h-4" />}
        </div>
      )}
    </div>
  );
}
