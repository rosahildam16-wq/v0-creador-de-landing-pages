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
    Img,
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
        <Preview>Bienvenido a la era de la duplicación con Magic Funnel</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={header}>
                    <Heading style={heading}>¡Bienvenido a la Familia, {name}!</Heading>
                </Section>
                <Section style={content}>
                    <Text style={paragraph}>
                        Estamos emocionados de tenerte con nosotros. Has dado el primer paso
                        para profesionalizar tu negocio con tecnología de punta.
                    </Text>
                    <Section style={codeBox}>
                        <Text style={codeLabel}>Tu Código de Comunidad:</Text>
                        <Text style={codeText}>{communityCode}</Text>
                    </Section>
                    <Text style={paragraph}>
                        Este código es tu llave maestra. Compártelo con tus prospectos para que
                        queden vinculados automáticamente a tu equipo.
                    </Text>
                    <Link href={dashboardUrl} style={button}>
                        Ir a mi Panel de Control
                    </Link>
                    <Hr style={hr} />
                    <Text style={footer}>
                        Magic Funnel - La plataforma líder para Networkers de Élite.
                    </Text>
                </Section>
            </Container>
        </Body>
    </Html>
)

const main = {
    backgroundColor: "#0a0a0a",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
    margin: "0 auto",
    padding: "20px 0 48px",
    width: "580px",
}

const header = {
    padding: "32px",
    textAlign: "center" as const,
}

const heading = {
    fontSize: "32px",
    lineHeight: "1.3",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "-0.5px",
}

const content = {
    padding: "0 32px",
}

const paragraph = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#a1a1aa",
}

const codeBox = {
    backgroundColor: "#18181b",
    borderRadius: "12px",
    padding: "24px",
    margin: "24px 0",
    textAlign: "center" as const,
    border: "1px solid #27272a",
}

const codeLabel = {
    fontSize: "12px",
    color: "#8b5cf6",
    fontWeight: "700",
    textTransform: "uppercase" as const,
    marginBottom: "8px",
}

const codeText = {
    fontSize: "36px",
    color: "#ffffff",
    fontWeight: "800",
    margin: "0",
    letterSpacing: "4px",
}

const button = {
    backgroundColor: "#8b5cf6",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "16px",
    marginTop: "24px",
}

const hr = {
    borderColor: "#27272a",
    margin: "40px 0",
}

const footer = {
    color: "#52525b",
    fontSize: "12px",
    textAlign: "center" as const,
}

export default WelcomeEmail
