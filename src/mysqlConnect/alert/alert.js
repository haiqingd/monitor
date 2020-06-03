const mysqlconfig = require('../../../config/config');
const query = require('../mysqlconnect')

const table_name_database = mysqlconfig.table_name_database;

const table = " (\n\
    AlertID INT PRIMARY KEY AUTO_INCREMENT, # id主键自增\n\
    Job VARCHAR(20) NOT NULL, #被监控端IP\n\
    OSUsername VARCHAR(32), #被监控端操作系统用户\n\
    OSPassword VARCHAR(64),\n\
    User VARCHAR(32), #被监控端数据库用户\n\
    Password VARCHAR(32), \n\
    NodePort VARCHAR(5) NOT NULL Default '9100', #Prometheus默认Node_Exporter开放端口9100\n\
    NodeName VARCHAR(32) NOT NULL, #在Prometheus中该Node_Exporter的名称\n\
    DBPort VARCHAR(5) NOT NULL Default '9104', #Prometheus默认Mysql_Exporter开放端口9104\n\
    DBName VARCHAR(32) UNIQUE NOT NULL, #在Prometheus中该Mysql_Exporter的名称\n\
    Type VARCHAR(32) NOT NULL Default 'Mysql', #数据库类型，默认mysql\n\
    DBGroup VARCHAR(32) NOT NULL Default 'Ungrouped' #数据库分组，默认为未分组的\n\
    )";

// console.log("CREATE TABLE if not exists "+table_name_database + table);

query("CREATE TABLE if not exists "+table_name_database + table)