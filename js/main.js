/**
 * Main Application Entry Point
 * Snow Leaf ID Playground
 */

// 全域狀態
const AppState = {
  snowflake: {
    generator: null,
    visualizer: null
  },
  leafSegment: {
    simulator: null,
    bufferVisualizer: null,
    dbTableVisualizer: null
  }
};

/**
 * 初始化應用程式
 */
function initApp() {
  // 初始化 UI 元件
  initNavigation();
  initScrollEffects();
  initParticles();

  // 初始化 Snowflake 區塊
  initSnowflakeSection();

  // 初始化 Leaf-Segment 區塊
  initLeafSegmentSection();

  // 初始化比較區塊
  initComparisonSection();

  // 初始化程式碼範例區塊
  initCodeExamples();

  // 初始化工具提示
  Tooltip.init();

  console.log('Snow Leaf ID Playground initialized');
}

/**
 * 初始化導航
 */
function initNavigation() {
  new SmoothScroll();
  new NavScrollEffect();
  new MobileMenu();
}

/**
 * 初始化滾動效果
 */
function initScrollEffects() {
  new ScrollAnimator();
}

/**
 * 初始化粒子背景
 */
function initParticles() {
  const heroBackground = document.querySelector('.hero-background');
  if (heroBackground && !prefersReducedMotion()) {
    const particles = new ParticleBackground(heroBackground);
    particles.start();
  }
}

/**
 * 初始化 Snowflake 區塊
 */
function initSnowflakeSection() {
  // 建立生成器實例
  const defaultEpoch = new Date('2020-01-01T00:00:00Z').getTime();
  AppState.snowflake.generator = new SnowflakeGenerator({
    epoch: defaultEpoch,
    datacenterId: 1,
    workerId: 1
  });

  // 初始化位元視覺化器
  const bitContainer = document.getElementById('snowflake-bit-visualizer');
  if (bitContainer) {
    AppState.snowflake.visualizer = new BitVisualizer(bitContainer);

    // 設定區塊點擊回調
    AppState.snowflake.visualizer.onSectionClick = (info) => {
      showSectionInfo(info);
    };

    // 初始渲染
    updateSnowflakeVisualization();
  }

  // 綁定控制項事件
  bindSnowflakeControls();

  // 綁定生成按鈕
  const generateBtn = document.getElementById('snowflake-generate-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', () => generateSnowflakeId());
  }

  // 綁定批量生成按鈕
  const batchBtn = document.getElementById('snowflake-batch-btn');
  if (batchBtn) {
    batchBtn.addEventListener('click', () => generateSnowflakeBatch());
  }

  // 綁定解析按鈕
  const parseBtn = document.getElementById('snowflake-parse-btn');
  if (parseBtn) {
    parseBtn.addEventListener('click', () => parseSnowflakeId());
  }

  // 綁定複製按鈕
  const copyBtn = document.getElementById('snowflake-copy-btn');
  if (copyBtn) {
    new CopyButton(copyBtn, () => {
      const output = document.getElementById('snowflake-id-output');
      return output ? output.textContent : '';
    });
  }

  // 初始生成一個 ID
  generateSnowflakeId();
}

/**
 * 綁定 Snowflake 控制項事件
 */
function bindSnowflakeControls() {
  // Epoch 輸入
  const epochInput = document.getElementById('snowflake-epoch');
  if (epochInput) {
    epochInput.value = toDateTimeLocalString(AppState.snowflake.generator.epoch);
    epochInput.addEventListener('change', (e) => {
      const newEpoch = new Date(e.target.value).getTime();
      AppState.snowflake.generator = new SnowflakeGenerator({
        ...AppState.snowflake.generator,
        epoch: newEpoch
      });
      updateSnowflakeVisualization();
    });
  }

  // Datacenter ID
  const dcInput = document.getElementById('snowflake-datacenter');
  if (dcInput) {
    dcInput.value = AppState.snowflake.generator.datacenterId;
    dcInput.addEventListener('input', debounce((e) => {
      const value = clamp(safeParseInt(e.target.value, 1), 0, 31);
      e.target.value = value;
      AppState.snowflake.generator.datacenterId = value;
      updateSnowflakeVisualization();
    }, 100));
  }

  // Worker ID
  const workerInput = document.getElementById('snowflake-worker');
  if (workerInput) {
    workerInput.value = AppState.snowflake.generator.workerId;
    workerInput.addEventListener('input', debounce((e) => {
      const value = clamp(safeParseInt(e.target.value, 1), 0, 31);
      e.target.value = value;
      AppState.snowflake.generator.workerId = value;
      updateSnowflakeVisualization();
    }, 100));
  }

  // Sequence
  const seqInput = document.getElementById('snowflake-sequence');
  if (seqInput) {
    seqInput.value = 0;
    seqInput.addEventListener('input', debounce((e) => {
      const value = clamp(safeParseInt(e.target.value, 0), 0, 4095);
      e.target.value = value;
      updateSnowflakeVisualization();
    }, 100));
  }
}

