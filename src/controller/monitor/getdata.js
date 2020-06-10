const key = require('../../../config/config').key;
const query = require('../../mysqlConnect/mysqlconnect')
const mysqlconfig = require('../../../config/config');
const jsonwebtoken = require('jsonwebtoken');
const verToken = require('../../middlewares/passport');
const request = require('request');
const PrometheusAddr = require('../../../config/config').prometheus
const uri_query = PrometheusAddr + require('../../../config/config').query
const uri_query_range = PrometheusAddr + require('../../../config/config').query_range
const PromQL = require('../../PromQL')
const frequency = require('../../../config/config').frequency


let query_api = function( qstr ) {
  status = true;
  return new Promise(( resolve, reject ) => {
    request(qstr,function(error, response,body){
      if (!error && response.statusCode == 200) {
        body = JSON.parse(body);
        resolve(body)
      }else {
        if(!response) console.log("服务未开启")
        // console.log(response)
        else console.log("服务正在启动中或查询语句错误")
      }
    })
  })
}

function exchangePromQL (startTime, endTime){
  const now = new Date();
  var offset = now.getTimezoneOffset() * 60000;
  //传入的时间应为当地时间，故在与now相减前需要先加上时差偏移量
  let unixEnd;
  if(endTime == ''){
    const end = new Date();
    unixEnd = (end.getTime())/1000;
    if(startTime == ''){
      const offsetTime =1;
      const total_scale = 60;
      return{offsetTime, total_scale}
    }
  }
  else{
    const end = new Date(endTime);
    unixEnd = (end.getTime() + offset)/1000;
  }
  
  const start = new Date(startTime);
  const unixStart = (start.getTime() + offset)/1000;
  const unixNow = now.getTime()/1000;

  let offsetTime = parseInt(unixNow - unixEnd);
  const total_scale = parseInt(unixEnd - unixStart);
  if(offsetTime == 0) offsetTime = 1
  return {offsetTime, total_scale}

}


