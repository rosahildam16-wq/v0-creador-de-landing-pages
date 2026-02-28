import React from "react"
import { LegalFooter } from "@/components/legal/legal-footer"

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
            <div className="mx-auto max-w-4xl px-6 py-24">
                <h1 className="text-4xl font-black mb-8 tracking-tighter">TÉRMINOS DE SERVICIO</h1>

                <div className="space-y-8 text-neutral-400 leading-relaxed">
                    <section>
                        <h2 className="text-white text-xl font-bold mb-4">1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar Magic Funnel, aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo, por favor no utilices la plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-xl font-bold mb-4">2. Uso del Servicio</h2>
                        <p>
                            Nuestra plataforma proporciona herramientas de marketing y prospección automatizada. El usuario es responsable de cumplir con las leyes locales al utilizar nuestros funnels para la captación de leads.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-xl font-bold mb-4">3. Propiedad Intelectual</h2>
                        <p>
                            Todos los diseños, códigos y marcas asociados a Magic Funnel son propiedad exclusiva de la empresa. Los socios tienen una licencia limitada y revocable para utilizar estas herramientas como parte de su suscripción.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-xl font-bold mb-4">4. Limitación de Responsabilidad</h2>
                        <p>
                            Magic Funnel no garantiza resultados financieros específicos. Los ingresos dependen del esfuerzo individual de cada usuario y las condiciones del mercado.
                        </p>
                    </section>
                </div>
            </div>
            <LegalFooter />
        </div>
    )
}
