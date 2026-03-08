"use client"

import { MailingPanel } from "@/components/mailing/mailing-panel"
import { useAuth } from "@/lib/auth-context"
import { FeatureGate } from "@/components/feature-gate"

export default function MemberMailingPage() {
    const { user } = useAuth()

    return (
        <FeatureGate
            feature="mailing"
            description="Envía campañas de email masivo a toda tu lista de contactos y automatiza tus secuencias de seguimiento."
            mode="replace"
        >
            <div className="py-6">
                <MailingPanel mode="leader" communityId={user?.communityId} />
            </div>
        </FeatureGate>
    )
}
