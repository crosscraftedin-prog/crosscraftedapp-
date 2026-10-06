"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, X, Upload, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Props = {
  /** Current artwork URL (storage path like /comic-artwork/genesis/2/GEN2-P01.webp) */
  artworkUrl: string | null;
  /** Called when artwork is uploaded/replaced — receives the new URL */
  onChange: (url: string | null) => void;
  /** Book ID for storage path (e.g. "genesis") */
  bookId: string;
  /** Chapter number for storage path (e.g. "2") */
  chapter: number;
  /** Panel ID for filename (e.g. "GEN2-P01") */
  panelId: string;
  label?: string;
};

/**
 * Dedicated comic artwork uploader for the Bible Comics CMS.
 *
 * Flow:
 *   Admin selects image → uploads to /api/admin/comics/upload →
 *   server converts to WebP via sharp → saves to public/comic-artwork/ →
 *   returns URL → saved in ComicPanel.artworkUrl
 *
 * Does NOT use base64 data URLs — artwork is stored as files on the server.
 * Does NOT break the existing ImagePicker (separate component).
 */
export default function ComicArtworkUploader({
  artworkUrl,
  onChange,
  bookId,
  chapter,
  panelId,
  label = "Artwork",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError(`Unsupported type: ${file.type}. Use PNG, JPG, or WEBP.`);
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB.`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookId", bookId);
      formData.append("chapter", String(chapter));
      formData.append("panelId", panelId);

      const res = await fetch("/api/admin/comics/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      onChange(data.url);
      toast.success("Artwork uploaded!", {
        description: `Saved as WebP (${(file.size / 1024).toFixed(0)}KB original)`,
      });
    } catch (e: any) {
      setError(e.message || "Upload failed");
      toast.error("Upload failed", { description: e.message });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
        {label}
      </label>

      {artworkUrl ? (
        <div className="relative group">
          <div className="w-full h-32 rounded-xl overflow-hidden border border-white/[0.08] bg-[#0f0f1a]">
            <img
              src={artworkUrl}
              alt="Comic panel artwork"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute top-1 right-1 flex gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-6 h-6 rounded-md bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-all"
              title="Replace artwork"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="w-6 h-6 rounded-md bg-[#EF4444]/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-[#EF4444] transition-all"
              title="Remove artwork"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-32 rounded-xl border-2 border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.2] transition-all flex flex-col items-center justify-center gap-2 text-[#64748B] hover:text-[#94A3B8] disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="animate-spin text-[#F39B9B]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Upload Artwork</span>
              <span className="text-[9px] text-[#475569]">PNG, JPG, or WEBP (max 10MB)</span>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="flex items-start gap-1.5 text-[10px] text-[#EF4444]">
          <AlertCircle size={11} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
      />
    </div>
  );
}
