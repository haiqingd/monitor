const query_api = require("../monitor/getdata").query_api
const request = require('request');
const verToken = require('../../middlewares/passport');
const cfg = require("../../../config/config")
const query = require('../../mysqlConnect/mysqlconnect')

class BenchSettings {
  async init(ctx) {
    let { DBID } = ctx.request.body
    DBID = parseInt(DBID)

    let rows = await query(`select * from ${cfg.table_name_ChartOption}  where DBID = ?`, DBID);
    let message = ""
    if (rows[0]) {
      //重置为初始状态，修改太麻烦，不如删了在写
      message +="Already exist, now Reset.\n"
      let rows = await query(`delete from ${cfg.table_name_ChartOption}  where DBID = ?`, DBID);
    }
    for (var i in cfg.dataToname_map) { }
    i = parseInt(i)
    for (; i != 0; i--) {
      const query_context = `(DBID, data)\
      VALUES\
      (${DBID},${i})\
      `;
      await query("INSERT INTO " + cfg.table_name_ChartOption + " " + query_context);
    }
    
    return ctx.success({ msg: message + "Init successfullly" })
  }
  async getdata (ctx){
    let { DBID } = ctx.request.query
    DBID = parseInt(DBID)

    let rows = await query(`select span, show1, visible, color, interval1, type, data from ${cfg.table_name_ChartOption}  where DBID = ?`, DBID);
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
    const {DBID, data, span, show, chartOption_visible, chartOption_color, chartOption_interval, chartOption_type} = ctx.request.body
    if(span){
      let res = await query(`update ${cfg.table_name_ChartOption} set span = ${span} WHERE DBID = ${DBID} and data =  ${data}`);
    }
    if(show){
      let res = await query(`update ${cfg.table_name_ChartOption} set show1 = \'${show}\' WHERE DBID = ${DBID} and data =  ${data}`);
    }
    if(chartOption_visible){
      let res = await query(`update ${cfg.table_name_ChartOption} set visible = \'${chartOption_visible}\' WHERE DBID = ${DBID} and data =  ${data}`);
    }
    if(chartOption_color){
      let res = await query(`update ${cfg.table_name_ChartOption} set color = \'${chartOption_color}\' WHERE DBID = ${DBID} and data =  ${data}`);
    }
    if(chartOption_interval){
      let res = await query(`update ${cfg.table_name_ChartOption} set interval1 = ${chartOption_interval} WHERE DBID = ${DBID} and data =  ${data}`);
    }
    if(chartOption_type){
      let res = await query(`update ${cfg.table_name_ChartOption} set type = \'${chartOption_type}\' WHERE DBID = ${DBID} and data =  ${data}`);
    }

    let rows = await query(`select * from ${cfg.table_name_ChartOption}  WHERE DBID = ${DBID} and data =  ${data}`);
    return ctx.success({msg:"success",data:rows[0]})

  }
  async changeGroup(ctx){
    const {raw} = ctx.request.body
    const updateData = JSON.parse(raw)

    console.log(updateData)
    const DBID = updateData.DBID
    console.log(DBID)
    let rows = await query(`delete from ${cfg.table_name_ChartOption}  where DBID = ?`, DBID);
    for (let i in updateData.list){
      const thisOfList = updateData.list[i]
      const query_context = `(DBID, span, show1, visible, color, interval1, type, data)\
      VALUES\
      (${DBID},${thisOfList.span}, \'${thisOfList.show}\', \'${thisOfList.chartOption.visible}\', \'${thisOfList.chartOption.color}\', ${thisOfList.chartOption.interval}, \'${thisOfList.chartOption.type}\', ${thisOfList.chartOption.data})\
      `;
      await query("INSERT INTO " + cfg.table_name_ChartOption + " " + query_context);
    }

    return ctx.success({msg:'Update successfully' })

  }
  async delete(ctx) {
    const { DBID,data } = ctx.request.body
    let res = await query(`delete from ${cfg.table_name_ChartOption}  where DBID = ${DBID} and data = ${data}`);
    if (res.affectedRows == 0) {
      return ctx.error({msg:"数据库不存在或者尚未初始化。"})
    }
    return ctx.success({msg:res})
  }
}

module.exports = new BenchSettings()