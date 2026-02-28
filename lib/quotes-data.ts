export interface Quote {
    text: string
    author: string
    type: "motivational" | "spiritual" | "financial" | "growth"
}

export const DAILY_QUOTES: Quote[] = [
    {
        text: "Si haces lo que siempre has hecho, obtendrás lo que siempre has obtenido.",
        author: "Tony Robbins",
        type: "motivational"
    },
    {
        text: "Tu nivel de éxito rara vez superará tu nivel de desarrollo personal.",
        author: "Jim Rohn",
        type: "growth"
    },
    {
        text: "Dime y lo olvido, enséñame y lo recuerdo, involúcrame y lo aprendo.",
        author: "Benjamin Franklin",
        type: "growth"
    },
    {
        text: "Recuerda que tienes linaje de la grandeza de Dios y hoy será un gran día en el que verás sus bendiciones.",
        author: "Espiritual",
        type: "spiritual"
    },
    {
        text: "Los pensamientos conducen a sentimientos. Los sentimientos conducen a acciones. Las acciones conducen a resultados.",
        author: "T. Harv Eker",
        type: "financial"
    },
    {
        text: "La mejor manera de predecir el futuro es creándolo.",
        author: "Abraham Lincoln",
        type: "motivational"
    },
    {
        text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
        author: "Robert Collier",
        type: "growth"
    },
    {
        text: "La luz de la conciencia es la clave para la libertad y la paz interior.",
        author: "Espiritual",
        type: "spiritual"
    },
    {
        text: "Un líder es aquel que conoce el camino, recorre el camino y muestra el camino.",
        author: "John C. Maxwell",
        type: "growth"
    },
    {
        text: "Tus ingresos solo pueden crecer hasta donde crezcas tú.",
        author: "T. Harv Eker",
        type: "financial"
    },
    {
        text: "El universo conspira a favor de aquellos que trabajan con fe y propósito.",
        author: "Espiritual",
        type: "spiritual"
    },
    {
        text: "No juzgues cada día por la cosecha que recoges, sino por las semillas que plantas.",
        author: "Robert Louis Stevenson",
        type: "growth"
    },
    {
        text: "La única limitación es la que uno mismo se impone en su mente.",
        author: "Napoleon Hill",
        type: "motivational"
    },
    {
        text: "Eres una expresión única de lo divino, hoy es tu oportunidad para brillar con Su luz.",
        author: "Espiritual",
        type: "spiritual"
    },
    {
        text: "El obstáculo es el camino.",
        author: "Marco Aurelio",
        type: "growth"
    },
    {
        text: "Para que las cosas cambien, tú tienes que cambiar.",
        author: "Jim Rohn",
        type: "motivational"
    },
    {
        text: "La fe es dar el primer paso incluso cuando no ves toda la escalera.",
        author: "Martin Luther King Jr.",
        type: "spiritual"
    },
    {
        text: "Pide y se te dará, busca y hallarás, llama y se te abrirá.",
        author: "Bíblico",
        type: "spiritual"
    },
    {
        text: "La riqueza no se trata de tener muchas posesiones, sino de tener pocas necesidades.",
        author: "Epicteto",
        type: "financial"
    },
    {
        text: "Configura tu mente para el éxito y el éxito te encontrará.",
        author: "Tony Robbins",
        type: "motivational"
    },
    {
        text: "Hoy la gracia te rodea, confía en el proceso perfecto de la vida.",
        author: "Espiritual",
        type: "spiritual"
    },
    {
        text: "El liderazgo se trata de influencia, nada más y nada menos.",
        author: "John C. Maxwell",
        type: "growth"
    },
    {
        text: "Trabaja más duro en ti mismo que en tu trabajo.",
        author: "Jim Rohn",
        type: "growth"
    },
    {
        text: "Todo es posible para quien cree.",
        author: "Bíblico",
        type: "spiritual"
    },
    {
        text: "No cuentes los días, haz que los días cuenten.",
        author: "Muhammad Ali",
        type: "motivational"
    },
    {
        text: "Tu carácter es tu destino.",
        author: "Heráclito",
        type: "growth"
    },
    {
        text: "La gratitud abre la puerta a la abundancia infinita.",
        author: "Espiritual",
        type: "spiritual"
    },
    {
        text: "Define tu por qué y el cómo aparecerá.",
        author: "Tony Robbins",
        type: "motivational"
    },
    {
        text: "Camina con integridad y verás el mundo abrirse ante ti.",
        author: "Espiritual",
        type: "spiritual"
    },
    {
        text: "La disciplina es el puente entre las metas y los logros.",
        author: "Jim Rohn",
        type: "growth"
    },
    {
        text: "Que la paz que sobrepasa todo entendimiento guarde hoy tu corazón.",
        author: "Bíblico",
        type: "spiritual"
    }
];

export function getDailyQuote(): Quote {
    const today = new Date();
    const index = (today.getFullYear() * 365 + today.getMonth() * 31 + today.getDate()) % DAILY_QUOTES.length;
    return DAILY_QUOTES[index];
}
