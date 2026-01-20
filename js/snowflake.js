/**
 * Snowflake ID Generator
 *
 * 64-bit ID Structure:
 * ┌────────┬────────────────────────┬──────────┬──────────────┐
 * │ 1 bit  │        41 bits         │ 10 bits  │   12 bits    │
 * │ 符號位  │        時間戳記         │ 機器 ID  │    序列號    │
 * │   0    │ 毫秒級時間戳 (69年週期) │ 最多1024 │ 每毫秒4096個 │
 * └────────┴────────────────────────┴──────────┴──────────────┘
 */

class SnowflakeGenerator {
  // 各區塊的位元數
  static SIGN_BITS = 1;
  static TIMESTAMP_BITS = 41;
  static DATACENTER_BITS = 5;
  static WORKER_BITS = 5;
  static SEQUENCE_BITS = 12;

  // 最大值
  static MAX_DATACENTER_ID = (1 << SnowflakeGenerator.DATACENTER_BITS) - 1; // 31
  static MAX_WORKER_ID = (1 << SnowflakeGenerator.WORKER_BITS) - 1; // 31
  static MAX_SEQUENCE = (1 << SnowflakeGenerator.SEQUENCE_BITS) - 1; // 4095
  static MAX_TIMESTAMP = (1n << BigInt(SnowflakeGenerator.TIMESTAMP_BITS)) - 1n; // 2^41 - 1

  // 位移量
  static WORKER_SHIFT = SnowflakeGenerator.SEQUENCE_BITS;
  static DATACENTER_SHIFT = SnowflakeGenerator.SEQUENCE_BITS + SnowflakeGenerator.WORKER_BITS;
  static TIMESTAMP_SHIFT = SnowflakeGenerator.SEQUENCE_BITS + SnowflakeGenerator.WORKER_BITS + SnowflakeGenerator.DATACENTER_BITS;

  constructor(options = {}) {
    // 設定 Epoch（預設：2020-01-01 00:00:00 UTC）
    this.epoch = options.epoch || new Date('2020-01-01T00:00:00Z').getTime();

    // 設定 Datacenter ID
    this.datacenterId = options.datacenterId ?? 1;
    if (this.datacenterId < 0 || this.datacenterId > SnowflakeGenerator.MAX_DATACENTER_ID) {
      throw new Error(`Datacenter ID must be between 0 and ${SnowflakeGenerator.MAX_DATACENTER_ID}`);
    }

    // 設定 Worker ID
    this.workerId = options.workerId ?? 1;
    if (this.workerId < 0 || this.workerId > SnowflakeGenerator.MAX_WORKER_ID) {
      throw new Error(`Worker ID must be between 0 and ${SnowflakeGenerator.MAX_WORKER_ID}`);
    }

    // 初始化序列號和時間戳記
    this.sequence = 0;
    this.lastTimestamp = -1n;
  }

