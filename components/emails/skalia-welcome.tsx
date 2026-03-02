import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Hr,
} from "@react-email/components"
import * as React from "react"

interface SkaliaWelcomeEmailProps {
    name: string
    dashboardUrl: string
}

export const SkaliaWelcomeEmail = ({
    name,
    dashboardUrl,
}: SkaliaWelcomeEmailProps) => (
    <Html>
        <Head />
        <Preview>Bienvenido a la Élite: La Nueva Era del Marketing ha Comenzado 🚀</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={header}>
                    <div style={glow} />
                    <Heading style={heading}>¡HOLA <span style={highlight}>{name.toUpperCase()}</span>!</Heading>
                    <Text style={badge}>SKALIA VIP • LA NUEVA ERA</Text>
                </Section>

                <Section style={content}>
                    <Text style={paragraph}>
                        Prepárate, porque <strong>la nueva era del marketing para networkers ha comenzado</strong>.
                        Estás recibiendo este correo porque eres parte fundamental de la comunidad <strong>Escalia (DIAMANTECELION)</strong>.
                    </Text>

                    <Text style={paragraph}>
                        Hemos renovado nuestra plataforma con un <strong>nuevo dominio y un diseño élite</strong> diseñado para que tu negocio sea 100% replicable y escalable con Inteligencia Artificial.
                    </Text>

                    <Section style={featureBox}>
                        <Text style={featureTitle}>¿QUÉ SIGNIFICA ESTO PARA TI?</Text>
                        <ul style={featureList}>
                            <li style={featureItem}>✅ <strong>Nuevo Dominio:</strong> Ahora operamos en <Link href="https://magicfunnel.app" style={link}>magicfunnel.app</Link></li>
                            <li style={featureItem}>✅ <strong>Diseño Pro:</strong> Interfaz optimizada para conversiones líquidas.</li>
                            <li style={featureItem}>✅ <strong>Poder IA:</strong> Embudos automáticos que trabajan mientras descansas.</li>
                        </ul>
                    </Section>

                    <Text style={paragraph}>
                        Tu plataforma ya está lista. Accede ahora con tus credenciales y descubre la magia del marketing moderno.
                    </Text>

                    <Link href={dashboardUrl} style={button}>
                        ACCEDER A MAGIC FUNNEL
                    </Link>

                    <Hr style={hr} />
                    <Section style={footer}>
                        <Text style={footerText}>
                            <strong>DIAMANTECELION • ESCALIA</strong><br />
                            EL FUTURO ES AHORA.
                        </Text>
                    </Section>
                </Section>
            </Container>
        </Body>
    </Html>
)

const main = {
    backgroundColor: "#05010d",
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
    margin: "0 auto",
    padding: "40px 0",
    width: "600px",
}

const header = {
    padding: "40px 32px",
    textAlign: "center" as const,
}

const glow = {
    position: "absolute" as const,
    top: "-50px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "200px",
    height: "100px",
    backgroundColor: "#a855f7",
    opacity: "0.2",
    borderRadius: "100%",
    filter: "blur(60px)",
}

const heading = {
    fontSize: "32px",
    lineHeight: "1.1",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "-1px",
    margin: "0 0 16px",
}

const highlight = {
    color: "#a855f7",
}

const badge = {
    fontSize: "10px",
    fontWeight: "800",
    color: "#a855f7",
    letterSpacing: "4px",
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    padding: "8px 16px",
    borderRadius: "20px",
    display: "inline-block",
}

const content = {
    padding: "0 40px",
}

const paragraph = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "rgba(255,255,255,0.7)",
    marginBottom: "24px",
}

const featureBox = {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "32px",
}

const featureTitle = {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: "2px",
    marginBottom: "16px",
}

const featureList = {
    padding: "0",
    margin: "0",
    listStyleType: "none",
}

const featureItem = {
    fontSize: "14px",
    color: "rgba(255,255,255,0.9)",
    marginBottom: "12px",
}

const link = {
    color: "#a855f7",
    textDecoration: "underline",
}

const button = {
    backgroundColor: "#a855f7",
    borderRadius: "16px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "900",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "20px",
    margin: "32px 0",
    boxShadow: "0 10px 30px rgba(168, 85, 247, 0.3)",
}

const hr = {
    borderColor: "rgba(255, 255, 255, 0.05)",
    margin: "40px 0",
}

const footer = {
    textAlign: "center" as const,
}

const footerText = {
    color: "rgba(255,255,255,0.3)",
    fontSize: "11px",
    lineHeight: "18px",
    letterSpacing: "1px",
}

export default SkaliaWelcomeEmail
