'use strict';
/* ============================================================================
   EcoQuest — VERSION 1 : de l'écran titre à la victoire contre le Kraken (17 écrans)

   Ce fichier a 4 parties :
     1. RÉGLAGES   : durées, positions, vitesse du texte (c'est ici que tu règles le rythme)
     2. TEXTES     : tous les dialogues, recopiés de ton Figma et de ta vidéo d'intro
     3. OUTILS     : la boîte de dialogue à effet « machine à écrire »
     4. LES SCÈNES : une scène = un moment du jeu (Titre → Intro → Capitaine → Plongée → Combat)

   Toutes les durées sont en millisecondes (1000 = 1 seconde).
   Astuce : ajoute ?scene=Combat (ou Titre, Intro, Capitaine, Plongee) à l'adresse pour sauter à une scène.
   ============================================================================ */

/* ------------------------------- 1. RÉGLAGES ------------------------------- */
const CFG = {
  fondu: 400,               // fondu au noir entre deux scènes

  // --- Texte « machine à écrire » (rythme relevé sur ta vidéo : environ 26 lettres / seconde) ---
  lettre: 38,               // une lettre toutes les … ms
  caracteresParLigne: 48,   // largeur d'une ligne (391 px / 8 px par lettre, comme dans ton Figma)
  interligne: 16,           // hauteur d'une ligne (police 8 px × interligne 2 dans ton Figma)

  // --- Intro ---
  introFondSeul: 1300,      // le décor reste seul avant l'apparition du parchemin
  introApparition: 700,     // le parchemin et la boîte apparaissent en …
  ruinesPause: 2000,        // les ruines restent seules à l'écran avant le capitaine
  capitaineApparition: 600, // le capitaine apparaît en …

  // --- Plongée ---
  plongeeArrivee: 1700,     // le capitaine arrive dans les ruines en …
  plongeePause: 1300,       // … puis reste un instant (il flotte) avant le Kraken

  // --- Combat : positions (mesurées sur tes écrans Figma, repère 1085 × 723) ---
  captain: { x: 74,  y: 229 },
  captainHurt: { x: 31, y: 229 },
  kraken:  { x: 504, y: 0 },
  krakenHit: { x: 454, y: 0 },
  kraken_ko: { x: 461, y: 310 },
  playerBar: { x: 10,  y: 10 },
  enemyBar:  { x: 835, y: 10 },
  waveStart: { x: 400, y: 411 },
  waveEnd:   { x: 673, y: 295 },
  ballStart: { x: 690, y: 385 },
  ballMid:   { x: 571, y: 398 },
  ballEnd:   { x: 384, y: 438 },
  boiteVictoire: { x: 267, y: 471 },
  playerFill: { debut: 47, fin: 207 },   // partie colorée de chaque jauge, dans son image
  enemyFill:  { debut: 31, fin: 192 },

  // --- Combat : menu des 4 boutons (position de chaque bouton, repère 1085 × 723) ---
  menu: {
    magie:    { x: 269, y: 547 },
    objets:   { x: 547, y: 547 },
    attaquer: { x: 269, y: 625 },
    fuir:     { x: 547, y: 625 },
    curseurDx: 211, curseurDy: 19,       // où le curseur doré se pose sur un bouton
    apparition: 250,
  },

  // --- Combat : entrée du Kraken ---
  krakenEntree: 650,        // le Kraken arrive en …
  krakenEntreeDist: 150,    // … depuis la droite (px)

  // --- Combat : chronologie de l'attaque ---
  lunge: 160, lungeDist: 38, waveFadeIn: 120, waveTravel: 350, hitStop: 70,
  shake: 180, shakePower: 0.006, recoil: 16, recoilTime: 90,
  hpDrop: 1500, hpAfter: 0.42,
  redIn: 90, redToGreen: 90, waveFadeOut: 50, captainReturn: 320,
  riposteDelay: 350, ballFadeIn: 140, ballTravel: 520, playerHpAfter: 0.62, hurtRecoil: 18,
  koDrop: 70, koTime: 420,
  pauseFin: 500,            // petite pause avant de rendre la main au joueur
};

