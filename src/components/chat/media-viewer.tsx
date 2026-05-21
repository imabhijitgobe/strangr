"use client";

import * as React from "react";
import { X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MediaViewerProps {
  viewingMedia: string | null;
  viewingMediaKind: "image" | "gif" | "video" | null;
  viewCountdown: number | null;
  onClose: () => void;
}

export function MediaViewer({
  viewingMedia,
  viewingMediaKind,
  viewCountdown,
  onClose,
}: MediaViewerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [screenshotDetected, setScreenshotDetected] = React.useState(false);

  // Render image on canvas (prevents easy screenshot via dev tools / save-as)
  React.useEffect(() => {
    if (!viewingMedia || viewingMediaKind === "video" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Scale to fit viewport
      const maxW = window.innerWidth * 0.9;
      const maxH = window.innerHeight * 0.8;
      let w = img.width;
      let h = img.height;

      if (w > maxW) {
        h = (h / w) * maxW;
        w = maxW;
      }
      if (h > maxH) {
        w = (w / h) * maxH;
        h = maxH;
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
    };
    img.src = viewingMedia;
  }, [viewingMedia, viewingMediaKind]);

  // Detect screenshot attempts via keyboard shortcuts
  React.useEffect(() => {
    if (!viewingMedia) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        setScreenshotDetected(true);
        onClose();
        return;
      }

      // Block Ctrl+Shift+S (screenshot tools), Ctrl+P (print)
      if (
        (e.ctrlKey && e.shiftKey && e.key === "S") ||
        (e.ctrlKey && e.key === "p") ||
        (e.ctrlKey && e.key === "P")
      ) {
        e.preventDefault();
        setScreenshotDetected(true);
        onClose();
        return;
      }

      // Block Windows+Shift+S (Snipping Tool)
      if (e.metaKey && e.shiftKey && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        setScreenshotDetected(true);
        onClose();
        return;
      }

      // Block Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i")) {
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [viewingMedia, onClose]);

  // Detect visibility change (screen recording tools often trigger this)
  React.useEffect(() => {
    if (!viewingMedia) return;

    const handleVisibility = () => {
      if (document.hidden) {
        // User switched away while viewing — close immediately
        onClose();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [viewingMedia, onClose]);

  // Detect window blur (alt-tab, screen capture tools gaining focus)
  React.useEffect(() => {
    if (!viewingMedia) return;

    const handleBlur = () => {
      onClose();
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [viewingMedia, onClose]);

  // Clear screenshot detection after showing
  React.useEffect(() => {
    if (screenshotDetected) {
      const t = setTimeout(() => setScreenshotDetected(false), 3000);
      return () => clearTimeout(t);
    }
  }, [screenshotDetected]);

  return (
    <>
      {/* Screenshot detected warning */}
      <AnimatePresence>
        {screenshotDetected && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-150 bg-destructive text-white px-4 py-2 rounded-lg flex items-center gap-2 font-mono text-xs"
          >
            <ShieldAlert className="h-4 w-4" />
            Screenshot blocked — media closed
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media viewer overlay */}
      <AnimatePresence>
        {viewingMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-100 bg-black flex flex-col items-center justify-center"
            onClick={onClose}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            style={{
              // CSS to hinder screen capture on supported browsers
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              MozUserSelect: "none",
            }}
          >
            {/* Header with countdown */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <p className="text-white/70 font-mono text-xs">VIEW ONCE</p>
                {viewCountdown !== null && (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#FF6B2C] text-[#FF6B2C] font-mono text-sm font-bold">
                    {viewCountdown}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white cursor-pointer transition-colors duration-200"
                aria-label="Close media"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Media content */}
            <div
              className="max-w-[90vw] max-h-[80vh] select-none relative"
              onClick={(e) => e.stopPropagation()}
              style={{
                WebkitTouchCallout: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
              }}
            >
              {viewingMediaKind === "video" ? (
                <video
                  src={viewingMedia}
                  autoPlay
                  playsInline
                  muted={false}
                  onEnded={onClose}
                  className="max-w-full max-h-[80vh] object-contain"
                  draggable={false}
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : (
                // Render on canvas — harder to capture than <img>
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[80vh] object-contain pointer-events-none"
                  style={{
                    imageRendering: "auto",
                  }}
                />
              )}

              {/* Invisible overlay to block interactions */}
              <div
                className="absolute inset-0"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-center z-10">
              <p className="text-white/50 font-mono text-xs">
                {viewCountdown !== null
                  ? `Closes in ${viewCountdown}s`
                  : "Video plays once"}
              </p>
            </div>

            {/* Countdown progress bar */}
            {viewCountdown !== null && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-10">
                <motion.div
                  className="h-full bg-[#FF6B2C]"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: viewCountdown, ease: "linear" }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
