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

interface WelcomeEmailProps {
    name: string
    communityCode: string
    dashboardUrl: string
}

export const WelcomeEmail = ({
    name,
    communityCode,
    dashboardUrl,
}: WelcomeEmailProps) => (
    <Html>
        <Head />
        <Preview>¡Bienvenido a la Magia del Marketing! Tu cuenta está lista 🚀</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={header}>
                    <div style={glow} />
                    <Heading style={heading}>BIENVENIDO AL FUTURO,<br /><span style={highlight}>{name.toUpperCase()}</span></Heading>
                    <Text style={badge}>MAGIC FUNNEL • MIEMBRO ACTIVO</Text>
                </Section>

                <Section style={content}>
                    <Text style={paragraph}>
                        Has dado el primer paso para revolucionar tu prospección digital. <strong>Magic Funnel</strong> es el motor de crecimiento que transformará tu negocio con embudos de alta conversión e Inteligencia Artificial.
                    </Text>

                    <div style={featureBox}>
                        <Text style={featureTitle}>TODO LO QUE NECESITAS YA ES TUYO:</Text>
                        <ul style={featureList}>
                            <li style={featureItem}>🚀 <strong>Embudos de Elite:</strong> Listos para prospectar por ti 24/7.</li>
                            <li style={featureItem}>🤖 <strong>Poder IA:</strong> Automatiza tus respuestas y cierra más ventas.</li>
                            <li style={featureItem}>🤝 <strong>Comunidad Global:</strong> Acceso a estrategias probadas de marketing digital.</li>
                        </ul>
                    </div>

                    <Section style={codeBox}>
                        <Text style={codeLabel}>TU CÓDIGO DE ACCESO:</Text>
                        <Text style={codeText}>{communityCode}</Text>
                        <Text style={codeSubText}>Úsalo para activar tus herramientas y compartir con tu equipo.</Text>
                    </Section>

                    <Link href={dashboardUrl} style={button}>
                        ACCERDER A MI PANEL AHORA
                    </Link>

                    <Hr style={hr} />
                    <Section style={footer}>
                        <Text style={footerText}>
                            <strong>MAGIC FUNNEL</strong><br />
                            LA TECNOLOGÍA AL SERVICIO DE LA LIBERTAD.
                        </Text>
                    </Section>
                </Section>
            </Container>
        </Body>
    </Html>
)

const main = {
    backgroundColor: "#050012",
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
    position: "relative" as const,
}

const glow = {
    position: "absolute" as const,
    top: "-50px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "200px",
    height: "100px",
    backgroundColor: "#8b5cf6",
    opacity: "0.2",
    borderRadius: "100%",
    filter: "blur(60px)",
}

const heading = {
    fontSize: "36px",
    lineHeight: "1.1",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "-1px",
    margin: "0 0 16px",
}

const highlight = {
    color: "#8b5cf6",
}

const badge = {
    fontSize: "10px",
    fontWeight: "800",
    color: "#8b5cf6",
    letterSpacing: "4px",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
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
    color: "#a1a1aa",
    marginBottom: "24px",
}

const featureBox = {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
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
    color: "#d1d1d6",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
}

const codeBox = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "32px",
    margin: "32px 0",
    textAlign: "center" as const,
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
}

const codeLabel = {
    fontSize: "11px",
    color: "#8b5cf6",
    fontWeight: "800",
    letterSpacing: "2px",
    marginBottom: "8px",
}

const codeText = {
    fontSize: "48px",
    color: "#050012",
    fontWeight: "900",
    margin: "0 0 8px",
    letterSpacing: "6px",
}

const codeSubText = {
    fontSize: "12px",
    color: "#71717a",
    margin: "0",
}

const button = {
    backgroundColor: "#8b5cf6",
    borderRadius: "16px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "900",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "20px",
    margin: "32px 0",
    boxShadow: "0 10px 30px rgba(139, 92, 246, 0.3)",
}

const hr = {
    borderColor: "rgba(255, 255, 255, 0.05)",
    margin: "40px 0",
}

const footer = {
    textAlign: "center" as const,
}

const footerText = {
    color: "#52525b",
    fontSize: "11px",
    lineHeight: "18px",
    letterSpacing: "1px",
}

export default WelcomeEmail