/**
 * 更新 Snowflake 視覺化
 */
function updateSnowflakeVisualization() {
  const seqInput = document.getElementById('snowflake-sequence');
  const sequence = seqInput ? safeParseInt(seqInput.value, 0) : 0;

  const result = AppState.snowflake.generator.generateWithParams({
    timestamp: Date.now() - AppState.snowflake.generator.epoch,
    datacenterId: AppState.snowflake.generator.datacenterId,
    workerId: AppState.snowflake.generator.workerId,
    sequence: sequence
  });

  // 更新視覺化
  if (AppState.snowflake.visualizer) {
    AppState.snowflake.visualizer.render(result.breakdown);
  }
}

/**
 * 生成 Snowflake ID
 */
function generateSnowflakeId() {
  try {
    const result = AppState.snowflake.generator.generate();

    // 更新輸出
    const output = document.getElementById('snowflake-id-output');
    if (output) {
      output.textContent = result.id.toString();
      output.classList.add('animate-pulse');
      setTimeout(() => output.classList.remove('animate-pulse'), 500);
    }

    // 更新視覺化
    if (AppState.snowflake.visualizer) {
      AppState.snowflake.visualizer.render(result.breakdown);
    }

    // 更新解析結果
    updateSnowflakeParseResult(result.id);

    Toast.show('ID 生成成功', 'success');
  } catch (error) {
    Toast.show(error.message, 'error');
  }
}

/**
 * 批量生成 Snowflake ID
 */
function generateSnowflakeBatch() {
  const countInput = document.getElementById('snowflake-batch-count');
  const count = countInput ? clamp(safeParseInt(countInput.value, 10), 1, 100) : 10;

  try {
    const results = AppState.snowflake.generator.generateBatch(count);

    const batchOutput = document.getElementById('snowflake-batch-output');
    if (batchOutput) {
      batchOutput.innerHTML = results.map(r => `<div>${r.id.toString()}</div>`).join('');
    }

    Toast.show(`已生成 ${count} 個 ID`, 'success');
  } catch (error) {
    Toast.show(error.message, 'error');
  }
}

/**
 * 解析 Snowflake ID
 */
function parseSnowflakeId() {
  const input = document.getElementById('snowflake-parse-input');
  if (!input || !input.value) {
    Toast.show('請輸入要解析的 ID', 'warning');
    return;
  }

  try {
    const id = safeParseBigInt(input.value);
    if (id === 0n) {
      throw new Error('無效的 ID 格式');
    }

    updateSnowflakeParseResult(id);
    Toast.show('解析成功', 'success');
  } catch (error) {
    Toast.show(error.message, 'error');
  }
}

/**
 * 更新 Snowflake 解析結果
 */
function updateSnowflakeParseResult(id) {
  const parsed = AppState.snowflake.generator.parse(id);
  const resultContainer = document.getElementById('snowflake-parse-result');

  if (resultContainer) {
    resultContainer.innerHTML = `
      <div class="parse-result-grid">
        <div class="parse-result-item">
          <span class="label">時間戳記</span>
          <span class="value">${formatTimestamp(parsed.absoluteTime)}</span>
        </div>
        <div class="parse-result-item">
          <span class="label">資料中心 ID</span>
          <span class="value">${parsed.datacenterId}</span>
        </div>
        <div class="parse-result-item">
          <span class="label">機器 ID</span>
          <span class="value">${parsed.workerId}</span>
        </div>
        <div class="parse-result-item">
          <span class="label">序列號</span>
          <span class="value">${parsed.sequence}</span>
        </div>
      </div>
    `;
  }
}

/**
 * 顯示區塊資訊
 */
function showSectionInfo(info) {
  const infoPanel = document.getElementById('snowflake-section-info');
  if (infoPanel) {
    infoPanel.innerHTML = `
      <h4>${info.title}</h4>
      <p>${info.description}</p>
      <p class="text-muted">${info.note}</p>
    `;
    infoPanel.classList.add('visible');
  }
}

