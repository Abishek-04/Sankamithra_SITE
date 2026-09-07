"use client";

import CloudImage from "./CloudImage";
import { useEffect, useRef, useState } from "react";
import { Close } from "./Icons";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [fine, setFine] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (images.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((v) => (v + 1) % images.length);
      if (e.key === "ArrowLeft") setI((v) => (v - 1 + images.length) % images.length);
      if (e.key === "Escape") setLightbox(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [images.length]);

  useEffect(() => {
    document.body.classList.toggle("is-locked", lightbox);
    return () => document.body.classList.remove("is-locked");
  }, [lightbox]);

  /* hover-zoom is pointer-dependent; resolve it after mount so server and
     client render the same markup */
  useEffect(() => setFine(matchMedia("(hover: hover) and (pointer: fine)").matches), []);

  if (!images.length) {
    return (
      <div className="pgal">
        <div className="pgal__main is-noimg" />
      </div>
    );
  }

  return (
    <div className="pgal">
      <div
        ref={mainRef}
        className={`pgal__main${zoom ? " is-zoom" : ""}`}
        onPointerEnter={() => fine && setZoom(true)}
        onPointerLeave={() => {
          setZoom(false);
          const el = imgRef.current;
          if (el) { el.style.transform = ""; el.style.transformOrigin = ""; }
        }}
        onPointerMove={(e) => {
          if (!zoom) return;
          const box = mainRef.current!.getBoundingClientRect();
          const el = imgRef.current;
          if (!el) return;
          const x = Math.min(100, Math.max(0, ((e.clientX - box.left) / box.width) * 100));
          const y = Math.min(100, Math.max(0, ((e.clientY - box.top) / box.height) * 100));
          el.style.transformOrigin = `${x}% ${y}%`;
          el.style.transform = "scale(2)";
        }}
        onClick={() => setLightbox(true)}
      >
        <CloudImage
          ref={imgRef}
          key={images[i]}
          id={images[i]}
          alt={name}
          fill
          sizes="(max-width: 900px) 92vw, 46vw"
          priority
          maxWidth={1280}
        />
        <span className="pgal__hint">Hover to zoom · click to expand</span>
      </div>

      {images.length > 1 && (
        <div className="pgal__thumbs">
          {images.map((im, k) => (
            <button
              key={im}
              className={`pgal__thumb${k === i ? " is-on" : ""}`}
              type="button"
              aria-label={`View image ${k + 1}`}
              onClick={() => setI(k)}
            >
              <CloudImage id={im} alt="" width={74} height={74} sizes="74px" maxWidth={320} />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="lb is-open" onClick={() => setLightbox(false)}>
          <button className="lb__close" type="button" aria-label="Close"><Close width={18} height={18} /></button>
          <CloudImage id={images[i]} alt={name} width={1000} height={1000} sizes="90vw" maxWidth={1600} />
        </div>
      )}
    </div>
  );
}
