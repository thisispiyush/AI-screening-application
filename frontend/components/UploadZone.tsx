/**
 * frontend/components/UploadZone.tsx
 * ------------------------------------
 * Drag-and-drop file upload zone with preview.
 *
 * Props:
 *   label       — Zone label e.g. "Passport"
 *   accept      — MIME types to accept e.g. "image/*"
 *   required    — Whether this field is required
 *   file        — Currently selected file (controlled)
 *   onChange    — Callback when file changes
 *   previewUrl  — Optional preview URL (created by parent)
 */

"use client";

import { useRef, useState, useCallback } from "react";

interface UploadZoneProps {
  label: string;
  accept?: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
  previewUrl?: string | null;
  icon?: string;
  hint?: string;
}

export default function UploadZone({
  label,
  accept = "image/jpeg,image/jpg,image/png,image/webp",
  required = false,
  file,
  onChange,
  previewUrl,
  icon = "📄",
  hint,
}: UploadZoneProps) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFileSelect = useCallback(
    (selected: File | null) => {
      if (!selected) return;
      // Basic MIME check on the client side (backend validates too)
      if (!selected.type.startsWith("image/")) {
        alert(`"${selected.name}" is not an image file. Please upload a JPEG, PNG, or WebP.`);
        return;
      }
      onChange(selected);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0] ?? null;
      handleFileSelect(dropped);
    },
    [handleFileSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] ?? null);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Label */}
      <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
        {icon} {label}
        {required && <span className="text-rose-400 text-xs">*</span>}
      </label>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed
          transition-all duration-200 overflow-hidden
          min-h-[160px] flex items-center justify-center
          ${dragging
            ? "border-violet-400 bg-violet-500/10 scale-[1.01]"
            : file
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/8"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          id={`upload-${label.toLowerCase().replace(/\s+/g, "-")}`}
          accept={accept}
          className="sr-only"
          onChange={handleChange}
        />

        {/* Preview */}
        {previewUrl ? (
          <div className="relative w-full h-full group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="w-full h-full object-cover max-h-[200px]"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <span className="text-white text-sm font-medium">Click to change</span>
              <button
                id={`remove-${label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={handleRemove}
                className="text-xs text-rose-300 hover:text-rose-200 underline"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-xl
              transition-transform duration-200
              ${dragging ? "scale-110 bg-violet-500/30" : "bg-white/10"}
            `}>
              {dragging ? "✨" : icon}
            </div>
            <div>
              <p className="text-slate-300 text-sm font-medium">
                {dragging ? "Drop here!" : "Click or drag to upload"}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                {hint ?? "JPEG, PNG, WebP • Max 10 MB"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filename chip */}
      {file && (
        <p className="text-xs text-emerald-400 truncate flex items-center gap-1">
          <span>✓</span>
          <span className="truncate">{file.name}</span>
          <span className="text-slate-500 shrink-0">
            ({(file.size / 1024).toFixed(0)} KB)
          </span>
        </p>
      )}
    </div>
  );
}
