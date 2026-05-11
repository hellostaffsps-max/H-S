import { describe, it, expect } from 'vitest';
import { getPagination, createPaginatedResponse } from './pagination';

describe('getPagination', () => {
  it('returns correct range for page 1 with default limit', () => {
    const result = getPagination(1, 20);
    expect(result).toEqual({ page: 1, limit: 20, from: 0, to: 19 });
  });

  it('returns correct range for page 3 with limit 10', () => {
    const result = getPagination(3, 10);
    expect(result).toEqual({ page: 3, limit: 10, from: 20, to: 29 });
  });

  it('clamps page to minimum 1', () => {
    const result = getPagination(0, 20);
    expect(result.page).toBe(1);
    expect(result.from).toBe(0);
  });

  it('clamps page to minimum 1 for negative values', () => {
    const result = getPagination(-5, 20);
    expect(result.page).toBe(1);
  });

  it('clamps limit to maximum 100', () => {
    const result = getPagination(1, 200);
    expect(result.limit).toBe(100);
  });

  it('clamps limit to minimum 1', () => {
    const result = getPagination(1, 0);
    expect(result.limit).toBe(1);
  });

  it('uses default values when called with no arguments', () => {
    const result = getPagination();
    expect(result).toEqual({ page: 1, limit: 20, from: 0, to: 19 });
  });
});

describe('createPaginatedResponse', () => {
  it('creates correct pagination for first page', () => {
    const result = createPaginatedResponse([1, 2, 3], 1, 20, 50);
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 50,
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
    });
  });

  it('creates correct pagination for last page', () => {
    const result = createPaginatedResponse([49, 50], 3, 20, 50);
    expect(result.pagination.hasNext).toBe(false);
    expect(result.pagination.hasPrev).toBe(true);
  });

  it('creates correct pagination for middle page', () => {
    const result = createPaginatedResponse([21, 22], 2, 20, 50);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(true);
  });

  it('handles empty data correctly', () => {
    const result = createPaginatedResponse([], 1, 20, 0);
    expect(result.pagination.totalPages).toBe(0);
    expect(result.pagination.hasNext).toBe(false);
    expect(result.pagination.hasPrev).toBe(false);
  });

  it('handles total less than limit', () => {
    const result = createPaginatedResponse([1, 2, 3], 1, 20, 3);
    expect(result.pagination.totalPages).toBe(1);
    expect(result.pagination.hasNext).toBe(false);
  });

  it('calculates totalPages with ceiling', () => {
    const result = createPaginatedResponse([1], 1, 10, 15);
    expect(result.pagination.totalPages).toBe(2);
  });
});