class DataCollectController{

//CurrentInfo
  async getCurrentInfo(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    
    const{DBID,accuracy} = ctx.request.query;
    if(!DBID) {
      return ctx.error({msg:"未输入DBID"})
    }
    let rows = await query(`select NodeName,DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    if(!rows[0]){
      return ctx.error({msg:"查询失败"})
    }
    const NodeName = rows[0].NodeName;
    const DBName  = rows[0].DBName
    let res ={'instance':NodeName, data:[]} 
    
    //CPU
    let qstr = PromQL.currentCPU;
    qstr = qstr.replace(/NodeName/g, NodeName)
      .replace(/accuracy/g, accuracy)
    const para = '?query=';
    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    const cpuInfo = await query_api(uri_query+para+qstr)
    res.data.push({name:'cpuInfo',data:cpuInfo.data.result[0].value})
    console.log(cpuInfo.data.result)


    //UP
    qstr = PromQL.currentMysqlUP;
    qstr = qstr.replace(/DBName/g, DBName)
    // console.log("PromQL 执行语句：\n"+qstr)
    const mysqlInfo = await query_api(uri_query+para+qstr)
    res.data.push({name:'mysqlUp',data:mysqlInfo.data.result[0].value})
    
    qstr = PromQL.currentNodeUP;
    qstr = qstr.replace(/NodeName/g, NodeName)
    // console.log("PromQL 执行语句：\n"+qstr)
    const nodeInfo = await query_api(uri_query+para+qstr)
    res.data.push({name:'NodeUp',data:nodeInfo.data.result[0].value})
    
    
    //DISK
    qstr = PromQL.currentDiskRead;
    qstr = qstr.replace(/NodeName/g, NodeName)
    // console.log("PromQL 执行语句：\n"+qstr)
    const readInfo = await query_api(uri_query+para+qstr)
    res.data.push({name:'currentDiskRead[30s] byte/s',data:readInfo.data.result[0].value})

    qstr = PromQL.currentDiskWrite;
    qstr = qstr.replace(/NodeName/g, NodeName)
    // console.log("PromQL 执行语句：\n"+qstr)
    const writeInfo = await query_api(uri_query+para+qstr)
    res.data.push({name:'currentDiskWrite[30s] byte/s',data:writeInfo.data.result[0].value})

    //wait
    qstr = PromQL.currentWait;
    qstr = qstr.replace(/NodeName/g, NodeName)
      .replace(/accuracy/g, accuracy)
    // console.log("PromQL 执行语句：\n"+qstr)
    const waitInfo = await query_api(uri_query+para+qstr)
    res.data.push({name:'iowait ms/s',data:waitInfo.data.result[0].value})
    return ctx.success({data:res}) 
  }
  //Current Alert
  async getAlert(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const res = await query_api(PrometheusAddr+'/api/v1/alerts')
    return ctx.success({data:res.data })
  }



  //CPU
  async getCPU(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }

    
    const {DBID, startTime, endTime, interval, accuracy} = ctx.request.query;
    //从ID获取NodeName
    let rows = await query(`select NodeName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const NodeName = rows[0].NodeName;
    
    //时间值转换为PromQL所需的offset 和total_scale
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.CPU;
    //PromQL 表达式转换
    qstr = qstr.replace(/NodeName/g, NodeName)
      .replace(/accuracy/g, accuracy)
      .replace(/offsetTime/g, offsetTime)
      .replace(/interval/g,interval)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';

    // const date = new Date(1587637990000)
                          
    // console.log(date)

    const date = new Date()
    if (date.getUTCSeconds()%10 ==0 ){
      console.log('\n['+date.toLocaleTimeString()+"]PromQL 执行语句：\n"+qstr)
    }
    //执行查询
    // console.log(uri_query)
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }

  
  
  //MeMory
  async getMeMory(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime} = ctx.request.query;
    let rows = await query(`select NodeName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const NodeName = rows[0].NodeName;
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    let qstr = PromQL.Memory;
    qstr = qstr.replace(/NodeName/g, NodeName)
      .replace(/offsetTime/g, offsetTime)
      .replace(/interval/g,frequency)
      .replace(/total_scale/g, total_scale)
      .replace(/\+/g,'%2B');//将+号替换为 %2B ,以供浏览器地址栏标识
    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)

    const para = '?query=';

    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }

  //TPS
  async getTPS(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    let {DBID, startTime, endTime, interval, accuracy} = ctx.request.query;
    //从ID获取NodeName
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    
    //时间值转换为PromQL所需的offset 和total_scale
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    const Unixnow = parseInt(new Date().getTime()/1000);
    endTime = Unixnow - offsetTime;
    startTime = endTime - total_scale;

    let qstr = PromQL.TPS;
    //PromQL 表达式转换
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/accuracy/g, accuracy)

    const para1 = '?query=';
    const para2 = '&start='
    const para3 = '&end='
    const para4 = '&step='

    const str = para1+qstr+para2+startTime+para3+endTime+para4+interval

    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+uri_query_range+str)
    //执行查询
    const res = await query_api(uri_query_range+str)
    return ctx.success({data:res.data.result, msg : uri_query_range+str})
  }

  //QPS
  async getQPS(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime, interval, accuracy} = ctx.request.query;
    //从ID获取NodeName
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    
    //时间值转换为PromQL所需的offset 和total_scale
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.QPS;
    //PromQL 表达式转换
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/accuracy/g, accuracy)
      .replace(/offsetTime/g, offsetTime)
      .replace(/interval/g,interval)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';

    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    //执行查询
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }


  //SlowQuery
  async getSlowQuery(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime} = ctx.request.query;
    //从ID获取NodeName
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    
    //时间值转换为PromQL所需的offset 和total_scale
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.SlowQuery;
    //PromQL 表达式转换
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/offsetTime/g, offsetTime)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';

    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    //执行查询
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }

  //Threads_created
  async getThreads_created(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime} = ctx.request.query;
    //从ID获取NodeName
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    
    //时间值转换为PromQL所需的offset 和total_scale
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.Threads_created;
    //PromQL 表达式转换
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/offsetTime/g, offsetTime)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';

    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    //执行查询
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }


  //Threads_connected
  async getThreads_connected(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime} = ctx.request.query;
    //从ID获取NodeName
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    
    //时间值转换为PromQL所需的offset 和total_scale
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.Threads_connected;
    //PromQL 表达式转换
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/offsetTime/g, offsetTime)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';

    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    //执行查询
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }

  //Threads_running
  async getThreads_running(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime} = ctx.request.query;
    //从ID获取NodeName
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    
    //时间值转换为PromQL所需的offset 和total_scale
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.Threads_running;
    //PromQL 表达式转换
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/offsetTime/g, offsetTime)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';

    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    //执行查询
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }
  

  //Connect_aborted
  async Connect_aborted(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime} = ctx.request.query;
    //从ID获取NodeName
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    
    //时间值转换为PromQL所需的offset 和total_scale
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.Connect_aborted;
    //PromQL 表达式转换
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/offsetTime/g, offsetTime)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';

    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    //执行查询
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }

  //KeyBufferReadHItRate
  async KeyBufferReadHItRate(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime, interval, accuracy} = ctx.request.query;
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.KeyBufferReadHItRate;
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/accuracy/g, accuracy)
      .replace(/offsetTime/g, offsetTime)
      .replace(/interval/g,interval)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';
    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }


  //KeyBufferWriteHItRate     NOT USED YET!!
  async KeyBufferWriteHItRate(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime, interval, accuracy} = ctx.request.query;
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.KeyBufferWriteHItRate;
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/accuracy/g, accuracy)
      .replace(/offsetTime/g, offsetTime)
      .replace(/interval/g,interval)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';
    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }


  //InnodbHitRate
  async InnodbHitRate(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime, interval, accuracy} = ctx.request.query;
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.InnodbHitRate;
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/accuracy/g, accuracy)
      .replace(/offsetTime/g, offsetTime)
      .replace(/interval/g,interval)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';
    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }


  //ThreadCacheHitRate
  async ThreadCacheHitRate(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime, interval, accuracy} = ctx.request.query;
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.ThreadCacheHitRate;
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/accuracy/g, accuracy)
      .replace(/offsetTime/g, offsetTime)
      .replace(/interval/g,interval)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';
    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }

  // BytesReceived
  async BytesReceived(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime, interval, accuracy} = ctx.request.query;
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.BytesReceived;
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/accuracy/g, accuracy)
      .replace(/offsetTime/g, offsetTime)
      .replace(/interval/g,interval)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';
    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }

  //ByteSent
  async BytesSent(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime, interval, accuracy} = ctx.request.query;
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.BytesSent;
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/accuracy/g, accuracy)
      .replace(/offsetTime/g, offsetTime)
      .replace(/interval/g,interval)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';
    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }

  //slaveRunning
  async slaveRunning(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    const {DBID, startTime, endTime, interval, accuracy} = ctx.request.query;
    let rows = await query(`select DBName from ${mysqlconfig.table_name_database} WHERE DBID = ?`,DBID);
    const DBName = rows[0].DBName;
    const {offsetTime, total_scale}= exchangePromQL(startTime, endTime);
    
    let qstr = PromQL.slaveRunning;
    qstr = qstr.replace(/DBName/g, DBName)
      .replace(/accuracy/g, accuracy)
      .replace(/offsetTime/g, offsetTime)
      .replace(/interval/g,frequency)
      .replace(/total_scale/g, total_scale);

    const para = '?query=';
    const date = new Date().toLocaleTimeString();
    // console.log('\n['+date+"]PromQL 执行语句：\n"+qstr)
    const res = await query_api(uri_query+para+qstr)
    return ctx.success({data:res.data.result[0], msg : uri_query+para+qstr})
  }

  //getAllParamName
  async allName(ctx){
    await verToken(ctx);
    const username = ctx.state.username;
    let user = await query(`select * from user where username = '${username}'`)
    if (!user[0]) {
      return ctx.error({ msg: '用户未登录' });
    }
    return ctx.success({data:mysqlconfig.dataToname_map})
  }

}

module.exports = new DataCollectController();