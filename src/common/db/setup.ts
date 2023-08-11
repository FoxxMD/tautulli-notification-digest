import {Sequelize} from "sequelize";

import * as request from './models/TautulliRequest.js';
import * as files from './models/TautulliRequestFile.js';

export const setupMappings = (db: Sequelize) => {
    request.init(db);
    files.init(db);

    request.associate();
    files.associate();
}
