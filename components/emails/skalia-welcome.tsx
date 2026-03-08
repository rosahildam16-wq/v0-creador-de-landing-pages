import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Row,
    Column,
    Section,
    Text,
} from "@react-email/components"
import * as React from "react"

interface SkaliaWelcomeEmailProps {
    name: string
    dashboardUrl: string
    communityCode?: string
}

export const SkaliaWelcomeEmail = ({
    name,
    dashboardUrl,
}: SkaliaWelcomeEmailProps) => (
    <Html>
        <Head />
        <Preview>Bienvenido a Skalia VIP — Tu acceso a Magic Funnel está listo 🚀</Preview>
        <Body style={main}>
            <Container style={container}>

                {/* ── TOP ACCENT BAR ── */}
                <Section style={accentBar} />

                {/* ── HEADER ── */}
                <Section style={header}>
                    <Text style={logoText}>✦ MAGIC FUNNEL</Text>
                    <Text style={badge}>SKALIA VIP • ACCESO ÉLITE</Text>
                    <Heading style={heading}>
                        ¡Hola, <span style={nameHighlight}>{name}</span>!
                    </Heading>
                    <Text style={subHeading}>
                        Tu cuenta en Magic Funnel está activa y lista.
                    </Text>
                </Section>

                {/* ── MAIN MESSAGE ── */}
                <Section style={content}>
                    <Text style={paragraph}>
                        Eres parte de <strong style={strong}>Skalia VIP</strong>, una comunidad de élite que usa
                        Inteligencia Artificial y embudos de alta conversión para escalar negocios
                        de red en el mercado hispano.
                    </Text>

                    {/* ── FEATURES ── */}
                    <Section style={featureBox}>
                        <Text style={featureTitle}>LO QUE TIENES ACTIVADO HOY:</Text>

                        <Row style={featureRow}>
                            <Column style={featureIconCol}>
                                <Text style={featureIcon}>🚀</Text>
                            </Column>
                            <Column style={featureTextCol}>
                                <Text style={featureItemText}>
                                    <strong style={strong}>Embudos de conversión:</strong> Listos para atraer prospectos 24/7 sin esfuerzo manual.
                                </Text>
                            </Column>
                        </Row>

                        <Row style={featureRow}>
                            <Column style={featureIconCol}>
                                <Text style={featureIcon}>🤖</Text>
                            </Column>
                            <Column style={featureTextCol}>
                                <Text style={featureItemText}>
                                    <strong style={strong}>IA integrada:</strong> Automatiza seguimientos y cierra más ventas mientras descansas.
                                </Text>
                            </Column>
                        </Row>

                        <Row style={featureRow}>
                            <Column style={featureIconCol}>
                                <Text style={featureIcon}>🏆</Text>
                            </Column>
                            <Column style={featureTextCol}>
                                <Text style={featureItemText}>
                                    <strong style={strong}>Comunidad Skalia:</strong> Estrategias, soporte y equipo que crece contigo.
                                </Text>
                            </Column>
                        </Row>
                    </Section>

                    {/* ── CTA ── */}
                    <Section style={ctaSection}>
                        <Text style={ctaLabel}>TU ENLACE DE ACCESO:</Text>
                        <Button href={dashboardUrl} style={button}>
                            ENTRAR A MAGIC FUNNEL →
                        </Button>
                        <Text style={ctaNote}>
                            Usa tu usuario y contraseña que registraste para ingresar.
                        </Text>
                    </Section>

                    {/* ── DIVIDER ── */}
                    <Hr style={hr} />

                    {/* ── FOOTER ── */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            Recibiste este correo porque eres parte de{" "}
                            <strong>Skalia VIP</strong> en la plataforma{" "}
                            <strong>Magic Funnel</strong>.
                        </Text>
                        <Text style={footerBrand}>
                            ✦ MAGIC FUNNEL · SKALIA VIP · EL FUTURO ES AHORA
                        </Text>
                    </Section>
                </Section>

            </Container>
        </Body>
    </Html>
)

/* ── STYLES ─────────────────────────────────────────────────────────────── */

const main: React.CSSProperties = {
    backgroundColor: "#07030f",
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container: React.CSSProperties = {
    margin: "0 auto",
    maxWidth: "600px",
    backgroundColor: "#0e0820",
    borderRadius: "20px",
    overflow: "hidden",
}

const accentBar: React.CSSProperties = {
    height: "4px",
    background: "linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)",
    width: "100%",
}

const header: React.CSSProperties = {
    padding: "48px 40px 32px",
    textAlign: "center",
    backgroundColor: "#0e0820",
}

const logoText: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: "800",
    color: "#7c3aed",
    letterSpacing: "4px",
    margin: "0 0 16px",
}

const badge: React.CSSProperties = {
    display: "inline-block",
    fontSize: "10px",
    fontWeight: "700",
    color: "#c084fc",
    letterSpacing: "3px",
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    border: "1px solid rgba(168, 85, 247, 0.3)",
    padding: "6px 18px",
    borderRadius: "100px",
    margin: "0 0 24px",
}

const heading: React.CSSProperties = {
    fontSize: "38px",
    lineHeight: "1.15",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "-1.5px",
    margin: "0 0 12px",
}

const nameHighlight: React.CSSProperties = {
    color: "#a855f7",
}

const subHeading: React.CSSProperties = {
    fontSize: "16px",
    color: "rgba(255,255,255,0.5)",
    margin: "0",
    lineHeight: "1.5",
}

const content: React.CSSProperties = {
    padding: "32px 40px 48px",
}

const paragraph: React.CSSProperties = {
    fontSize: "16px",
    lineHeight: "28px",
    color: "rgba(255,255,255,0.65)",
    margin: "0 0 32px",
}

const strong: React.CSSProperties = {
    color: "#ffffff",
    fontWeight: "700",
}

const featureBox: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(168, 85, 247, 0.2)",
    borderRadius: "16px",
    padding: "28px",
    marginBottom: "36px",
}

