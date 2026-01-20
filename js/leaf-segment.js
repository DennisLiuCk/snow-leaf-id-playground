/**
 * Leaf-Segment ID Simulator
 *
 * 美團 Leaf 號段模式模擬器
 * 使用雙 Buffer 機制確保高可用性
 *
 * 架構示意:
 * ┌─────────────────────────────────────────────────────────┐
 * │                    Database Table                       │
 * │  ┌──────────┬─────────┬──────────┬───────────────────┐  │
 * │  │ biz_tag  │ max_id  │   step   │    update_time    │  │
 * │  └──────────┴─────────┴──────────┴───────────────────┘  │
 * └─────────────────────────────────────────────────────────┘
 *                            │
 *                            ▼
 * ┌─────────────────────────────────────────────────────────┐
 * │                   Application Memory                    │
 * │  ┌───────────────────────┬───────────────────────────┐  │
 * │  │  Buffer 1 (Active)    │  Buffer 2 (Standby)       │  │
 * │  └───────────────────────┴───────────────────────────┘  │
 * └─────────────────────────────────────────────────────────┘
 */

class LeafSegmentSimulator {
  constructor(options = {}) {
    // 業務標籤
    this.bizTag = options.bizTag || 'default';

    // 號段大小（每次從 DB 獲取的 ID 數量）
    this.step = options.step || 1000;

    // 初始最大 ID
    this.maxId = options.maxId || 0;

    // 預載入閾值（當剩餘 ID 低於此比例時觸發預載入）
    this.threshold = options.threshold || 0.2;

    // 模擬的網路延遲（毫秒）
    this.networkLatency = options.networkLatency || 50;

    // 雙 Buffer
    this.buffers = [null, null];
    this.currentBuffer = 0;

    // 狀態
    this.isLoading = false;
    this.dbAvailable = true;

    // 統計資料
    this.stats = {
      totalGenerated: 0,
      segmentsFetched: 0,
      bufferSwitches: 0,
      dbFailures: 0
    };

    // 事件回調
    this.onSegmentLoad = options.onSegmentLoad || (() => {});
    this.onBufferSwitch = options.onBufferSwitch || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    // 資料庫表模擬
    this.dbTable = {
      bizTag: this.bizTag,
      maxId: this.maxId,
      step: this.step,
      updateTime: new Date()
    };
  }

  /**
   * 初始化 - 載入第一個號段
   */
  async initialize() {
    await this._loadSegment(0);
    this._notifyStateChange();
    return this.getState();
  }

  /**
   * 獲取下一個 ID
   * @returns {Object} 包含 ID 和 Buffer 狀態的物件
   */
  async getNextId() {
    const buffer = this.buffers[this.currentBuffer];

    // 檢查當前 Buffer 是否可用
    if (!buffer || buffer.currentId > buffer.maxId) {
      // 嘗試切換到備用 Buffer
      if (await this._trySwitch()) {
        return this.getNextId();
      }
      throw new Error('No available IDs. All buffers exhausted.');
    }

    const id = buffer.currentId++;
    this.stats.totalGenerated++;

    // 檢查是否需要預載入下一個號段
    const remaining = buffer.maxId - buffer.currentId + 1;
    const total = buffer.maxId - buffer.minId + 1;
    const usageRatio = 1 - (remaining / total);

    if (usageRatio >= (1 - this.threshold) && !this.isLoading) {
      this._preloadNextSegment();
    }

    this._notifyStateChange();

    return {
      id: id,
      bufferState: this.getBufferState(),
      usageRatio: usageRatio
    };
  }

  /**
   * 批量獲取 ID
   */
  async getNextIds(count) {
    const ids = [];
    for (let i = 0; i < count; i++) {
      const result = await this.getNextId();
      ids.push(result);
    }
    return ids;
  }

  /**
   * 載入號段到指定 Buffer
   * @private
   */
  async _loadSegment(bufferIndex) {
    if (!this.dbAvailable) {
      this.stats.dbFailures++;
      throw new Error('Database unavailable');
    }

    this.isLoading = true;
    this._notifyStateChange();

    // 模擬網路延遲
    await this._simulateLatency();

    // 更新資料庫表
    const newMaxId = this.dbTable.maxId + this.step;
    const minId = this.dbTable.maxId + 1;

    this.dbTable.maxId = newMaxId;
    this.dbTable.updateTime = new Date();

    // 建立新號段
    this.buffers[bufferIndex] = {
      minId: minId,
      maxId: newMaxId,
      currentId: minId,
      loadTime: new Date(),
      status: bufferIndex === this.currentBuffer ? 'active' : 'standby'
    };

    this.stats.segmentsFetched++;
    this.isLoading = false;

    this.onSegmentLoad({
      bufferIndex,
      segment: this.buffers[bufferIndex],
      dbState: { ...this.dbTable }
    });

    this._notifyStateChange();

    return this.buffers[bufferIndex];
  }

  /**
   * 預載入下一個號段
   * @private
   */
  async _preloadNextSegment() {
    const nextBuffer = 1 - this.currentBuffer;

    // 如果下一個 Buffer 已經有資料且未用完，不需要載入
    if (this.buffers[nextBuffer] &&
        this.buffers[nextBuffer].currentId <= this.buffers[nextBuffer].maxId) {
      return;
    }

    try {
      await this._loadSegment(nextBuffer);
    } catch (error) {
      console.warn('Failed to preload segment:', error.message);
    }
  }

