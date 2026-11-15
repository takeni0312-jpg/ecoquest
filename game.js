'use strict';
/* ============================================================================
   EcoQuest — démo jouable (séquence du Kraken) · moteur v0
   Principe : le jeu est une LISTE DE SCÈNES (ci-dessous). Chaque scène = un écran
   (une image), et ce qui se passe ensuite. Ajouter une scène = ajouter un bloc.
   ============================================================================ */

// Taille des écrans Figma (les zones cliquables sont données dans ce repère)
const W = 1085, H = 723;

// Le menu de combat : ordre retenu = Attaquer, Magie, Objets, Fuir (grille 2×2)
const ACTIONS = [
  { id: 'attaquer', label: 'Attaquer', x: 269, y: 547, w: 254, h: 66 },
  { id: 'magie',    label: 'Magie',    x: 547, y: 547, w: 254, h: 66 },
  { id: 'objets',   label: 'Objets',   x: 269, y: 625, w: 254, h: 66 },
  { id: 'fuir',     label: 'Fuir',     x: 547, y: 625, w: 254, h: 66 },
];

// Message quand on clique une action qui n'existe pas encore dans la démo
const INDISPONIBLE = {
  magie:  'La Magie n’est pas encore disponible dans cette démo.',
  objets: 'Les Objets ne sont pas encore disponibles dans cette démo.',
  fuir:   'On ne peut pas reculer.',
};

/* Champs d'une scène :
   img   : nom du fichier image (dossier img/)
   alt   : description lue par les lecteurs d'écran (reprend le texte de l'image)
   next  : scène suivante (clic, ou automatique si "wait" est donné)
   wait  : durée en ms avant d'enchaîner tout seul
   skip  : true = on peut aussi cliquer pour passer plus vite
   menu  : { action: scène } — les actions listées avancent, les autres affichent un message
   hint  : petite aide sous l'écran
   end   : true = écran de fin (bouton Rejouer)                                                  */
const START = 'intro';
const SCENES = {
  intro: {
    img: 's01',
    alt: 'Le Capitaine Léviathan, un requin en armure tenant un trident, s’adresse à vous : « Ici le Capitaine Léviathan. Abyssalia meurt. L’acide ronge nos dernières amarres. Il faut fuir vers Azur. Mais la Fosse grouille de monstres. Je ne survivrai pas seul dans le noir. J’ai besoin de vous à la barre. Magie, Acier ou Ruse... C’est vous qui prendrez les décisions. Et chaque choix aura un prix. Si nous échouons, l’océan est perdu. Prêt à plonger avec moi ? »',
    next: 'plongee', hint: 'Clique pour continuer',
  },
  plongee: {
    img: 's02',
    alt: 'Le capitaine plonge entre les colonnes d’une cité engloutie, son trident à la main.',
    next: 'kraken', wait: 2600, skip: true, hint: '',
  },
  kraken: {
    img: 's03',
    alt: 'Le Kraken Pollueur surgit face au capitaine. Capitaine Léviathan : « Par toutes les reliques... C’est le Kraken Pollueur. Ses tentacules suintent de Sang Noir. On ne peut pas reculer. Acier, Magie ou Ruse ? Donnez vos ordres, et vite ! »',
    next: 'menu1', hint: 'Clique pour continuer',
  },
  menu1: {
    img: 's04',
    alt: 'Combat contre le Kraken Pollueur. Choisissez une action : Attaquer, Magie, Objets ou Fuir.',
    menu: { attaquer: 'attaque1' }, hint: 'Choisis une action',
  },
  attaque1: {
    img: 's05',
    alt: 'Le capitaine lance une vague d’eau tourbillonnante vers le Kraken.',
    next: 'impact1', wait: 900, hint: '',
  },
  impact1: {
    img: 's06',
    alt: 'La vague frappe le Kraken, dont la jauge de vie devient rouge.',
    next: 'riposte', wait: 1100, hint: '',
  },
  riposte: {
    img: 's07',
    alt: 'Le Kraken riposte en lançant une boule d’énergie sombre.',
    next: 'touche', wait: 1000, hint: '',
  },
  touche: {
    img: 's08',
    alt: 'La boule sombre frappe le capitaine ; sa jauge de vie baisse.',
    next: 'menu2', wait: 1400, hint: '',
  },
  menu2: {
    img: 's09',
    alt: 'La jauge de vie du capitaine a baissé. Choisissez une action : Attaquer, Magie, Objets ou Fuir.',
    menu: { attaquer: 'impact2' }, hint: 'Choisis une action',
  },
  impact2: {
    img: 's10',
    alt: 'Une seconde vague frappe le Kraken, qui vacille.',
    next: 'victoire', wait: 1600, hint: '',
  },
  victoire: {
    img: 's11',
    alt: 'Félicitations ! Vous avez vaincu le KRAKEN POLLUEUR ! Vous obtenez une TENTACULE RUGUEUSE. Vous obtenez +36 xp.',
    next: 'fin', hint: 'Clique pour continuer',
  },
  fin: { img: 's11', alt: 'Fin de la démo.', end: true, hint: '' },
};

