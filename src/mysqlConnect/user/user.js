const mysqlconfig = require('../../../config/config');
const query = require('../mysqlconnect')

const table_name_user = mysqlconfig.table_name_user;

const table = " (\n\
    userGroup INT, # 0:admin 1:user 2:visitor\n\
    username VARCHAR(20) NOT NULL, #管理员默认为admin\n\
    password VARCHAR(50), #sha256\n\
    Primary key(username)\n\
    )";

// console.log("CREATE TABLE if not exists "+table_name_user + table);


async function create() {
    await query("CREATE TABLE if not exists "+table_name_user + table)
    console.log(table_name_user+ "db ready")
  }
  module.exports = create