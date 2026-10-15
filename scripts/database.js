import mongoose from 'mongoose';
import { MongoBinary } from 'mongodb-memory-server-core';
import { mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopkart?replicaSet=rs0';
if (!uri.startsWith('mongodb://127.0.0.1:27017/')) {
  console.log('Using the configured external MongoDB database.');
  process.exit(0);
}
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
  await mongoose.disconnect();
  console.log('Local MongoDB is already running.');
  process.exit(0);
} catch { await mongoose.disconnect(); }

const directory = fileURLToPath(new URL('../.local/mongodb/', import.meta.url));
await mkdir(directory, { recursive: true });
const binary = await MongoBinary.getPath({ version: '7.0.24' });
// Keep database files in the project between restarts.
execFileSync(binary, ['--replSet', 'rs0', '--bind_ip', '127.0.0.1', '--port', '27017', '--dbpath', directory, '--logpath', path.join(directory, 'mongod.log'), '--fork'], { stdio: 'inherit' });
await mongoose.connect('mongodb://127.0.0.1:27017/admin?directConnection=true');
const admin = mongoose.connection.db.admin();
try { await admin.command({ replSetGetStatus: 1 }); }
catch (error) {
  if (error.code !== 94) throw error;
  await admin.command({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27017' }] } });
}
for (let attempt = 0; attempt < 60; attempt++) {
  if ((await admin.command({ hello: 1 })).isWritablePrimary) break;
  if (attempt === 59) throw new Error('MongoDB did not become ready. Check .local/mongodb/mongod.log');
  await new Promise(resolve => setTimeout(resolve, 500));
}
await mongoose.disconnect();
console.log('Local MongoDB is ready.');