/* -------------------------------- 2. TEXTES -------------------------------- */
// Chaque texte est une liste de « pages ». Un saut de ligne vide = une ligne blanche.

// Intro (parchemin) : découpée en 4 pages, comme dans ta vidéo.
const TEXTE_INTRO = [
  "L'ère des lumières est révolue, Abyssalia se meurt.\n\nLe ciel n'est plus qu'un linceul de plastique. Le Sang Noir empoisonne nos courants. Nos coraux ne sont plus que des cendres.",
  "Il ne reste qu'un seul espoir : AZUR. Le dernier sanctuaire de l'ancien monde.\n\nVous êtes le Capitaine du Léviathan. Votre navire mêle Acier lourd et Magie ancienne.",
  "Votre mission : Traverser les abysses. Survivre aux toxines. Atteindre Azur coûte que coûte.\nMais attention... L'océan appartient désormais aux monstres.",
  "Vos choix dictent votre destin. Gérez votre jauge vitale grâce à vos actions.\n\nFace aux abominations, vous devrez choisir entre la force brute de l'ACIER, la lumière sacrée de la MAGIE ou la survie par la RUSE. Il n'y a pas de bonne réponse. Seulement des conséquences...",
];

// Le capitaine parle (texte de ton Figma, écran « Capitaine »)
const TEXTE_CAPITAINE = [
  "Ici le Capitaine Léviathan.\n\nAbyssalia meurt. L'acide ronge nos dernières amarres. Il faut fuir vers Azur. Mais la Fosse grouille de monstres. Je ne survivrai pas seul dans le noir. J'ai besoin de vous à la barre.\nMagie, Acier ou Ruse... C'est vous qui prendrez les décisions. Et chaque choix aura un prix.\n\nSi nous échouons, l'océan est perdu. Prêt à plonger avec moi ?",
];

// Le Kraken apparaît (texte de ton Figma, écran « Apparition du Kraken »)
const TEXTE_KRAKEN = [
  "CAPITAINE LEVIATHAN :\nPar toutes les reliques... C'est le Kraken Pollueur. Ses tentacules suintent de Sang Noir.\n\nOn ne peut pas reculer. Acier, Magie ou Ruse ? Donnez vos ordres, et vite !",
];