const featureTitle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "800",
    color: "#a855f7",
    letterSpacing: "3px",
    margin: "0 0 20px",
}

const featureRow: React.CSSProperties = {
    marginBottom: "16px",
}

const featureIconCol: React.CSSProperties = {
    width: "36px",
    verticalAlign: "top",
}

const featureTextCol: React.CSSProperties = {
    verticalAlign: "top",
}

const featureIcon: React.CSSProperties = {
    fontSize: "18px",
    margin: "0",
    lineHeight: "1.6",
}

const featureItemText: React.CSSProperties = {
    fontSize: "14px",
    lineHeight: "24px",
    color: "rgba(255,255,255,0.7)",
    margin: "0",
}

const ctaSection: React.CSSProperties = {
    textAlign: "center",
    padding: "8px 0",
}

const ctaLabel: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: "3px",
    margin: "0 0 16px",
}

const button: React.CSSProperties = {
    backgroundColor: "#7c3aed",
    borderRadius: "14px",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
    textDecoration: "none",
    textAlign: "center",
    display: "block",
    padding: "18px 32px",
    letterSpacing: "1px",
    boxShadow: "0 8px 32px rgba(124, 58, 237, 0.4)",
}

const ctaNote: React.CSSProperties = {
    fontSize: "12px",
    color: "rgba(255,255,255,0.3)",
    margin: "16px 0 0",
    lineHeight: "1.5",
}

const hr: React.CSSProperties = {
    borderColor: "rgba(255,255,255,0.06)",
    margin: "40px 0 32px",
}

const footer: React.CSSProperties = {
    textAlign: "center",
}

const footerText: React.CSSProperties = {
    fontSize: "13px",
    color: "rgba(255,255,255,0.3)",
    lineHeight: "22px",
    margin: "0 0 12px",
}

const footerBrand: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: "700",
    color: "rgba(168, 85, 247, 0.5)",
    letterSpacing: "3px",
    margin: "0",
}

export default SkaliaWelcomeEmail
