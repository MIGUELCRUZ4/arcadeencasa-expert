'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };
type Product = { name: string; url: string; price?: string; image?: string; category?: string };
type Source = { title: string; url: string; type: string };
type Contact = { email: string; whatsapp: string; whatsappUrl: string; partnersUrl: string } | null;
type Reply = {
  answer: string;
  mode: string;
  products: Product[];
  sources: Source[];
  contact: Contact;
  amazonLive: boolean;
};

const welcome: Message = {
  role: 'assistant',
  content: 'Soy ARCADEENCASA // EXPERT. Pregúntame qué comprar, montar, comparar, reparar o investigar. Puedo ayudarte con recreativas, consolas, ordenadores clásicos y actuales, controles, MAME, hardware, historia y la tienda de ArcadeEnCasa.'
};

const quick = [
  'Tengo 150 € y juego en PC. ¿Qué arcade stick me conviene?',
  'Quiero una consola retro oficial para conectar y jugar sin complicarme',
  '¿Cuál es la diferencia real entre CRT y LCD/IPS para arcade?',
  'Cuéntame la historia de Space Invaders y qué tiene de mito',
  'Somos fabricantes y queremos vender nuestro producto en ArcadeEnCasa'
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reply, setReply] = useState<Reply | null>(null);
  const bottom = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('aec-expert-history');
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      // Ignore malformed session state.
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('aec-expert-history', JSON.stringify(messages.slice(-20)));
    } catch {
      // Session storage may be blocked by the browser.
    }
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, reply, loading]);

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
        body: JSON.stringify({ messages: next.slice(-10) })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Error desconocido');

      const result = data as Reply;
      setMessages(previous => [...previous, { role: 'assistant', content: result.answer }]);
      setReply(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No he podido responder ahora mismo.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([welcome]);
    setReply(null);
    setError('');
    setInput('');
    try { sessionStorage.removeItem('aec-expert-history'); } catch { /* no-op */ }
  };

  return (
    <main className="aec-shell">
      <section className="aec-chat" aria-label="Asistente experto de ArcadeEnCasa">
        <header className="aec-head">
          <div className="aec-logo" aria-hidden="true">🕹</div>
          <div className="aec-brand">
            <strong>ARCADEENCASA // EXPERT</strong>
            <span>HARDWARE · HISTORIA · RETROGAMING · COMPRA INTELIGENTE</span>
          </div>
          <button className="aec-reset" onClick={reset} aria-label="Reiniciar conversación">↺</button>
        </header>

        <div className="aec-status" aria-label="Estado del asistente">
          <span><i className="aec-dot" /> ArcadeEnCasa vivo</span>
          <span><i className="aec-dot" /> Tienda WooCommerce</span>
          <span><i className="aec-dot" /> Búsqueda web</span>
          <span>Amazon live: {reply?.amazonLive ? 'SÍ' : 'NO'}</span>
        </div>

        <div className="aec-messages">
          {messages.map((message, index) => (
            <div className={`aec-row ${message.role}`} key={`${message.role}-${index}`}>
              <div className="aec-avatar">{message.role === 'assistant' ? 'AI' : 'TÚ'}</div>
              <div className="aec-bubble">{message.content}</div>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="aec-quick">
              {quick.map(item => (
                <button key={item} onClick={() => send(item)}>{item}</button>
              ))}
            </div>
          )}

          {loading && (
            <div className="aec-row assistant">
              <div className="aec-avatar">AI</div>
              <div className="aec-bubble aec-thinking">Consultando ArcadeEnCasa y contrastando fuentes</div>
            </div>
          )}

          {error && <div className="aec-error"><strong>ERROR:</strong> {error}</div>}

          {reply?.products?.length ? (
            <section className="aec-section">
              <div className="aec-section-title">Opciones relevantes en la tienda</div>
              <div className="aec-products">
                {reply.products.slice(0, 3).map(product => (
                  <article className="aec-product" key={product.url}>
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <div className="aec-product-placeholder" aria-hidden="true">🕹️</div>
                    )}
                    <div className="aec-product-body">
                      <span className="aec-product-meta">{product.category || 'TIENDA ARCADE'}</span>
                      <strong>{product.name}</strong>
                      {product.price && <span className="aec-price">{product.price}</span>}
                      <a href={product.url} target="_blank" rel="noreferrer">VER FICHA →</a>
                    </div>
                  </article>
                ))}
              </div>
              <p className="aec-privacy">El precio final y la disponibilidad deben comprobarse al abrir el comercio. Algunos enlaces pueden ser de afiliación sin coste extra para el usuario.</p>
            </section>
          ) : null}

          {reply?.contact && (
            <section className="aec-section aec-b2b">
              <div>
                <div className="aec-section-title" style={{ color: '#b2ebf2' }}>PARTNERS // REUNIÓN B2B</div>
                <strong>¿Quieres vender o colaborar con ArcadeEnCasa?</strong>
                <p>Prepara producto, web, mercado, stock/logística, márgenes y propuesta de valor. El objetivo es pasar de la conversación a una reunión profesional.</p>
              </div>
              <div className="aec-b2b-links">
                <a href={`mailto:${reply.contact.email}`}>{reply.contact.email}</a>
                <a href={reply.contact.whatsappUrl} target="_blank" rel="noreferrer">{reply.contact.whatsapp}</a>
                <a href={reply.contact.partnersUrl} target="_blank" rel="noreferrer">ZONA PARTNERS →</a>
              </div>
            </section>
          )}

          {reply?.sources?.length ? (
            <section className="aec-section aec-sources">
              <div className="aec-section-title">Fuentes y fichas consultadas</div>
              {reply.sources.map((source, index) => (
                <a className="aec-source" href={source.url} target="_blank" rel="noreferrer" key={`${source.url}-${index}`}>
                  <b>{source.type}</b>
                  <span>{source.title}</span>
                </a>
              ))}
            </section>
          ) : null}

          <div ref={bottom} />
        </div>

        <footer className="aec-compose-wrap">
          <div className="aec-compose">
            <textarea
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (canSend) send();
                }
              }}
              rows={2}
              maxLength={3000}
              placeholder="Ej.: Tengo poco espacio, 500 € y quiero una recreativa para dos jugadores…"
            />
            <button className="aec-send" onClick={() => send()} disabled={!canSend} aria-label="Enviar pregunta">➤</button>
          </div>
          <p className="aec-privacy">No introduzcas contraseñas, datos bancarios ni información sensible.</p>
        </footer>
      </section>
    </main>
  );
}
