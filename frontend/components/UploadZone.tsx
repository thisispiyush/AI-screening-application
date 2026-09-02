/**
 * frontend/components/UploadZone.tsx
 * ------------------------------------
 * Neo-Brutalist Drag-and-Drop file upload zone designed from the Veritas Identity Stitch spec.
 *
 * Preserves all functional behavior:
 *   - Controlled file state
 *   - Drag & drop support
 *   - Image preview
 *   - File removal / change
 *   - Client-side format check
 */

"use client";

import { useRef, useState, useCallback } from "react";

export interface UploadZoneProps {
  label: string;
  subtitle?: string;
  accept?: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
  previewUrl?: string | null;
  iconName?: string; // Material symbol name e.g. "add_photo_alternate", "camera_alt"
  badgeIcon?: string; // Top corner icon e.g. "upload_file", "face"
  hint?: string;
  variant?: "card" | "visa";
}

export default function UploadZone({
  label,
  subtitle,
  accept = "image/jpeg,image/jpg,image/png,image/webp",
  required = false,
  file,
  onChange,
  previewUrl,
  iconName = "add_photo_alternate",
  badgeIcon = "upload_file",
  hint = "JPG, PNG, WebP (Max 10MB)",
  variant = "card",
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFileSelect = useCallback(
    (selected: File | null) => {
      if (!selected) return;
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

  const idPrefix = label.toLowerCase().replace(/[^a-z0-9]/g, "-");

  // --- VISA VARIANT (Optional Document Panel) ---
  if (variant === "visa") {
    return (
      <div className="relative group">
        <input
          ref={inputRef}
          type="file"
          id={`upload-${idPrefix}`}
          accept={accept}
          className="sr-only"
          onChange={handleChange}
        />

        {!file ? (
          <div
            role="button"
            tabIndex={0}
            aria-label={`Upload ${label}`}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed p-6 transition-all cursor-pointer
              ${
                dragging
                  ? "border-primary bg-primary-fixed/20"
                  : "border-outline-variant bg-surface-container-lowest hover:border-solid hover:border-on-background"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-on-surface-variant group-hover:text-on-background flex items-center gap-2">
                  {label}
                  <span className="text-xs font-mono px-1.5 py-0.5 border border-outline-variant text-outline uppercase">
                    Optional
                  </span>
                </h3>
                <p className="text-sm font-mono text-outline mt-1">
                  {subtitle ?? "For non-citizens or special status"}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="bg-surface-variant p-2.5 border border-outline-variant hover:bg-surface-dim hover:border-on-background transition-all"
                title="Add Visa Document"
              >
                <span className="material-symbols-outlined text-on-surface-variant block">add</span>
              </button>
            </div>
          </div>
        ) : (
          /* Visa Selected State */
          <div className="border-2 border-on-background bg-surface p-5 neo-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {previewUrl && (
                <div className="w-16 h-12 border-2 border-on-background bg-surface-container-low shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt={`${label} preview`} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-on-background truncate">{label}</h4>
                  <span className="text-xs font-mono text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2">
                    ATTACHED
                  </span>
                </div>
                <p className="text-xs font-mono text-on-surface-variant truncate mt-0.5">
                  {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs font-mono uppercase px-3 py-1.5 bg-surface border border-on-background hover:bg-surface-container-high transition-colors"
              >
                Change
              </button>
              <button
                type="button"
                id={`remove-${idPrefix}`}
                onClick={handleRemove}
                className="text-xs font-mono uppercase px-3 py-1.5 bg-error-container text-error border border-error hover:bg-red-200 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- STANDARD CARD VARIANT (Identity Document & Person Photo) ---
  return (
    <div className="border-2 border-on-background bg-surface shadow-[8px_8px_0px_0px_rgba(27,27,32,1)] p-6 relative group transition-transform hover:-translate-y-1">
      <input
        ref={inputRef}
        type="file"
        id={`upload-${idPrefix}`}
        accept={accept}
        className="sr-only"
        onChange={handleChange}
      />

      {/* Top right corner decorative icon */}
      <div className="absolute top-0 right-0 p-3">
        <span className="material-symbols-outlined text-outline group-hover:text-on-background transition-colors">
          {badgeIcon}
        </span>
      </div>

      {/* Card Header */}
      <div className="mb-4 pr-8">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bold text-on-background tracking-tight">{label}</h3>
          {required && (
            <span className="text-xs font-mono px-1.5 py-0.5 bg-primary-fixed text-on-background border border-on-background uppercase">
              Req
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm font-mono text-on-surface-variant mt-1">{subtitle}</p>}
      </div>

      {/* Dropzone / Preview Area */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed transition-all cursor-pointer mt-6 overflow-hidden min-h-[170px] flex flex-col items-center justify-center
          ${
            dragging
              ? "border-primary bg-primary-fixed/20"
              : file
              ? "border-on-background bg-surface-container-lowest"
              : "border-outline-variant bg-surface-container-low hover:border-on-background hover:bg-surface-container"
          }
        `}
      >
        {previewUrl ? (
          <div className="relative w-full h-[180px] group/preview flex items-center justify-center bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={`${label} preview`} className="w-full h-full object-contain p-2" />
            <div className="absolute inset-0 bg-on-background/70 opacity-0 group-hover/preview:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white">
              <span className="text-xs font-mono uppercase tracking-wider">Click to replace</span>
              <button
                type="button"
                id={`remove-${idPrefix}`}
                onClick={handleRemove}
                className="text-xs font-mono uppercase px-3 py-1 bg-error text-white border border-white hover:bg-red-700 transition-colors"
              >
                Remove File
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl text-primary mb-2 block">
              {iconName}
            </span>
            <p className="text-sm font-mono text-on-surface-variant font-medium">
              {dragging ? "Release file to upload" : "Drag & Drop or Click to Browse"}
            </p>
            <p className="text-xs font-mono text-outline uppercase tracking-wider mt-2">
              {hint}
            </p>
          </div>
        )}
      </div>

      {/* Selected File Details Strip */}
      {file && (
        <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between gap-2 text-xs font-mono">
          <span className="truncate text-on-background font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0"></span>
            <span className="truncate">{file.name}</span>
          </span>
          <span className="text-outline shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
        </div>
      )}
    </div>
  );
}
