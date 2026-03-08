import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
const VALID_BUCKETS = ["avatars", "social-center-assets", "calendar-assets", "course-assets"]

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const session = await getSession()
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get("file") as File | null
        const bucket = formData.get("bucket") as string | null
        const pathPrefix = (formData.get("path_prefix") as string | null) || ""

        if (!file) {
            return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
        }

        // Validate bucket
        if (!bucket || !VALID_BUCKETS.includes(bucket)) {
            return NextResponse.json({ error: "Bucket inválido" }, { status: 400 })
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({
                error: "Formato no permitido. Usa JPG, PNG o WebP."
            }, { status: 400 })
        }

        // Validate file size
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json({
                error: "El archivo supera 2 MB. Comprime la imagen antes de subirla."
            }, { status: 400 })
        }

        const supabase = createAdminClient()
        if (!supabase) {
            return NextResponse.json({ error: "Storage no disponible" }, { status: 503 })
        }

        // Build unique storage path
        const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg"
        const timestamp = Date.now()
        const prefix = pathPrefix || (session.user.memberId || session.user.email?.split("@")[0] || "user")
        const storagePath = `${prefix}/${timestamp}.${ext}`

        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(storagePath, buffer, {
                contentType: file.type,
                upsert: true,
            })

        if (uploadError) {
            console.error("Storage upload error:", uploadError)
            return NextResponse.json({
                error: `Error al subir: ${uploadError.message}`
            }, { status: 500 })
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(storagePath)

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            path: storagePath,
        })

    } catch (err: any) {
        console.error("Upload error:", err)
        return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
    }
}
