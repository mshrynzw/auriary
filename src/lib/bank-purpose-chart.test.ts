/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import {
  aggregatePurposeSpending,
  purposeBarRows,
  purposeShareBuckets,
  purposeSharePercent,
  recentPurposeBuckets,
  recentPurposeMonths,
} from './bank-purpose-chart';

const purposes = [
  { id: 1, name: '買い食い', text_color: '#DC2626' },
  { id: 2, name: '食費', text_color: '#2563eb' },
];

describe('用途グラフの月', () => {
  it('今月を含む直近3か月を、同じ年なら月だけで出す', () => {
    expect(recentPurposeMonths(new Date(2026, 10, 7), 3)).toEqual([
      { key: '2026-09', label: '9月' },
      { key: '2026-10', label: '10月' },
      { key: '2026-11', label: '11月' },
    ]);
  });

  it('年をまたぐときは年も付ける', () => {
    expect(recentPurposeMonths(new Date(2026, 0, 15), 3)).toEqual([
      { key: '2025-11', label: '2025年11月' },
      { key: '2025-12', label: '2025年12月' },
      { key: '2026-01', label: '2026年1月' },
    ]);
  });
});

describe('用途ごとの支払', () => {
  const now = new Date(2026, 10, 7);

  it('支払を月と用途で足し、入金と期間外は除く', () => {
    const chart = aggregatePurposeSpending(
      now,
      3,
      [
        { txn_date: '2026-11-06', txn_type: '支払', amount: 278, purpose_id: 2 },
        { txn_date: '2026-11-06', txn_type: '支払', amount: 100, purpose_id: 2 },
        { txn_date: '2026-11-04', txn_type: '入金', amount: 1475, purpose_id: 2 },
        { txn_date: '2026-10-02', txn_type: '支払', amount: 500, purpose_id: null },
        { txn_date: '2026-10-03', txn_type: '支払', amount: 40, purpose_id: 99 },
        { txn_date: '2026-08-01', txn_type: '支払', amount: 9999, purpose_id: 1 },
      ],
      purposes,
    );

    expect(chart.series).toEqual([
      { key: 'purpose-2', name: '食費', color: '#2563eb' },
      { key: 'unset', name: '未設定', color: '#808080' },
    ]);
    expect(chart.months.map((month) => [month.label, month.total])).toEqual([
      ['9月', 0],
      ['10月', 540],
      ['11月', 378],
    ]);
    expect(chart.months[1]?.slices).toEqual([
      { key: 'unset', name: '未設定', color: '#808080', amount: 540 },
    ]);
    expect(chart.months[2]?.slices[0]).toMatchObject({ name: '食費', amount: 378 });
    expect(purposeBarRows(chart)[2]).toMatchObject({ label: '11月', 'purpose-2': 378, unset: 0 });
    expect(purposeSharePercent(378, 378)).toBe(100);
    expect(purposeShareBuckets(chart).map((month) => month.label)).toEqual(['11月', '10月', '9月']);
  });

  it('支払がなければ系列を出さない', () => {
    const chart = aggregatePurposeSpending(now, 1, [], purposes);
    expect(chart.series).toEqual([]);
    expect(chart.months).toEqual([{ key: '2026-11', label: '11月', total: 0, slices: [] }]);
  });

  it('週は月曜始まり、年は西暦で分ける', () => {
    const weeks = recentPurposeBuckets(new Date(2026, 10, 7), 2, 'week');
    expect(weeks).toEqual([
      { key: '2026-10-26', label: '10/26' },
      { key: '2026-11-02', label: '11/2' },
    ]);

    const chart = aggregatePurposeSpending(
      now,
      2,
      [{ txn_date: '2026-11-06', txn_type: '支払', amount: 278, purpose_id: 2 }],
      purposes,
      'week',
    );
    expect(chart.months.map((month) => [month.label, month.total])).toEqual([
      ['10/26', 0],
      ['11/2', 278],
    ]);

    expect(recentPurposeBuckets(new Date(2026, 10, 7), 2, 'year')).toEqual([
      { key: '2025', label: '2025年' },
      { key: '2026', label: '2026年' },
    ]);
  });
});
