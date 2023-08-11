import {Migration} from "sequelize-cli";
import {IndexType} from "sequelize/types/dialects/abstract/query-interface.js";

const migration: Migration = {
    async up(queryInterface, Sequelize) {

        await queryInterface.createTable('TautulliRequests', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER.UNSIGNED
            },
            slug: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: false
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: false
            },
            content: {
                type: Sequelize.JSON,
                allowNull: true,
                unique: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.createTable('TautulliRequestFiles', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER.UNSIGNED
            },
            tautulliRequestId: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false
            },
            mimeType: {
                type: Sequelize.STRING,
            },
            filename: {
                type: Sequelize.STRING,
            },
            content: {
                type: Sequelize.BLOB,
                allowNull: false,
                unique: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
        await queryInterface.addIndex('TautulliRequestFiles', ['tautulliRequestId']);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('TautulliRequests');
        await queryInterface.dropTable('TautulliRequestFiles');
    }
};
module.exports = {up: migration.up, down: migration.down};
