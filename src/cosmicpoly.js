class CosmicPoly extends HTMLElement {
  /**
   * Constructs a new instance of the class.
   *
   * @constructor
   *
   * @property {boolean} isAnimating - Indicates whether the animation is currently running.
   * @property {number|null} animationFrameId - The ID of the current animation frame request.
   * @property {number} elapsedTime - The elapsed time since the animation started.
   * @property {number|null} startTime - The start time of the animation.
   *
   * @property {boolean} isGeneratingWave - Indicates whether a wave is currently being generated.
   *
   * @property {Path2D|null} currentPath - The current wave path.
   * @property {Path2D|null} targetPath - The target wave path.
   * @property {Path2D|null} pendingTargetPath - The next wave path to be generated.
   *
   * @property {IntersectionObserver|null} intersectionObserver - The Intersection Observer instance.
   * @property {Object|null} observerOptions - The options for the Intersection Observer.
   */
  constructor() {
    super();
    this.isAnimating = false;
    this.animationFrameId = null;
    this.elapsedTime = 0;
    this.startTime = null;

    this.isGeneratingWave = false;

    // Track current and target wave paths
    this.currentPath = null;
    this.targetPath = null;
    this.pendingTargetPath = null;

    // Intersection Observer properties
    this.intersectionObserver = null;
    this.observerOptions = null;
  }

  /**
   * Called when the custom element is appended to the DOM.
   * Initializes the wave properties, constructs the SVG element,
   * and sets up animation and observation if specified.
   *
   * @method connectedCallback
   * @returns {void}
   */
  connectedCallback() {
    const classes = this.className;
    const id = this.id ?? Math.random().toString(36).substring(7);
    const styles = this.getAttribute("style");

    const waveDirection = this.getAttribute("data-wave-face") || "top";
    this.points = parseInt(this.getAttribute("data-wave-points")) || 6;
    this.variance = parseFloat(this.getAttribute("data-variance")) || 3;
    this.duration = parseFloat(this.getAttribute("data-wave-speed")) || 7500;

    this.vertical = waveDirection === "left" || waveDirection === "right";
    const flipX = waveDirection === "right";
    const flipY = waveDirection === "bottom";

    this.width = this.vertical ? 160 : 1440;
    this.height = this.vertical ? 1440 : 160;

    this.startEndZero = this.getAttribute( 'data-start-end-zero' ) === 'true';
    this.startZero = this.getAttribute( 'data-start-zero' ) === 'true';
    this.endZero = this.getAttribute( 'data-end-zero' ) === 'true';

    // Initialize current and target paths
    this.currentPath = generateWave({
      width: this.width,
      height: this.height,
      points: this.points,
      variance: this.variance,
      vertical: this.vertical,
      startEndZero: this.startEndZero,
      startZero: this.startZero,
      endZero: this.endZero
    });

    this.targetPath = generateWave({
      width: this.width,
      height: this.height,
      points: this.points,
      variance: this.variance,
      vertical: this.vertical,
      startEndZero: this.startEndZero,
      startZero: this.startZero,
      endZero: this.endZero
    });

    // Construct the SVG
    this.innerHTML = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg
        version="1.1"
        viewBox="${this.vertical ? "0 0 160 1440" : "0 0 1440 160"}"
        preserveAspectRatio="none"
        class="${classes || ""}"
        style="${flipX ? "transform:scaleX(-1);" : ""}${flipY ? "transform:scaleY(-1);" : ""}${styles || ""}"
        id="${id}"
        aria-hidden="true"
        role="presentation"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        <path d="${this.currentPath}" style="stroke:inherit; fill: inherit"></path>
      </svg>
    `;

    // Save SVG references
    this.svg = this.querySelector("svg");
    this.path = this.querySelector("path");

    // Bind methods
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.generateNewWave = this.generateNewWave.bind(this);

    // Check for wave observation attribute
    const observeAttr = this.getAttribute("data-wave-observe");
    if (observeAttr) {
      this.setupIntersectionObserver(observeAttr);
    }

    // Automatically start animation if enabled
    if (this.getAttribute("data-wave-animate") === "true") {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        this.play();
      }
    }
  }

  // Public method to play the animation
  play(customDuration = null) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const animationDuration = customDuration || this.duration;

    const continueAnimation = () => {
      if (!this.pendingTargetPath) {
        this.pendingTargetPath = generateWave({
          width: this.width,
          height: this.height,
          points: this.points,
          variance: this.variance,
          vertical: this.vertical,
          startEndZero: this.startEndZero,
          startZero: this.startZero,
          endZero: this.endZero
        });
      }

      this.animateWave(animationDuration, () => {
        this.currentPath = this.targetPath;
        this.targetPath = this.pendingTargetPath;

        this.pendingTargetPath = generateWave({
          width: this.width,
          height: this.height,
          points: this.points,
          variance: this.variance,
          vertical: this.vertical,
          startEndZero: this.startEndZero,
          startZero: this.startZero,
          endZero: this.endZero
        });

        if (this.isAnimating) {
          continueAnimation();
        }
      });
    };

    continueAnimation();
  }

  // Public method to pause the animation
  pause() {
    if (!this.isAnimating) return;
    this.isAnimating = false;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;

    this.elapsedTime += performance.now() - (this.startTime || performance.now());
    this.startTime = null;
  }

  disconnectedCallback() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }

  setupIntersectionObserver(observeConfig) {
    const [mode, rootMargin = '0px'] = observeConfig.split(':');
    const isOneTime = mode === 'once';

    this.observerOptions = {
      root: null,
      rootMargin: rootMargin,
      threshold: 0
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          this.generateNewWave();
          if (isOneTime) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
          }
        }
      });
    }, this.observerOptions);

    this.intersectionObserver.observe(this);
  }

  // Public method to morph to a new wave
  generateNewWave(duration = 800) {
    if (this.isGeneratingWave || this.animationFrameId) {
      return;
    }

    if (duration < 1) duration = 1;
    this.isGeneratingWave = true;

    this.pendingTargetPath = generateWave({
      width: this.width,
      height: this.height,
      points: this.points,
      variance: this.variance,
      vertical: this.vertical,
      startEndZero: this.startEndZero,
      startZero: this.startZero,
      endZero: this.endZero
    });

    this.animateWave(duration, () => {
      this.currentPath = this.targetPath;
      this.targetPath = this.pendingTargetPath;
      this.pendingTargetPath = null;
      this.isGeneratingWave = false;
      this.animationFrameId = null;
    });
  }

  // Core animation logic
  animateWave(duration, onComplete = null) {
    const startPoints = parsePath(this.currentPath);
    const endPoints = parsePath(this.targetPath);

    if (startPoints.length !== endPoints.length) {
      this.currentPath = generateWave({
        width: this.width,
        height: this.height,
        points: this.points,
        variance: this.variance,
        vertical: this.vertical,
        startEndZero: this.startEndZero,
        startZero: this.startZero,
        endZero: this.endZero
      });

      this.targetPath = generateWave({
        width: this.width,
        height: this.height,
        points: this.points,
        variance: this.variance,
        vertical: this.vertical,
        startEndZero: this.startEndZero,
        startZero: this.startZero,
        endZero: this.endZero
      });

      return;
    }

    const animate = (timestamp) => {
      if (!this.startTime) this.startTime = timestamp - this.elapsedTime;
      const elapsed = timestamp - this.startTime;
      const progress = Math.min(elapsed / duration, 1);

      const interpolatedPath = interpolateWave(
        startPoints,
        endPoints,
        progress,
        this.vertical,
        this.height,
        this.width
      );

      this.path.setAttribute("d", interpolatedPath);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.elapsedTime = 0;
        this.startTime = null;
        if (onComplete) onComplete();
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }
}

customElements.define("cosmic-poly", CosmicPoly);

/**
 * Generates an SVG path string containing straight-lined polygon segments.
 */
function generateWave({ width, height, points, variance, vertical = false, startEndZero = false, startZero = false, endZero = false }) {
  const anchors = [];
  const step = vertical ? height / (points - 1) : width / (points - 1);

  for (let i = 0; i < points; i++) {
    const x = vertical ? height - step * i : step * i;
    const y = vertical
      ? width - width * 0.1 - Math.random() * (variance * width * 0.25)
      : height - height * 0.1 - Math.random() * (variance * height * 0.25);
    anchors.push(vertical ? { x: y, y: x } : { x, y });
  }

  if (startEndZero) {
    if (vertical) { anchors[0].x = 0; anchors[anchors.length - 1].x = 0; }
    else { anchors[0].y = height; anchors[anchors.length - 1].y = height; }
  } else if (startZero) {
    if (vertical) { anchors[0].x = 0; anchors[anchors.length - 1].x = height; }
    else { anchors[0].y = height; anchors[anchors.length - 1].y = 0; }
  } else if (endZero) {
    if (vertical) { anchors[0].x = height; anchors[anchors.length - 1].x = 0; }
    else { anchors[0].y = 0; anchors[anchors.length - 1].y = height; }
  }

  let path = vertical
    ? `M ${width} ${height} L ${anchors[0].x} ${height}`
    : `M 0 ${height} L 0 ${anchors[0].y}`;

  // Loop connects points directly with straight lines instead of curve tangents
  for (let i = 1; i < anchors.length; i++) {
    path += ` L ${anchors[i].x} ${anchors[i].y}`;
  }

  path += vertical
    ? ` L 0 0 L ${width} 0 L ${width} ${height} Z`
    : ` L ${width} ${height} Z`;

  return path;
}

/**
 * Extracts explicit line path positioning maps.
 */
function parsePath(pathString) {
  const points = [];
  const regex = /(?:M|L)\s([\d.]+)\s([\d.]+)/g;
  let match;

  while ((match = regex.exec(pathString)) !== null) {
    points.push({
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
    });
  }
  return points;
}

/**
 * Interpolates straight lines linearly across active updates.
 */
function interpolateWave(currentPoints, targetPoints, progress, vertical = false, height, width) {
  const interpolatedPoints = currentPoints.map((current, i) => {
    const target = targetPoints[i];
    if (!target) return current;

    return {
      x: current.x + (target.x - current.x) * progress,
      y: current.y + (target.y - current.y) * progress,
    };
  });

  if (interpolatedPoints.length === 0) return '';

  let path = `M ${interpolatedPoints[0].x} ${interpolatedPoints[0].y}`;
  for (let i = 1; i < interpolatedPoints.length; i++) {
    path += ` L ${interpolatedPoints[i].x} ${interpolatedPoints[i].y}`;
  }
  path += ' Z';

  return path;
}