  /**
   * 生成單一 ID
   * @returns {Object} 包含 ID 和各區塊分解的物件
   */
  generate() {
    let timestamp = BigInt(Date.now() - this.epoch);

    // 時鐘回撥檢查
    if (timestamp < this.lastTimestamp) {
      const diff = this.lastTimestamp - timestamp;
      throw new Error(`Clock moved backwards. Refusing to generate ID for ${diff}ms`);
    }

    // 同一毫秒內
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & SnowflakeGenerator.MAX_SEQUENCE;

      // 序列號溢出，等待下一毫秒
      if (this.sequence === 0) {
        timestamp = this._waitNextMillis(timestamp);
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    // 組合 ID
    const id = (timestamp << BigInt(SnowflakeGenerator.TIMESTAMP_SHIFT)) |
               (BigInt(this.datacenterId) << BigInt(SnowflakeGenerator.DATACENTER_SHIFT)) |
               (BigInt(this.workerId) << BigInt(SnowflakeGenerator.WORKER_SHIFT)) |
               BigInt(this.sequence);

    return {
      id: id,
      breakdown: this._getBreakdown(id)
    };
  }

  /**
   * 使用指定參數生成 ID（用於互動式展示）
   * @param {Object} params - 包含 timestamp, datacenterId, workerId, sequence
   * @returns {Object} 包含 ID 和各區塊分解的物件
   */
  generateWithParams(params) {
    const timestamp = BigInt(params.timestamp || (Date.now() - this.epoch));
    const datacenterId = BigInt(params.datacenterId ?? this.datacenterId);
    const workerId = BigInt(params.workerId ?? this.workerId);
    const sequence = BigInt(params.sequence ?? 0);

    const id = (timestamp << BigInt(SnowflakeGenerator.TIMESTAMP_SHIFT)) |
               (datacenterId << BigInt(SnowflakeGenerator.DATACENTER_SHIFT)) |
               (workerId << BigInt(SnowflakeGenerator.WORKER_SHIFT)) |
               sequence;

    return {
      id: id,
      breakdown: this._getBreakdown(id)
    };
  }

  /**
   * 解析 ID
   * @param {BigInt|string|number} id - 要解析的 ID
   * @returns {Object} 解析結果
   */
  parse(id) {
    const bigId = BigInt(id);

    const sequence = Number(bigId & BigInt(SnowflakeGenerator.MAX_SEQUENCE));
    const workerId = Number((bigId >> BigInt(SnowflakeGenerator.WORKER_SHIFT)) & BigInt(SnowflakeGenerator.MAX_WORKER_ID));
    const datacenterId = Number((bigId >> BigInt(SnowflakeGenerator.DATACENTER_SHIFT)) & BigInt(SnowflakeGenerator.MAX_DATACENTER_ID));
    const timestamp = Number((bigId >> BigInt(SnowflakeGenerator.TIMESTAMP_SHIFT)) & SnowflakeGenerator.MAX_TIMESTAMP);

    return {
      timestamp: timestamp,
      absoluteTime: new Date(timestamp + this.epoch),
      datacenterId: datacenterId,
      workerId: workerId,
      sequence: sequence,
      machineId: (datacenterId << 5) | workerId,
      binary: this._getBreakdown(bigId)
    };
  }

  /**
   * 批量生成 ID
   * @param {number} count - 要生成的數量
   * @returns {Array} ID 陣列
   */
  generateBatch(count) {
    const ids = [];
    for (let i = 0; i < count; i++) {
      ids.push(this.generate());
    }
    return ids;
  }

  /**
   * 取得位元分解
   * @private
   */
  _getBreakdown(id) {
    const bigId = BigInt(id);
    const binaryStr = bigId.toString(2).padStart(64, '0');

    return {
      sign: binaryStr.substring(0, 1),
      timestamp: binaryStr.substring(1, 42),
      datacenter: binaryStr.substring(42, 47),
      worker: binaryStr.substring(47, 52),
      sequence: binaryStr.substring(52, 64),
      full: binaryStr
    };
  }

  /**
   * 等待下一毫秒
   * @private
   */
  _waitNextMillis(lastTimestamp) {
    let timestamp = BigInt(Date.now() - this.epoch);
    while (timestamp <= lastTimestamp) {
      timestamp = BigInt(Date.now() - this.epoch);
    }
    return timestamp;
  }

  /**
   * 取得當前時間戳記
   */
  getTimestamp() {
    return Date.now() - this.epoch;
  }

  /**
   * 計算最大可用時間
   */
  getMaxTime() {
    const maxTimestamp = (1n << 41n) - 1n;
    return new Date(Number(maxTimestamp) + this.epoch);
  }

  /**
   * 取得理論最大 QPS（每秒查詢數）
   */
  getTheoreticalMaxQPS() {
    // 每毫秒 4096 個 ID × 1000 毫秒 = 每秒 4,096,000 個 ID
    return (SnowflakeGenerator.MAX_SEQUENCE + 1) * 1000;
  }

  /**
   * 重置序列號（用於測試）
   */
  reset() {
    this.sequence = 0;
    this.lastTimestamp = -1n;
  }
}

/**
 * Snowflake ID 工具函數
 */
const SnowflakeUtils = {
  /**
   * 將 ID 轉換為格式化的二進位字串
   */
  formatBinary(id, separator = ' ') {
    const breakdown = new SnowflakeGenerator().parse(id).binary;
    return `${breakdown.sign}${separator}${breakdown.timestamp}${separator}${breakdown.datacenter}${separator}${breakdown.worker}${separator}${breakdown.sequence}`;
  },

  /**
   * 計算兩個 ID 之間的時間差（毫秒）
   */
  getTimeDiff(id1, id2, epoch) {
    const gen = new SnowflakeGenerator({ epoch });
    const parsed1 = gen.parse(id1);
    const parsed2 = gen.parse(id2);
    return Math.abs(parsed1.timestamp - parsed2.timestamp);
  },

  /**
   * 檢查 ID 是否有效
   */
  isValid(id) {
    try {
      const bigId = BigInt(id);
      return bigId >= 0n && bigId < (1n << 64n);
    } catch {
      return false;
    }
  },

  /**
   * 估算 ID 生成速率
   */
  estimateRate(ids) {
    if (ids.length < 2) return 0;

    const gen = new SnowflakeGenerator();
    const parsed = ids.map(id => gen.parse(id));
    const timeDiff = parsed[parsed.length - 1].timestamp - parsed[0].timestamp;

    if (timeDiff === 0) {
      return ids.length * 1000; // 同一毫秒內，估算為每秒
    }

    return Math.round((ids.length / timeDiff) * 1000);
  }
};

// 導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SnowflakeGenerator, SnowflakeUtils };
}
