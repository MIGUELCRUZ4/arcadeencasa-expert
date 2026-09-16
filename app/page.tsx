'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };
type Product = { name: string; url: string; price?: string; image?: string; category?: string };
type Contact = { email: string; whatsapp: string; whatsappUrl: string; partnersUrl: string } | null;
type Reply = { answer: string; mode: string; products: Product[]; contact: Contact; amazonLive: boolean };

const MASCOT = 'https://arcadeencasa.es/wp-content/uploads/2026/01/cropped-unnamed-4-Photoroom.png';

const welcome: Message = {
  role: 'assistant',
  content: '¡Ey, máquina! Dispara tu duda. Recreativas, consolas, ordenadores, MAME, hardware, historia, tecnología o qué comprar sin tirar la pasta: yo mastico los datos por ti.'
};

const quick = [
  'Tengo 150 € y juego en PC. ¿Qué arcade stick me conviene?',
  'Quiero una consola retro oficial para enchufar y jugar',
  '¿CRT, LCD u OLED para una recreativa en casa?',
  'Cuéntame qué hay de mito en la historia de Space Invaders',
  'Somos fabricantes y queremos colaborar con ArcadeEnCasa'
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reply, setReply] = useState<Reply | null>(null);
  const latestAssistant = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Remove the legacy stored conversation so no previous consultation can ever reappear.
    try { sessionStorage.removeItem('aec-expert-history'); } catch {}
  }, []);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (messages.length <= 1 || loading || last?.role !== 'assistant') return;

    const timer = window.setTimeout(() => {
      latestAssistant.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [messages, loading]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const send = async (forced?: string) => {
    const text = (forced ?? input).trim();
    if (!text || loading) return;

    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    setError('');
    setReply(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-6) })
      });
      const data = await response.json();
      if (!response.ok && !data?.answer) throw new Error(data?.error || 'Error desconocido');
      const result = data as Reply;
      setMessages(previous => [...previous, { role: 'assistant', content: result.answer }]);
      setReply(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La planta se ha quedado tiesa un segundo.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([welcome]);
    setReply(null);
    setError('');
    setInput('');
  };

  return (
    <main className="aec-shell">
      <section className="aec-chat" aria-label="Planta Empollona de ArcadeEnCasa">
        <header className="aec-head">
          <div className="aec-head-mascot"><img src={MASCOT} alt="Planta carnívora de ArcadeEnCasa" /></div>
          <div className="aec-brand">
            <strong>LA PLANTA EMPOLLONA</strong>
            <span>ARCADEENCASA // SABE DEMASIADO DE ARCADE</span>
          </div>
          <button className="aec-reset" onClick={reset} aria-label="Nueva consulta">↺</button>
        </header>

        <div className="aec-status">
          <span><i className="aec-dot" /> ArcadeEnCasa vivo</span>
          <span><i className="aec-dot" /> Tienda WooCommerce</span>
          <span><i className="aec-dot" /> GPT-OSS</span>
          <span>Amazon live: {reply?.amazonLive ? 'SÍ' : 'NO'}</span>
        </div>

        <div className="aec-messages">
          {messages.map((message, index) => {
            const isLatestAnswer = message.role === 'assistant' && index === messages.length - 1 && messages.length > 1;
            return (
              <div
                className={`aec-row ${message.role}`}
                key={`${message.role}-${index}`}
                ref={isLatestAnswer ? latestAssistant : undefined}
                style={isLatestAnswer ? { scrollMarginTop: '14px' } : undefined}
              >
                {message.role === 'assistant' ? (
                  <div className="aec-mascot-avatar"><img src={MASCOT} alt="" aria-hidden="true" /></div>
                ) : <div className="aec-avatar-user">TÚ</div>}
                <div className="aec-bubble">{message.content}</div>
              </div>
            );
          })}

          {messages.length === 1 && (
            <div className="aec-quick">
              {quick.map(item => <button key={item} onClick={() => send(item)}>{item}</button>)}
            </div>
          )}

          {loading && (
            <div className="aec-row assistant">
              <div className="aec-mascot-avatar"><img src={MASCOT} alt="" aria-hidden="true" /></div>
              <div className="aec-bubble aec-thinking">Estoy rebuscando en mi cerebro pixelado</div>
            </div>
          )}

          {error && <div className="aec-error"><strong>GAME OVER:</strong> {error}</div>}

          {reply?.products?.length ? (
            <section className="aec-section">
              <div className="aec-section-title">BOTÍN RECOMENDADO // SIN HUMO</div>
              <div className="aec-products">
                {reply.products.slice(0, 3).map(product => (
                  <article className="aec-product" key={product.url}>
                    {product.image ? <img src={product.image} alt={product.name} /> : <div className="aec-product-placeholder">🕹️</div>}
                    <div className="aec-product-body">
                      <span className="aec-product-meta">{product.category || 'TIENDA ARCADE'}</span>
                      <strong>{product.name}</strong>
                      {product.price && <span className="aec-price">{product.price}</span>}
                      <a href={product.url} target="_blank" rel="noreferrer">VER FICHA →</a>
                    </div>
                  </article>
                ))}
              </div>
              <p className="aec-privacy">Precio y disponibilidad final: compruébalos al abrir la ficha. Algunos enlaces pueden ser de afiliación sin coste extra.</p>
            </section>
          ) : null}

          {reply?.contact && (
            <section className="aec-section aec-b2b">
              <div><div className="aec-section-title">PARTNERS // NIVEL EMPRESA</div><strong>¿Quieres vender o colaborar con ArcadeEnCasa?</strong><p>Producto, web, mercado, stock/logística, márgenes y propuesta de valor. Vamos a lo serio.</p></div>
              <div className="aec-b2b-links">
                <a href={`mailto:${reply.contact.email}`}>{reply.contact.email}</a>
                <a href={reply.contact.whatsappUrl} target="_blank" rel="noreferrer">{reply.contact.whatsapp}</a>
                <a href={reply.contact.partnersUrl} target="_blank" rel="noreferrer">ZONA PARTNERS →</a>
              </div>
            </section>
          )}
        </div>

        <footer className="aec-compose-wrap">
          <div className="aec-compose">
            <textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (canSend) send(); }
            }} rows={2} maxLength={3000} placeholder="Venga, máquina: dispara tu duda arcade…" />
            <button className="aec-send" onClick={() => send()} disabled={!canSend} aria-label="Enviar pregunta">➤</button>
          </div>
          <p className="aec-privacy">No metas contraseñas, tarjetas ni datos sensibles. Esto es un recreativo, no Fort Knox.</p>
        </footer>
      </section>
    </main>
  );
}
