import { MailingPanel } from "@/components/mailing/mailing-panel"
import Link from "next/link"
import { Eye } from "lucide-react"

export default function AdminMailingPage() {
    return (
        <div className="container mx-auto py-10 px-6">
            <div className="mb-6 flex items-center justify-between">
                <div />
                <Link
                    href="/admin/mailing/preview"
                    className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-400 hover:bg-purple-500/20 transition-colors"
                >
                    <Eye className="h-4 w-4" />
                    Preview emails de bienvenida
                </Link>
            </div>
            <MailingPanel mode="admin" />
        </div>
    )
}

