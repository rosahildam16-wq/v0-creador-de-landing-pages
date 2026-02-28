import React from "react"
import { LegalFooter } from "@/components/legal/legal-footer"

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
            <div className="mx-auto max-w-4xl px-6 py-24">
                <h1 className="text-4xl font-black mb-8 tracking-tighter">POLÍTICA DE PRIVACIDAD</h1>

                <div className="space-y-8 text-neutral-400 leading-relaxed">
                    <section>
                        <h2 className="text-white text-xl font-bold mb-4">1. Introducción</h2>
                        <p>
                            En Magic Funnel, valoramos la privacidad de nuestros usuarios y los leads generados a través de nuestra plataforma. Esta política explica cómo recopilamos, usamos y protegemos la información personal en cumplimiento con el RGPD y estándares internacionales.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-xl font-bold mb-4">2. Datos que Recopilamos</h2>
                        <p>
                            Recopilamos información proporcionada voluntariamente: nombre, correo electrónico, número de teléfono (WhatsApp) y respuestas a cuestionarios de calificación.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-xl font-bold mb-4">3. Uso de la Información</h2>
                        <p>
                            Utilizamos los datos para:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Personaizar la experiencia del usuario.</li>
                            <li>Atribuir correctamente los prospectos a los patrocinadores.</li>
                            <li>Mejorar el rendimiento técnico de la plataforma.</li>
                            <li>Enviar notificaciones críticas sobre el servicio.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-xl font-bold mb-4">4. Tus Derechos (RGPD)</h2>
                        <p>
                            Tienes derecho a acceder, rectificar o solicitar la eliminación de tus datos personales en cualquier momento. Puedes ejercer estos derechos contactando a soporte desde tu panel de miembro.
                        </p>
                    </section>
                </div>
            </div>
            <LegalFooter />
        </div>
    )
}