/**
 * 初始化 Leaf-Segment 區塊
 */
function initLeafSegmentSection() {
  // 建立模擬器實例
  AppState.leafSegment.simulator = new LeafSegmentSimulator({
    bizTag: 'order',
    step: 1000,
    maxId: 0,
    threshold: 0.2,
    networkLatency: 50,
    onStateChange: (state) => updateLeafSegmentVisualization(state),
    onSegmentLoad: () => {
      const dbVisualizer = AppState.leafSegment.dbTableVisualizer;
      if (dbVisualizer) {
        dbVisualizer.highlightUpdate();
      }
    },
    onBufferSwitch: (data) => {
      Toast.show(`Buffer 切換: ${data.fromBuffer + 1} → ${data.toBuffer + 1}`, 'info');
    }
  });

  // 初始化 Buffer 視覺化器
  const bufferContainer = document.getElementById('leaf-buffer-visualizer');
  if (bufferContainer) {
    AppState.leafSegment.bufferVisualizer = new BufferVisualizer(bufferContainer);
  }

  // 初始化資料庫表格視覺化器
  const dbContainer = document.getElementById('leaf-db-visualizer');
  if (dbContainer) {
    AppState.leafSegment.dbTableVisualizer = new DbTableVisualizer(dbContainer);
  }

  // 綁定控制項事件
  bindLeafSegmentControls();

  // 綁定按鈕事件
  const initBtn = document.getElementById('leaf-init-btn');
  if (initBtn) {
    initBtn.addEventListener('click', () => initLeafSegment());
  }

  const getIdBtn = document.getElementById('leaf-getid-btn');
  if (getIdBtn) {
    getIdBtn.addEventListener('click', () => getLeafSegmentId());
  }

  const burstBtn = document.getElementById('leaf-burst-btn');
  if (burstBtn) {
    burstBtn.addEventListener('click', () => burstLeafSegment());
  }

  const failureBtn = document.getElementById('leaf-failure-btn');
  if (failureBtn) {
    failureBtn.addEventListener('click', () => simulateDbFailure());
  }

  const resetBtn = document.getElementById('leaf-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => resetLeafSegment());
  }
}

/**
 * 綁定 Leaf-Segment 控制項事件
 */
function bindLeafSegmentControls() {
  // Business Tag
  const bizTagInput = document.getElementById('leaf-biztag');
  if (bizTagInput) {
    bizTagInput.value = AppState.leafSegment.simulator.bizTag;
    bizTagInput.addEventListener('change', (e) => {
      AppState.leafSegment.simulator.bizTag = e.target.value || 'default';
    });
  }

  // Step
  const stepInput = document.getElementById('leaf-step');
  if (stepInput) {
    stepInput.value = AppState.leafSegment.simulator.step;
    stepInput.addEventListener('input', debounce((e) => {
      const value = clamp(safeParseInt(e.target.value, 1000), 100, 10000);
      e.target.value = value;
      AppState.leafSegment.simulator.setStep(value);
    }, 100));
  }

  // Threshold
  const thresholdInput = document.getElementById('leaf-threshold');
  const thresholdValue = document.getElementById('leaf-threshold-value');
  if (thresholdInput) {
    thresholdInput.value = AppState.leafSegment.simulator.threshold * 100;
    if (thresholdValue) {
      thresholdValue.textContent = `${Math.round(AppState.leafSegment.simulator.threshold * 100)}%`;
    }

    thresholdInput.addEventListener('input', (e) => {
      const value = e.target.value / 100;
      AppState.leafSegment.simulator.setThreshold(value);
      if (thresholdValue) {
        thresholdValue.textContent = `${e.target.value}%`;
      }
    });
  }
}

/**
 * 初始化 Leaf-Segment
 */
async function initLeafSegment() {
  try {
    await AppState.leafSegment.simulator.initialize();
    Toast.show('Leaf-Segment 初始化成功', 'success');
  } catch (error) {
    Toast.show(error.message, 'error');
  }
}

/**
 * 獲取 Leaf-Segment ID
 */
async function getLeafSegmentId() {
  try {
    const result = await AppState.leafSegment.simulator.getNextId();

    const output = document.getElementById('leaf-id-output');
    if (output) {
      output.textContent = result.id.toLocaleString();
      output.classList.add('animate-pulse');
      setTimeout(() => output.classList.remove('animate-pulse'), 500);
    }
  } catch (error) {
    Toast.show(error.message, 'error');
  }
}

