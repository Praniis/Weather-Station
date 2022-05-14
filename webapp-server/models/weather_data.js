'use strict';

const {
	Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
	class weather_data extends Model {
		static associate(models) {
			// define association here
		}
	}
	weather_data.init({
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.BIGINT
		},
		dtime: {
			type: DataTypes.DATE,
			allowNull: false
		},
		temperature: DataTypes.FLOAT,
		humidity: DataTypes.FLOAT,
		wind_speed: DataTypes.INTEGER,
		wind_degree: DataTypes.SMALLINT,
		wind_dir: DataTypes.STRING(1),
		cloudcover: DataTypes.INTEGER,
		pressure: DataTypes.INTEGER,
		uv_index: DataTypes.INTEGER,
		coord: {
			type: DataTypes.GEOMETRY('POINT')
		},
		stime: {
			type: DataTypes.DATE,
			defaultValue: sequelize.NOW
		}
	}, {
		sequelize,
		modelName: 'weather_data',
		timestamps: false
	});
	return weather_data;
};