'use strict';
/* ============================================================================
   EcoQuest — TEST D'ANIMATION : le combat complet contre le Kraken
   Objectif : voir si une bibliothèque de jeu (Phaser) donne le rythme voulu.

   Ce fichier a 2 parties :
     1. RÉGLAGES : tous les nombres (durées, distances). C'est ici que tu joues
        avec le rythme, comme avec les courbes d'une animation Figma.
     2. LA SCÈNE : ce qui se passe, dans l'ordre (le « scénario » du combat).
   Toutes les durées sont en millisecondes (1000 = 1 seconde).
   ============================================================================ */

/* ------------------------------- 1. RÉGLAGES ------------------------------- */
const CFG = {
  // Positions des éléments (mesurées sur tes écrans Figma, repère 1085 × 723)
  captain: { x: 74,  y: 229 },
  kraken:  { x: 504, y: 0   },       // Kraken « normal »
  krakenHit: { x: 454, y: 0 },       // Kraken « touché » (autre image)
  playerBar: { x: 10,  y: 10 },
  enemyBar:  { x: 835, y: 10 },
  captainHurt: { x: 31, y: 229 },    // capitaine « touché » (autre image, plus large)
  ballStart: { x: 690, y: 385 },     // la boule sombre part de la bouche du Kraken
  ballMid:   { x: 571, y: 398 },     // …passe ici (repéré sur ton écran « Riposte »)
  ballEnd:   { x: 384, y: 438 },     // …et frappe le capitaine ici
  waveStart: { x: 400, y: 411 },     // centre de la vague au départ (près du trident)
  waveEnd:   { x: 673, y: 295 },     // centre de la vague à l'impact (sur le Kraken)

  // Où commence et où finit la partie COLORÉE de chaque jauge, dans son image (en px).
  // L'image contient aussi l'icône et les pointes : 100 % de vie = toute la partie colorée,
  // pas toute l'image. (Mesuré sur les images.)
  playerFill: { debut: 47, fin: 207 },
  enemyFill:  { debut: 31, fin: 192 },

  // Chronologie (ms)
  lunge: 160,          // le capitaine s'élance vers l'avant
  lungeDist: 38,       // … de combien (px)
  waveFadeIn: 120,     // la vague apparaît
  waveTravel: 350,     // la vague voyage jusqu'au Kraken
  hitStop: 70,         // micro-pause à l'impact (donne du poids au coup)
  shake: 180,          // durée de la secousse d'écran
  shakePower: 0.006,   // force de la secousse
  recoil: 16,          // le Kraken recule de … px
  recoilTime: 90,
  hpDrop: 1500,         // la jauge du Kraken descend en …
  hpAfter: 0.42,       // … jusqu'à 42 % de vie
  redIn: 90,           // la jauge passe au rouge en …
  redHold: 180,        // la jauge reste rouge encore … après avoir fini de baisser
  redToGreen: 90,      // puis elle repasse au vert en …
  waveFadeOut: 50,
  captainReturn: 320,  // le capitaine revient à sa place
  endHold: 700,        // pause avant de pouvoir rejouer

  // --- Riposte du Kraken (boule sombre) ---
  riposteDelay: 350,   // pause entre le coup du joueur et la riposte
  ballFadeIn: 140,     // la boule apparaît
  ballTravel: 520,     // la boule voyage jusqu'au capitaine
  playerHpAfter: 0.62, // jauge du capitaine après le coup du Kraken
  hurtRecoil: 18,      // le capitaine recule de … px quand il est touché
  // --- Victoire ---
  kraken_ko: { x: 461, y: 310 },     // Kraken vaincu (autre image, plus basse)
  boite: { x: 267, y: 471 },         // boîte de dialogue de victoire
  koDrop: 70,          // le Kraken vaincu tombe de … px avant de se poser
  koTime: 420,         // … en …
};

/* -------------------------------- 2. LA SCÈNE ------------------------------ */
class Combat extends Phaser.Scene {
  constructor() { super('Combat'); this.busy = false; }

