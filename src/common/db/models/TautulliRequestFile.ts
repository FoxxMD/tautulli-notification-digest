'use strict';
import {
    InferAttributes,
    InferCreationAttributes,
    Sequelize,
    DataTypes,
    CreationOptional,
    Model, ForeignKey,
} from "sequelize";
import {TautulliRequest} from "./TautulliRequest.js";
import {TautulliRequestFileData} from "../../infrastructure/Atomic.js";

export class TautulliRequestFile extends Model<InferAttributes<TautulliRequestFile>, InferCreationAttributes<TautulliRequestFile>> implements TautulliRequestFileData {

    declare id: CreationOptional<number>;
    declare tautulliRequestId: ForeignKey<TautulliRequest['id']>
    declare content: Buffer;
    declare mimeType?: string;
    declare filename: string;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

export const init = (sequelize: Sequelize) => {
    TautulliRequestFile.init({
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        content: {
            type: DataTypes.BLOB,
            allowNull: false,
        },
        mimeType: DataTypes.STRING,
        filename: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    }, {
        sequelize,
        modelName: 'TautulliRequestFile',
    });
}

export const associate = () => {
    TautulliRequestFile.belongsTo(TautulliRequest, {foreignKey: 'tautulliRequestId', as: 'files'})
}
