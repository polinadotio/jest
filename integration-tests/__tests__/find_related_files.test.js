/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import runJest from '../runJest';
import os from 'os';
import path from 'path';

const {cleanup, writeFiles} = require('../Utils');

const SkipOnWindows = require('../../scripts/SkipOnWindows');
const DIR = path.resolve(os.tmpdir(), 'find_related_tests_test');

SkipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

//this is correct
test('runs tests related to filename', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/test.test.js': `
      const a = require('../a');
      test('a', () => {});
    `,
    'a.js': 'module.exports = {};',
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  const {stdout} = runJest(DIR, ['a.js']);
  expect(stdout).toMatch('');

  const {stderr} = runJest(DIR, ['--findRelatedTests', 'a.js']);
  expect(stderr).toMatch('PASS __tests__/test.test.js');

  const summaryMsg = 'Ran all test suites related to files matching /a.js/i.';
  expect(stderr).toMatch(summaryMsg);
});

//this is correct
test('runs tests when path matches', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/test.test.js': `
      const a = require('../a');
      test('a', () => {});
    `,
    'a.js': 'module.exports = {};',
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  const {stdout} = runJest(DIR, ['a.js']);
  expect(stdout).toMatch('');

  const {stderr} = runJest(DIR, [
    '--testPathPattern',
    '__tests__',
  ]);
  expect(stderr).toMatch('PASS __tests__/test.test.js');

  const summaryMsg = 'Ran all test suites matching /__tests__/i.';
  expect(stderr).toMatch(summaryMsg);
});

//this is correct
test('does not run test when filename does not match but path matches', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/test.test.js': `
      const a = require('../a');
      test('a', () => {});
    `,
    'a.js': 'module.exports = {};',
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  const {stdout} = runJest(DIR, [
    '--testPathPattern',
    '__tests__',
    '--findRelatedTests',
    'foo.js',
  ]);
  expect(stdout).toMatch('No tests found');

  const summaryMsg = 'Pattern: foo.js|__tests__ - 0 matches';
  expect(stdout).toMatch(summaryMsg);
});

// this is a bug
test('runs tests when filename matches but path does not match', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/test.test.js': `
      const a = require('../a');
      test('a', () => {});
    `,
    'a.js': 'module.exports = {};',
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  const {stdout} = runJest(DIR, ['a.js']);
  expect(stdout).toMatch('');

  const {stderr} = runJest(DIR, [
    '--testPathPattern',
    'abcdd',
    '--findRelatedTests',
    'a.js',
  ]);
  expect(stderr).toMatch('PASS __tests__/test.test.js');

  const summaryMsg = 'Ran all test suites related to files matching /a.js|abcdd/i.';
  expect(stderr).toMatch(summaryMsg);
});