  // Étape A : charger les images
  preload() {
    ['bg', 'captain', 'kraken', 'kraken_hit', 'wave1', 'wave2',
     'captain_hurt', 'ball', 'kraken_ko', 'dialogue_victoire',
     'bar_player', 'bar_player_empty', 'bar_player_red',
     'bar_enemy', 'bar_enemy_empty', 'bar_enemy_red_clean']
      .forEach((nom) => this.load.image(nom, `assets/${nom}.png`));
  }

  // Étape B : placer les éléments (du fond vers l'avant, comme des calques Figma)
  create() {
    // Un petit anneau lumineux dessiné par le code (pas besoin d'image)
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.lineStyle(7, 0xdff3ff, 1); g.strokeCircle(64, 64, 56);
    g.generateTexture('ring', 128, 128); g.destroy();

    // Une étincelle (halo lumineux) dessinée par le code : elle suivra le bord de la jauge
    const tex = this.textures.createCanvas('spark', 96, 96);
    const ctx = tex.getContext();
    const halo = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
    halo.addColorStop(0, 'rgba(255,255,255,1)');
    halo.addColorStop(0.18, 'rgba(255,225,120,0.95)');
    halo.addColorStop(0.5, 'rgba(255,110,20,0.45)');
    halo.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, 96, 96);
    tex.refresh();

    this.add.image(0, 0, 'bg').setOrigin(0);
    this.krakenSprite = this.add.image(CFG.kraken.x, CFG.kraken.y, 'kraken').setOrigin(0);
    this.captain = this.add.image(CFG.captain.x, CFG.captain.y, 'captain').setOrigin(0);

    // Jauges : une version sombre en dessous (le « vide »), la version colorée dessus
    // que l'on rogne (« crop ») pour la faire baisser.
    this.add.image(CFG.playerBar.x, CFG.playerBar.y, 'bar_player_empty').setOrigin(0);   // barre vide (cadre + fond)
    this.playerBar = this.add.image(CFG.playerBar.x, CFG.playerBar.y, 'bar_player').setOrigin(0);
    this.playerRed = this.add.image(CFG.playerBar.x, CFG.playerBar.y, 'bar_player_red').setOrigin(0).setAlpha(0);
    this.add.image(CFG.enemyBar.x, CFG.enemyBar.y, 'bar_enemy_empty').setOrigin(0);   // barre vide (cadre + fond), sans teinte
    this.enemyBar = this.add.image(CFG.enemyBar.x, CFG.enemyBar.y, 'bar_enemy').setOrigin(0);
    this.enemyRed = this.add.image(CFG.enemyBar.x, CFG.enemyBar.y, 'bar_enemy_red_clean').setOrigin(0).setAlpha(0);
    this.spark = this.add.image(0, 0, 'spark').setVisible(false).setBlendMode(Phaser.BlendModes.ADD);

    this.wave = this.add.image(0, 0, 'wave1').setVisible(false);   // origine au centre
    this.ball = this.add.image(0, 0, 'ball').setVisible(false);    // la boule sombre du Kraken
    this.ring = this.add.image(0, 0, 'ring').setVisible(false).setBlendMode(Phaser.BlendModes.ADD);

