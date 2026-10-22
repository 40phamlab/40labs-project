// [PHASE: marketplace-preview — Marketplace search]
import { describe, it, expect } from 'vitest';
import { templateCatalogRepo } from '../templateRepos';

describe('Marketplace Search Performance (5k cache)', () => {
  it('searches catalog within 50ms', async () => {
    const startTime = performance.now();
    await templateCatalogRepo.searchProducts('paracetamol');
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(50);
  });
});