/* -------------------------------- 3. OUTILS -------------------------------- */
const POLICE = { fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffffff', resolution: 2 };

// Découpe un texte en lignes de 48 lettres maximum (retour à la ligne entre les mots)
function decouper(texte, max) {
  const lignes = [];
  texte.split('\n').forEach((para) => {
    if (para === '') { lignes.push(''); return; }
    let ligne = '';
    para.split(' ').forEach((mot) => {
      const essai = ligne ? ligne + ' ' + mot : mot;
      if (essai.length > max && ligne) { lignes.push(ligne); ligne = mot; } else { ligne = essai; }
    });
    lignes.push(ligne);
  });
  return lignes;
}

// Fondu au noir vers une autre scène
function aller(scene, nom, data) {
  scene.cameras.main.fadeOut(CFG.fondu, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(nom, data));
}

// La boîte de dialogue : affiche des pages de texte lettre par lettre.
// Un clic (ou Espace / Entrée) : termine la page en cours ; un autre clic : page suivante.
class Dialogue {
  constructor(scene, { texteX, texteY, flecheX, flecheY }) {
    this.s = scene; this.x = texteX; this.y = texteY;
    this.fleche = scene.add.image(flecheX, flecheY, 'arrow').setOrigin(0).setVisible(false).setDepth(30);
    scene.tweens.add({ targets: this.fleche, y: flecheY + 3, duration: 450, yoyo: true, repeat: -1 });
    this.lignes = [];
  }

  nettoyer() { this.lignes.forEach((t) => t.destroy()); this.lignes = []; }

  // Retourne une promesse : terminée quand le joueur a lu toute la dernière page
  jouer(pages) {
    return new Promise((fini) => {
      let n = 0, total = 0, vus = 0, timer = null, ecriture = false;
      const montrer = () => {
        this.nettoyer(); this.fleche.setVisible(false);
        const lignes = decouper(pages[n], CFG.caracteresParLigne);
        total = lignes.reduce((a, l) => a + l.length, 0); vus = 0; ecriture = true;
        this.lignes = lignes.map((l, i) =>
          this.s.add.text(this.x, this.y + i * CFG.interligne, '', POLICE).setDepth(30));
        const afficher = () => {
          let reste = vus;
          lignes.forEach((l, i) => { this.lignes[i].setText(l.slice(0, Math.max(0, Math.min(l.length, reste)))); reste -= l.length; });
        };
        this._afficher = afficher;
        timer = this.s.time.addEvent({ delay: CFG.lettre, loop: true, callback: () => {
          vus++; afficher();
          if (vus >= total) { timer.remove(); ecriture = false; this.fleche.setVisible(true); }
        } });
      };
      const clic = () => {
        if (ecriture) { timer.remove(); vus = total; this._afficher(); ecriture = false; this.fleche.setVisible(true); return; }
        n++;
        if (n < pages.length) { montrer(); return; }
        this.s.input.off('pointerdown', clic); this.s.input.keyboard.off('keydown-SPACE', clic); this.s.input.keyboard.off('keydown-ENTER', clic);
        this.nettoyer(); this.fleche.setVisible(false); fini();
      };
      this.s.input.on('pointerdown', clic);
      this.s.input.keyboard.on('keydown-SPACE', clic);
      this.s.input.keyboard.on('keydown-ENTER', clic);
      montrer();
    });
  }
}

// Petit outil : attendre / lancer une animation et attendre sa fin
const attendre = (scene, ms) => new Promise((ok) => scene.time.delayedCall(ms, ok));
const anim = (scene, config) => new Promise((ok) => scene.tweens.add({ ...config, onComplete: ok }));

/* ------------------------------- 4. LES SCÈNES ------------------------------ */

// 4.0 — Chargement : toutes les images, et la police des dialogues
class Chargement extends Phaser.Scene {
  constructor() { super('Chargement'); }
  preload() {
    this.add.text(542, 361, 'Chargement…', { fontFamily: 'monospace', fontSize: '18px', color: '#9fd8ff' }).setOrigin(0.5);
    [
      'title', 'bg_intro', 'box', 'scroll', 'arrow', 'bg_ruines', 'bg_capitaine', 'captain_big', 'swim', 'cursor',
      'btn_magie', 'btn_objets', 'btn_attaquer', 'btn_fuir',
      'bg', 'captain', 'captain_hurt', 'kraken', 'kraken_hit', 'kraken_ko', 'wave1', 'wave2', 'ball',
      'bar_player', 'bar_player_empty', 'bar_player_red', 'bar_enemy', 'bar_enemy_empty', 'bar_enemy_red_clean',
      'dialogue_victoire',
    ].forEach((nom) => this.load.image(nom, `assets/${nom}.png`));
  }
  create() {
    // On attend la police pixel (2,5 s au maximum) ; sinon le jeu démarre avec une police de secours.
    const police = document.fonts ? document.fonts.load('8px "Press Start 2P"') : Promise.resolve();
    Promise.race([police, new Promise((ok) => setTimeout(ok, 2500))]).catch(() => {}).then(() => {
      const voulue = new URLSearchParams(location.search).get('scene');
      this.scene.start(voulue && this.scene.get(voulue) ? voulue : 'Titre');
    });
  }
}

// 4.1 — Écran titre (écran 1)
class Titre extends Phaser.Scene {
  constructor() { super('Titre'); }
  create() {
    this.cameras.main.fadeIn(CFG.fondu, 0, 0, 0);
    this.add.image(0, 0, 'title').setOrigin(0);
    // zone cliquable : le bouton « Jouer » (position mesurée sur ton Figma)
    const bouton = this.add.zone(379, 471, 326, 89).setOrigin(0).setInteractive({ useHandCursor: true });
    const lueur = this.add.rectangle(379, 471, 326, 89, 0xffffff, 0).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD);
    bouton.on('pointerover', () => this.tweens.add({ targets: lueur, alpha: 0.18, duration: 120 }));
    bouton.on('pointerout', () => this.tweens.add({ targets: lueur, alpha: 0, duration: 120 }));
    let parti = false;
    const jouer = () => { if (parti) return; parti = true; aller(this, 'Intro'); };
    bouton.on('pointerdown', jouer);
    this.input.keyboard.on('keydown-ENTER', jouer);
    this.input.keyboard.on('keydown-SPACE', jouer);
  }
}

