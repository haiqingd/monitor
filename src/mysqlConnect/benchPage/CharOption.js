const mysqlconfig = require('../../../config/config');
const query = require('../mysqlconnect')

const table_name_benchPage = mysqlconfig.table_name_benchPage
const table_name_user = mysqlconfig.table_name_user
const table_name_database = mysqlconfig.table_name_database
const table_name_ChartOption = mysqlconfig.table_name_ChartOption

const table = ` (\n\
    username VARCHAR(20) NOT NULL, \n\
    foreign key(username) references ${table_name_user}(username), \n\
    ChartOptionID INT PRIMARY KEY AUTO_INCREMENT, \n\
    DBID INT NOT NULL, # 数据库ID\n\
    foreign key(DBID) references ${table_name_database}(DBid), \n\
    span INT not null default 24,\n\
    show1 varchar(10) not null default 'true', \n\
    visible varchar(10) NOT NULL default 'false', \n\
    color varchar(10) default '',\n\
    interval1 float NOT NULL default 0.5 , \n\
    type varchar(10) not null default 'line', \n\
    data int not null default '1' \n\
    \
    )`;

async function create() {
  // console.log("CREATE TABLE if not exists " + table_name_ChartOption + table);
  await query("CREATE TABLE if not exists " + table_name_ChartOption + table)
  console.log("CharOption db ready")
}
module.exports = create