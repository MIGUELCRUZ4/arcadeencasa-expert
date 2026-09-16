import { NextRequest, NextResponse } from 'next/server';
import { retrieveArcadeEnCasa } from '../../../lib/site-data';
import { retrieveGeneralArcadeKnowledge } from '../../../lib/general-knowledge';

export const runtime = 'nodejs';
export const maxDuration = 45;

const B2B_RE = /(proveedor|fabricante|distribuidor|partner|colaboraci[oó]n|colaborador|vender mi producto|vender nuestro producto|empresa|mayorista|dropshipping|b2b|wholesale|reuni[oó]n)/i;
const CLOSE_RE = /^(?:ok[,.! ]*)?(?:vale[,.! ]*)?(?:perfecto[,.! ]*)?(?:(?:muchas?|mil)\s+)?gracias(?:\s+(?:por\s+todo|por\s+la\s+ayuda))?[!. ]*$|^(?:no[, ]*)?gracias[!. ]*$|^(?:ya\s+est[aá]|eso\s+es\s+todo|nada\s+m[aá]s|no\s+necesito\s+nada\s+m[aá]s|hasta\s+luego|hasta\s+otra|adi[oó]s|nos\s+vemos)[!. ]*$/i;
const ACK_RE = /^(?:ok|vale|perfecto|genial|estupendo|entendido|de\s+acuerdo|correcto|bien)[!. ]*$/i;
const GREETING_RE = /^(?:hola|buenas|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches|hey|ey)[!. ]*$/i;

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

CONVERSACIÓN HUMANA
- Interpreta SIEMPRE el último mensaje según el contexto real de la conversación. No confundas un agradecimiento, despedida, confirmación o comentario social con una nueva consulta técnica.
- Si el usuario agradece o indica que ya no necesita nada más, despídete con naturalidad y brevedad. No sigas vendiendo, no recomiendes productos y no hagas otra pregunta.
- Si el usuario solo confirma con “ok”, “vale”, “perfecto”, “genial” o similar, responde de forma breve y pregunta si necesita algo más.
- Tras resolver una consulta sustantiva, termina normalmente con UNA pregunta corta y natural para saber si quiere algo más. Si ya has hecho una pregunta necesaria para afinar la respuesta, no añadas otra.
- Mantén el hilo mientras la conversación siga abierta. Si el usuario cambia claramente de tema, responde al nuevo tema sin mezclar datos irrelevantes del anterior.

BREVEDAD
- Sé concreto y directo. Por defecto, 60-140 palabras.
- Usa 2-4 párrafos cortos o una lista muy breve cuando aporte claridad.
- No vuelques todo lo que sabes. Da primero la respuesta útil y solo amplía si el usuario lo pide.
- En recomendaciones, prioriza como máximo 2-3 opciones realmente relevantes.

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
- Si falta un dato exacto, ofrece una respuesta útil basada en criterios, alternativas o comprobaciones concretas.
- Si faltan datos del usuario, da primero una recomendación útil y luego pide SOLO el dato mínimo para afinar.
- No inventes. Ser positivo no significa fingir certeza.

CONOCIMIENTO
Dominas todo el ecosistema relacionado con ArcadeEnCasa: recreativas, historia arcade, placas y sistemas, consolas retro y actuales, ordenadores clásicos y actuales, PCs, hardware, GPUs/CPUs cuando sean relevantes para gaming/emulación, CRT/LCD/OLED, mandos, arcade sticks, volantes, light guns, MAME, RetroArch, emulación, preservación, mods, reparaciones, compatibilidad, redes, almacenamiento, sistemas operativos y tecnología relacionada.
Prioridad de confianza: 1) contexto vivo de ArcadeEnCasa, 2) documentación oficial recuperada, 3) fuentes enciclopédicas recuperadas, 4) conocimiento general estable del modelo.
Separa hechos documentados de leyendas y opiniones.

VERACIDAD COMERCIAL
- No afirmes “AEC APPROVED”, “garantía en España”, “stock disponible”, “envío”, “soporte posventa”, “vendedor oficial” o equivalentes salvo que aparezcan explícitamente en el contexto recuperado para ESE producto.
- No conviertas una inferencia en un hecho comercial.
- Si el contexto no confirma garantía o autenticidad, indícalo de forma breve y útil sin sembrar desconfianza innecesaria.

VENTA CONSULTIVA
Recomienda productos de ArcadeEnCasa solo cuando encajen de verdad con la consulta, plataforma, presupuesto, espacio y uso. No muestres productos por rutina.
Si el usuario pide evitar clones, falsificaciones o hardware dudoso, céntrate en señales verificables de autenticidad y calidad.
Amazon: no tienes acceso oficial en vivo a precio/stock de Amazon; nunca afirmes que lo has comprobado en tiempo real.

B2B
Si detectas fabricante, distribuidor o partner, baja el tono bromista y pasa a profesional-cercano. Orienta a reunión usando arcadeencasa.miguelcruz@gmail.com y WhatsApp +34 675 907 941, GrowthPartner360. No prometas acuerdos cerrados.

