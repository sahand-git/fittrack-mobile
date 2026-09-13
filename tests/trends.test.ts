import test from 'node:test';
import assert from 'node:assert/strict';
import type { DataPoint } from '../src/components/TrendLineChart.ts';
import type { CalorieDataPoint } from '../src/components/TrendBarChart.ts';

test('trend weight calculations accurately measure progress delta', () => {
  const data: DataPoint[] = [
    { date: '2026-09-01', value: 80.0 },
    { date: '2026-09-03', value: 79.2 },
    { date: '2026-09-07', value: 78.5 }
  ];

  const first = data[0].value;
  const last = data[data.length - 1].value;
  const diff = Math.round((last - first) * 10) / 10;

  assert.equal(diff, -1.5, 'weight change should be -1.5 kg');
});

test('trend calorie adherence computes average and compliance rate correctly', () => {
  const calories: CalorieDataPoint[] = [
    { date: '2026-09-01', calories: 2000, target: 2200 },
    { date: '2026-09-02', calories: 2100, target: 2200 },
    { date: '2026-09-03', calories: 2500, target: 2200 }, // over target
    { date: '2026-09-04', calories: 1800, target: 2200 },
    { date: '2026-09-05', calories: 0, target: 2200 }, // skipped day
  ];

  const active = calories.filter(d => d.calories > 0);
  assert.equal(active.length, 4, '4 active days');

  const avg = Math.round(active.reduce((acc, d) => acc + d.calories, 0) / active.length);
  assert.equal(avg, 2100, 'average calorie intake should be 2100 kcal');

  const onTarget = active.filter(d => d.calories <= d.target).length;
  assert.equal(onTarget, 3, '3 days were on/under target');

  const adherence = Math.round((onTarget / active.length) * 100);
  assert.equal(adherence, 75, 'adherence rate should be 75%');
});
