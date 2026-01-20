/**
 * UI Components
 * 通用 UI 元件
 */

/**
 * 複製到剪貼簿按鈕
 */
class CopyButton {
  constructor(button, getTextFn) {
    this.button = typeof button === 'string'
      ? document.querySelector(button)
      : button;
    this.getTextFn = getTextFn;
    this.originalText = this.button.innerHTML;

    this._init();
  }

  _init() {
    this.button.addEventListener('click', () => this.copy());
  }

  async copy() {
    try {
      const text = this.getTextFn();
      await navigator.clipboard.writeText(text);

      this.button.innerHTML = '<span>已複製!</span>';
      this.button.classList.add('copied');

      setTimeout(() => {
        this.button.innerHTML = this.originalText;
        this.button.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
}

/**
 * 標籤頁切換器
 */
class TabSwitcher {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this.onChange = options.onChange || (() => {});

    this._init();
  }

  _init() {
    const tabs = this.container.querySelectorAll('.code-tab');
    const contents = this.container.querySelectorAll('.code-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;

        // 更新標籤狀態
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // 更新內容顯示
        contents.forEach(content => {
          content.classList.toggle('active', content.id === targetId);
        });

        this.onChange(targetId);
      });
    });
  }

  switchTo(tabId) {
    const tab = this.container.querySelector(`[data-tab="${tabId}"]`);
    if (tab) {
      tab.click();
    }
  }
}

/**
 * 決策樹元件
 */
class DecisionTree {
  constructor(container, questions) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this.questions = questions;
    this.currentStep = 0;
    this.answers = [];

    this._render();
  }

  _render() {
    const question = this.questions[this.currentStep];

    if (question.type === 'result') {
      this._renderResult(question);
      return;
    }

    const html = `
      <div class="decision-node active">
        <div class="decision-progress">
          步驟 ${this.currentStep + 1} / ${this._getTotalSteps()}
        </div>
        <div class="decision-question">${question.text}</div>
        <div class="decision-options">
          ${question.options.map((opt, idx) => `
            <button class="decision-option" data-next="${opt.next}" data-index="${idx}">
              ${opt.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this._attachListeners();
  }

  _renderResult(result) {
    const html = `
      <div class="decision-result ${result.recommendation}">
        <div class="decision-result-icon">
          ${result.recommendation === 'snowflake' ? '❄️' : '🍃'}
        </div>
        <div class="decision-result-title">
          推薦: ${result.recommendation === 'snowflake' ? 'Snowflake' : 'Leaf-Segment'}
        </div>
        <div class="decision-result-reason">
          ${result.reason}
        </div>
        <div class="decision-result-actions mt-lg">
          <button class="btn btn-secondary" id="decision-restart">重新選擇</button>
          <a href="#${result.recommendation}" class="btn btn-primary">了解更多</a>
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    document.getElementById('decision-restart').addEventListener('click', () => {
      this.reset();
    });
  }

  _attachListeners() {
    const options = this.container.querySelectorAll('.decision-option');
    options.forEach(opt => {
      opt.addEventListener('click', () => {
        const nextStep = parseInt(opt.dataset.next);
        this.answers.push(parseInt(opt.dataset.index));
        this.currentStep = nextStep;
        this._render();
      });
    });
  }

  _getTotalSteps() {
    return this.questions.filter(q => q.type !== 'result').length;
  }

  reset() {
    this.currentStep = 0;
    this.answers = [];
    this._render();
  }
}

/**
 * 滾動動畫觸發器
 */
class ScrollAnimator {
  constructor(selector = '.scroll-animate') {
    this.elements = document.querySelectorAll(selector);
    this._init();
  }

  _init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    this.elements.forEach(el => observer.observe(el));
  }
}

/**
 * 平滑滾動導航
 */
class SmoothScroll {
  constructor() {
    this._init();
  }

  _init() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');

        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }
}

/**
 * 導航欄滾動效果
 */
class NavScrollEffect {
  constructor() {
    this.header = document.querySelector('.header');
    this.sections = document.querySelectorAll('section[id]');
    this.navLinks = document.querySelectorAll('.nav-link');

    this._init();
  }

  _init() {
    // 滾動時更新當前區塊
    window.addEventListener('scroll', () => {
      this._updateActiveLink();
      this._updateHeaderBackground();
    });
  }

  _updateActiveLink() {
    const scrollPos = window.scrollY + 100;

    this.sections.forEach(section => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < bottom) {
        this.navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }

  _updateHeaderBackground() {
    if (window.scrollY > 50) {
      this.header?.classList.add('scrolled');
    } else {
      this.header?.classList.remove('scrolled');
    }
  }
}

/**
 * 行動版選單
 */
class MobileMenu {
  constructor() {
    this.toggle = document.querySelector('.mobile-menu-toggle');
    this.nav = document.querySelector('.nav');
    this.isOpen = false;

    this._init();
  }

  _init() {
    if (!this.toggle) return;

    this.toggle.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      this.nav?.classList.toggle('is-open', this.isOpen);
      this.toggle.classList.toggle('is-active', this.isOpen);
    });

    // 點擊連結後關閉選單
    this.nav?.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        this.isOpen = false;
        this.nav?.classList.remove('is-open');
        this.toggle?.classList.remove('is-active');
      });
    });
  }
}

/**
 * 數字動畫
 */
class NumberAnimator {
  constructor(element, options = {}) {
    this.element = typeof element === 'string'
      ? document.querySelector(element)
      : element;
    this.duration = options.duration || 1000;
    this.formatter = options.formatter || (n => n.toLocaleString());
  }

  animate(from, to) {
    const startTime = performance.now();
    const diff = to - from;

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this.duration, 1);

      // Easing function (ease-out)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(from + diff * easeProgress);

      this.element.textContent = this.formatter(currentValue);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }
}

/**
 * Toast 通知
 */
class Toast {
  static show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      z-index: 1000;
      animation: fadeInUp 0.3s ease;
    `;

    if (type === 'success') {
      toast.style.borderColor = 'var(--color-accent-green)';
    } else if (type === 'error') {
      toast.style.borderColor = 'var(--color-accent-red)';
    } else if (type === 'warning') {
      toast.style.borderColor = 'var(--color-accent-orange)';
    }

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

/**
 * 工具提示
 */
class Tooltip {
  static init() {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
      el.classList.add('tooltip');

      const content = document.createElement('div');
      content.className = 'tooltip-content';
      content.textContent = el.dataset.tooltip;
      el.appendChild(content);
    });
  }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CopyButton,
    TabSwitcher,
    DecisionTree,
    ScrollAnimator,
    SmoothScroll,
    NavScrollEffect,
    MobileMenu,
    NumberAnimator,
    Toast,
    Tooltip
  };
}
