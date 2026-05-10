
import fs from 'fs';
import path from 'path';

export function logErrorToFile(content: string) {
    if (process.env.NODE_ENV === 'production') {
        console.error('Debug file logging is disabled in production.');
        return;
    }

    const logPath = path.join(process.cwd(), 'debug_error.log');
    fs.appendFileSync(logPath, `\n\n--- DATE: ${new Date().toISOString()} ---\n${content}`);
}
