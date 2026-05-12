import {describe, it, expect, beforeEach} from 'vitest';
import {LocalStorageAdapter} from '../../src/storage/LocalStorageAdapter.js';

/** A minimal in-memory Storage shim for deterministic tests. */
function makeMemoryStorage() {
    const store = new Map();
    return {
        get length() {
            return store.size;
        },
        key(i) {
            return [...store.keys()][i] ?? null;
        },
        getItem(k) {
            return store.has(k) ? store.get(k) : null;
        },
        setItem(k, v) {
            store.set(k, String(v));
        },                  // 按索引获取键
        removeItem(k) {
            store.delete(k);
        },
        clear() {
            store.clear();
        },
        _store: store,      // 暴露内部存储便于调试
    };
}

describe('LocalStorageAdapter', () => {
    let storage;
    let adapter;

    beforeEach(() => {
        storage = makeMemoryStorage();
        adapter = new LocalStorageAdapter({storage, namespace: 'test'});
    });

    // A. 同意机制测试
    // 测试 1：初始状态为禁用
    it('starts disabled (no consent)', () => {
        expect(adapter.isEnabled()).toBe(false);
    });

    // 测试 2：无同意时保存操作被阻止
    it('saveServices is a no-op without consent', () => {
        const res = adapter.saveServices('app', [{a: 1}]);
        expect(res).toEqual({ok: false, reason: 'no-consent'});
        expect(storage.getItem('test-services-app')).toBeNull();
    });

    // 测试 3：enable() 激活同意并持久化
    it('enable() flips consent and persists the consent flag', () => {
        adapter.enable();
        expect(adapter.isEnabled()).toBe(true);
        expect(storage.getItem('sba-consent')).toBe('granted');
    });

    // B. 数据读写测试
    // 测试 4：同意后成功保存
    it('saveServices writes JSON after consent', () => {
        adapter.enable();
        const res = adapter.saveServices('app', [{id: 1}]);
        expect(res).toEqual({ok: true});
        expect(JSON.parse(storage.getItem('test-services-app'))).toEqual([{id: 1}]);
    }); // 验证数据被序列化为 JSON 并正确存储

    // 测试 5：读取解析后的数组
    it('loadServices returns parsed array', () => {
        storage.setItem('test-services-app', JSON.stringify([{id: 7}]));
        expect(adapter.loadServices('app')).toEqual([{id: 7}]);
    }); // 验证 JSON 反序列化正常工作


    //C. 容错处理测试
    // 测试 6：缺失键返回空数组
    it('loadServices returns [] for missing key', () => {
        expect(adapter.loadServices('nope')).toEqual([]);
    });

    // 测试 7：损坏的 JSON 返回空数组
    it('loadServices returns [] for malformed JSON', () => {
        storage.setItem('test-services-app', '{not valid');
        expect(adapter.loadServices('app')).toEqual([]);
    });

    // 测试 8：非数组值返回空数组
    it('loadServices returns [] when stored value is not an array', () => {
        storage.setItem('test-services-app', JSON.stringify({not: 'array'}));
        expect(adapter.loadServices('app')).toEqual([]);
    });

    // D. 同意撤回测试
    // 测试 9：禁用时清除所有命名空间键
    it('disable() clears all namespaced keys', () => {
        storage.setItem('sba-consent', 'granted');
        storage.setItem('test-services-app', '[]');
        storage.setItem('unrelated-key', 'keep');
        adapter._enabled = true;
        adapter.disable();
        expect(adapter.isEnabled()).toBe(false);
        expect(storage.getItem('test-services-app')).toBeNull();
        expect(storage.getItem('sba-consent')).toBeNull();
        expect(storage.getItem('unrelated-key')).toBe('keep');
    });

    // E. 错误分类测试
    // 测试 10：配额超限特定错误
    it('saveServices reports quota-exceeded specifically', () => {
        adapter.enable();
        storage.setItem = () => {
            const e = new Error('quota');
            e.name = 'QuotaExceededError';
            throw e;
        };
        const res = adapter.saveServices('app', [{}]);
        expect(res.ok).toBe(false);
        expect(res.reason).toBe('quota-exceeded');
    });

    // 测试 11：I/O 错误报告为通用 io-error
    it('saveServices reports generic io-error for other write failures', () => {
        adapter.enable();
        storage.setItem = () => {
            throw new Error('boom');
        };
        const res = adapter.saveServices('app', [{}]);
        expect(res.reason).toBe('io-error');
    });


    // F. Boundary 情况测试
    // 测试 12：null storage（SSR 场景）
    it('handles a null storage (e.g. SSR)', () => {
        const a = new LocalStorageAdapter({storage: null});
        expect(a.isEnabled()).toBe(false);
        expect(a.loadServices('app')).toEqual([]);
        expect(a.saveServices('app', [])).toEqual({ok: false, reason: 'no-consent'});
        a.enable();
        expect(a.saveServices('app', [])).toEqual({ok: false, reason: 'no-storage'});
        a.disable();
    });

    // 测试 13：构造时读取已有同意状态
    it('reads existing consent flag on construction', () => {
        storage.setItem('sba-consent', 'granted');
        const a = new LocalStorageAdapter({storage, namespace: 'test'});
        expect(a.isEnabled()).toBe(true);
    });

    // 测试 14：构造时 getItem 抛出异常
    it('survives a throwing getItem on construction', () => {
        const broken = makeMemoryStorage();
        broken.getItem = () => {
            throw new Error('no');
        };
        const a = new LocalStorageAdapter({storage: broken});
        expect(a.isEnabled()).toBe(false);
    });
});
