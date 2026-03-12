
import selfsigned from 'selfsigned';
import * as fs from 'fs';
import path from 'path';

console.log('Starting cert generation...');
const attrs = [{ name: 'commonName', value: 'localhost' }];

// Using top-level await (requires ES module)
console.log('Generating keys (this may take a moment)...');
const pems = await selfsigned.generate(attrs, { days: 365 });

const certDir = path.join(process.cwd(), 'certs');
console.log('Cert Dir:', certDir);

if (!fs.existsSync(certDir)) {
    console.log('Creating dir...');
    fs.mkdirSync(certDir);
}

fs.writeFileSync(path.join(certDir, 'server.key'), pems.private);
fs.writeFileSync(path.join(certDir, 'server.cert'), pems.cert);
console.log('Done.');
