import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkoutDuration } from '../src/utils/workoutInput.ts';

test('keeps an empty duration invalid while accepting whole minutes', () => {
  assert.equal(parseWorkoutDuration(''), null);
  assert.equal(parseWorkoutDuration('30'), 30);
  for (const value of ['0', '1.5', '361', 'abc']) {
    assert.equal(parseWorkoutDuration(value), null);
  }
});
