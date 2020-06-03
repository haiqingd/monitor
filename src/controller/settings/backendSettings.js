const query_api = require("../monitor/getdata").query_api
const prometheusAddr = require("../../../config/config.js").prometheus
const request = require('request');
const verToken = require('../../middlewares/passport');
const startProm = require("../../../config/config").wherePrometheus
const util = require('util');
const backend = require("../../../config/config")
const fs = require("fs");



function reload() {
  request({
    url: prometheusAddr + '/-/reload',
    method: "POST",
    json: true,
    headers: {
      "content-type": "application/json",
    }
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // console.log(response.body) // 请求成功的处理逻辑
    }
    else console.log(new Error("重启错误"))
  });
};

function quit() {
  request({
    url: prometheusAddr + '/-/quit',
    method: "POST",
    json: true,
    headers: {
      "content-type": "application/json",
    }
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // console.log(response.body) // 请求成功的处理逻辑
    }
    else console.log(new Error("Prometheus关闭时遇到错误"))
  });
}






class backendSettingsController {
  async reload(ctx) {
    await reload();
    console.log("Prometheus reloaded successfully!!")
    const lastConfigTime = (await new backendSettingsController().getPrometheusStatus(ctx)).lastConfigTime


    return ctx.success({ msg: "Prometheus reloaded successfully!", data: { lastConfigTime } })
  }


