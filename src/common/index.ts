import * as path from 'path';

export const projectDir = path.resolve(__dirname, '../../');
export const dataDir: string = process.env.DATA_DIR !== undefined ? path.resolve(process.env.DATA_DIR) :  path.resolve(projectDir, './data');


