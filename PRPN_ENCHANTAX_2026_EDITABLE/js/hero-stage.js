/**
 * ==============================================================================
 * HERO STAGE CONTROLLER — PRPN x ENCHANTAX 2026 (INFINITAX)
 * TAHAP 1: State Machine 5 Adegan Hero & Maskot Storytelling
 * ==============================================================================
 */

(function () {
  'use strict';

  // State
  let currentScene = 1;
  const totalScenes = 5;
  let storyStep = 0; // 0 to 4 (5 dialogs)
  let posterPhase = 0; // 0: two posters, 1: slide 1, 2: slide 2, 3: slide 3
  const totalSlides = 3;

  // Maskot dialogues (5 official story prompts)
  const storyDialogues = [
    {
      speaker: 'Maskot Putra',
      name: '[TULIS DI SINI]',
      text: 'Hai, aku [TULIS DI SINI]!',
      activeMascot: 'boy'
    },
    {
      speaker: 'Maskot Putri',
      name: '[TULIS DI SINI]',
      text: 'Kamu tau nggak, Infinitax itu apa?',
      activeMascot: 'girl'
    },
    {
      speaker: 'Maskot Putra',
      name: '[TULIS DI SINI]',
      text: 'Infinitax itu gabungan 2 lomba besar, lohh!',
      activeMascot: 'boy'
    },
    {
      speaker: 'Maskot Putri',
      name: '[TULIS DI SINI]',
      text: 'Inget kan PRPN sama Enchantax?',
      activeMascot: 'girl'
    },
    {
      speaker: 'Maskot Putra',
      name: '[TULIS DI SINI]',
      text: 'Yaudah, aku bantu ingetin deh.',
      activeMascot: 'boy'
    }
  ];

  // DOM Elements
  const hero = document.getElementById('hero');
  const scenes = document.querySelectorAll('.stage-scene');
  const dots = document.querySelectorAll('.hero-progress-dots .stage-dot');
  const skipBtn = document.getElementById('hero-skip');
  const legacySkip = document.getElementById('ldk');
  const enterBtn = document.getElementById('btn-enter-kingdom');
  const lgBtn = document.getElementById('lg');

  if (!hero) return;

  // Update dots indicator
  function updateDots(idx) {
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === idx - 1);
    });
  }

  // Preload next scene assets
  function preloadScene(sceneIdx) {
    const assetsByScene = {
      2: [],
      3: ['assets/images/asset-01.png', 'assets/images/asset-04.png'],
      4: ['assets/cinematic/01_cinematic_winner_portal.png', 'assets/cinematic/02_ornamental_pagoda_frame_hd.webp', 'assets/images/asset-17.webp'],
      5: []
    };
    const toPreload = assetsByScene[sceneIdx] || [];
    toPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  // Scene Switcher
  function goToScene(target) {
    if (target < 1 || target > totalScenes) return;
    currentScene = target;

    scenes.forEach(s => {
      const sNum = parseInt(s.dataset.scene, 10);
      s.classList.toggle('active', sNum === currentScene);
    });

    updateDots(currentScene);
    preloadScene(currentScene + 1);

    // Initializations per scene
    if (currentScene === 3) {
      storyStep = 0;
      renderStoryStep(storyStep);
    } else if (currentScene === 4) {
      posterPhase = 0;
      renderPosterPhase(posterPhase);
    }
  }

  // Story step renderer
  function renderStoryStep(stepIdx) {
    const data = storyDialogues[stepIdx];
    if (!data) return;

    const numEl = document.getElementById('storyBubbleNum');
    const textEl = document.getElementById('storyBubbleText');
    const speakerEl = document.getElementById('storySpeakerName');
    const boyMascot = document.getElementById('storyBoyMascot');
    const girlMascot = document.getElementById('storyGirlMascot');

    if (numEl) numEl.textContent = `Bagian ${stepIdx + 1} dari 5`;
    if (textEl) textEl.textContent = `"${data.text}"`;
    if (speakerEl) speakerEl.textContent = `— ${data.speaker}`;

    if (boyMascot) boyMascot.classList.toggle('active', data.activeMascot === 'boy');
    if (girlMascot) girlMascot.classList.toggle('active', data.activeMascot === 'girl');
  }

  // Poster & Static Panels renderer
  function renderPosterPhase(phase) {
    const postersBox = document.getElementById('postersTwo');
    const slidesBox = document.getElementById('slidesContainer');
    const panelImg = document.getElementById('panelSlideImg');
    const panelTitle = document.getElementById('panelSlideTitle');
    const panelDesc = document.getElementById('panelSlideDesc');

    const slideData = [
      {
        src: 'assets/cinematic/01_cinematic_winner_portal.png',
        title: 'Portal Keagungan & Prestasi',
        desc: 'Menempa insan perpajakan unggul dan transformatif di kancah nasional.'
      },
      {
        src: 'assets/cinematic/02_ornamental_pagoda_frame_hd.webp',
        title: 'Mahakarya Inovasi Fiskal',
        desc: 'Kolaborasi riset, ide kecerdasan buatan, dan gagasan progresif perpajakan.'
      },
      {
        src: 'assets/images/asset-17.webp',
        title: 'Medali Kehormatan Infinitax',
        desc: 'Raihlah puncak mahkota sayembara dan ukir namamu dalam sejarah.'
      }
    ];

    if (phase === 0) {
      if (postersBox) postersBox.style.display = 'flex';
      if (slidesBox) slidesBox.classList.remove('active');
    } else {
      if (postersBox) postersBox.style.display = 'none';
      if (slidesBox) slidesBox.classList.add('active');
      const curSlide = slideData[phase - 1];
      if (curSlide) {
        if (panelImg) panelImg.src = curSlide.src;
        if (panelTitle) panelTitle.textContent = curSlide.title;
        if (panelDesc) panelDesc.textContent = curSlide.desc;
      }
    }
  }

  // Advance on tap
  function handleNextAction() {
    if (currentScene === 1) {
      goToScene(2);
    } else if (currentScene === 2) {
      goToScene(3);
    } else if (currentScene === 3) {
      if (storyStep < storyDialogues.length - 1) {
        storyStep++;
        renderStoryStep(storyStep);
      } else {
        goToScene(4);
      }
    } else if (currentScene === 4) {
      if (posterPhase < totalSlides) {
        posterPhase++;
        renderPosterPhase(posterPhase);
      } else {
        goToScene(5);
      }
    }
  }

  // Enter portal logic (Existing handler)
  function enterPortal() {
    if (typeof window.openSite === 'function') {
      window.openSite();
    } else if (lgBtn && typeof lgBtn.onclick === 'function') {
      lgBtn.onclick();
    } else {
      // Fallback
      document.body.classList.add('app-on', 'in-app');
      hero.style.display = 'none';
      const dock = document.getElementById('dock');
      if (dock) dock.classList.add('show', 'ready');
      const portalPg = document.getElementById('pg-portal');
      if (portalPg) portalPg.classList.add('active');
    }
  }

  // Click & tap listeners
  hero.addEventListener('click', function (e) {
    // If clicked on skip or enter button, don't trigger general advance
    if (e.target.closest('#hero-skip') || e.target.closest('#ldk') || e.target.closest('#btn-enter-kingdom')) {
      return;
    }
    handleNextAction();
  });

  if (skipBtn) {
    skipBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      enterPortal();
    });
  }

  if (legacySkip) {
    legacySkip.addEventListener('click', function (e) {
      e.stopPropagation();
      enterPortal();
    });
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      enterPortal();
    });
  }

  if (lgBtn) {
    lgBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      handleNextAction();
    });
  }

  // Keyboard accessibility
  window.addEventListener('keydown', function (e) {
    if (hero.style.display === 'none' || document.body.classList.contains('in-app')) {
      return;
    }
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleNextAction();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      enterPortal();
    }
  });

  // Parallax handling for Scene 2 (max 4 layers, transform only)
  hero.addEventListener('pointermove', function (e) {
    if (currentScene !== 2) return;
    const px = (e.clientX / window.innerWidth) - 0.5;
    const py = (e.clientY / window.innerHeight) - 0.5;

    const layers = document.querySelectorAll('.forest-layer[data-depth]');
    layers.forEach(layer => {
      const depth = parseFloat(layer.getAttribute('data-depth')) || 0.1;
      const x = px * depth * 35;
      const y = py * depth * 20;
      layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }, { passive: true });

  // Expose API for testing / verification
  window.HeroStage = {
    goToScene,
    getCurrentScene: () => currentScene,
    getStoryStep: () => storyStep,
    getPosterPhase: () => posterPhase,
    enterPortal
  };

  // Init
  goToScene(1);
})();
