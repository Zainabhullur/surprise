document.addEventListener('DOMContentLoaded', () => {

  // --- 1. DOM Elements & State ---
  const gatekeeper = document.getElementById('gatekeeper');
  const btnEnter = document.getElementById('btn-enter');
  const mainContent = document.getElementById('main-content');
  const audioControl = document.getElementById('audio-control');
  const musicBtn = document.getElementById('music-btn');
  const visualizer = document.getElementById('visualizer');
  const envelope = document.getElementById('envelope');
  const envelopeHintText = document.getElementById('envelope-hint-text');
  
  let isSiteEntered = false;
  let isPlayingMusic = false;
  let audioContext = null;
  let synthesizer = null;

  // --- 2. Canvas Background Stardust & Confetti System ---
  const canvas = document.getElementById('stardust-canvas');
  const ctx = canvas.getContext('2d');
  
  let particles = [];
  let trailParticles = [];
  let confettiParticles = [];
  const particleCount = 80;
  
  let mouse = { x: null, y: null, active: false };

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Floating Ambient Star Particles
  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * canvas.height; // start scattered
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + 10;
      this.size = Math.random() * 2 + 0.5;
      this.speed = Math.random() * 0.4 + 0.1;
      this.alpha = Math.random() * 0.6 + 0.1;
      this.wobble = Math.random() * 2 - 1;
      this.wobbleSpeed = Math.random() * 0.02 + 0.005;
      this.angle = Math.random() * Math.PI * 2;
    }

    update() {
      this.y -= this.speed;
      this.angle += this.wobbleSpeed;
      this.x += Math.sin(this.angle) * 0.2;

      // React to mouse cursor (drift away slightly)
      if (mouse.active) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          let force = (100 - dist) / 100;
          this.x -= (dx / dist) * force * 1.5;
          this.y -= (dy / dist) * force * 1.5;
        }
      }

      // Reset particle if it drifts off top or sides
      if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(226, 180, 189, ${this.alpha})`;
      ctx.shadowBlur = this.size * 3;
      ctx.shadowColor = '#ffd166';
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow for performance
    }
  }

  // Mouse Trail Star Particles
  class TrailParticle {
    constructor(x, y) {
      this.x = x + (Math.random() * 12 - 6);
      this.y = y + (Math.random() * 12 - 6);
      this.size = Math.random() * 2.5 + 1;
      this.speedX = Math.random() * 1.2 - 0.6;
      this.speedY = Math.random() * 1.2 - 0.6;
      this.alpha = 1.0;
      this.decay = Math.random() * 0.02 + 0.012;
      this.color = Math.random() > 0.5 ? '#ffd166' : '#e2b4bd';
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.alpha -= this.decay;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color === '#ffd166' ? `rgba(255, 209, 102, ${this.alpha})` : `rgba(226, 180, 189, ${this.alpha})`;
      ctx.shadowBlur = this.size * 3;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Trigger a stardust ripple burst (expanding ring of particles)
  function triggerStardustRipple(x, y) {
    const rippleCount = 20;
    for (let i = 0; i < rippleCount; i++) {
      const angle = (i / rippleCount) * Math.PI * 2 + Math.random() * 0.4;
      const speed = Math.random() * 2.5 + 1.5;
      
      const p = new TrailParticle(x, y);
      p.speedX = Math.cos(angle) * speed;
      p.speedY = Math.sin(angle) * speed;
      p.decay = Math.random() * 0.012 + 0.008;
      p.size = Math.random() * 3.5 + 1.5;
      trailParticles.push(p);
    }
  }

  // Confetti Particles
  class ConfettiParticle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 8 + 4;
      this.speedX = Math.random() * 8 - 4;
      this.speedY = Math.random() * -12 - 5; // shoots upwards
      this.gravity = 0.28;
      this.colors = ['#ffd166', '#ff85a1', '#e2b4bd', '#4cc9f0', '#72efdd'];
      this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 10 - 5;
      this.alpha = 1.0;
      this.decay = Math.random() * 0.01 + 0.007;
    }

    update() {
      this.x += this.speedX;
      this.speedY += this.gravity;
      this.y += this.speedY;
      this.rotation += this.rotationSpeed;
      this.alpha -= this.decay;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation * Math.PI / 180);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    }
  }

  // Track cursor coordinates
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
    
    // Spawn trail particles
    if (Math.random() < 0.6) {
      for (let i = 0; i < 2; i++) {
        trailParticles.push(new TrailParticle(mouse.x, mouse.y));
      }
    }
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  // Track touch events for mobile trails
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      mouse.active = true;
      
      if (Math.random() < 0.5) {
        trailParticles.push(new TrailParticle(mouse.x, mouse.y));
      }
    }
  });

  // Initialize Particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  // Animation Loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update & draw background stardust
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    // Update & draw cursor trail particles
    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const p = trailParticles[i];
      p.update();
      p.draw();
      if (p.alpha <= 0) {
        trailParticles.splice(i, 1);
      }
    }

    // Update & draw confetti particles
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];
      p.update();
      p.draw();
      if (p.alpha <= 0 || p.y > canvas.height + 20) {
        confettiParticles.splice(i, 1);
      }
    }
    ctx.globalAlpha = 1.0; // reset alpha

    requestAnimationFrame(animate);
  }
  
  animate();

  // --- 3. Web Audio API Generative Synthesizer ---
  // Generates chimes and plays "Main Yahaan Hoon" melody from Veer-Zaara.
  class AmbientSynthesizer {
    constructor() {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.isPlaying = false;

      // Load original Veer-Zaara song
      this.bgAudio = new Audio('main_yahaan_hoon.mp3');
      this.bgAudio.loop = true;
      this.bgAudio.volume = 0.45; // Ambient background volume level

      // Reverb / Echo effects setup for synthesized chimes
      this.delay = this.ctx.createDelay(2.0);
      this.feedback = this.ctx.createGain();
      this.filter = this.ctx.createBiquadFilter();

      this.delay.delayTime.value = 0.6; 
      this.feedback.gain.value = 0.35;  
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 1000; 

      // Connections for synthesized chimes
      this.delay.connect(this.feedback);
      this.feedback.connect(this.filter);
      this.filter.connect(this.delay); 
      this.filter.connect(this.ctx.destination);
    }

    start() {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isPlaying = true;
      
      // Play background song
      this.bgAudio.play().catch(err => {
        console.warn("Background music autoplay was blocked or failed:", err);
      });
    }

    stop() {
      this.isPlaying = false;
      this.bgAudio.pause();
    }

    playTone(freq, durationMs = 1000) {
      if (!this.isPlaying && this.ctx.state === 'suspended') return;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, this.ctx.currentTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, this.ctx.currentTime);

      const durationSec = durationMs / 1000;

      gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + Math.max(durationSec, 2.0));

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.ctx.destination); 
      gainNode.connect(this.delay);          

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + Math.max(durationSec, 2.5));
      osc2.stop(this.ctx.currentTime + Math.max(durationSec, 2.5));
    }
  }

  function toggleMusic() {
    if (!synthesizer) {
      synthesizer = new AmbientSynthesizer();
    }

    if (isPlayingMusic) {
      synthesizer.stop();
      visualizer.classList.remove('playing');
      musicBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
      isPlayingMusic = false;
    } else {
      synthesizer.start();
      visualizer.classList.add('playing');
      musicBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      isPlayingMusic = true;
    }
  }

  audioControl.addEventListener('click', toggleMusic);

  // --- 4. Gatekeeper Entrance ---
  const portraitTrigger = document.getElementById('portrait-trigger');

  function enterSite(e) {
    if (isSiteEntered) return;
    
    // Animate portrait clicked state
    if (portraitTrigger) {
      portraitTrigger.classList.add('clicked');
    }
    
    // Play magical tone progression
    if (!synthesizer) {
      synthesizer = new AmbientSynthesizer();
    }
    if (synthesizer.ctx.state === 'suspended') {
      synthesizer.ctx.resume();
    }
    
    // Play a sweet celebratory chime arpeggio
    const entryChime = [261.63, 329.63, 392.00, 523.25];
    entryChime.forEach((freq, idx) => {
      setTimeout(() => {
        synthesizer.playTone(freq);
      }, idx * 100);
    });

    // Play magical pop chime arpeggio
    setTimeout(() => {
      synthesizer.playTone(329.63);   // E4
      setTimeout(() => synthesizer.playTone(392.00), 100); // G4
      setTimeout(() => synthesizer.playTone(493.88), 200); // B4
      setTimeout(() => synthesizer.playTone(659.25), 300); // E5
    }, 150);

    const triggerRect = (e && e.currentTarget) ? e.currentTarget.getBoundingClientRect() : btnEnter.getBoundingClientRect();
    const x = (e && e.clientX) || (triggerRect.left + triggerRect.width / 2);
    const y = (e && e.clientY) || (triggerRect.top + triggerRect.height / 2);
    triggerStardustRipple(x, y);

    // Fade out gatekeeper and show main content
    setTimeout(() => {
      gatekeeper.classList.add('fade-out');
      document.body.classList.add('show-bg');
      mainContent.classList.remove('hide');
      
      setTimeout(() => {
        mainContent.classList.add('show');
        isSiteEntered = true;
        
        // Start background ambient music visualizer state
        visualizer.classList.add('playing');
        musicBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        isPlayingMusic = true;
        synthesizer.start();
        
        // Spawn entering stardust burst
        for (let i = 0; i < 35; i++) {
          trailParticles.push(new TrailParticle(window.innerWidth / 2, window.innerHeight / 2));
        }
      }, 400);
    }, 700); // 700ms delay to let the photo fade animation play!
  }

  if (portraitTrigger) {
    portraitTrigger.addEventListener('click', enterSite);
  }
  btnEnter.addEventListener('click', enterSite);

  // --- 5. Magical Jar of Warm Thoughts ---
  const jarContainer = document.getElementById('jar-container');
  const heartNote = document.getElementById('heart-note');
  const heartTitle = document.getElementById('heart-note-title');
  const heartText = document.getElementById('heart-note-text');
  const closeNoteBtn = document.getElementById('close-note-btn');

  const jarThoughts = [
    {
      title: "Warm Reminder",
      text: "You hold a permanent place in my heart, Sarfraz Ji. Your kindness, strength, and genuine presence make the world a warmer place just by having you in it."
    },
    {
      title: "Wishing You Joy",
      text: "On this special day, I hope the universe brings you absolute peace, clear directions, and endless reasons to smile. You deserve the best of everything."
    },
    {
      title: "Quiet Support",
      text: "Whenever paths cross, or wherever life leads us, always remember you have a safe harbor and someone cheering for your success and happiness from afar."
    },
    {
      title: "Sweet Memories",
      text: "Thank you for the fits of shared laughter, inside jokes, and the effortless support during stormier waves. Those memories will always remain cherished chapters."
    },
    {
      title: "A Bright Future",
      text: "May this upcoming year bring you closer to all your deepest dreams, grant you complete clarity, and fill your days with love, laughter, and genuine peace."
    }
  ];

  let currentThoughtIndex = 0;
  let isJarAnimating = false;

  if (jarContainer) {
    jarContainer.addEventListener('click', (e) => {
      if (isJarAnimating) return;
      isJarAnimating = true;

      // Shake the jar
      jarContainer.classList.add('shaking');

      // Chime tone progression
      if (synthesizer && isPlayingMusic) {
        synthesizer.playTone(392.00); // G4
        setTimeout(() => synthesizer.playTone(493.88), 100); // B4
        setTimeout(() => synthesizer.playTone(587.33), 200); // D5
      }

      const rect = jarContainer.getBoundingClientRect();
      const x = e.clientX || (rect.left + rect.width / 2);
      const y = e.clientY || rect.top;
      triggerStardustRipple(x, y);

      // Extract heart note after shake ends
      setTimeout(() => {
        jarContainer.classList.remove('shaking');
        
        // Load sequential thought
        const thought = jarThoughts[currentThoughtIndex];
        heartTitle.textContent = thought.title;
        heartText.textContent = thought.text;
        currentThoughtIndex = (currentThoughtIndex + 1) % jarThoughts.length;

        // Show note
        heartNote.classList.remove('hide');
        setTimeout(() => {
          heartNote.classList.add('show');
          isJarAnimating = false;
        }, 50);

        // Slow confetti burst
        for (let i = 0; i < 15; i++) {
          confettiParticles.push(new ConfettiParticle(x + (Math.random() * 40 - 20), y - 20));
        }

      }, 500);
    });
  }

  if (closeNoteBtn) {
    closeNoteBtn.addEventListener('click', () => {
      heartNote.classList.remove('show');
      
      if (synthesizer && isPlayingMusic) {
        synthesizer.playTone(329.63); // E4
      }

      setTimeout(() => {
        heartNote.classList.add('hide');
      }, 700);
    });
  }

  // --- 6. Birthday Cake & Blow Candles Interaction ---
  const candles = document.querySelectorAll('.candle');
  const btnBlow = document.getElementById('btn-blow');
  const cakeMessage = document.getElementById('cake-message');

  function checkAllCandlesExtinguished() {
    const activeCandles = document.querySelectorAll('.candle.active');
    if (activeCandles.length === 0) {
      triggerCelebration();
    }
  }

  function triggerCelebration() {
    // Launch confetti blast from below the cake
    for (let i = 0; i < 150; i++) {
      confettiParticles.push(new ConfettiParticle(window.innerWidth / 2, window.innerHeight * 0.75));
    }

    cakeMessage.classList.remove('hide');
    setTimeout(() => {
      cakeMessage.classList.add('show');
    }, 50);

    if (synthesizer && isPlayingMusic) {
      const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; 
      arpeggio.forEach((freq, idx) => {
        setTimeout(() => {
          synthesizer.playTone(freq);
        }, idx * 140);
      });
    }
  }

  candles.forEach(candle => {
    candle.addEventListener('click', (e) => {
      e.stopPropagation(); 
      if (candle.classList.contains('active')) {
        candle.classList.remove('active');
        candle.classList.add('extinguished');
        
        if (synthesizer && isPlayingMusic) {
          synthesizer.playTone(440.00 + Math.random() * 120);
        }

        const rect = candle.getBoundingClientRect();
        for (let i = 0; i < 8; i++) {
          trailParticles.push(new TrailParticle(rect.left + rect.width / 2, rect.top));
        }

        checkAllCandlesExtinguished();
      }
    });
  });

  btnBlow.addEventListener('click', (e) => {
    const rect = btnBlow.getBoundingClientRect();
    const x = e.clientX || (rect.left + rect.width / 2);
    const y = e.clientY || (rect.top + rect.height / 2);
    triggerStardustRipple(x, y);

    const activeCandles = document.querySelectorAll('.candle.active');
    if (activeCandles.length > 0) {
      activeCandles.forEach(candle => {
        candle.classList.remove('active');
        candle.classList.add('extinguished');
        
        const rectCandle = candle.getBoundingClientRect();
        for (let i = 0; i < 5; i++) {
          trailParticles.push(new TrailParticle(rectCandle.left + rectCandle.width / 2, rectCandle.top));
        }
      });
      triggerCelebration();
      btnBlow.querySelector('span').textContent = 'Relight the candles';
      btnBlow.querySelector('i').className = 'fa-solid fa-fire animate-pulse';
    } else {
      candles.forEach(candle => {
        candle.classList.remove('extinguished');
        candle.classList.add('active');
      });
      cakeMessage.classList.remove('show');
      setTimeout(() => {
        cakeMessage.classList.add('hide');
      }, 500);
      btnBlow.querySelector('span').textContent = 'Blow out the candles';
      btnBlow.querySelector('i').className = 'fa-solid fa-wind animate-pulse';
      
      if (synthesizer && isPlayingMusic) {
        synthesizer.playTone(220.00);
      }
    }
  });

  // --- 7. Envelope & Letter Interaction ---
  envelope.addEventListener('click', (e) => {
    const isOpen = envelope.classList.contains('open');
    if (isOpen) {
      envelope.classList.remove('open');
      envelopeHintText.textContent = "Click envelope to open";
      
      if (synthesizer && isPlayingMusic) {
        synthesizer.playTone(261.63); 
      }
    } else {
      envelope.classList.add('open');
      envelopeHintText.textContent = "Click envelope to close";
      
      const waxSealRect = document.getElementById('wax-seal').getBoundingClientRect();
      const x = e.clientX || (waxSealRect.left + waxSealRect.width / 2);
      const y = e.clientY || (waxSealRect.top + waxSealRect.height / 2);
      triggerStardustRipple(x, y);
      
      for (let i = 0; i < 20; i++) {
        trailParticles.push(new TrailParticle(waxSealRect.left + waxSealRect.width / 2, waxSealRect.top + waxSealRect.height / 2));
      }
      
      if (synthesizer && isPlayingMusic) {
        synthesizer.playTone(523.25); 
        setTimeout(() => synthesizer.playTone(659.25), 150); 
      }
    }
  });

  // --- 8. Intersection Observer for Scroll Reveals ---
  const revealItems = document.querySelectorAll('.reveal-item');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealItems.forEach(item => {
    revealObserver.observe(item);
  });

});
