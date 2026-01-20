/**
 * Visualizer Components
 * 視覺化元件庫
 */

/**
 * 位元視覺化器
 * 用於展示 Snowflake ID 的位元結構
 */
class BitVisualizer {
  constructor(container) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.sections = [
      { name: 'sign', bits: 1, label: '符號位', color: 'var(--color-bit-sign)' },
      { name: 'timestamp', bits: 41, label: '時間戳記', color: 'var(--color-bit-timestamp)' },
      { name: 'datacenter', bits: 5, label: '資料中心 ID', color: 'var(--color-bit-datacenter)' },
      { name: 'worker', bits: 5, label: '機器 ID', color: 'var(--color-bit-worker)' },
      { name: 'sequence', bits: 12, label: '序列號', color: 'var(--color-bit-sequence)' }
    ];

    this.currentBreakdown = null;
  }

  /**
   * 渲染位元結構
   */
  render(breakdown) {
    this.currentBreakdown = breakdown;

    const html = `
      <div class="bit-structure">
        ${this.sections.map(section => this._renderSection(section, breakdown)).join('')}
      </div>
      <div class="binary-output mt-lg">
        <span class="bit-sign">${breakdown.sign}</span>
        <span class="bit-timestamp">${breakdown.timestamp}</span>
        <span class="bit-datacenter">${breakdown.datacenter}</span>
        <span class="bit-worker">${breakdown.worker}</span>
        <span class="bit-sequence">${breakdown.sequence}</span>
      </div>
    `;

    this.container.innerHTML = html;
    this._attachEventListeners();
  }

  /**
   * 渲染單一區塊
   * @private
   */
  _renderSection(section, breakdown) {
    const value = breakdown[section.name];
    const decimalValue = parseInt(value, 2);

    return `
      <div class="bit-section bit-section--${section.name}" data-section="${section.name}" style="--section-color: ${section.color}">
        <div class="bit-section-label">${section.label}</div>
        <div class="bit-section-bits">${section.bits} bits</div>
        <div class="bit-section-value">${decimalValue}</div>
        <div class="bit-cells">
          ${value.split('').map((bit, idx) => `
            <div class="bit-cell ${bit === '1' ? 'active' : ''}" data-index="${idx}">${bit}</div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 附加事件監聽器
   * @private
   */
  _attachEventListeners() {
    const sections = this.container.querySelectorAll('.bit-section');

    sections.forEach(section => {
      section.addEventListener('mouseenter', () => {
        section.classList.add('highlight');
      });

      section.addEventListener('mouseleave', () => {
        section.classList.remove('highlight');
      });

      section.addEventListener('click', () => {
        const sectionName = section.dataset.section;
        this._showSectionDetails(sectionName);
      });
    });
  }

  /**
   * 顯示區塊詳細資訊
   * @private
   */
  _showSectionDetails(sectionName) {
    const details = {
      sign: {
        title: '符號位 (Sign Bit)',
        description: '始終為 0，表示正數。保留此位是為了確保 ID 為正整數，方便在各種程式語言中處理。',
        note: '如果設為 1，在有符號整數表示中會變成負數。'
      },
      timestamp: {
        title: '時間戳記 (Timestamp)',
        description: '41 位元的毫秒級時間戳記，相對於自定義的 epoch 時間點。',
        note: `可表示約 69 年的時間範圍 (2^41 毫秒 ≈ 69.7 年)。`
      },
      datacenter: {
        title: '資料中心 ID (Datacenter ID)',
        description: '5 位元，可支援最多 32 個資料中心 (0-31)。',
        note: '用於在多資料中心部署時區分不同的資料中心。'
      },
      worker: {
        title: '機器 ID (Worker ID)',
        description: '5 位元，每個資料中心可支援最多 32 台機器 (0-31)。',
        note: '結合資料中心 ID，總共可支援 1024 台機器。'
      },
      sequence: {
        title: '序列號 (Sequence)',
        description: '12 位元，同一毫秒內的序列號，從 0 開始遞增。',
        note: '每毫秒最多可產生 4096 個 ID (0-4095)，即每秒約 409.6 萬個 ID。'
      }
    };

    const info = details[sectionName];
    if (info && this.onSectionClick) {
      this.onSectionClick(info);
    }
  }

  /**
   * 動畫更新
   */
  animate(fromBreakdown, toBreakdown, duration = 300) {
    // 簡單的淡入淡出動畫
    this.container.style.opacity = '0.5';

    setTimeout(() => {
      this.render(toBreakdown);
      this.container.style.opacity = '1';
    }, duration / 2);
  }

  /**
   * 高亮特定區塊
   */
  highlightSection(sectionName) {
    const sections = this.container.querySelectorAll('.bit-section');
    sections.forEach(section => {
      if (section.dataset.section === sectionName) {
        section.classList.add('highlight');
        section.style.transform = 'translateY(-8px)';
      } else {
        section.classList.remove('highlight');
        section.style.transform = '';
      }
    });
  }

  /**
   * 清除高亮
   */
  clearHighlight() {
    const sections = this.container.querySelectorAll('.bit-section');
    sections.forEach(section => {
      section.classList.remove('highlight');
      section.style.transform = '';
    });
  }
}

