import { describe, it, expect } from 'vitest';
import { resolveSite } from './proxy';

describe('resolveSite', () => {
  it('resolves standard company hostnames to company', () => {
    expect(resolveSite('40labs.com')).toBe('company');
    expect(resolveSite('www.40labs.com')).toBe('company');
    expect(resolveSite('localhost:3000')).toBe('company');
    expect(resolveSite('localhost')).toBe('company');
    expect(resolveSite('preview.40labs.com')).toBe('company');
  });

  it('resolves core subdomains to core', () => {
    expect(resolveSite('core.40labs.com')).toBe('core');
    expect(resolveSite('core.localhost')).toBe('core');
    expect(resolveSite('core.localhost:3000')).toBe('core');
    expect(resolveSite('core.40labs.com:443')).toBe('core');
  });

  it('handles empty, null, or undefined host headers', () => {
    expect(resolveSite(null)).toBe('company');
    expect(resolveSite(undefined)).toBe('company');
    expect(resolveSite('')).toBe('company');
    expect(resolveSite('   ')).toBe('company');
  });

  it('handles uppercase host headers case-insensitively', () => {
    expect(resolveSite('CORE.40LABS.COM')).toBe('core');
    expect(resolveSite('WWW.40LABS.COM')).toBe('company');
    expect(resolveSite('CORE.LOCALHOST:3000')).toBe('core');
  });

  it('handles trailing dots correctly', () => {
    expect(resolveSite('core.40labs.com.')).toBe('core');
    expect(resolveSite('40labs.com.')).toBe('company');
  });

  it('rejects spoofed domains like core.40labs.com.evil.com', () => {
    expect(resolveSite('core.40labs.com.evil.com')).toBe('company');
    expect(resolveSite('notcore.40labs.com')).toBe('company');
  });
});
