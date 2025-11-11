import { Sequelize } from "sequelize";

const fasttrack_db = new Sequelize("database", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "fasttrack.sqlite",
});;

export { fasttrack_db };