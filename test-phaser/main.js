'use strict';
/* ============================================================================
   EcoQuest — TEST D'ANIMATION : l'attaque du capitaine sur le Kraken
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
  redToGreen: 0,     // puis elle repasse au vert en …
  waveFadeOut: 260,
  captainReturn: 320,  // le capitaine revient à sa place
  endHold: 700,        // pause avant de pouvoir rejouer
};

/* -------------------------------- 2. LA SCÈNE ------------------------------ */
class Combat extends Phaser.Scene {
  constructor() { super('Combat'); this.busy = false; }

  // Étape A : charger les images
  preload() {
    ['bg', 'captain', 'kraken', 'kraken_hit', 'wave1', 'wave2',
     'bar_player', 'bar_enemy', 'bar_enemy_red_clean']
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
    this.add.image(CFG.playerBar.x, CFG.playerBar.y, 'bar_player').setOrigin(0).setTint(0x2a0c0c);
    this.playerBar = this.add.image(CFG.playerBar.x, CFG.playerBar.y, 'bar_player').setOrigin(0);
    this.add.image(CFG.enemyBar.x, CFG.enemyBar.y, 'bar_enemy').setOrigin(0).setTint(0x2a0c0c);
    this.enemyBar = this.add.image(CFG.enemyBar.x, CFG.enemyBar.y, 'bar_enemy').setOrigin(0);
    this.enemyRed = this.add.image(CFG.enemyBar.x, CFG.enemyBar.y, 'bar_enemy_red_clean').setOrigin(0).setAlpha(0);
    this.spark = this.add.image(0, 0, 'spark').setVisible(false).setBlendMode(Phaser.BlendModes.ADD);

    this.wave = this.add.image(0, 0, 'wave1').setVisible(false);   // origine au centre
    this.ring = this.add.image(0, 0, 'ring').setVisible(false).setBlendMode(Phaser.BlendModes.ADD);

    // Le capitaine « respire » en permanence (petit va-et-vient vertical)
    this.tweens.add({ targets: this.captain, y: CFG.captain.y - 4, duration: 1400,
                      ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

    this.hp = { enemy: 1 };
    this.setBar(this.playerBar, 'gauche', 1);
    this.setBar(this.enemyBar, 'droite', 1);

    // Déclencheurs : clic / toucher, ou barre Espace
    this.input.on('pointerdown', () => this.jouer());
    this.input.keyboard.on('keydown-SPACE', () => this.jouer());
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

  // Remet tout en place avant de rejouer
  remettreAZero() {
    this.krakenSprite.setTexture('kraken').setPosition(CFG.kraken.x, CFG.kraken.y).clearTint();
    this.captain.x = CFG.captain.x;
    this.hp.enemy = 1; this.setBar(this.enemyBar, 'droite', 1);
    this.enemyRed.setAlpha(0); this.setBar(this.enemyRed, 'droite', 1);
    this.spark.setVisible(false);
    this.wave.setVisible(false); this.ring.setVisible(false);
  }

  // Petits outils : « attendre » et « lancer une animation et attendre sa fin »
  attendre(ms) { return new Promise((ok) => this.time.delayedCall(ms, ok)); }
  anim(config) { return new Promise((ok) => this.tweens.add({ ...config, onComplete: ok })); }

  // Étape C : LE SCÉNARIO de l'attaque, ligne par ligne
  async jouer() {
    if (this.busy) return;
    this.busy = true;
    this.remettreAZero();

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
    // Temps 2 : la jauge passe au rouge À 100 %, avec l'étincelle au bord (le Kraken vient d'être touché)
    this.spark.setVisible(true).setAlpha(1)
              .setPosition(this.bordJaugeKraken(1), CFG.enemyBar.y + 24);
    await this.anim({ targets: this.enemyRed, alpha: 1, duration: CFG.redIn });
    // Temps 3 : seulement ensuite, la jauge rouge baisse et l'étincelle la suit
    await this.anim({ targets: this.hp, enemy: CFG.hpAfter, duration: CFG.hpDrop, ease: 'Cubic.easeOut',
                      onUpdate: () => {
                        this.setBar(this.enemyBar, 'droite', this.hp.enemy);
                        this.setBar(this.enemyRed, 'droite', this.hp.enemy);
                        this.spark.x = this.bordJaugeKraken(this.hp.enemy);
                        this.spark.setScale(Phaser.Math.FloatBetween(0.9, 1.5));   // scintillement
                      } });

    // 4. La jauge s'est arrêtée : l'étincelle s'éteint, courte pause, puis la jauge repasse au vert
    this.tweens.add({ targets: this.spark, alpha: 0, duration: CFG.redHold });
    await this.attendre(CFG.redHold);
    await this.anim({ targets: this.enemyRed, alpha: 0, duration: CFG.redToGreen });

    // 5. Pause avant de pouvoir rejouer
    await this.attendre(CFG.endHold);
    this.busy = false;
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
