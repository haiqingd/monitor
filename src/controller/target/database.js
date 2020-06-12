const key = require('../../../config/config').key;
const query = require('../../mysqlConnect/mysqlconnect')
const mysqlconfig = require('../../../config/config.js');
const jsonwebtoken = require('jsonwebtoken');
const verToken = require('../../middlewares/passport');
const benchSettings = require('../settings/benchSettings')
const date = new Date().toLocaleString();

class DataCollectController {
async addDatabase(ctx) {
  await verToken(ctx);
  const username_login = ctx.state.username;

  let rows = await query(`select * from user where username = '${username_login}'`);
  if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
    return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
  }

  let value = [];
  const body = ctx.request.body;
  let rows2 = await query(`select DBid,DBName from ${mysqlconfig.table_name_database}  where DBName = ?`, body.DBName);
  if (rows2[0]) {
    // return ctx.error({ msg: "DBName已存在" })
  }
  for (let i in body) {
    if (body[i] == '') body[i] = null;
    value.push(body[i])
  }
  const query_context = `(host, OSUsername, OSPassword, user, password, DBGroup, nodePort, nodeName, DBPort, DBName, type)\
    VALUES\
    (?,?,?,?,?,?,?,?,?,?,?)\
    `;
  await query("INSERT INTO " + mysqlconfig.table_name_database + " " + query_context, value);

  const rows3 = await query(`Select DBid from ${mysqlconfig.table_name_database} where DBName = \'${body.DBName}\'`)
  if (!rows3[0]) {
    return ctx.error({ msg: "创建失败，请重试" })
  }
  ctx.request.body.DBID = rows3[0].DBid
  await benchSettings.init(ctx);
  ctx.success({
    msg: '添加成功! DBID:' + ctx.request.body.DBID
  });
}

async getAllID(ctx) {
  await verToken(ctx);
  const username = ctx.state.username;
  let user = await query(`select * from user where username = '${username}'`)
  if (!user[0]) {
    return ctx.error({ msg: '用户未登录' });
  }

  if(!mysqlconfig.table_name_database) console.log(mysqlconfig, mysqlconfig.table_name_database)
  let rows = await query(`select DBid,DBName,DBGroup from ${mysqlconfig.table_name_database} `);
  return ctx.success({ msg: "success", data: rows })
}

async getInfo(ctx) {
  await verToken(ctx);
  const username = ctx.state.username;
  let user = await query(`select * from user where username = '${username}'`)
  if (!user[0]) {
    return ctx.error({ msg: '用户未登录' });
  }
  const { DBID } = ctx.request.query;
  let rows = await query(`select DBID, host, OSUsername, user, DBGroup, nodePort, nodeName, DBPort, DBName, type from ${mysqlconfig.table_name_database} WHERE DBID = ${DBID}`);
  if (!rows[0]) return ctx.error({ msg: "不存在的数据库ID" })
  return ctx.success({ msg: "success", data: rows })
}


//更改分组
async changeGroup(ctx) {
  //验证身份
  await verToken(ctx);
  const username_login = ctx.state.username;
  if (!username_login) return ctx.error({ msg: 'Token错误' })

  let rows = await query('select * from user where username = ?', username_login);
  if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
    return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
  }

  const { DBID, group } = ctx.request.body;
  let rows2 = await query(`select DBID, host, OSUsername, user, DBGroup, nodePort, nodeName, DBPort, DBName, type from ${mysqlconfig.table_name_database} WHERE DBID = ${DBID}`);
  if (!rows2[0]) return ctx.error({ msg: "不存在的数据库ID" })

  let groupName = ['Development', 'Staging', 'Production', 'Ungrouped']
  // console.log(groupName.indexOf(group))
  if (groupName.indexOf(group) == -1) {
    return ctx.error({ msg: "数据库的分组，可选项（ Development  Staging  Production Ungrouped）" })
  }
  let res = await query(`update ${mysqlconfig.table_name_database} set DBGroup = \"${group}\" WHERE DBID = ?`, DBID);

  console.log('\n[' + date + "]" + "修改数据库分组  DBID:" + DBID + " -> " + group)

  return ctx.success({ msg: "success" })
}
}

module.exports = new DataCollectController();