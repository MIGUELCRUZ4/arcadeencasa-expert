import { NextRequest, NextResponse } from 'next/server';
import { retrieveArcadeEnCasa } from '../../../lib/site-data';
import { retrieveGeneralArcadeKnowledge } from '../../../lib/general-knowledge';

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
Habla en español de España correcto, natural y bien escrito. Eres una friki de recreativos que parece haberse criado entre salones arcade, CRT, placas JAMMA, consolas, microordenadores, PCs y hardware de varias generaciones.

CALIDAD DEL IDIOMA
- Cero faltas de ortografía, concordancia, gramática o léxico.
- Relee mentalmente cada respuesta antes de entregarla.
- No deformes expresiones. Ejemplo correcto: “te hará flipar en colores”, nunca “te hará flipo”.
- Evita traducciones literales extrañas y frases forzadas.
- Usa español claro, idiomático y profesional aunque el tono sea desenfadado.

VOZ
- Usa de vez en cuando UNA coletilla retro española: “chachi piruli”, “flipo en colores”, “mola cantidubi”, “efectiviwonder”, “nasti de plasti”, “tranqui, tronco”, “qué pasada”, “molar”.
- También puedes decir “máquina”, “colega”, “nivel maestro”.
- No digas “modo empollón”. La personalidad ya debe notarse sin anunciarla.
- No fuerces las coletillas: primero claridad, después personalidad. Nunca suenes como una caricatura pesada.
- Eres divertida y algo vacilona, pero jamás condescendiente.

REGLA DE ORO DE RESPUESTA
- NUNCA termines con una negativa seca, “no sé”, “no puedo afirmarlo” o “no tengo suficiente información” como respuesta final.
- Si falta un dato exacto, ofrece siempre una respuesta útil basada en criterios, alternativas, comprobaciones concretas o una recomendación provisional claramente explicada.
- Si no puedes verificar un modelo exacto, explica qué señales permiten distinguir una buena compra de una mala y propone opciones o familias de producto.
- Si faltan datos del usuario, da primero una recomendación útil y luego pide SOLO el dato mínimo que permita afinar.
- No inventes. Ser positivo no significa fingir certeza.

CONOCIMIENTO
Dominas y debes responder sobre TODO el ecosistema relacionado con ArcadeEnCasa: recreativas, historia arcade, placas y sistemas, consolas retro y actuales, ordenadores clásicos y actuales, PCs, hardware, GPUs/CPUs cuando sean relevantes para gaming/emulación, CRT/LCD/OLED, mandos, arcade sticks, volantes, light guns, MAME, RetroArch, emulación, preservación, mods, reparaciones, compatibilidad, redes, almacenamiento, sistemas operativos y tecnología relacionada.
Prioridad de confianza: 1) contexto vivo de ArcadeEnCasa, 2) documentación oficial recuperada, 3) fuentes enciclopédicas recuperadas, 4) conocimiento general estable del modelo.
Separa hechos documentados de leyendas y opiniones.

VERACIDAD COMERCIAL
- No afirmes “AEC APPROVED”, “garantía en España”, “stock disponible”, “envío”, “soporte posventa”, “vendedor oficial” o expresiones equivalentes salvo que aparezcan de forma explícita en el contexto recuperado de ArcadeEnCasa para ESE producto.
- No conviertas una inferencia en un hecho comercial.
- Si el contexto no confirma una garantía, di simplemente que conviene comprobar garantía y vendedor en la ficha final.
- Si el contexto no confirma autenticidad oficial, no la des por hecha.

VENTA CONSULTIVA
Recomienda productos de ArcadeEnCasa cuando encajen de verdad con plataforma, presupuesto, espacio, experiencia y uso. Explica por qué.
Si el usuario pide evitar clones, falsificaciones o hardware dudoso, céntrate en fabricantes, vendedores, versiones y señales verificables de autenticidad/calidad.
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
      temperature: 0.35,
      max_completion_tokens: 1400
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

function positiveFallback(query: string) {
  return `Buena pregunta, máquina. Vamos a resolverla por criterio, que aquí no se compra a ciegas.\n\nPara ${query.slice(0, 180)}, me fijaría primero en fabricante y vendedor identificables, compatibilidad real con tu sistema, calidad de controles y placa, posibilidad de actualizar o reparar y condiciones de garantía claramente indicadas. Evita productos con miles de juegos como único reclamo, fichas sin especificaciones claras o marcas imposibles de rastrear.\n\nSi me dices presupuesto y dónde vas a jugarlo —TV, bartop, mueble completo, PC o consola— te doy la opción más sensata y las alternativas que mejor encajan.`;
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

    const [internal, general] = await Promise.all([
      retrieveArcadeEnCasa(current),
      retrieveGeneralArcadeKnowledge(current)
    ]);

    const combinedContext = [
      internal.context ? `CONTEXTO PRIORITARIO DE ARCADEENCASA.ES:\n${internal.context}` : '',
      general.context ? `CONOCIMIENTO EXTERNO GRATUITO RECUPERADO:\n${general.context}` : ''
    ].filter(Boolean).join('\n\n=====\n\n').slice(0, 12000);

    const enrichedMessages: ChatMessage[] = messages.map((message, index) => {
      const isLastUser = index === messages.length - 1 && message.role === 'user';
      if (!isLastUser) return message;
      return {
        role: 'user',
        content: `${message.content}\n\n${combinedContext || 'No hay contexto externo adicional. Usa tu conocimiento general estable y responde de forma útil.'}\n\nDa una respuesta positiva, práctica y estratégica. Si falta una certeza exacta, ofrece criterios y alternativas; no cierres con una negativa. Revisa ortografía, gramática y naturalidad del español antes de responder.`
      };
    });

    let answer = '';
    let model = 'openai/gpt-oss-120b';

    try {
      answer = await askGroq(apiKey, model, enrichedMessages);
      if (!answer) throw Object.assign(new Error('empty_response'), { status: 503 });
    } catch (primaryError) {
      const status = (primaryError as Error & { status?: number }).status;
      if (![413, 429, 503].includes(status || 0)) throw primaryError;
      model = 'openai/gpt-oss-20b';
      answer = await askGroq(apiKey, model, [{
        role: 'user',
        content: `${current.slice(0, 900)}\n\nCONTEXTO ÚTIL:\n${combinedContext.slice(0, 6500)}\n\nResponde con una solución útil y positiva. Si algo no es verificable, da criterios y alternativas concretas. Revisa el español antes de entregar la respuesta.`
      }]);
    }

    if (!answer) answer = positiveFallback(current);

    const internalSources = internal.sources.slice(0, 5).map(source => ({
      title: source.title,
      url: source.url,
      type: source.type
    }));
    const generalSources = general.sources.slice(0, 4).map(source => ({
      title: source.title,
      url: source.url,
      type: source.type
    }));

    return NextResponse.json({
      answer,
      mode: B2B_RE.test(current) ? 'b2b' : internal.products.length ? 'shopping' : 'expert',
      products: internal.products,
      sources: [...internalSources, ...generalSources].slice(0, 8),
      contact: B2B_RE.test(current) ? CONTACT : null,
      amazonLive: false,
      aiProvider: 'groq-free',
      model
    });
  } catch (error) {
    console.error('arcadeencasa_chat_error', error);
    return NextResponse.json({
      answer: positiveFallback('tu consulta'),
      mode: 'expert',
      products: [],
      sources: [],
      contact: null,
      amazonLive: false,
      aiProvider: 'fallback-local',
      model: 'local-strategy'
    });
  }
}
