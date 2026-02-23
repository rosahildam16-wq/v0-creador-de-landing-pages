import type {
  BlockType,
  HeroProps,
  ProblemProps,
  BenefitsProps,
  TestimonialsProps,
  CtaProps,
  FaqProps,
  CountdownProps,
  FormProps,
  VideoProps,
  GalleryProps,
  CommunityProps,
} from "./landing-builder-types"

export function getDefaultProps(type: BlockType): Record<string, unknown> {
  const defaults: Record<BlockType, Record<string, unknown>> = {
    hero: {
      title: "Transforma tu negocio digital hoy",
      subtitle: "Descubre el sistema probado que ha ayudado a cientos de emprendedores a escalar sus ventas en linea.",
      ctaText: "Quiero empezar ahora",
      ctaLink: "#",
      badgeText: "Nuevo programa 2026",
      backgroundStyle: "gradient",
      backgroundImage: "",
      alignment: "center",
    } satisfies HeroProps,

    problem: {
      sectionTitle: "Te identificas con esto?",
      painPoints: [
        { icon: "AlertTriangle", text: "No sabes como generar leads de forma constante" },
        { icon: "Clock", text: "Pasas horas en redes sociales sin resultados" },
        { icon: "TrendingDown", text: "Tus ventas son impredecibles cada mes" },
        { icon: "Frown", text: "Te sientes abrumado con tanta informacion" },
      ],
      accentColor: "#ef4444",
    } satisfies ProblemProps,

    benefits: {
      sectionTitle: "Lo que vas a lograr",
      benefits: [
        { icon: "Rocket", title: "Escala rapido", description: "Sistema automatizado que trabaja 24/7 por ti" },
        { icon: "Target", title: "Leads cualificados", description: "Atrae clientes que realmente quieren comprar" },
        { icon: "BarChart", title: "Resultados medibles", description: "Dashboard con metricas claras de tu progreso" },
        { icon: "Shield", title: "Soporte dedicado", description: "Acompanamiento personalizado en cada paso" },
      ],
      layout: "grid",
    } satisfies BenefitsProps,

    testimonials: {
      sectionTitle: "Lo que dicen nuestros alumnos",
      testimonials: [
        { name: "Maria Garcia", text: "En 3 meses duplique mis ventas. El sistema es increiblemente facil de seguir.", label: "Emprendedora digital" },
        { name: "Carlos Lopez", text: "Por fin tengo un flujo constante de leads. Mejor inversion que he hecho.", label: "Coach de negocios" },
        { name: "Ana Martinez", text: "Pase de 0 a 50 clientes en 8 semanas. Totalmente recomendado.", label: "Consultora" },
      ],
      layout: "grid",
    } satisfies TestimonialsProps,

    cta: {
      title: "Listo para dar el siguiente paso?",
      description: "Accede al programa completo con garantia de satisfaccion de 30 dias.",
      originalPrice: "$497",
      offerPrice: "$197",
      buttonText: "Acceder ahora",
      buttonLink: "#",
      urgencyText: "Oferta por tiempo limitado",
      features: [
        "Acceso de por vida al programa",
        "Comunidad privada",
        "Plantillas listas para usar",
        "Soporte por WhatsApp",
      ],
    } satisfies CtaProps,

    faq: {
      sectionTitle: "Preguntas frecuentes",
      questions: [
        { question: "Funciona para mi nicho?", answer: "Si, el sistema esta disenado para adaptarse a cualquier industria o nicho de mercado." },
        { question: "Necesito experiencia previa?", answer: "No, te guiamos paso a paso desde cero, sin importar tu nivel actual." },
        { question: "Cuanto tiempo necesito dedicar?", answer: "Con 1-2 horas diarias puedes empezar a ver resultados en las primeras semanas." },
        { question: "Tiene garantia?", answer: "Si, ofrecemos 30 dias de garantia. Si no estas satisfecho, te devolvemos tu dinero." },
      ],
      style: "accordion",
    } satisfies FaqProps,

    countdown: {
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      title: "La oferta termina en",
      subtitle: "No dejes pasar esta oportunidad",
      style: "cards",
    } satisfies CountdownProps,

    form: {
      title: "Reserva tu lugar ahora",
      subtitle: "Completa el formulario y te enviaremos toda la informacion.",
      fields: [
        { name: "nombre", type: "text", label: "Nombre completo", required: true },
        { name: "email", type: "email", label: "Correo electronico", required: true },
        { name: "telefono", type: "tel", label: "WhatsApp", required: false },
      ],
      buttonText: "Reservar mi lugar",
      successMessage: "Listo! Revisa tu correo para los proximos pasos.",
    } satisfies FormProps,

    video: {
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      title: "Mira como funciona",
      description: "En este video te explico paso a paso el sistema completo.",
      autoplay: false,
      layout: "contained",
    } satisfies VideoProps,

    gallery: {
      sectionTitle: "Resultados de nuestros clientes",
      images: [
        { url: "https://placehold.co/600x400/7c3aed/white?text=Resultado+1", alt: "Resultado 1" },
        { url: "https://placehold.co/600x400/6d28d9/white?text=Resultado+2", alt: "Resultado 2" },
        { url: "https://placehold.co/600x400/5b21b6/white?text=Resultado+3", alt: "Resultado 3" },
        { url: "https://placehold.co/600x400/4c1d95/white?text=Resultado+4", alt: "Resultado 4" },
      ],
      columns: 2,
      layout: "grid",
    } satisfies GalleryProps,

    community: {
      sectionTitle: "Unete a la comunidad",
      description: "Conecta con miles de emprendedores, comparte logros y crece junto a personas con tu misma mentalidad.",
      communityName: "Emprendedores Elite",
      memberCount: "2,847",
      categories: [
        { name: "General", emoji: "💬" },
        { name: "Logros", emoji: "🏆" },
        { name: "Recursos", emoji: "📚" },
        { name: "Preguntas", emoji: "❓" },
        { name: "Networking", emoji: "🤝" },
      ],
      posts: [
        {
          author: "Sofia Herrera",
          content: "Acabo de cerrar mi primer cliente a $5,000 USD aplicando exactamente lo que aprendimos en el modulo 4. Estoy temblando de la emocion! Gracias a esta comunidad por todo el apoyo.",
          timeAgo: "hace 2 horas",
          likes: 47,
          comments: 12,
          category: "Logros",
          badge: "Top Contributor",
        },
        {
          author: "Miguel Torres",
          content: "Comparto mi plantilla de embudo de ventas que me genero $12K el mes pasado. Espero les sirva tanto como a mi. Link en los comentarios.",
          timeAgo: "hace 5 horas",
          likes: 83,
          comments: 24,
          category: "Recursos",
          badge: "Mentor",
        },
        {
          author: "Laura Mendez",
          content: "Alguien mas esta implementando la estrategia de email marketing del ultimo live? Tengo algunas dudas sobre la secuencia de bienvenida. Agradeceria mucho sus insights!",
          timeAgo: "hace 8 horas",
          likes: 19,
          comments: 31,
          category: "Preguntas",
        },
      ],
      leaderboard: [
        { name: "Sofia Herrera", points: 4850, level: 5, badge: "Diamante" },
        { name: "Carlos Ruiz", points: 3720, level: 4, badge: "Oro" },
        { name: "Miguel Torres", points: 3410, level: 4, badge: "Oro" },
        { name: "Ana Castillo", points: 2890, level: 3, badge: "Plata" },
        { name: "Diego Morales", points: 2150, level: 2, badge: "Bronce" },
      ],
      showLeaderboard: true,
      showCategories: true,
      layout: "split",
    } satisfies CommunityProps,
  }

  return defaults[type]
}
