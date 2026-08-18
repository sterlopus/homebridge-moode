'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  clampVolume,
  parseMpdKeyValue,
} = require('../lib/mpd-client');

test('parseMpdKeyValue parses MPD status lines', () => {
  const parsed = parseMpdKeyValue([
    'OK MPD 0.24.0',
    'volume: 69',
    'state: play',
    'song: 1',
    'OK',
  ].join('\n'));

  assert.equal(parsed.volume, '69');
  assert.equal(parsed.state, 'play');
  assert.equal(parsed.song, '1');
});

test('clampVolume keeps HomeKit brightness in MPD volume range', () => {
  assert.equal(clampVolume(-5), 0);
  assert.equal(clampVolume(0), 0);
  assert.equal(clampVolume(42.4), 42);
  assert.equal(clampVolume(42.5), 43);
  assert.equal(clampVolume(100), 100);
  assert.equal(clampVolume(150), 100);
  assert.equal(clampVolume('nice'), 0);
});
