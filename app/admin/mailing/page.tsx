import { MailingPanel } from "@/components/mailing/mailing-panel"

export default function AdminMailingPage() {
    return (
        <div className="container mx-auto py-10 px-6">
            <MailingPanel mode="admin" />
        </div>
    )
}
