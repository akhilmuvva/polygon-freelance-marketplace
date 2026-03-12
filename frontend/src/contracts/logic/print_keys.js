
import selfsigned from 'selfsigned';
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });
console.log('Is Promise?', pems instanceof Promise);
console.dir(pems, { depth: null });
