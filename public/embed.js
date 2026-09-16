(() => {
  if (window.__ARCADEENCASA_EXPERT__) return;
  window.__ARCADEENCASA_EXPERT__ = true;

  const current = document.currentScript;
  if (!current || !current.src) return;
  const origin = new URL(current.src).origin;
  const mascot = 'https://arcadeencasa.es/wp-content/uploads/2026/02/cropped-29182356-9a3d-4521-9de2-87c2c5ef6e56.png';

  const host = document.createElement('div');
  host.id = 'arcadeencasa-expert-widget';

  const frameWrap = document.createElement('div');
  frameWrap.className = 'aec-frame-wrap';
  frameWrap.setAttribute('aria-hidden', 'true');

  const frame = document.createElement('iframe');
  frame.src = origin;
  frame.title = 'Planta Empollona de ArcadeEnCasa';
  frame.loading = 'lazy';
  frame.setAttribute('allow', 'clipboard-write');

  const tail = document.createElement('span');
  tail.className = 'aec-comic-tail';

  frameWrap.append(frame, tail);

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'aec-launcher';
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-label', 'Abrir la Planta Empollona de ArcadeEnCasa');
  launcher.innerHTML = `
    <span class="aec-launcher-copy">
      <strong>¿DUDAS ARCADE?</strong>
      <small>MODO EMPOLLÓN</small>
    </span>
    <span class="aec-mascot-crop"><img src="${mascot}" alt="" aria-hidden="true"></span>
    <span class="aec-ping">!</span>
  `;

  host.append(frameWrap, launcher);
  document.body.appendChild(host);

  const style = document.createElement('style');
  style.textContent = `
    #arcadeencasa-expert-widget {
      position: fixed;
      right: 18px;
      bottom: 10px;
      z-index: 2147483000;
      font-family: 'Courier New', Courier, monospace;
      pointer-events: none;
    }
    #arcadeencasa-expert-widget * { box-sizing: border-box; }
    #arcadeencasa-expert-widget .aec-launcher {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      width: 235px;
      height: 154px;
      padding: 0;
      border: 0;
      background: transparent;
      cursor: pointer;
      pointer-events: auto;
      filter: drop-shadow(0 8px 12px rgba(0,0,0,.32));
    }
    #arcadeencasa-expert-widget .aec-mascot-crop {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 146px;
      height: 150px;
      overflow: hidden;
      display: block;
      animation: aecMascotIdle 3.2s ease-in-out infinite;
      transform-origin: 50% 100%;
    }
    #arcadeencasa-expert-widget .aec-mascot-crop img {
      width: 150px;
      height: auto;
      display: block;
      transform: translateY(-1px);
    }
    #arcadeencasa-expert-widget .aec-launcher-copy {
      position: absolute;
      left: 0;
      top: 24px;
      width: 126px;
      padding: 10px 11px 9px;
      border: 3px solid #17100d;
      border-radius: 18px 18px 4px 18px;
      background: #fffdf1;
      color: #17100d;
      box-shadow: 5px 5px 0 #b2ebf2;
      text-align: left;
      transform: rotate(-2deg);
    }
    #arcadeencasa-expert-widget .aec-launcher-copy::after {
      content: '';
      position: absolute;
      right: -17px;
      bottom: 8px;
      width: 25px;
      height: 22px;
      background: #fffdf1;
      border-right: 3px solid #17100d;
      border-bottom: 3px solid #17100d;
      transform: skewX(-35deg) rotate(-20deg);
    }
    #arcadeencasa-expert-widget .aec-launcher-copy strong {
      display: block;
      color: #4a0404;
      font-size: 13px;
      line-height: 1.05;
      letter-spacing: .2px;
    }
    #arcadeencasa-expert-widget .aec-launcher-copy small {
      display: block;
      margin-top: 5px;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: .7px;
    }
    #arcadeencasa-expert-widget .aec-ping {
      position: absolute;
      right: 19px;
      top: 4px;
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      border: 3px solid #17100d;
      border-radius: 50%;
      background: #d7ff39;
      color: #4a0404;
      font-size: 17px;
      font-weight: 900;
      animation: aecPing 1.7s ease-in-out infinite;
    }
    #arcadeencasa-expert-widget .aec-frame-wrap {
      position: absolute;
      right: 102px;
      bottom: 142px;
      width: min(520px, calc(100vw - 36px));
      height: min(710px, calc(100vh - 175px));
      opacity: 0;
      transform: translateY(16px) scale(.97);
      transform-origin: 100% 100%;
      pointer-events: none;
      transition: opacity .18s ease, transform .18s ease;
    }
    #arcadeencasa-expert-widget.aec-open .aec-frame-wrap {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    #arcadeencasa-expert-widget iframe {
      width: 100%;
      height: 100%;
      display: block;
      border: 4px solid #17100d;
      border-radius: 28px 28px 8px 28px;
      background: #fffdf1;
      box-shadow: 9px 9px 0 #b2ebf2, 15px 15px 0 rgba(74,4,4,.32);
    }
    #arcadeencasa-expert-widget .aec-comic-tail {
      position: absolute;
      right: -20px;
      bottom: 22px;
      width: 48px;
      height: 44px;
      background: #fffdf1;
      border-right: 4px solid #17100d;
      border-bottom: 4px solid #17100d;
      transform: skewX(-28deg) rotate(13deg);
      z-index: 2;
    }
    @keyframes aecMascotIdle {
      0%,100% { transform: rotate(-1deg) translateY(0); }
      50% { transform: rotate(1.5deg) translateY(-5px); }
    }
    @keyframes aecPing {
      0%,100% { transform: scale(1); }
      50% { transform: scale(1.13); }
    }
    @media (max-width: 680px) {
      #arcadeencasa-expert-widget { right: 5px; bottom: 2px; }
      #arcadeencasa-expert-widget .aec-launcher { width: 150px; height: 112px; }
      #arcadeencasa-expert-widget .aec-mascot-crop { width: 105px; height: 108px; }
      #arcadeencasa-expert-widget .aec-mascot-crop img { width: 108px; }
      #arcadeencasa-expert-widget .aec-launcher-copy { left: -42px; top: 12px; width: 98px; padding: 8px; }
      #arcadeencasa-expert-widget .aec-launcher-copy strong { font-size: 10px; }
      #arcadeencasa-expert-widget .aec-launcher-copy small { font-size: 7px; }
      #arcadeencasa-expert-widget .aec-frame-wrap {
        position: fixed;
        left: 8px;
        right: 8px;
        bottom: 108px;
        width: auto;
        height: calc(100dvh - 126px);
      }
      #arcadeencasa-expert-widget iframe { border-radius: 18px 18px 5px 18px; }
      #arcadeencasa-expert-widget .aec-comic-tail { right: 22px; bottom: -17px; transform: rotate(42deg) skewX(-20deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      #arcadeencasa-expert-widget * { animation: none !important; transition: none !important; }
    }
  `;
  document.head.appendChild(style);

  launcher.addEventListener('click', () => {
    const open = host.classList.toggle('aec-open');
    frameWrap.setAttribute('aria-hidden', String(!open));
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? 'Cerrar la Planta Empollona de ArcadeEnCasa' : 'Abrir la Planta Empollona de ArcadeEnCasa');
  });
})();
