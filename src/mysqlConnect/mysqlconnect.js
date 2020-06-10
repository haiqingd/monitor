const mysqlconfig = require('../../config/config');
const DBName = "monitoring_end"
var mysql = require("mysql");
var connection = mysql.createConnection({
  host: mysqlconfig.host,
  user: mysqlconfig.username,
  // password: mysqlconfig.password,
  database: mysqlconfig.database
})
connection.connect();
connection.query("use " + DBName);
connection.on('connect',function(){
  console.log('MySQL connected. Username: ' +
    mysqlconfig.username )
})
connection.on('error', function(err) {
  console.log('MySQL connection error: ' + err);
});
connection.on('disconnected', function() {
  console.log('MySQL connection disconnected. ');
});
connection.query("create database if not exists " + DBName, (err) => {
  if (err) return console.log("执行失败" + err.message);
});
connection.end(function(err){
  //连接结束
})

// module.exports = connection

const pool = mysql.createPool({
  host: mysqlconfig.host,
  user: mysqlconfig.username,
  // password: mysqlconfig.password,
  database: DBName
})
let query = async function( sql, values) {
  // 返回一个 Promise
  status = true;
  return new Promise(( resolve, reject ) => {
    pool.getConnection(function(err, connection) {
      if (err) {
        reject( err )
        return err
      } else {
        connection.query(sql, values, ( err, rows) => {
          
          if ( err ) {
            console.log(sql + values)
            reject( err )
            
          } else {
            resolve( rows )
          }
          // 结束会话
          connection.release()
        })
      }
    })
  })
}
module.exports =  query
require('./user/user')()
require('./db/db')()
require('./benchPage/CharOption')()
// require('./benchPage/benchPage')()