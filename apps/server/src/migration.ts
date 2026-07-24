import { generateMigration, revertLastMigration, runMigrations } from '@vendure/core';
import { config } from './vendure-config';

const action = process.argv[2];

if (action === 'generate') {
    generateMigration(config, {
        name: process.argv[3] || 'migration',
    }).then(() => process.exit(0));
} else if (action === 'run') {
    runMigrations(config).then(() => process.exit(0));
} else if (action === 'revert') {
    revertLastMigration(config).then(() => process.exit(0));
}
