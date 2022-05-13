'use strict';

const {
	Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
	class sensor extends Model {
		static associate(models) {
			// define association here
		}
	}
	sensor.init({
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER
		},
		notes: DataTypes.TEXT
	}, {
		sequelize,
		modelName: 'sensor'
	});
	return sensor;
};