/**
 * 高併發模擬
 */
async function burstLeafSegment() {
  const countInput = document.getElementById('leaf-burst-count');
  const count = countInput ? clamp(safeParseInt(countInput.value, 100), 10, 1000) : 100;

  const output = document.getElementById('leaf-id-output');
  let generated = 0;

  const interval = setInterval(async () => {
    try {
      const result = await AppState.leafSegment.simulator.getNextId();
      generated++;

      if (output) {
        output.textContent = result.id.toLocaleString();
      }

      if (generated >= count) {
        clearInterval(interval);
        Toast.show(`已生成 ${count} 個 ID`, 'success');
      }
    } catch (error) {
      clearInterval(interval);
      Toast.show(error.message, 'error');
    }
  }, 10);
}

/**
 * 模擬資料庫故障
 */
async function simulateDbFailure() {
  Toast.show('模擬資料庫故障中 (5秒)...', 'warning', 5000);
  await AppState.leafSegment.simulator.simulateDbFailure(5000);
  Toast.show('資料庫已恢復', 'success');
}

/**
 * 重置 Leaf-Segment
 */
function resetLeafSegment() {
  AppState.leafSegment.simulator.reset();
  const output = document.getElementById('leaf-id-output');
  if (output) {
    output.textContent = '-';
  }
  Toast.show('模擬器已重置', 'info');
}

/**
 * 更新 Leaf-Segment 視覺化
 */
function updateLeafSegmentVisualization(state) {
  if (AppState.leafSegment.bufferVisualizer) {
    AppState.leafSegment.bufferVisualizer.render(state);
  }

  if (AppState.leafSegment.dbTableVisualizer) {
    AppState.leafSegment.dbTableVisualizer.render(state.dbTable);
  }

  // 更新統計資訊
  const statsContainer = document.getElementById('leaf-stats');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">已生成 ID</span>
        <span class="stat-value">${state.stats.totalGenerated.toLocaleString()}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">號段請求次數</span>
        <span class="stat-value">${state.stats.segmentsFetched}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Buffer 切換次數</span>
        <span class="stat-value">${state.stats.bufferSwitches}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">DB 狀態</span>
        <span class="stat-value ${state.dbAvailable ? 'text-green' : 'text-orange'}">
          ${state.dbAvailable ? '正常' : '故障'}
        </span>
      </div>
    `;
  }
}

/**
 * 初始化比較區塊
 */
function initComparisonSection() {
  const decisionContainer = document.getElementById('decision-tree');
  if (decisionContainer) {
    const questions = [
      {
        text: '您的系統是否需要完全連續遞增的 ID？',
        options: [
          { label: '是，必須連續', next: 1 },
          { label: '否，趨勢遞增即可', next: 2 }
        ]
      },
      {
        type: 'result',
        recommendation: 'leaf-segment',
        reason: 'Leaf-Segment 提供完全連續遞增的 ID，適合需要連續序號的場景。'
      },
      {
        text: '您是否可以接受對資料庫的依賴？',
        options: [
          { label: '可以，有現有 DB 基礎設施', next: 3 },
          { label: '不行，希望無依賴', next: 4 }
        ]
      },
      {
        text: '您更看重哪個特性？',
        options: [
          { label: 'ID 可讀性高', next: 5 },
          { label: '極致性能', next: 4 }
        ]
      },
      {
        type: 'result',
        recommendation: 'snowflake',
        reason: 'Snowflake 無外部依賴，本地生成效能極高，適合高併發場景。'
      },
      {
        type: 'result',
        recommendation: 'leaf-segment',
        reason: 'Leaf-Segment 生成純數字 ID，可讀性高且易於調試。'
      }
    ];

    new DecisionTree(decisionContainer, questions);
  }
}

/**
 * 初始化程式碼範例區塊
 */
function initCodeExamples() {
  const codeExampleContainers = document.querySelectorAll('.code-example');
  codeExampleContainers.forEach(container => {
    new TabSwitcher(container);
  });
}

// DOM Ready 時初始化
document.addEventListener('DOMContentLoaded', initApp);

// 導出給外部使用
if (typeof window !== 'undefined') {
  window.AppState = AppState;
  window.generateSnowflakeId = generateSnowflakeId;
  window.getLeafSegmentId = getLeafSegmentId;
}