    // Le capitaine « respire » en permanence (petit va-et-vient vertical)
    this.tweens.add({ targets: this.captain, y: CFG.captain.y - 4, duration: 1400,
                      ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

    this.hp = { enemy: 1, player: 1 };
    this.tour = 0;           // 0 = avant le 1er coup, 1 = avant le coup final, 2 = victoire affichée
    this.creerBoiteVictoire();
    this.setBar(this.playerBar, 'gauche', 1);
    this.setBar(this.enemyBar, 'droite', 1);

    // Déclencheurs : clic / toucher, ou barre Espace (un clic = un tour de combat)
    this.input.on('pointerdown', () => this.avancer());
    this.input.keyboard.on('keydown-SPACE', () => this.avancer());
  }

  // Fait baisser une jauge : on n'affiche que la part « ratio » de la partie colorée.
  // 'gauche' = l'icône est à gauche (capitaine) ; 'droite' = l'icône est à droite (Kraken).
  // Le ratio s'applique à la partie colorée (voir CFG.playerFill / enemyFill), pas à toute l'image.
  setBar(image, cote, ratio) {
    const r = Math.max(0, Math.min(1, ratio));
    if (r >= 1) { image.setCrop(); return; }                       // 100 % : aucun rognage
    const f = cote === 'gauche' ? CFG.playerFill : CFG.enemyFill;
    const part = (f.fin - f.debut) * r;
    if (cote === 'gauche') image.setCrop(0, 0, f.debut + part, image.height);
    else image.setCrop(f.fin - part, 0, image.width - (f.fin - part), image.height);
  }

  // Position (en px à l'écran) du bord mobile de la jauge du Kraken : là où l'étincelle doit se placer
  bordJaugeKraken(ratio) {
    const f = CFG.enemyFill;
    return CFG.enemyBar.x + f.fin - (f.fin - f.debut) * Math.max(0, Math.min(1, ratio));
  }

  // Idem pour la jauge du capitaine (l'icône est à gauche, la jauge se vide vers la gauche)
  bordJaugeJoueur(ratio) {
    const f = CFG.playerFill;
    return CFG.playerBar.x + f.debut + (f.fin - f.debut) * Math.max(0, Math.min(1, ratio));
  }

  // La boîte de dialogue de victoire (ton image Figma, texte compris)
  creerBoiteVictoire() {
    this.boite = this.add.image(CFG.boite.x, CFG.boite.y, 'dialogue_victoire').setOrigin(0).setVisible(false).setAlpha(0);
  }

  // Remet tout en place avant de rejouer
  remettreAZero() {
    this.tweens.killTweensOf([this.boite, this.krakenSprite]);
    this.krakenSprite.setTexture('kraken').setPosition(CFG.kraken.x, CFG.kraken.y).clearTint().setAlpha(1);
    this.captain.setTexture('captain').setPosition(CFG.captain.x, CFG.captain.y).clearTint();
    this.hp.enemy = 1; this.hp.player = 1;
    this.setBar(this.enemyBar, 'droite', 1);
    this.setBar(this.playerBar, 'gauche', 1);
    this.enemyRed.setAlpha(0); this.setBar(this.enemyRed, 'droite', 1);
    this.playerRed.setAlpha(0); this.setBar(this.playerRed, 'gauche', 1);
    this.spark.setVisible(false);
    this.wave.setVisible(false); this.ring.setVisible(false); this.ball.setVisible(false);
    this.boite.setVisible(false).setAlpha(0);
    this.tour = 0;
  }

  // Petits outils : « attendre » et « lancer une animation et attendre sa fin »
  attendre(ms) { return new Promise((ok) => this.time.delayedCall(ms, ok)); }
  anim(config) { return new Promise((ok) => this.tweens.add({ ...config, onComplete: ok })); }

  // Un clic = un tour. Tour 0 : 1er coup + riposte. Tour 1 : coup final + victoire. Tour 2 : on recommence.
  async avancer() {
    if (this.busy) return;
    this.busy = true;
    if (this.tour === 2) { this.remettreAZero(); this.busy = false; return; }   // un clic de plus = rejouer
    if (this.tour === 0) {
      await this.attaqueJoueur(CFG.hpAfter, false);
      await this.attendre(CFG.riposteDelay);
      await this.riposte();
      this.tour = 1;
    } else {
      await this.attaqueJoueur(0, true);
      await this.victoire();
      this.tour = 2;
    }
    await this.attendre(CFG.endHold);
    this.busy = false;
  }

  // ÉTAPE 1 — L'attaque du capitaine (ton scénario validé). « final » = c'est le coup qui achève le Kraken.
  async attaqueJoueur(cibleVie, final) {
    // 1. Le capitaine s'élance
    await this.anim({ targets: this.captain, x: CFG.captain.x + CFG.lungeDist,
                      duration: CFG.lunge, ease: 'Cubic.easeOut' });

    // 2. La vague apparaît près du trident et traverse l'écran
    this.wave.setTexture('wave1').setPosition(CFG.waveStart.x, CFG.waveStart.y)
             .setScale(0.5).setAlpha(0).setVisible(true);
    this.tweens.add({ targets: this.wave, alpha: 1, duration: CFG.waveFadeIn });
    this.tweens.add({ targets: this.captain, x: CFG.captain.x,          // le capitaine revient
                      duration: CFG.captainReturn, ease: 'Sine.easeInOut' });
    await this.anim({ targets: this.wave, x: CFG.waveEnd.x, y: CFG.waveEnd.y,
                      scale: 1.1, duration: CFG.waveTravel, ease: 'Sine.easeIn' });

    // 3. IMPACT : tout se passe en même temps
    this.wave.setTexture('wave2').setScale(1);
    this.krakenSprite.setTexture('kraken_hit').setPosition(CFG.krakenHit.x, CFG.krakenHit.y);
    this.krakenSprite.setTintFill(0xffffff);                       // flash blanc
    this.ring.setPosition(CFG.waveEnd.x, CFG.waveEnd.y).setScale(0.3).setAlpha(1).setVisible(true);
    this.tweens.add({ targets: this.ring, scale: 2.2, alpha: 0, duration: 380, ease: 'Cubic.easeOut' });
    await this.attendre(CFG.hitStop);                              // micro-pause : le coup « pèse »
    this.krakenSprite.clearTint();
    this.cameras.main.shake(CFG.shake, CFG.shakePower);            // secousse d'écran
    this.tweens.add({ targets: this.krakenSprite, x: CFG.krakenHit.x + CFG.recoil,
                      duration: CFG.recoilTime, yoyo: true, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: this.wave, alpha: 0, duration: CFG.waveFadeOut });
    // Temps 2 : la jauge passe au rouge À 100 % (ou à son niveau actuel), avec l'étincelle au bord
    const depart = this.hp.enemy;
    this.setBar(this.enemyRed, 'droite', depart);
    this.spark.setVisible(true).setAlpha(1)
              .setPosition(this.bordJaugeKraken(depart), CFG.enemyBar.y + 24);
    await this.anim({ targets: this.enemyRed, alpha: 1, duration: CFG.redIn });
    // Temps 3 : seulement ensuite, la jauge rouge baisse et l'étincelle la suit
    await this.anim({ targets: this.hp, enemy: cibleVie, duration: CFG.hpDrop, ease: 'Cubic.easeOut',
                      onUpdate: () => {
                        this.setBar(this.enemyBar, 'droite', this.hp.enemy);
                        this.setBar(this.enemyRed, 'droite', this.hp.enemy);
                        this.spark.x = this.bordJaugeKraken(this.hp.enemy);
                        this.spark.setScale(Phaser.Math.FloatBetween(0.9, 1.5));   // scintillement
                      } });

    // 4. La jauge s'est arrêtée : l'étincelle s'éteint ET la jauge repasse au vert EN MÊME TEMPS
    if (!final) this.krakenSprite.setTexture('kraken').setPosition(CFG.kraken.x, CFG.kraken.y);   // le Kraken reprend son état initial
    this.tweens.add({ targets: this.spark, alpha: 0, duration: CFG.redToGreen });
    await this.anim({ targets: this.enemyRed, alpha: 0, duration: CFG.redToGreen });
  }

  // ÉTAPE 2 — La riposte du Kraken : une boule sombre frappe le capitaine (même logique que pour le Kraken)
  async riposte() {
    // 1. Le Kraken se ramasse un instant, la boule apparaît devant lui
    this.tweens.add({ targets: this.krakenSprite, x: CFG.kraken.x + 14, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
    this.ball.setPosition(CFG.ballStart.x, CFG.ballStart.y).setScale(0.55).setAlpha(0).setVisible(true);
    this.tweens.add({ targets: this.ball, alpha: 1, duration: CFG.ballFadeIn });
    // 2. Elle traverse l'écran en passant par le point repéré sur ton écran « Riposte »
    const moitie = CFG.ballTravel * 0.55;
    await this.anim({ targets: this.ball, x: CFG.ballMid.x, y: CFG.ballMid.y, scale: 1, duration: moitie, ease: 'Sine.easeIn' });
    await this.anim({ targets: this.ball, x: CFG.ballEnd.x, y: CFG.ballEnd.y, duration: CFG.ballTravel - moitie, ease: 'Sine.easeIn' });

    // 3. IMPACT sur le capitaine : image « touché », flash, secousse, recul
    this.captain.setTexture('captain_hurt').setPosition(CFG.captainHurt.x, CFG.captainHurt.y);
    this.captain.setTintFill(0xffffff);
    this.ring.setPosition(CFG.ballEnd.x, CFG.ballEnd.y).setScale(0.3).setAlpha(1).setVisible(true);
    this.tweens.add({ targets: this.ring, scale: 2.2, alpha: 0, duration: 380, ease: 'Cubic.easeOut' });
    await this.attendre(CFG.hitStop);
    this.captain.clearTint();
    this.cameras.main.shake(CFG.shake, CFG.shakePower);
    this.tweens.add({ targets: this.captain, x: CFG.captainHurt.x - CFG.hurtRecoil,
                      duration: CFG.recoilTime, yoyo: true, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: this.ball, alpha: 0, duration: CFG.waveFadeOut });

    // Temps 2 : la jauge du capitaine passe au rouge à son niveau actuel, avec l'étincelle au bord
    const depart = this.hp.player;
    this.setBar(this.playerRed, 'gauche', depart);
    this.spark.setVisible(true).setAlpha(1)
              .setPosition(this.bordJaugeJoueur(depart), CFG.playerBar.y + 24);
    await this.anim({ targets: this.playerRed, alpha: 1, duration: CFG.redIn });
    // Temps 3 : la jauge rouge baisse, l'étincelle la suit
    await this.anim({ targets: this.hp, player: CFG.playerHpAfter, duration: CFG.hpDrop, ease: 'Cubic.easeOut',
                      onUpdate: () => {
                        this.setBar(this.playerBar, 'gauche', this.hp.player);
                        this.setBar(this.playerRed, 'gauche', this.hp.player);
                        this.spark.x = this.bordJaugeJoueur(this.hp.player);
                        this.spark.setScale(Phaser.Math.FloatBetween(0.9, 1.5));
                      } });

    // 4. Étincelle qui s'éteint + retour au vert + le capitaine reprend son état initial, en même temps
    this.captain.setTexture('captain').setPosition(CFG.captain.x, CFG.captain.y);
    this.tweens.add({ targets: this.spark, alpha: 0, duration: CFG.redToGreen });
    await this.anim({ targets: this.playerRed, alpha: 0, duration: CFG.redToGreen });
  }

  // ÉTAPE 3 — Victoire : le Kraken vaincu s'affaisse (image Figma), puis la boîte de dialogue apparaît
  async victoire() {
    this.krakenSprite.setTexture('kraken_ko').setPosition(CFG.kraken_ko.x, CFG.kraken_ko.y - CFG.koDrop);
    await this.anim({ targets: this.krakenSprite, y: CFG.kraken_ko.y, duration: CFG.koTime, ease: 'Bounce.easeOut' });
    await this.attendre(250);
    this.boite.setVisible(true);
    await this.anim({ targets: this.boite, alpha: 1, duration: 400 });
  }
}

/* ------------------------- Démarrage du jeu (Phaser) ----------------------- */
window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 1085, height: 723,                 // la taille de tes écrans Figma
  parent: 'game',
  backgroundColor: '#0a1118',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  // ATTENTION : ce jeu ne s'ouvre PAS en double-cliquant sur index.html.
  // Le navigateur bloque les images (« cross-origin ») quand la page vient d'un simple fichier.
  // Il faut un mini-serveur local, ou la page publiée sur GitHub Pages.
  scene: [Combat],
});
