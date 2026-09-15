(() => {
  if (window.__ARCADEENCASA_EXPERT__) return;
  window.__ARCADEENCASA_EXPERT__ = true;

  const current = document.currentScript;
  if (!current || !current.src) return;
  const origin = new URL(current.src).origin;

  const host = document.createElement('div');
  host.id = 'arcadeencasa-expert-widget';

  const frame = document.createElement('iframe');
  frame.src = origin;
  frame.title = 'ArcadeEnCasa Expert';
  frame.loading = 'lazy';
  frame.setAttribute('allow', 'clipboard-write');
  frame.style.display = 'none';

  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', 'Abrir experto de ArcadeEnCasa');
  button.innerHTML = '<span class="aec-widget-icon">🕹️</span><span class="aec-widget-label">PREGUNTA AL EXPERTO</span>';

  host.append(frame, button);
  document.body.appendChild(host);

  const style = document.createElement('style');
  style.textContent = `
    #arcadeencasa-expert-widget {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483000;
      font-family: 'Courier New', Courier, monospace;
    }
    #arcadeencasa-expert-widget > button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      min-width: 58px;
      height: 58px;
      padding: 0 16px;
      border: 3px solid #4a0404;
      background: #4a0404;
      color: #fff;
      box-shadow: 5px 5px 0 #b2ebf2;
      font-weight: 900;
      cursor: pointer;
    }
    #arcadeencasa-expert-widget .aec-widget-icon { font-size: 25px; }
    #arcadeencasa-expert-widget .aec-widget-label { font-size: 10px; letter-spacing: .7px; }
    #arcadeencasa-expert-widget iframe {
      position: absolute;
      right: 0;
      bottom: 76px;
      width: min(440px, calc(100vw - 24px));
      height: min(720px, calc(100vh - 110px));
      border: 3px solid #4a0404;
      background: #fff;
      box-shadow: 8px 8px 0 #b2ebf2;
    }
    @media (max-width: 520px) {
      #arcadeencasa-expert-widget { right: 8px; bottom: 8px; }
      #arcadeencasa-expert-widget iframe {
        right: 0;
        bottom: 70px;
        width: calc(100vw - 16px);
        height: calc(100vh - 88px);
      }
      #arcadeencasa-expert-widget .aec-widget-label { display: none; }
      #arcadeencasa-expert-widget > button { width: 58px; padding: 0; }
    }
  `;
  document.head.appendChild(style);

  button.addEventListener('click', () => {
    const open = frame.style.display !== 'none';
    frame.style.display = open ? 'none' : 'block';
    button.setAttribute('aria-expanded', String(!open));
    button.setAttribute('aria-label', open ? 'Abrir experto de ArcadeEnCasa' : 'Cerrar experto de ArcadeEnCasa');
  });
})();