/* ============================ MOTEUR ====================================== */
(() => {
  const $ = (s) => document.querySelector(s);
  const stage = $('#stage'), ui = $('#ui'), toast = $('#toast'), hint = $('#hint');
  const endBox = $('#end'), loading = $('#loading');
  const layers = [$('#layerA'), $('#layerB')];

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FADE = reduced ? 0 : 220;
  const LOCK = FADE + 80;               // évite de sauter deux scènes d'un coup en cliquant vite

  let current = null, shown = null, top = 0;
  let timer = null, toastTimer = null, fadeTimer = null, lockUntil = 0, token = 0;

  if (/[?&]debug/.test(location.search)) document.documentElement.classList.add('debug');

  const src = (name) => `img/${name}.webp`;
  const pct = (v, total) => `${(v / total) * 100}%`;

  /* ---- chargement de toutes les images avant de commencer ---- */
  function preload() {
    const names = [...new Set(Object.values(SCENES).map((s) => s.img))];
    let done = 0;
    return Promise.all(names.map((n) => new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => { loading.textContent = `Chargement… ${++done}/${names.length}`; resolve(); };
      im.onerror = () => reject(new Error('image introuvable : ' + n));
      im.src = src(n);
    })));
  }

  /* ---- affichage de l'image d'une scène, avec fondu enchaîné ---- */
  function showImage(sc, instant) {
    if (shown === sc.img) { layers[top].alt = sc.alt; return; }
    const next = layers[1 - top], prev = layers[top];
    next.src = src(sc.img);
    next.alt = sc.alt;
    next.removeAttribute('aria-hidden');
    prev.setAttribute('aria-hidden', 'true');
    next.style.zIndex = 2; prev.style.zIndex = 1;
    if (instant) next.style.transition = 'none';
    next.classList.add('on');
    if (instant) { void next.offsetWidth; next.style.transition = ''; }
    top = 1 - top; shown = sc.img;
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {          // l'ancienne image disparaît une fois la nouvelle bien visible
      prev.style.transition = 'none'; prev.classList.remove('on'); void prev.offsetWidth; prev.style.transition = '';
    }, FADE + 30);
  }

  /* ---- boutons / zones cliquables de la scène ---- */
  function renderControls(sc) {
    ui.replaceChildren();
    if (sc.menu) {
      ACTIONS.forEach((a, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'hot'; b.dataset.action = a.id; b.setAttribute('aria-label', a.label);
        Object.assign(b.style, { left: pct(a.x, W), top: pct(a.y, H), width: pct(a.w, W), height: pct(a.h, H) });
        b.addEventListener('click', () => choose(a.id));
        b.addEventListener('keydown', (e) => gridKeys(e, i));
        ui.append(b);
      });
    } else if (sc.next && (!sc.wait || sc.skip)) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'advance'; b.setAttribute('aria-label', sc.hint || 'Continuer');
      b.addEventListener('click', () => { if (ready()) go(sc.next); });
      ui.append(b);
    }
  }

  // Flèches du clavier dans la grille 2×2 du menu
  function gridKeys(e, i) {
    const move = { ArrowRight: i ^ 1, ArrowLeft: i ^ 1, ArrowDown: i ^ 2, ArrowUp: i ^ 2 }[e.key];
    if (move === undefined) return;
    e.preventDefault(); ui.children[move].focus();
  }

  const ready = () => performance.now() >= lockUntil;

  function choose(actionId) {
    if (!ready()) return;
    const sc = SCENES[current];
    const target = sc.menu && sc.menu[actionId];
    if (target) go(target); else showToast(INDISPONIBLE[actionId] || 'Pas encore disponible dans cette démo.');
  }

  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  /* ---- passage à une scène ---- */
  function go(id, opts = {}) {
    const sc = SCENES[id]; if (!sc) { console.error('scène inconnue :', id); return; }
    token++; clearTimeout(timer); toast.classList.remove('show');
    current = id; lockUntil = performance.now() + (opts.instant ? 0 : LOCK);
    showImage(sc, !!opts.instant);
    endBox.hidden = !sc.end;
    renderControls(sc);
    hint.textContent = sc.hint || '';
    if (sc.end) $('#replay').focus({ preventScroll: true });
    else { const first = ui.querySelector('button'); if (first) first.focus({ preventScroll: true }); }
    if (sc.wait) { const t = token; timer = setTimeout(() => { if (t === token) go(sc.next); }, sc.wait); }
  }

  const restart = () => go(START, { instant: false });
  $('#replay').addEventListener('click', restart);
  $('#restart').addEventListener('click', restart);
  document.addEventListener('keydown', (e) => { if (current === 'fin' && (e.key === 'r' || e.key === 'R')) restart(); });

  // Pour tester / bricoler depuis la console du navigateur
  window.EcoQuest = { SCENES, go, get current() { return current; }, lockMs: LOCK };

  preload()
    .then(() => { loading.hidden = true; go(START, { instant: true }); })
    .catch((err) => { loading.textContent = 'Impossible de charger les images du jeu.'; console.error(err); });
})();
