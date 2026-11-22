import { Policy } from '../types';

export const DEFAULT_POLICIES: Policy[] = [
  {
    id: 'enterprise-safe',
    name: 'Enterprise Safe',
    description: 'Allows only permissive licenses suitable for commercial products. Blocks all copyleft and unknown licenses.',
    rules: [
      {
        id: 'deny-agpl',
        name: 'Deny AGPL',
        description: 'AGPL-3.0 is incompatible with most commercial products due to network copyleft obligations.',
        type: 'deny',
        licenses: ['AGPL-3.0'],
      },
      {
        id: 'deny-gpl',
        name: 'Deny GPL',
        description: 'GPL licenses require derivative works to be open-sourced under the same terms.',
        type: 'deny',
        licenses: ['GPL-2.0', 'GPL-3.0'],
      },
      {
        id: 'warn-weak-copyleft',
        name: 'Warn on Weak Copyleft',
        description: 'Weak copyleft licenses may impose conditions depending on how the library is linked.',
        type: 'warn',
        licenses: ['LGPL-2.1', 'LGPL-3.0', 'MPL-2.0', 'EPL-1.0', 'EPL-2.0'],
      },
      {
        id: 'deny-unknown',
        name: 'Deny Unknown Licenses',
        description: 'Dependencies with unknown or unidentified licenses pose legal risk.',
        type: 'deny',
        riskLevels: ['high', 'critical'],
        licenses: ['UNKNOWN'],
      },
    ],
  },
  {
    id: 'open-source-friendly',
    name: 'Open Source Friendly',
    description: 'Permits most open-source licenses. Only blocks AGPL and flags unknown licenses.',
    rules: [
      {
        id: 'deny-agpl-oss',
        name: 'Deny AGPL (network copyleft)',
        description: 'AGPL network copyleft obligations are rarely acceptable even in OSS projects.',
        type: 'deny',
        licenses: ['AGPL-3.0'],
      },
      {
        id: 'warn-unknown-oss',
        name: 'Warn Unknown Licenses',
        description: 'Dependencies with unidentified licenses should be reviewed.',
        type: 'warn',
        licenses: ['UNKNOWN'],
      },
    ],
  },
  {
    id: 'permissive-only',
    name: 'Permissive Only',
    description: 'Only permits MIT, Apache-2.0, BSD, ISC, CC0 and Unlicense. Blocks everything else.',
    rules: [
      {
        id: 'deny-all-copyleft',
        name: 'Deny All Copyleft',
        description: 'No copyleft licenses allowed.',
        type: 'deny',
        categories: ['strong-copyleft', 'weak-copyleft', 'network-copyleft'],
      },
      {
        id: 'deny-unknown-strict',
        name: 'Deny Unknown Licenses (Strict)',
        description: 'Any dependency without a recognized permissive license is blocked.',
        type: 'deny',
        licenses: ['UNKNOWN'],
      },
    ],
  },
];