/**
 * Buffer 視覺化器
 * 用於展示 Leaf-Segment 的雙 Buffer 狀態
 */
class BufferVisualizer {
  constructor(container) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
  }

  /**
   * 渲染雙 Buffer 狀態
   */
  render(state) {
    const { buffer1, buffer2, activeBuffer, isLoading } = state.bufferState;

    const html = `
      <div class="buffer-visualization">
        ${this._renderBuffer(buffer1, 0, activeBuffer, isLoading)}
        ${this._renderBuffer(buffer2, 1, activeBuffer, isLoading)}
      </div>
    `;

    this.container.innerHTML = html;
  }

  /**
   * 渲染單一 Buffer
   * @private
   */
  _renderBuffer(buffer, index, activeBuffer, isLoading) {
    const isActive = index === activeBuffer;
    const isEmpty = !buffer;
    const isBufferLoading = isLoading && !buffer;

    let statusClass = 'empty';
    let statusText = '空';

    if (buffer) {
      if (isActive) {
        statusClass = 'active';
        statusText = '使用中';
      } else if (buffer.currentId > buffer.maxId) {
        statusClass = 'exhausted';
        statusText = '已耗盡';
      } else {
        statusClass = 'standby';
        statusText = '待命';
      }
    } else if (isBufferLoading) {
      statusClass = 'loading';
      statusText = '載入中...';
    }

    const progress = buffer ? this._calculateProgress(buffer) : 0;

    return `
      <div class="buffer-container ${statusClass}">
        <div class="buffer-header">
          <span class="buffer-title">Buffer ${index + 1}</span>
          <span class="buffer-status ${statusClass}">${statusText}</span>
        </div>
        <div class="buffer-progress">
          <div class="buffer-progress-bar ${isBufferLoading ? 'shimmer' : ''}"
               style="width: ${progress}%"></div>
        </div>
        <div class="buffer-info">
          <div class="buffer-info-item">
            <span class="buffer-info-label">範圍</span>
            <span class="buffer-info-value">
              ${buffer ? `${buffer.minId.toLocaleString()} - ${buffer.maxId.toLocaleString()}` : '-'}
            </span>
          </div>
          <div class="buffer-info-item">
            <span class="buffer-info-label">當前 ID</span>
            <span class="buffer-info-value">
              ${buffer ? buffer.currentId.toLocaleString() : '-'}
            </span>
          </div>
          <div class="buffer-info-item">
            <span class="buffer-info-label">已使用</span>
            <span class="buffer-info-value">${progress}%</span>
          </div>
          <div class="buffer-info-item">
            <span class="buffer-info-label">剩餘</span>
            <span class="buffer-info-value">
              ${buffer ? Math.max(0, buffer.maxId - buffer.currentId + 1).toLocaleString() : '-'}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 計算使用進度
   * @private
   */
  _calculateProgress(buffer) {
    if (!buffer) return 0;

    const total = buffer.maxId - buffer.minId + 1;
    const used = buffer.currentId - buffer.minId;
    return Math.round((used / total) * 100);
  }

  /**
   * 更新進度條
   */
  updateProgress(bufferIndex, progress) {
    const containers = this.container.querySelectorAll('.buffer-container');
    if (containers[bufferIndex]) {
      const progressBar = containers[bufferIndex].querySelector('.buffer-progress-bar');
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
    }
  }

  /**
   * 動畫切換
   */
  animateSwitch(fromBuffer, toBuffer) {
    const containers = this.container.querySelectorAll('.buffer-container');

    if (containers[fromBuffer]) {
      containers[fromBuffer].classList.add('animate-fade-out');
    }

    if (containers[toBuffer]) {
      containers[toBuffer].classList.add('animate-pulse');
      setTimeout(() => {
        containers[toBuffer].classList.remove('animate-pulse');
      }, 1000);
    }
  }
}

/**
 * 資料庫表格視覺化器
 */
class DbTableVisualizer {
  constructor(container) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
  }

  /**
   * 渲染資料庫表格
   */
  render(dbTable) {
    const html = `
      <table class="db-table">
        <thead>
          <tr>
            <th>biz_tag</th>
            <th>max_id</th>
            <th>step</th>
            <th>update_time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${dbTable.bizTag}</td>
            <td>${dbTable.maxId.toLocaleString()}</td>
            <td>${dbTable.step.toLocaleString()}</td>
            <td>${this._formatTime(dbTable.updateTime)}</td>
          </tr>
        </tbody>
      </table>
    `;

    this.container.innerHTML = html;
  }

  /**
   * 格式化時間
   * @private
   */
  _formatTime(date) {
    return new Date(date).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * 高亮更新
   */
  highlightUpdate() {
    const row = this.container.querySelector('tbody tr');
    if (row) {
      row.classList.add('animate-pulse');
      setTimeout(() => {
        row.classList.remove('animate-pulse');
      }, 1000);
    }
  }
}

/**
 * 粒子背景效果
 */
class ParticleBackground {
  constructor(container) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.isRunning = false;

    container.appendChild(this.canvas);
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  /**
   * 調整畫布大小
   * @private
   */
  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * 建立粒子
   * @private
   */
  _createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: this.canvas.height + 10,
      size: Math.random() * 3 + 1,
      speedY: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.5 ? '#00ffff' : '#a855f7'
    };
  }

  /**
   * 更新粒子
   * @private
   */
  _update() {
    // 建立新粒子
    if (this.particles.length < 50 && Math.random() > 0.95) {
      this.particles.push(this._createParticle());
    }

    // 更新現有粒子
    this.particles = this.particles.filter(p => {
      p.y -= p.speedY;
      p.x += p.speedX;
      p.opacity -= 0.002;

      return p.y > -10 && p.opacity > 0;
    });
  }

  /**
   * 繪製粒子
   * @private
   */
  _draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fill();
    });

    this.ctx.globalAlpha = 1;
  }

  /**
   * 動畫循環
   * @private
   */
  _animate() {
    if (!this.isRunning) return;

    this._update();
    this._draw();
    requestAnimationFrame(() => this._animate());
  }

  /**
   * 開始動畫
   */
  start() {
    this.isRunning = true;
    this._animate();
  }

  /**
   * 停止動畫
   */
  stop() {
    this.isRunning = false;
  }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BitVisualizer, BufferVisualizer, DbTableVisualizer, ParticleBackground };
}