SEGURIDAD Y FORMATO
En emulación/ROMs ayuda con preservación, configuración y compatibilidad, pero no facilites descargas no autorizadas.
No menciones RAG, WordPress REST ni procesos internos.`;

async function askGroq(apiKey: string, model: string, messages: ChatMessage[]) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: INSTRUCTIONS }, ...messages],
      reasoning_effort: 'high',
      temperature: 0.3,
      max_completion_tokens: 1100
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

function positiveFallback() {
  return 'Vamos al grano, máquina: puedo orientarte por compatibilidad, calidad, presupuesto y uso real sin hacerte perder el tiempo. Dime el modelo o el tipo de equipo que estás mirando y te doy una recomendación concreta.\n\n¿Te ayudo con eso?';
}

function ensureNaturalFollowUp(answer: string) {
  const tail = answer.slice(-180);
  if (/\?\s*$/.test(tail)) return answer;
  return `${answer.trim()}\n\n¿Quieres que te ayude con algo más, máquina?`;
}

function socialReply(current: string) {
  const text = current.trim();
  if (CLOSE_RE.test(text)) {
    return {
      answer: '¡A ti, máquina! Ha sido un placer echarte un cable. Cuando quieras volver a darle al START, aquí me tienes. 👾',
      conversationClosed: true
    };
  }
  if (ACK_RE.test(text)) {
    return {
      answer: 'Perfecto, máquina. ¿Te ayudo con algo más?',
      conversationClosed: false
    };
  }
  if (GREETING_RE.test(text)) {
    return {
      answer: '¡Buenas, máquina! Dispara: arcade, consolas, ordenadores, MAME, hardware o compras. ¿Qué necesitas?',
      conversationClosed: false
    };
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    const messages = (body.messages || [])
      .filter(message => (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
      .slice(-6)
      .map(message => ({ ...message, content: message.content.slice(0, 1200) }));

    const current = [...messages].reverse().find(message => message.role === 'user')?.content.trim() || '';
    if (!current) return NextResponse.json({ error: 'Escribe una pregunta para continuar.' }, { status: 400 });

    const social = socialReply(current);
    if (social) {
      return NextResponse.json({
        answer: social.answer,
        mode: 'conversation',
        products: [],
        sources: [],
        contact: null,
        amazonLive: false,
        conversationClosed: social.conversationClosed,
        aiProvider: 'conversation-router',
        model: 'local-intent'
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        answer: positiveFallback(),
        mode: 'expert',
        products: [],
        sources: [],
        contact: null,
        amazonLive: false,
        conversationClosed: false,
        aiProvider: 'fallback-local',
        model: 'local-strategy'
      });
    }

    const [internal, general] = await Promise.all([
      retrieveArcadeEnCasa(current),
      retrieveGeneralArcadeKnowledge(current)
    ]);

    const combinedContext = [
      internal.context ? `CONTEXTO PRIORITARIO DE ARCADEENCASA.ES:\n${internal.context}` : '',
      general.context ? `CONOCIMIENTO EXTERNO RECUPERADO:\n${general.context}` : ''
    ].filter(Boolean).join('\n\n=====\n\n').slice(0, 10500);

    const enrichedMessages: ChatMessage[] = messages.map((message, index) => {
      const isLastUser = index === messages.length - 1 && message.role === 'user';
      if (!isLastUser) return message;
      return {
        role: 'user',
        content: `${message.content}\n\n${combinedContext || 'No hay contexto externo adicional. Usa conocimiento general estable.'}\n\nResponde SOLO a la intención del último mensaje y usa el historial únicamente cuando sea relevante. Sé breve, concreto y coherente. Normalmente 60-140 palabras. No metas productos si no ayudan directamente. Revisa el español antes de responder.`
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
        content: `${current.slice(0, 900)}\n\nCONTEXTO ÚTIL:\n${combinedContext.slice(0, 6000)}\n\nResponde SOLO a esta consulta. Sé breve, concreto, coherente y usa español correcto. Si ya has resuelto la cuestión y no necesitas aclarar nada, termina preguntando de forma natural si puedo ayudar con algo más.`
      }]);
    }

    if (!answer) answer = positiveFallback();
    answer = ensureNaturalFollowUp(answer);

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

    const b2b = B2B_RE.test(current);
    const products = internal.products.slice(0, 3);

    return NextResponse.json({
      answer,
      mode: b2b ? 'b2b' : products.length ? 'shopping' : 'expert',
      products,
      sources: [...internalSources, ...generalSources].slice(0, 8),
      contact: b2b ? CONTACT : null,
      amazonLive: false,
      conversationClosed: false,
      aiProvider: 'groq-free',
      model
    });
  } catch (error) {
    console.error('arcadeencasa_chat_error', error);
    return NextResponse.json({
      answer: positiveFallback(),
      mode: 'expert',
      products: [],
      sources: [],
      contact: null,
      amazonLive: false,
      conversationClosed: false,
      aiProvider: 'fallback-local',
      model: 'local-strategy'
    });
  }
}