// 4.2 — Intro : le décor, puis le parchemin et le texte (écrans 2 à 5)
class Intro extends Phaser.Scene {
  constructor() { super('Intro'); }
  async create() {
    this.cameras.main.fadeIn(CFG.fondu, 0, 0, 0);
    this.add.image(0, 0, 'bg_intro').setOrigin(0);
    await attendre(this, CFG.introFondSeul);

    const parchemin = this.add.image(281, 56 + 24, 'scroll').setOrigin(0).setAlpha(0).setDepth(10);
    const boite = this.add.image(199, 417, 'box').setOrigin(0).setAlpha(0).setDepth(10);
    this.tweens.add({ targets: parchemin, alpha: 1, y: 56, duration: CFG.introApparition, ease: 'Cubic.easeOut' });
    await anim(this, { targets: boite, alpha: 1, duration: CFG.introApparition });

    const dialogue = new Dialogue(this, { texteX: 318, texteY: 506, flecheX: 684, flecheY: 634 });
    await dialogue.jouer(TEXTE_INTRO);
    aller(this, 'Capitaine');
  }
}

// 4.3 — Les ruines, puis le capitaine qui parle (écrans 6 et 7)
class Capitaine extends Phaser.Scene {
  constructor() { super('Capitaine'); }
  async create() {
    this.cameras.main.fadeIn(CFG.fondu, 0, 0, 0);
    this.add.image(0, 0, 'bg_ruines').setOrigin(0);                    // les ruines, seules
    const sombre = this.add.image(0, 0, 'bg_capitaine').setOrigin(0).setAlpha(0).setDepth(2);   // même décor, assombri
    await attendre(this, CFG.ruinesPause);

    const portrait = this.add.image(259, 0 + 20, 'captain_big').setOrigin(0).setAlpha(0).setDepth(5);
    const boite = this.add.image(199, 417, 'box').setOrigin(0).setAlpha(0).setDepth(10);
    this.tweens.add({ targets: sombre, alpha: 1, duration: CFG.capitaineApparition });
    this.tweens.add({ targets: portrait, alpha: 1, y: 0, duration: CFG.capitaineApparition, ease: 'Cubic.easeOut' });
    await anim(this, { targets: boite, alpha: 1, duration: CFG.capitaineApparition });

    const dialogue = new Dialogue(this, { texteX: 318, texteY: 488, flecheX: 684, flecheY: 634 });
    await dialogue.jouer(TEXTE_CAPITAINE);
    aller(this, 'Plongee');
  }
}

