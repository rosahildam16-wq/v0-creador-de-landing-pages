"use client"

import { MailingPanel } from "@/components/mailing/mailing-panel"
import { useAuth } from "@/lib/auth-context"

export default function MemberMailingPage() {
    const { user } = useAuth()

    return (
        <div className="py-6">
            <MailingPanel mode="leader" communityId={user?.communityId} />
        </div>
    )
}
