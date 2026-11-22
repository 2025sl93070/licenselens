import { ParsedDependency } from '../parsers';
import { LicenseId } from '../types';

const NPM_SAMPLE: Array<{ name: string; version: string; license: LicenseId; direct: boolean }> = [
  { name: 'express', version: '4.18.2', license: 'MIT', direct: true },
  { name: 'lodash', version: '4.17.21', license: 'MIT', direct: true },
  { name: 'react', version: '18.2.0', license: 'MIT', direct: true },
  { name: 'react-dom', version: '18.2.0', license: 'MIT', direct: true },
  { name: 'axios', version: '1.4.0', license: 'MIT', direct: true },
  { name: 'winston', version: '3.9.0', license: 'MIT', direct: true },
  { name: 'helmet', version: '7.0.0', license: 'MIT', direct: true },
  { name: 'cors', version: '2.8.5', license: 'MIT', direct: true },
  { name: 'dotenv', version: '16.0.3', license: 'BSD-2-Clause', direct: true },
  { name: 'uuid', version: '9.0.0', license: 'MIT', direct: true },
  { name: 'sharp', version: '0.32.1', license: 'Apache-2.0', direct: false },
  { name: 'pg', version: '8.11.0', license: 'MIT', direct: true },
  { name: 'sequelize', version: '6.32.1', license: 'MIT', direct: true },
  { name: 'node-fetch', version: '3.3.1', license: 'MIT', direct: false },
  { name: 'body-parser', version: '1.20.2', license: 'MIT', direct: false },
  { name: 'debug', version: '4.3.4', license: 'MIT', direct: false },
  { name: 'ms', version: '2.1.3', license: 'MIT', direct: false },
  { name: 'ansi-regex', version: '6.0.1', license: 'MIT', direct: false },
  { name: 'mkdirp', version: '3.0.1', license: 'MIT', direct: false },
  { name: 'socket.io', version: '4.6.2', license: 'MIT', direct: true },
  { name: 'handlebars', version: '4.7.7', license: 'MIT', direct: false },
  { name: 'node-redis', version: '4.6.7', license: 'MIT', direct: true },
  { name: 'libxml2', version: '2.9.14', license: 'GPL-2.0', direct: false },
  { name: 'ffmpeg-static', version: '5.1.0', license: 'GPL-3.0', direct: false },
  { name: 'some-analytics-sdk', version: '2.0.1', license: 'AGPL-3.0', direct: true },
  { name: 'crypto-utils', version: '1.2.0', license: 'LGPL-2.1', direct: false },
  { name: 'enterprise-module', version: '0.9.0', license: 'UNKNOWN', direct: true },
  { name: 'react-scripts', version: '5.0.1', license: 'MIT', direct: true },
  { name: 'typescript', version: '5.0.4', license: 'Apache-2.0', direct: false },
  { name: 'prettier', version: '3.0.0', license: 'MIT', direct: false },
];

export function getSampleDependencies(): ParsedDependency[] {
  return NPM_SAMPLE;
}
