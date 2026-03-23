import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

async function loadRules() {
    console.log('🛡️ Loading Firestore Rules into Emulator...');
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');

    // initializing the environment automatically loads the rules to the emulator running on 8080
    await initializeTestEnvironment({
        projectId: 'demo-uat-project',
        firestore: { rules, host: '127.0.0.1', port: 8080 },
    });

    console.log('✅ Rules loaded successfully. Not running cleanup so they persist.');
    process.exit(0);
}

loadRules().catch(console.error);
