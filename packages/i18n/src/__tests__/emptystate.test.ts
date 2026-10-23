import { describe, test, expect } from 'vitest';
import { t, translations } from '../index';

describe('EmptyState i18n keys and Value Rules verification', () => {
  test('assert EmptyState i18n keys exist in both sw-TZ and en locales', () => {
    const keys = [
      'emptystate.empty.title',
      'emptystate.empty.desc',
      'emptystate.filtered.title',
      'emptystate.filtered.desc',
      'emptystate.filtered.action',
      'emptystate.error.title',
      'emptystate.error.desc',
      'emptystate.error.action',
      'emptystate.offline.title',
      'emptystate.offline.desc',
      'emptystate.noAccess.title',
      'emptystate.noAccess.desc',
      'value.notProvided',
    ];

    for (const key of keys) {
      expect(translations['sw-TZ'].common).toHaveProperty(key);
      expect(translations['en'].common).toHaveProperty(key);

      expect(t(key as any)).toBeTruthy();
    }
  });
});
