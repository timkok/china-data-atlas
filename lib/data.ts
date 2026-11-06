import fs from 'node:fs';
import path from 'node:path';
import type {Atlas} from './types';
export function getAtlas():Atlas {const p=path.join(process.cwd(),'data/atlas.json');return fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):{indicators:[],regions:[],observations:[],sources:[]};}
