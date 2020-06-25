const mysqlconfig = require('../../config/config');
const key = require('../../config/config').key;
const md5 = require('blueimp-md5');
let config = require('../../config/config')
const DBName = mysqlconfig.database
var mysql = require("mysql");
var connection = mysql.createConnection({
  host: mysqlconfig.host,
  user: mysqlconfig.username,
  port:mysqlconfig.port,
  password: mysqlconfig.password,
  // database: mysqlconfig.database
})
connection.connect();
connection.query("Create Database If Not Exists "+ DBName +" Character Set UTF8 " );
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
  port: mysqlconfig.port,
  password: mysqlconfig.password,
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
async function createadmin(){
  let rows = await query('select * from user where userGroup = 0')
  if(!rows[0]) {
    const {username, password} = {"username":'root', "password":'asda'}
    const pw_encrypt = md5(password, key)
    const query_context = "(userGroup, username, password)\
      VALUES\
      (0, \'admin\', \'"+ pw_encrypt+"\')\
      "; 
    query("INSERT INTO "+ mysqlconfig.table_name_user + " " + query_context);
    config.admin = username
    delete require.cache[require.resolve("../../config/config")]
    config = require("../../config/config")
  }
}
createadmin();