  async restart(ctx) {
    const exec = util.promisify(require('child_process').exec);
    const { stdout, err } = await exec('./restart.sh');

    //目前是假的状态信息，暂时不知道该怎么处理
    const date = new Date().toLocaleTimeString();
    console.log('\n[' + date + "]")
    setTimeout(async function () { console.log('Reloading Prometheus...') }, 20);
    setTimeout(async function () { console.log('...') }, 1000);
    setTimeout(async function () { console.log('...') }, 2000);
    setTimeout(async function () { console.log('...') }, 3000);
    setTimeout(async function () { console.log('Restart Successfully') }, 4000);


    if (err) {
      console.log(err + "\n重启Prometheus失败，请尝试运行restart.sh文件")
    } else {
      // console.log("Restart Successfully")
    }

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    await delay(4000)
    const lastConfigTime = (await new backendSettingsController().getPrometheusStatus(ctx)).lastConfigTime
    return ctx.success({ msg: "success", data: { lastConfigTime } })
  }
  //Prometheus Status
  async getPrometheusStatus(ctx) {

    const runtimeinfo = prometheusAddr + "/api/v1/status/runtimeinfo"
    const buildinfo = prometheusAddr + "/api/v1/status/buildinfo"
    let res = {}
    const runtime = await new Promise((resolve, reject) => {
      request(runtimeinfo, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          body = JSON.parse(body).data;
          resolve(body)
        } else {
          if (response) {
            console.log(JSON.parse(response.body).error)
            reject(new Error(JSON.parse(response.body).error))
          }
          else reject(new Error("服务未开启"))
        }
      })
    })

    for (let i in runtime) {
      res[i] = runtime[i]
    }

    const build = await new Promise((resolve, reject) => {
      request(buildinfo, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          body = JSON.parse(body).data;
          resolve(body)
        } else {
          if (response) {
            console.log(JSON.parse(response.body).error)
            reject(new Error(JSON.parse(response.body).error))
          }
          else reject(new Error("服务未开启"))
        }
      })
    })

    for (let i in build) {
      res[i] = build[i]
    }
    ctx.success({ data: res })
    return res
  }

  //Target

  async getTargets(ctx) {
    const targets = prometheusAddr + "/api/v1/targets"
    let res = await new Promise((resolve, reject) => {
      request(targets, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          body = JSON.parse(body).data;
          resolve(body)
        } else {
          if (response) {
            console.log(JSON.parse(response.body).error)
            reject(new Error(JSON.parse(response.body).error))
          }
          else reject(new Error("服务未开启"))

        }
      })
    })
    return (ctx.success({ data: res }))
  }

  //getcmdFlags
  async getCommandLineFlags(ctx) {
    const CommandLineFlags = prometheusAddr + "/api/v1/status/flags"
    let res = await new Promise((resolve, reject) => {
      request(CommandLineFlags, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          body = JSON.parse(body).data;
          resolve(body)
        } else {
          if (response) {
            console.log(JSON.parse(response.body).error)
            reject(new Error(JSON.parse(response.body).error))
          }
          else {
            reject(new Error("服务未开启"))
          }
        }
      })
    })
    ctx.success({ data: res })
    return res
  }

  //setcmdFlags
  async setCommandLineFlags(ctx) {

    await verToken(ctx);
    const username_login = ctx.state.username;
    if (username_login != 'admin') {
      return ctx.error({ msg: "非管理员用户无权修改命令行参数" })
    }

    const originData = await new backendSettingsController().getCommandLineFlags(ctx)
    const nowData = ctx.request.body;
    let cmdStr = ""

    cmdStr += "cat /dev/null > Prometheus.log \n"
    cmdStr += "curl -XPOST \"" + prometheusAddr + "/-/quit\"\n"
    cmdStr += "sleep 2 \n"
    cmdStr += "nohup "
    cmdStr += startProm + " "


    cmdStr += '--config.file=';
    if (nowData.config.file) cmdStr += nowData.config.file
    else cmdStr += originData['config.file']

    cmdStr += ' --storage.tsdb.retention.size=';
    if (nowData.storage.tsdb.retention.size) cmdStr += nowData.storage.tsdb.retention.size
    else cmdStr += originData['storage.tsdb.retention.size']

    cmdStr += ' --storage.tsdb.retention.time=';
    if (nowData.storage.tsdb.retention.time) cmdStr += nowData.storage.tsdb.retention.time
    else cmdStr += originData['storage.tsdb.retention.time']

    if (nowData.web['enable-admin-api'] == '1' || (nowData.web['enable-admin-api'] == '' && originData['web.enable-admin-api'] == 'true'))
      cmdStr += ' --web.enable-admin-api'

    if (nowData.web['enable-lifecycle'] == '1' || (nowData.web['enable-lifecycle'] == '' && originData['web.enable-admin-api'] == 'true'))
      cmdStr += ' --web.enable-lifecycle'

    cmdStr += " >Prometheus.log 2>&1"


    cmdStr += " &"



    //文件操作
    fs.open('input.txt', 'w', function (err, fd) {
      if (err) {
        return console.error(err);
      }

      fs.writeFile('restart.sh', cmdStr, function (err) {
        if (err) {
          return console.error(err);
        }
      })

      fs.close(fd, function (err) {
        if (err) {
          console.log(err);
        }
      })
    });

    const exec = util.promisify(require('child_process').exec);
    const { stdout, err } = await exec('./restart.sh');

    //目前是假的状态信息，暂时不知道该怎么处理
    const date = new Date().toLocaleTimeString();
    console.log('\n[' + date + "]")
    setTimeout(async function () { console.log('Reloading Prometheus...') }, 20);
    setTimeout(async function () { console.log('...') }, 1000);
    setTimeout(async function () { console.log('...') }, 2000);
    setTimeout(async function () { console.log('...') }, 3000);
    setTimeout(async function () { console.log('Restart Successfully') }, 4000);


    if (err) {
      console.log(err + "\n重启Prometheus失败，请尝试运行restart.sh文件")
    } else {
      // console.log("Restart Successfully")
    }

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    //根据日志最后一行判断是否重启成功


    await delay(4000)
    const lastConfigTime = (await new backendSettingsController().getPrometheusStatus(ctx)).lastConfigTime
    return ctx.success({ msg: "success", data: { lastConfigTime } })

  }

  //prometheusConfig
  async getPrometheusConfig(ctx) {
    const targets = prometheusAddr + "/api/v1/status/config"
    let res = await new Promise((resolve, reject) => {
      request(targets, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          body = JSON.parse(body).data;
          resolve(body)
        } else {
          if (response) {
            console.log(JSON.parse(response.body).error)
            reject(new Error(JSON.parse(response.body).error))
          }
          else reject(new Error("服务未开启"))

        }
      })
    })
    return (ctx.success({ data: res.yaml }))
  }

  //backendparam
  async getBackend(ctx) {
    var backend_copy = backend
    delete eval(backend_copy).key
    delete eval(backend_copy).query
    delete eval(backend_copy).query_range
    delete eval(backend_copy).database
    delete eval(backend_copy).table_name_user
    delete eval(backend_copy).table_name_database
    delete eval(backend_copy).table_name_alert
    return (ctx.success({ data: backend_copy }))
  }

  //尚未完成
  async setBackend(ctx) {
    let cfgStr = "module.exports = "
    cfgStr += backend.toString()


    console.log(cfgStr)

    fs.writeFile('config.js', cfgStr, function (err) {
      if (err) {
        return console.error(err);
      }
    })
  }

  //rules
  async getRules(ctx){
    const rules = prometheusAddr + "/api/v1/rules"
    let res = await new Promise((resolve, reject) => {
      request(rules, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          body = JSON.parse(body).data;
          resolve(body)
        } else {
          if (response) {
            console.log(JSON.parse(response.body).error)
            reject(new Error(JSON.parse(response.body).error))
          }
          else reject(new Error("服务未开启"))

        }
      })
    })
    return (ctx.success({ data: res.groups }))
  }
}

module.exports = new backendSettingsController();