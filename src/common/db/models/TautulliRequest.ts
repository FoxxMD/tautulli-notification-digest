'use strict';
import {
    InferAttributes,
    InferCreationAttributes,
    Sequelize,
    DataTypes,
    CreationOptional,
    HasManyGetAssociationsMixin,
    HasManyAddAssociationMixin,
    HasManyRemoveAssociationMixin,
    HasManyCreateAssociationMixin,
    Model, Association,
} from "sequelize";
import {TautulliRequestFile} from "./TautulliRequestFile.js";
import {BaseMessageOptions} from "discord.js";
import {TautulliRequestData} from "../../infrastructure/Atomic.js";

export class TautulliRequest extends Model<InferAttributes<TautulliRequest>, InferCreationAttributes<TautulliRequest>> implements TautulliRequestData {

    declare id: CreationOptional<number>;
    declare slug: string;
    declare status: string
    declare content: BaseMessageOptions;
    declare title: string

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    declare getFiles: HasManyGetAssociationsMixin<TautulliRequestFile>;
    declare createFile: HasManyCreateAssociationMixin<TautulliRequestFile>;

    declare static associations: {
        files: Association<TautulliRequest, TautulliRequestFile>
    }
}

export const init = (sequelize: Sequelize) => {
    TautulliRequest.init({
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        slug: {
            type: DataTypes.STRING,
            defaultValue: 'pending'
        },
        title: DataTypes.STRING,
        status: DataTypes.STRING,
        content: DataTypes.JSON,
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    }, {
        sequelize,
        modelName: 'TautulliRequest',
    });
}

export const associate = () => {
    TautulliRequest.hasMany(TautulliRequestFile, {
        foreignKey: 'tautulliRequestId',
        sourceKey: 'id',
        as: 'files'
    })
}
