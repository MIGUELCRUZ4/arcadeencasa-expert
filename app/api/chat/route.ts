import { NextRequest, NextResponse } from 'next/server';
import { retrieveArcadeEnCasa } from '../../../lib/site-data';

export const runtime = 'nodejs';
export const maxDuration = 45;

const B2B_RE = /(proveedor|fabricante|distribuidor|partner|colaboraci[oó]n|colaborador|vender mi producto|vender nuestro producto|empresa|mayorista|dropshipping|b2b|wholesale|reuni[oó]n)/i;

const CONTACT = {
  email: 'arcadeencasa.miguelcruz@gmail.com',
  whatsapp: '+34 675 907 941 · GrowthPartner360',
  whatsappUrl: 'https://wa.me/34675907941?text=Hola%20ArcadeEnCasa%2C%20quiero%20hablar%20sobre%20una%20colaboraci%C3%B3n%20B2B.',
  partnersUrl: 'https://arcadeencasa.es/partners-arcade-b2b/'
};

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type GroqChoice = { message?: { content?: string | null } };
type GroqResponse = { choices?: GroqChoice[]; error?: { message?: string; type?: string } };

const INSTRUCTIONS = `Eres LA PLANTA EMPOLLONA de ArcadeEnCasa.es: una planta carnívora arcade, sabionda, cercana y con mucha personalidad.
Habla normalmente en español de España. Eres una friki de recreativos que parece haberse criado entre salones arcade, CRT, placas JAMMA, consolas y microordenadores de los 80 y 90.

VOZ
- Abre o remata de vez en cuando con UNA coletilla retro, no con cinco. Ejemplos documentados de jerga ochentera española: “chachi piruli”, “flipo en colores”, “mola cantidubi”, “efectiviwonder”, “nasti de plasti”, “tranqui, tronco”, “¿digamelón?”, “qué pasada”, “molar”.
- También puedes decir “máquina”, “colega”, “nivel maestro”, “modo empollón activado”.
- No fuerces las coletillas: primero claridad, después personalidad. Nunca suenes como una caricatura pesada.
- Eres divertida y algo vacilona, pero jamás condescendiente. Si el usuario se equivoca, corriges con gracia y precisión.

CONOCIMIENTO
Dominas recreativas, historia arcade, consolas retro y actuales, ordenadores clásicos y actuales, hardware, CRT/LCD/OLED, controles, fightsticks, MAME, emulación, preservación y cultura del videojuego.
Prioridad: 1) contexto vivo de ArcadeEnCasa, 2) datos oficiales presentes en ese contexto, 3) conocimiento general estable.
Nunca inventes especificaciones, fechas, compatibilidades, precios, stock ni disponibilidad. Separa hechos documentados de leyendas.

VENTA CONSULTIVA
Recomienda productos de ArcadeEnCasa solo cuando encajen de verdad con plataforma, presupuesto, espacio y uso. Explica por qué. No vendas por vender.
Amazon: no tienes acceso oficial en vivo a precio/stock de Amazon; nunca afirmes que lo has comprobado en tiempo real.

B2B
Si detectas fabricante, distribuidor o partner, baja el tono bromista y pasa a profesional-cercano. Orienta a reunión usando arcadeencasa.miguelcruz@gmail.com y WhatsApp +34 675 907 941, GrowthPartner360. No prometas acuerdos cerrados.

SEGURIDAD Y FORMATO
En emulación/ROMs ayuda con preservación, configuración y compatibilidad, pero no facilites descargas no autorizadas.
Respuestas compactas, útiles, escaneables y con criterio. No menciones RAG, WordPress REST ni procesos internos.`;

async function askGroq(apiKey: string, model: string, messages: ChatMessage[]) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: INSTRUCTIONS }, ...messages],
      reasoning_effort: 'high',
      temperature: 0.45,
      max_completion_tokens: 1200
    }),
    cache: 'no-store'
  });

  const data = (await response.json()) as GroqResponse;
  if (!response.ok) {
    const error = new Error(data.error?.message || `Groq API ${response.status}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    const messages = (body.messages || [])
      .filter(message => (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
      .slice(-4)
      .map(message => ({ ...message, content: message.content.slice(0, 1200) }));

    const current = [...messages].reverse().find(message => message.role === 'user')?.content.trim() || '';
    if (!current) return NextResponse.json({ error: 'Escribe una pregunta para continuar.' }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Falta configurar la clave gratuita de Groq en el servidor.' }, { status: 503 });

    const internal = await retrieveArcadeEnCasa(current);
    const enrichedMessages: ChatMessage[] = messages.map((message, index) => {
      const isLastUser = index === messages.length - 1 && message.role === 'user';
      if (!isLastUser) return message;
      return {
        role: 'user',
        content: `${message.content}\n\nCONTEXTO VIVO DE ARCADEENCASA.ES:\n${internal.context || 'No se han encontrado coincidencias internas claras para esta consulta.'}\n\nResponde con precisión y no inventes datos.`
      };
    });

    let answer = '';
    let model = 'openai/gpt-oss-120b';
    try {
      answer = await askGroq(apiKey, model, enrichedMessages);
    } catch (primaryError) {
      const status = (primaryError as Error & { status?: number }).status;
      if (![413, 429, 503].includes(status || 0)) throw primaryError;
      model = 'openai/gpt-oss-20b';
      answer = await askGroq(apiKey, model, [{
        role: 'user',
        content: `${current.slice(0, 900)}\n\nCONTEXTO ARCADEENCASA:\n${internal.context.slice(0, 5000)}`
      }]);
    }

    const internalSources = internal.sources.slice(0, 6).map(source => ({
      title: source.title,
      url: source.url,
      type: source.type
    }));

    return NextResponse.json({
      answer: answer || 'Nasti de plasti con inventar: no tengo una respuesta suficientemente verificada para afirmarlo con seguridad.',
      mode: B2B_RE.test(current) ? 'b2b' : internal.products.length ? 'shopping' : 'expert',
      products: internal.products,
      sources: internalSources,
      contact: B2B_RE.test(current) ? CONTACT : null,
      amazonLive: false,
      aiProvider: 'groq-free',
      model
    });
  } catch (error) {
    console.error('arcadeencasa_chat_error', error);
    return NextResponse.json({ error: 'La planta se ha quedado sin recreativa un segundo. Reintenta la pregunta.' }, { status: 503 });
  }
}