// 4.4 — La plongée : le capitaine nage dans les ruines, sans texte (écran 8)
class Plongee extends Phaser.Scene {
  constructor() { super('Plongee'); }
  async create() {
    this.cameras.main.fadeIn(CFG.fondu, 0, 0, 0);
    this.add.image(0, 0, 'bg_ruines').setOrigin(0);
    const nageur = this.add.image(453 + 330, 2 + 40, 'swim').setOrigin(0).setAlpha(0);
    this.tweens.add({ targets: nageur, alpha: 1, duration: 600 });
    await anim(this, { targets: nageur, x: 453, y: 2, duration: CFG.plongeeArrivee, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: nageur, y: 2 + 10, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // il flotte
    await attendre(this, CFG.plongeePause);
    aller(this, 'Combat');
  }
}

// 4.5 — Le combat : le Kraken apparaît, puis le menu, puis les tours (écrans 9 à 17)
class Combat extends Phaser.Scene {
  constructor() { super('Combat'); }

  create() {
    this.cameras.main.fadeIn(CFG.fondu, 0, 0, 0);
    this.occupe = true; this.tour = 0;

    // Éléments dessinés par le code : l'anneau d'impact et l'étincelle des jauges
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.lineStyle(7, 0xdff3ff, 1); g.strokeCircle(64, 64, 56); g.generateTexture('ring', 128, 128); g.destroy();
    const tex = this.textures.createCanvas('spark', 96, 96); const ctx = tex.getContext();
    const halo = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
    halo.addColorStop(0, 'rgba(255,255,255,1)'); halo.addColorStop(0.18, 'rgba(255,225,120,0.95)');
    halo.addColorStop(0.5, 'rgba(255,110,20,0.45)'); halo.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, 96, 96); tex.refresh();

    // Décor et personnages (du fond vers l'avant)
    this.add.image(0, 0, 'bg').setOrigin(0);
    this.krakenSprite = this.add.image(CFG.kraken.x + CFG.krakenEntreeDist, CFG.kraken.y, 'kraken').setOrigin(0).setAlpha(0);
    this.captain = this.add.image(CFG.captain.x, CFG.captain.y, 'captain').setOrigin(0);
    this.tweens.add({ targets: this.captain, y: CFG.captain.y - 4, duration: 1400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

    // Jauges : le fond vide (avec cadre), la jauge verte (rognée pour baisser), la jauge rouge par-dessus
    this.add.image(CFG.playerBar.x, CFG.playerBar.y, 'bar_player_empty').setOrigin(0);
    this.playerBar = this.add.image(CFG.playerBar.x, CFG.playerBar.y, 'bar_player').setOrigin(0);
    this.playerRed = this.add.image(CFG.playerBar.x, CFG.playerBar.y, 'bar_player_red').setOrigin(0).setAlpha(0);
    this.add.image(CFG.enemyBar.x, CFG.enemyBar.y, 'bar_enemy_empty').setOrigin(0);
    this.enemyBar = this.add.image(CFG.enemyBar.x, CFG.enemyBar.y, 'bar_enemy').setOrigin(0);
    this.enemyRed = this.add.image(CFG.enemyBar.x, CFG.enemyBar.y, 'bar_enemy_red_clean').setOrigin(0).setAlpha(0);
    this.spark = this.add.image(0, 0, 'spark').setVisible(false).setBlendMode(Phaser.BlendModes.ADD).setDepth(20);
    this.wave = this.add.image(0, 0, 'wave1').setVisible(false).setDepth(15);
    this.ball = this.add.image(0, 0, 'ball').setVisible(false).setDepth(15);
    this.ring = this.add.image(0, 0, 'ring').setVisible(false).setBlendMode(Phaser.BlendModes.ADD).setDepth(16);
    this.hp = { enemy: 1, player: 1 };
    this.setBar(this.playerBar, 'gauche', 1); this.setBar(this.enemyBar, 'droite', 1);

    this.creerMenu();
    this.boite = this.add.image(CFG.boiteVictoire.x, CFG.boiteVictoire.y, 'dialogue_victoire')
      .setOrigin(0).setVisible(false).setAlpha(0).setDepth(25);
    this.deroule();
  }

  // ---- Jauges ----
  setBar(image, cote, ratio) {
    const r = Math.max(0, Math.min(1, ratio));
    if (r >= 1) { image.setCrop(); return; }
    const f = cote === 'gauche' ? CFG.playerFill : CFG.enemyFill;
    const part = (f.fin - f.debut) * r;
    if (cote === 'gauche') image.setCrop(0, 0, f.debut + part, image.height);
    else image.setCrop(f.fin - part, 0, image.width - (f.fin - part), image.height);
  }
  bordJaugeKraken(r) { const f = CFG.enemyFill; return CFG.enemyBar.x + f.fin - (f.fin - f.debut) * Math.max(0, Math.min(1, r)); }
  bordJaugeJoueur(r) { const f = CFG.playerFill; return CFG.playerBar.x + f.debut + (f.fin - f.debut) * Math.max(0, Math.min(1, r)); }

  // ---- Menu : 4 boutons, curseur doré au survol. Seul « Attaquer » fonctionne pour l'instant ----
  creerMenu() {
    const M = CFG.menu;
    this.menu = this.add.container(0, 0).setAlpha(0).setVisible(false).setDepth(12);
    this.curseurMenu = this.add.image(0, 0, 'cursor').setOrigin(0).setVisible(false);
    [['magie', 'btn_magie'], ['objets', 'btn_objets'], ['attaquer', 'btn_attaquer'], ['fuir', 'btn_fuir']].forEach(([nom, img]) => {
      const p = M[nom];
      const b = this.add.image(p.x, p.y, img).setOrigin(0).setInteractive({ useHandCursor: true });
      b.on('pointerover', () => {
        if (this.occupe) return;
        b.setTint(0xe8f4ff); this.curseurMenu.setPosition(p.x + M.curseurDx, p.y + M.curseurDy).setVisible(true);
      });
      b.on('pointerout', () => { b.clearTint(); this.curseurMenu.setVisible(false); });
      b.on('pointerdown', () => this.choisir(nom, b));
      this.menu.add(b);
    });
    this.menu.add(this.curseurMenu);
  }

  async montrerMenu() {
    this.menu.setVisible(true); this.curseurMenu.setVisible(false);
    await anim(this, { targets: this.menu, alpha: 1, duration: CFG.menu.apparition });
    this.occupe = false;
  }
  async cacherMenu() {
    await anim(this, { targets: this.menu, alpha: 0, duration: CFG.menu.apparition });
    this.menu.setVisible(false);
  }

  choisir(nom, bouton) {
    if (this.occupe) return;
    if (nom !== 'attaquer') {                                   // pas encore disponible : le bouton frémit
      this.tweens.add({ targets: bouton, x: bouton.x + 5, duration: 45, yoyo: true, repeat: 2 });
      return;
    }
    this.occupe = true;
    this.resolverMenu && this.resolverMenu();
  }
  attendreAttaque() { return new Promise((ok) => { this.resolverMenu = () => { this.resolverMenu = null; ok(); }; }); }

  // ---- Le déroulé du combat ----
  async deroule() {
    // Écran 9 : le Kraken apparaît, le capitaine parle
    this.tweens.add({ targets: this.krakenSprite, alpha: 1, x: CFG.kraken.x, duration: CFG.krakenEntree, ease: 'Cubic.easeOut' });
    await attendre(this, CFG.krakenEntree * 0.6);
    this.cameras.main.shake(CFG.shake, CFG.shakePower * 0.7);
    await attendre(this, CFG.krakenEntree * 0.4 + 200);
    const boiteDialogue = this.add.image(228, 417, 'box').setOrigin(0).setAlpha(0).setDepth(10);
    await anim(this, { targets: boiteDialogue, alpha: 1, duration: 300 });
    const dialogue = new Dialogue(this, { texteX: 347, texteY: 506, flecheX: 713, flecheY: 634 });
    await dialogue.jouer(TEXTE_KRAKEN);
    await anim(this, { targets: boiteDialogue, alpha: 0, duration: 200 });
    boiteDialogue.destroy();

    // Écrans 10 à 14 : menu → attaque → riposte (tour 1)
    await this.montrerMenu();
    await this.attendreAttaque();
    await this.attaqueJoueur(CFG.hpAfter, false);
    await this.cacherMenu();
    await attendre(this, CFG.riposteDelay);
    await this.riposte();

    // Écrans 15 et 16 : menu → coup final (tour 2)
    await attendre(this, CFG.pauseFin);
    await this.montrerMenu();
    await this.attendreAttaque();
    await this.attaqueJoueur(0, true);
    await this.cacherMenu();

    // Écran 17 : victoire
    await this.victoire();
    await new Promise((ok) => { const f = () => { this.input.off('pointerdown', f); ok(); }; this.input.once('pointerdown', f); });
    aller(this, 'Titre');                                       // fin de la version 1 : retour au titre
  }

  // L'attaque du capitaine (ton scénario validé) — « final » = le coup qui achève le Kraken
  async attaqueJoueur(cibleVie, final) {
    await anim(this, { targets: this.captain, x: CFG.captain.x + CFG.lungeDist, duration: CFG.lunge, ease: 'Cubic.easeOut' });
    this.wave.setTexture('wave1').setPosition(CFG.waveStart.x, CFG.waveStart.y).setScale(0.5).setAlpha(0).setVisible(true);
    this.tweens.add({ targets: this.wave, alpha: 1, duration: CFG.waveFadeIn });
    this.tweens.add({ targets: this.captain, x: CFG.captain.x, duration: CFG.captainReturn, ease: 'Sine.easeInOut' });
    await anim(this, { targets: this.wave, x: CFG.waveEnd.x, y: CFG.waveEnd.y, scale: 1.1, duration: CFG.waveTravel, ease: 'Sine.easeIn' });

    this.wave.setTexture('wave2').setScale(1);
    this.krakenSprite.setTexture('kraken_hit').setPosition(CFG.krakenHit.x, CFG.krakenHit.y).setAlpha(1);
    this.krakenSprite.setTintFill(0xffffff);
    this.ring.setPosition(CFG.waveEnd.x, CFG.waveEnd.y).setScale(0.3).setAlpha(1).setVisible(true);
    this.tweens.add({ targets: this.ring, scale: 2.2, alpha: 0, duration: 380, ease: 'Cubic.easeOut' });
    await attendre(this, CFG.hitStop);
    this.krakenSprite.clearTint();
    this.cameras.main.shake(CFG.shake, CFG.shakePower);
    this.tweens.add({ targets: this.krakenSprite, x: CFG.krakenHit.x + CFG.recoil, duration: CFG.recoilTime, yoyo: true, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: this.wave, alpha: 0, duration: CFG.waveFadeOut });

    const depart = this.hp.enemy;                               // jauge rouge à son niveau actuel + étincelle au bord
    this.setBar(this.enemyRed, 'droite', depart);
    this.spark.setVisible(true).setAlpha(1).setPosition(this.bordJaugeKraken(depart), CFG.enemyBar.y + 24);
    await anim(this, { targets: this.enemyRed, alpha: 1, duration: CFG.redIn });
    await anim(this, { targets: this.hp, enemy: cibleVie, duration: CFG.hpDrop, ease: 'Cubic.easeOut', onUpdate: () => {
      this.setBar(this.enemyBar, 'droite', this.hp.enemy); this.setBar(this.enemyRed, 'droite', this.hp.enemy);
      this.spark.x = this.bordJaugeKraken(this.hp.enemy); this.spark.setScale(Phaser.Math.FloatBetween(0.9, 1.5));
    } });

    if (!final) this.krakenSprite.setTexture('kraken').setPosition(CFG.kraken.x, CFG.kraken.y);   // le Kraken reprend son état initial
    this.tweens.add({ targets: this.spark, alpha: 0, duration: CFG.redToGreen });
    await anim(this, { targets: this.enemyRed, alpha: 0, duration: CFG.redToGreen });
  }

  // La riposte du Kraken : une boule sombre frappe le capitaine
  async riposte() {
    this.tweens.add({ targets: this.krakenSprite, x: CFG.kraken.x + 14, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
    this.ball.setPosition(CFG.ballStart.x, CFG.ballStart.y).setScale(0.55).setAlpha(0).setVisible(true);
    this.tweens.add({ targets: this.ball, alpha: 1, duration: CFG.ballFadeIn });
    const moitie = CFG.ballTravel * 0.55;
    await anim(this, { targets: this.ball, x: CFG.ballMid.x, y: CFG.ballMid.y, scale: 1, duration: moitie, ease: 'Sine.easeIn' });
    await anim(this, { targets: this.ball, x: CFG.ballEnd.x, y: CFG.ballEnd.y, duration: CFG.ballTravel - moitie, ease: 'Sine.easeIn' });

    this.captain.setTexture('captain_hurt').setPosition(CFG.captainHurt.x, CFG.captainHurt.y).setTintFill(0xffffff);
    this.ring.setPosition(CFG.ballEnd.x, CFG.ballEnd.y).setScale(0.3).setAlpha(1).setVisible(true);
    this.tweens.add({ targets: this.ring, scale: 2.2, alpha: 0, duration: 380, ease: 'Cubic.easeOut' });
    await attendre(this, CFG.hitStop);
    this.captain.clearTint();
    this.cameras.main.shake(CFG.shake, CFG.shakePower);
    this.tweens.add({ targets: this.captain, x: CFG.captainHurt.x - CFG.hurtRecoil, duration: CFG.recoilTime, yoyo: true, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: this.ball, alpha: 0, duration: CFG.waveFadeOut });

    const depart = this.hp.player;
    this.setBar(this.playerRed, 'gauche', depart);
    this.spark.setVisible(true).setAlpha(1).setPosition(this.bordJaugeJoueur(depart), CFG.playerBar.y + 24);
    await anim(this, { targets: this.playerRed, alpha: 1, duration: CFG.redIn });
    await anim(this, { targets: this.hp, player: CFG.playerHpAfter, duration: CFG.hpDrop, ease: 'Cubic.easeOut', onUpdate: () => {
      this.setBar(this.playerBar, 'gauche', this.hp.player); this.setBar(this.playerRed, 'gauche', this.hp.player);
      this.spark.x = this.bordJaugeJoueur(this.hp.player); this.spark.setScale(Phaser.Math.FloatBetween(0.9, 1.5));
    } });

    this.captain.setTexture('captain').setPosition(CFG.captain.x, CFG.captain.y);
    this.tweens.add({ targets: this.spark, alpha: 0, duration: CFG.redToGreen });
    await anim(this, { targets: this.playerRed, alpha: 0, duration: CFG.redToGreen });
  }

  // Victoire : le Kraken vaincu tombe, la boîte « Félicitations » apparaît
  async victoire() {
    this.krakenSprite.setTexture('kraken_ko').setPosition(CFG.kraken_ko.x, CFG.kraken_ko.y - CFG.koDrop);
    await anim(this, { targets: this.krakenSprite, y: CFG.kraken_ko.y, duration: CFG.koTime, ease: 'Bounce.easeOut' });
    await attendre(this, 250);
    this.boite.setVisible(true);
    await anim(this, { targets: this.boite, alpha: 1, duration: 400 });
  }
}

/* ------------------------- Démarrage du jeu (Phaser) ----------------------- */
window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 1085, height: 723,                 // la taille de tes écrans Figma
  parent: 'game',
  backgroundColor: '#0a1118',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  // ATTENTION : ce jeu ne s'ouvre PAS en double-cliquant sur index.html (le navigateur bloque les images).
  // Il faut un mini-serveur local, ou la page publiée sur GitHub Pages.
  scene: [Chargement, Titre, Intro, Capitaine, Plongee, Combat],
});