  /**
   * 嘗試切換 Buffer
   * @private
   */
  async _trySwitch() {
    const nextBuffer = 1 - this.currentBuffer;
    const buffer = this.buffers[nextBuffer];

    // 如果下一個 Buffer 可用
    if (buffer && buffer.currentId <= buffer.maxId) {
      // 更新狀態
      if (this.buffers[this.currentBuffer]) {
        this.buffers[this.currentBuffer].status = 'exhausted';
      }
      buffer.status = 'active';

      this.currentBuffer = nextBuffer;
      this.stats.bufferSwitches++;

      this.onBufferSwitch({
        fromBuffer: 1 - nextBuffer,
        toBuffer: nextBuffer,
        bufferState: this.getBufferState()
      });

      this._notifyStateChange();
      return true;
    }

    // 嘗試載入新號段
    if (!this.isLoading) {
      try {
        await this._loadSegment(nextBuffer);
        return this._trySwitch();
      } catch (error) {
        return false;
      }
    }

    return false;
  }

  /**
   * 模擬網路延遲
   * @private
   */
  _simulateLatency() {
    return new Promise(resolve => {
      setTimeout(resolve, this.networkLatency);
    });
  }

  /**
   * 通知狀態變更
   * @private
   */
  _notifyStateChange() {
    this.onStateChange(this.getState());
  }

  /**
   * 取得 Buffer 狀態
   */
  getBufferState() {
    return {
      buffer1: this.buffers[0] ? { ...this.buffers[0] } : null,
      buffer2: this.buffers[1] ? { ...this.buffers[1] } : null,
      activeBuffer: this.currentBuffer,
      isLoading: this.isLoading
    };
  }

  /**
   * 取得完整狀態
   */
  getState() {
    return {
      bizTag: this.bizTag,
      step: this.step,
      threshold: this.threshold,
      bufferState: this.getBufferState(),
      dbTable: { ...this.dbTable },
      stats: { ...this.stats },
      dbAvailable: this.dbAvailable
    };
  }

  /**
   * 模擬資料庫故障
   * @param {number} duration - 故障持續時間（毫秒）
   */
  simulateDbFailure(duration = 5000) {
    this.dbAvailable = false;
    this._notifyStateChange();

    return new Promise(resolve => {
      setTimeout(() => {
        this.dbAvailable = true;
        this._notifyStateChange();
        resolve();
      }, duration);
    });
  }

  /**
   * 設定網路延遲
   */
  setNetworkLatency(latency) {
    this.networkLatency = latency;
  }

  /**
   * 設定號段大小
   */
  setStep(step) {
    this.step = step;
    this.dbTable.step = step;
  }

  /**
   * 設定預載入閾值
   */
  setThreshold(threshold) {
    this.threshold = Math.min(Math.max(threshold, 0.1), 0.5);
  }

  /**
   * 重置模擬器
   */
  reset() {
    this.buffers = [null, null];
    this.currentBuffer = 0;
    this.isLoading = false;
    this.dbAvailable = true;

    this.dbTable = {
      bizTag: this.bizTag,
      maxId: this.maxId,
      step: this.step,
      updateTime: new Date()
    };

    this.stats = {
      totalGenerated: 0,
      segmentsFetched: 0,
      bufferSwitches: 0,
      dbFailures: 0
    };

    this._notifyStateChange();
  }

  /**
   * 計算當前可用 ID 數量
   */
  getAvailableIds() {
    let count = 0;

    for (const buffer of this.buffers) {
      if (buffer && buffer.currentId <= buffer.maxId) {
        count += buffer.maxId - buffer.currentId + 1;
      }
    }

    return count;
  }

  /**
   * 取得使用統計
   */
  getUsageStats() {
    const activeBuffer = this.buffers[this.currentBuffer];

    if (!activeBuffer) {
      return {
        usagePercent: 0,
        remaining: 0,
        total: 0
      };
    }

    const total = activeBuffer.maxId - activeBuffer.minId + 1;
    const used = activeBuffer.currentId - activeBuffer.minId;
    const remaining = total - used;

    return {
      usagePercent: Math.round((used / total) * 100),
      remaining: remaining,
      total: total,
      used: used
    };
  }
}

/**
 * Leaf-Segment 工具函數
 */
const LeafSegmentUtils = {
  /**
   * 計算建議的號段大小
   * 基於 QPS 和期望的 DB 訪問頻率
   */
  calculateRecommendedStep(qps, dbAccessIntervalSeconds = 60) {
    // 號段大小 = QPS × 期望的 DB 訪問間隔
    return Math.ceil(qps * dbAccessIntervalSeconds);
  },

  /**
   * 計算號段可用時間
   */
  calculateSegmentDuration(step, qps) {
    if (qps <= 0) return Infinity;
    return step / qps; // 秒
  },

  /**
   * 估算資料庫負載
   */
  estimateDbLoad(qps, step) {
    // 每秒 DB 請求數 = QPS / 號段大小
    return qps / step;
  },

  /**
   * 格式化 ID 範圍
   */
  formatRange(minId, maxId) {
    return `${minId.toLocaleString()} - ${maxId.toLocaleString()}`;
  },

  /**
   * 計算預載入時機
   */
  calculatePreloadPoint(minId, maxId, threshold) {
    const total = maxId - minId + 1;
    const preloadAt = Math.floor(minId + total * (1 - threshold));
    return preloadAt;
  }
};

// 導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LeafSegmentSimulator, LeafSegmentUtils };
}
