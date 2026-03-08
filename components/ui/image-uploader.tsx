"use client"

import { useRef, useState, useCallback } from "react"
import { Upload, X, Loader2, ImageIcon, Check, AlertCircle } from "lucide-react"

type UploadState = "idle" | "compressing" | "uploading" | "success" | "error"

interface ImageUploaderProps {
    value: string
    onChange: (url: string) => void
    bucket: "avatars" | "social-center-assets" | "calendar-assets"
    pathPrefix?: string
    /** Shape: "circle" | "square" (default: "square") */
    shape?: "circle" | "square"
    /** Height class for the upload area (default: "h-32") */
    height?: string
    label?: string
    disabled?: boolean
}

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_SIZE_MB = 2

/** Compress image client-side using canvas. Max 1400px, quality 0.82, WebP with JPEG fallback */
async function compressImage(file: File): Promise<Blob> {
    const MAX_SIDE = 1400
    const QUALITY = 0.82

    return new Promise((resolve, reject) => {
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(objectUrl)

            let w = img.naturalWidth
            let h = img.naturalHeight

            // Resize if needed
            if (w > MAX_SIDE || h > MAX_SIDE) {
                if (w >= h) {
                    h = Math.round((h * MAX_SIDE) / w)
                    w = MAX_SIDE
                } else {
                    w = Math.round((w * MAX_SIDE) / h)
                    h = MAX_SIDE
                }
            }

            const canvas = document.createElement("canvas")
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext("2d")
            if (!ctx) { reject(new Error("Canvas not supported")); return }
            ctx.drawImage(img, 0, 0, w, h)

            // Try WebP first, fallback to JPEG
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        // WebP not supported — fallback to JPEG
                        canvas.toBlob(
                            (jpegBlob) => {
                                if (jpegBlob) resolve(jpegBlob)
                                else reject(new Error("No se pudo comprimir la imagen"))
                            },
                            "image/jpeg",
                            QUALITY
                        )
                    }
                },
                "image/webp",
                QUALITY
            )
        }

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error("No se pudo leer la imagen"))
        }

        img.src = objectUrl
    })
}

export function ImageUploader({
    value,
    onChange,
    bucket,
    pathPrefix,
    shape = "square",
    height = "h-32",
    label,
    disabled = false,
}: ImageUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [state, setState] = useState<UploadState>("idle")
    const [errorMsg, setErrorMsg] = useState("")
    const [preview, setPreview] = useState<string>(value)
    const [dragging, setDragging] = useState(false)

    // Keep preview in sync when value changes externally
    if (value !== preview && state === "idle") {
        setPreview(value)
    }

    const processFile = useCallback(async (file: File) => {
        setErrorMsg("")

        // Validate type
        if (!ALLOWED_TYPES.includes(file.type)) {
            setState("error")
            setErrorMsg("Formato no válido. Usa JPG, PNG o WebP.")
            return
        }

        // Validate size (before compression)
        if (file.size > MAX_SIZE_MB * 1024 * 1024 * 3) {
            // If original is more than 6 MB, refuse outright (even compressed it'd be big)
            setState("error")
            setErrorMsg("Imagen demasiado grande. Usa una imagen menor a 6 MB.")
            return
        }

        // Local preview while uploading
        const localUrl = URL.createObjectURL(file)
        setPreview(localUrl)

        setState("compressing")
        let compressed: Blob
        try {
            compressed = await compressImage(file)
        } catch (err: any) {
            URL.revokeObjectURL(localUrl)
            setState("error")
            setErrorMsg(err.message || "Error al comprimir la imagen")
            return
        }

        // Final size check after compression
        if (compressed.size > MAX_SIZE_MB * 1024 * 1024) {
            URL.revokeObjectURL(localUrl)
            setState("error")
            setErrorMsg(`La imagen comprimida supera ${MAX_SIZE_MB} MB. Usa una imagen más pequeña.`)
            return
        }

        setState("uploading")
        try {
            const form = new FormData()
            form.append("file", compressed, "upload.webp")
            form.append("bucket", bucket)
            if (pathPrefix) form.append("path_prefix", pathPrefix)

            const res = await fetch("/api/upload/image", { method: "POST", body: form })
            const data = await res.json()

            URL.revokeObjectURL(localUrl)

            if (!res.ok || !data.url) {
                throw new Error(data.error || "Error al subir la imagen")
            }

            setPreview(data.url)
            onChange(data.url)
            setState("success")
            // Reset to idle after a moment so user can upload again
            setTimeout(() => setState("idle"), 2500)
        } catch (err: any) {
            URL.revokeObjectURL(localUrl)
            setPreview(value) // Restore previous
            setState("error")
            setErrorMsg(err.message || "Error al subir la imagen")
        }
    }, [bucket, pathPrefix, onChange, value])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processFile(file)
        // Reset input so same file can be re-selected
        e.target.value = ""
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) processFile(file)
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        setPreview("")
        onChange("")
        setState("idle")
        setErrorMsg("")
    }

    const isLoading = state === "compressing" || state === "uploading"
    const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl"

    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-xs font-semibold text-muted-foreground">
                    {label}
                </label>
            )}

            <div
                onClick={() => !disabled && !isLoading && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); if (!disabled && !isLoading) setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={[
                    `relative ${height} w-full cursor-pointer overflow-hidden border-2 transition-all duration-200`,
                    shapeClass,
                    dragging
                        ? "border-primary bg-primary/10 scale-[1.01]"
                        : preview
                            ? "border-border/40 bg-card/30 hover:border-primary/40"
                            : "border-dashed border-border/50 bg-card/20 hover:border-primary/40 hover:bg-primary/[0.03]",
                    disabled && "pointer-events-none opacity-50",
                    isLoading && "pointer-events-none",
                ].filter(Boolean).join(" ")}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={disabled || isLoading}
                />

                {/* Image preview */}
                {preview && !isLoading && (
                    <img
                        src={preview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={() => setPreview("")}
                    />
                )}

                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-sm">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-[11px] font-semibold text-white/80">
                            {state === "compressing" ? "Optimizando..." : "Subiendo..."}
                        </span>
                    </div>
                )}

                {/* Success overlay */}
                {state === "success" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm">
                        <div className="flex items-center gap-2 rounded-full bg-emerald-500/90 px-3 py-1.5">
                            <Check className="h-4 w-4 text-white" />
                            <span className="text-xs font-bold text-white">Guardada</span>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!preview && !isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                            {dragging
                                ? <Upload className="h-5 w-5 text-primary" />
                                : <ImageIcon className="h-5 w-5 text-primary/60" />
                            }
                        </div>
                        <p className="text-center text-[11px] font-medium text-muted-foreground">
                            {dragging ? "Suelta aquí" : "Haz clic o arrastra una imagen"}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50">
                            JPG, PNG, WebP · máx. {MAX_SIZE_MB} MB
                        </p>
                    </div>
                )}

                {/* Hover overlay for existing image */}
                {preview && !isLoading && state !== "success" && (
                    <div className="absolute inset-0 flex items-end justify-between p-2 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 via-transparent to-transparent">
                        <span className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                            <Upload className="h-3 w-3" />
                            Cambiar
                        </span>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/70 text-white hover:bg-red-500 transition-colors backdrop-blur-sm"
                            title="Eliminar imagen"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Error message */}
            {state === "error" && errorMsg && (
                <div className="flex items-start gap-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-2.5 py-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400 mt-0.5" />
                    <p className="text-[11px] text-red-400">{errorMsg}</p>
                </div>
            )}
        </div>
    )
}
