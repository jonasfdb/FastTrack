import { Sequelize } from "sequelize";
import { fasttrack_db } from "./dbconfig.mjs"

const db_user = fasttrack_db.define("DB_USER", {
  user_id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  nintendo_username: {
    type: Sequelize.STRING,
  },
  nintendo_friend_code: {
    type: Sequelize.STRING,
  }
});

const db_timetrial = fasttrack_db.define("DB_TIMETRIAL", {
  run_id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  user_id: {
    type: Sequelize.STRING,
  },
  time_result: {
    type: Sequelize.STRING,
  },
  track_id: {
    type: Sequelize.STRING,
  },
  cup_id: {
    type: Sequelize.STRING,
  },
  category_id: {
    type: Sequelize.STRING,
  },
  timestamp: {
    type: Sequelize.STRING,
  }
})

export { db_user, db_timetrial };