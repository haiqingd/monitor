const query_api = require("../monitor/getdata").query_api
const request = require('request');
const verToken = require('../../middlewares/passport');
const cfg = require("../../../config/config")
const query = require('../../mysqlConnect/mysqlconnect')

class BenchSettings {
  async init(ctx) {
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    let { DBID } = ctx.request.body
    DBID = parseInt(DBID)

    let rows = await query(`select * from ${cfg.table_name_ChartOption}  where DBID = ${DBID} and username = '${username}'`);
    let message = ""
    if (rows[0]) {
      //重置为初始状态，修改太麻烦，不如删了在写
      message +="Already exist, now Reset.\n"
      let rows = await query(`delete from ${cfg.table_name_ChartOption}  where DBID = ?`, DBID);
    }
    for (var i in cfg.dataToname_map) { }
    i = parseInt(i)
    for (; i != 0; i--) {
      const query_context = `(username, DBID, data)\
      VALUES\
      ('${username}',${DBID},${i})\
      `;
      await query("INSERT INTO " + cfg.table_name_ChartOption + " " + query_context);
    }
    
    return ctx.success({ msg: message + "Init successfullly" })
  }


  async getdata (ctx){

    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    let { DBID } = ctx.request.query
    DBID = parseInt(DBID)

    let rows = await query(`select span, show1, visible, color, interval1, type, data from ${cfg.table_name_ChartOption}  where DBID = ${DBID} and username = '${username}'`);
    if (!rows[0]) {
      return ctx.error({msg:"数据库不存在或者尚未初始化。"})
    }

    let data = {}
    let list = []
    data.DBID = DBID
    data.interval = 5
    data.accuracy = 10
    for (let i in rows){
      const oneOfData = {}
      const name = cfg.dataToname_map[rows[i].data]
      // console.log(name)
      oneOfData.name = name;
      oneOfData.span = rows[i].span
      oneOfData.show = rows[i].show1
      const chartOption = {}
      chartOption.visible = rows[i].visible
      chartOption.color = rows[i].color
      chartOption.interval = rows[i].interval1
      chartOption.type = rows[i].type
      chartOption.data = rows[i].data
      oneOfData.chartOption = chartOption

      list.push(oneOfData)
    }
    data.list = list

    return ctx.success({data:data})
  }

  async change(ctx){
    
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }

    const {DBID, data, span, show, chartOption_visible, chartOption_color, chartOption_interval, chartOption_type} = ctx.request.body
    if(span){
      let res = await query(`update ${cfg.table_name_ChartOption} set span = ${span} WHERE DBID = ${DBID} and data =  ${data} and username = '${username}'`);
    }
    if(show){
      let res = await query(`update ${cfg.table_name_ChartOption} set show1 = \'${show}\' WHERE DBID = ${DBID} and data =  ${data} and username = '${username}'`);
    }
    if(chartOption_visible){
      let res = await query(`update ${cfg.table_name_ChartOption} set visible = \'${chartOption_visible}\' WHERE DBID = ${DBID} and data =  ${data} and username = '${username}'`);
    }
    if(chartOption_color){
      let res = await query(`update ${cfg.table_name_ChartOption} set color = \'${chartOption_color}\' WHERE DBID = ${DBID} and data =  ${data} and username = '${username}'`);
    }
    if(chartOption_interval){
      let res = await query(`update ${cfg.table_name_ChartOption} set interval1 = ${chartOption_interval} WHERE DBID = ${DBID} and data =  ${data} and username = '${username}'`);
    }
    if(chartOption_type){
      let res = await query(`update ${cfg.table_name_ChartOption} set type = \'${chartOption_type}\' WHERE DBID = ${DBID} and data =  ${data} and username = '${username}'`);
    }

    let rows = await query(`select * from ${cfg.table_name_ChartOption}  WHERE DBID = ${DBID} and data =  ${data} and username = '${username}'`);
    return ctx.success({msg:"success",data:rows[0]})

  }
  async changeGroup(ctx){


    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {raw} = ctx.request.body
    const updateData = JSON.parse(raw)

    const DBID = updateData.DBID
    let rows = await query(`delete from ${cfg.table_name_ChartOption} where DBID = ${DBID} and username = '${username}'`);
    for (let i in updateData.list){
      const thisOfList = updateData.list[i]
      const query_context = `(username, DBID, span, show1, visible, color, interval1, type, data)\
      VALUES\
      ('${username}',${DBID},${thisOfList.span}, \'${thisOfList.show}\', \'${thisOfList.chartOption.visible}\', \'${thisOfList.chartOption.color}\', ${thisOfList.chartOption.interval}, \'${thisOfList.chartOption.type}\', ${thisOfList.chartOption.data})\
      `;
      await query("INSERT INTO " + cfg.table_name_ChartOption + " " + query_context);
    }

    return ctx.success({msg:'Update successfully' })

  }
  async delete(ctx) {

    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }

    const { DBID,data } = ctx.request.body
    let res = await query(`delete from ${cfg.table_name_ChartOption}  where DBID = ${DBID} and data = ${data} and username ='${username}'`);
    if (res.affectedRows == 0) {
      return ctx.error({msg:"数据库不存在或者尚未初始化。"})
    }
    return ctx.success({msg:res})
  }
}

module.exports = new BenchSettings()