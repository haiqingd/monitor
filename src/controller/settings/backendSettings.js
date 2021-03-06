const query_api = require("../monitor/getdata").query_api
const query = require('../../mysqlConnect/mysqlconnect')
const prometheusAddr = require("../../../config/config.js").prometheus
const request = require('request');
const verToken = require('../../middlewares/passport');
const startProm = require("../../../config/config").wherePrometheus
const util = require('util');
let backend = require("../../../config/config")
const fs = require("fs");
const { wherePrometheus } = require("../../../config/config");
const YAML = require('yamljs');
const { resolve } = require("path");



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
    else console.log(new Error(prometheusAddr + '/-/reload' + " 重启错误"))
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
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
    }

    const bkedst = new backendSettingsController()
    const rld = new Promise(function (resolve, reject) {
      request({
        url: prometheusAddr + '/-/reload',
        method: "POST",
        json: true,
        headers: {
          "content-type": "application/json",
        }
      }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          resolve(response.statusCode);
        }
        else {
          reject(-200)
        }
      })
    })
    await rld.then(async function (value) {
      console.log("Prometheus reloaded successfully!!")
      const lastConfigTime = (await bkedst.getPrometheusStatus(ctx)).lastConfigTime
      ctx.success({ msg: "Prometheus reloaded successfully!", data: { lastConfigTime } })
      resolve()
    }, function (err) {
      console.log("Prometheus reloaded error!!")
      let errorInfo = ''
      data = fs.readFileSync('Prometheus.log', 'utf-8')
      var index = data.slice(0, -1).lastIndexOf('\n');
      errorInfo = data.slice(index + 1)
      console.log(data.slice(index + 1))
      ctx.error({ msg: "重启Prometheus时出错", data: errorInfo })
      resolve()
    })
  }


  async restart(ctx) {
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
    }
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
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
    }

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
            console.log(response.body)
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
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
    }
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
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
    }
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

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
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

  //getPrometheusConfig
  async getPrometheusConfig(ctx) {
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
    }
    const position = wherePrometheus.slice(0, wherePrometheus.lastIndexOf('/prometheus'))
      + '/prometheus.yml'
    // let file = fs.readFileSync(position, 'utf-8').toString()
    let file = YAML.parse(fs.readFileSync(position, 'utf-8').toString())
    return (ctx.success({ data: file }))
  }

  //setPromCfg_gl
  async setPrometheusConfig_gl(ctx) {
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
    }

    const position = wherePrometheus.slice(0, wherePrometheus.lastIndexOf('/prometheus'))
      + '/prometheus.yml'
    let file = YAML.parse(await fs.readFileSync(position, 'utf-8').toString())
    const data = ctx.request.body
    for (let i in data) {
      if (data[i] != '' && data[i]) {
        file.global[i] = data[i]
      }
    }
    const yamlfile = YAML.stringify(file)

    let err = null
    await fs.writeFileSync(position, yamlfile, function (err) {
      if (err) {
        return console.error(err);
      }
    })
    if (err) return ctx.error({ msg: "文件写入时失败，可能是权限不够，请将data中的内容覆盖Prometheus主机的位置：" + position, data: file })
    await new backendSettingsController().reload(ctx);
    if (ctx.body.code == -200) return ctx.error({ msg: '设置出错', data: ctx.body.data });
    return ctx.success({ msg: "设置成功" })

  }


  //backendparam
  async getBackend(ctx) {
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
    }

    let backend_copy = {}
    for (let i in backend) {
      backend_copy[i] = backend[i]
    }
    delete eval(backend_copy).key
    delete eval(backend_copy).query
    delete eval(backend_copy).query_range
    delete eval(backend_copy).database
    delete eval(backend_copy).table_name_user
    delete eval(backend_copy).table_name_database
    delete eval(backend_copy).table_name_alert
    delete eval(backend_copy).table_name_benchPage
    delete eval(backend_copy).table_name_ChartOption
    delete eval(backend_copy).password

    return (ctx.success({ data: backend_copy }))
  }

  //setBackend
  async setBackend(ctx) {
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
    }


    const data = ctx.request.body;

    let backend_copy = {}


    for (let i in backend) {
      if (data[i] != '' && data[i] != null) {
        backend_copy[i] = data[i]
      } else
        backend_copy[i] = backend[i]

    }
    let cfgStr = 'module.exports = '
    cfgStr += JSON.stringify(backend_copy, null, '  ')


    fs.writeFileSync('config/config.js', cfgStr, function (err) {
      if (err) {
        return console.error(err);
      }
    })
    delete require.cache[require.resolve("../../../config/config")]
    backend = require("../../../config/config")

    console.log(backend.frequency)
    return ctx.success({ msg: "success" })
  }

  //rules
  async getRules(ctx) {
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
    }
    // const rules = prometheusAddr + "/api/v1/rules"
    // let res = await new Promise((resolve, reject) => {
    //   request(rules, function (error, response, body) {
    //     if (!error && response.statusCode == 200) {
    //       body = JSON.parse(body).data;
    //       resolve(body)
    //     } else {
    //       if (response) {
    //         console.log(JSON.parse(response.body).error)
    //         reject(new Error(JSON.parse(response.body).error))
    //       }
    //       else reject(new Error("服务未开启"))

    //     }
    //   })
    // })
    // return (ctx.success({ data: res.groups }))
    const position = wherePrometheus.slice(0, wherePrometheus.lastIndexOf('/prometheus'))
      + '/prometheus_rules.yml'
    let file = YAML.parse(await fs.readFileSync(position, 'utf-8').toString())
    return (ctx.success({ data: file }))
  }

  async setRule(ctx) {
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
    }
    const position = wherePrometheus.slice(0, wherePrometheus.lastIndexOf('/prometheus'))
      + '/prometheus_rules.yml'
    let file = YAML.parse(await fs.readFileSync(position, 'utf-8').toString())
    // console.log(file.groups[1].rules)

    const data = ctx.request.body

    for (let i in file.groups) {
      if (file.groups[i].name == data.name) return ctx.error({ msg: "已存在的报警名称，请更换后重试" })
    }
    let appendIndex_json = {}
    for (let i in data) {
      if (data[i] != '' && data[i] != null) {
        appendIndex_json[i] = data[i]
      }
    }

    file.groups.push(appendIndex_json)
    let file_yaml = YAML.stringify(file, 2)
    // console.log(file_yaml)

    fs.writeFileSync(position, file_yaml, function (err) {
      if (err) {
        return console.error(err);
      }
    })
    await new backendSettingsController().reload(ctx);
    if (ctx.body.code == -200) {
      file.groups.pop()
      file_yaml = YAML.stringify(file)
      fs.writeFileSync(position, file_yaml, function (err) {
        if (err) {
          return console.error(err);
        }
      })
      return ctx.error({ msg: "更改文件后重启出错，已删除该行，请确认正确后重试", data: ctx.body.data })
    }


    console.log("set Rule:" + data.name)
    return ctx.success({ msg: "success" })


  }

  async alterRule(ctx) {
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
    }
    const position = wherePrometheus.slice(0, wherePrometheus.lastIndexOf('/prometheus'))
      + '/prometheus_rules.yml'
    let file = YAML.parse(await fs.readFileSync(position, 'utf-8').toString())

    const data = ctx.request.body
    for (let i in file.groups) {
      if (file.groups[i].name == data.name) {
        for (let j in data.rules[0]) {
          if (data.rules[0][j] != '' && typeof (data.rules[0][j]) != 'object') {
            file.groups[i].rules[0][j] = data.rules[0][j]
          }
        }
        if (data.rules[0].labels.severity && data.rules[0].labels.severity != '') {
          if (!file.groups[i].rules[0].labels) file.groups[i].rules[0].labels = {}
          file.groups[i].rules[0].labels.severity = data.rules[0][j]
        }

        if (data.rules[0].annotations.summary && data.rules[0].annotations.summary != '') {
          if (!file.groups[i].rules[0].annotations) file.groups[i].rules[0].annotations = {}
          file.groups[i].rules[0].annotations.summary = data.rules[0].annotations.summary
        }
        if (data.rules[0].annotations.description && data.rules[0].annotations.description != '') {
          if (!file.groups[i].rules[0].annotations) file.groups[i].rules[0].annotations = {}
          file.groups[i].rules[0].annotations.description = data.rules[0].annotations.description
        }
        let file_yaml = YAML.stringify(file, 2)
        await fs.writeFileSync(position, file_yaml, function (err) {
          if (err) {
            return console.error(err);
          }
        })
        await new backendSettingsController().reload(ctx);
        if (ctx.body.code == -200) return ctx.error({ msg: '设置出错', data: ctx.body.data })
        return ctx.success({ msg: "success" })
      }
    }


    return ctx.error({ msg: "不存在的报警名称" })
  }

  async delRule(ctx) {
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (rows[0].userGroup != 0 && rows[0].userGroup != 1) {
      return ctx.error({ msg: "用户权限不足！请使用管理员或标准用户" })
    }
    const position = wherePrometheus.slice(0, wherePrometheus.lastIndexOf('/prometheus'))
      + '/prometheus_rules.yml'
    let file = YAML.parse(await fs.readFileSync(position, 'utf-8').toString())

    const data = ctx.request.body


    for (let i in file.groups) {
      if (file.groups[i].name == data.name) {

        file.groups.splice(i, 1)
        let file_yaml = YAML.stringify(file, 2)
        fs.writeFileSync(position, file_yaml, function (err) {
          if (err) {
            return console.error(err);
          }
        })
        await new backendSettingsController().reload(ctx);
        if (ctx.body.code == -200) return ctx.error({ msg: '设置出错', data: ctx.body.data })
        return ctx.success({ msg: "success" })

      }
    }


    return ctx.error({ msg: "不存在的报警名称" })
  }

  async getAlertManagerYML(ctx) {
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (!rows[0] || (rows[0].userGroup != 0 && rows[0].userGroup != 1)) {
      return ctx.error({ msg: "用户权限不足或未登录！请使用管理员或标准用户" })
    }

    const position = (backend.whereAlertManager
      .slice(0, backend.whereAlertManager.lastIndexOf('/alertmanager')))
      + '/alertmanager.yml'

    let file = YAML.parse(await fs.readFileSync(position, 'utf-8'))


    ctx.success({ msg: "读取成功", data: file })

  }

  async setAlertManagerYML(ctx) {
    await verToken(ctx);
    const username_login = ctx.state.username;

    let rows = await query(`select * from user where username = '${username_login}'`);
    if (!rows[0] || (rows[0].userGroup != 0 && rows[0].userGroup != 1)) {
      return ctx.error({ msg: "用户权限不足或未登录！请使用管理员或标准用户" })
    }

    const position = (backend.whereAlertManager
      .slice(0, backend.whereAlertManager.lastIndexOf('/alertmanager')))
      + '/alertmanager.yml'

    let file = YAML.parse(await fs.readFileSync(position, 'utf-8'))

    const { property, value } = ctx.request.body

    //对输入的property分成数组
    // const arr = property.split(/\.|\]|\[/)
    // //去除空值
    // var r = arr.filter(function (s) {
    //   return s && s.trim();
    // });
    // console.log(r.slice(0,-1))

    const arr = property.split(/\./)
    let alterindex = file
    for (let i in arr.slice(0, -1)) {
      if (1) {
        const place = arr[i].indexOf('[')
        if (place != -1) {
          alterindex = alterindex[arr[i].slice(0, place)]
          const index = arr[i].slice(place + 1, arr[i].indexOf(']'))
          alterindex = alterindex[index]
        } else {
          alterindex = alterindex[arr[i]]
        }
      }
    }

    alterindex[arr.slice(-1)] = value


    // console.log(file[property])
    const yamlfile = YAML.stringify(file)

    await fs.writeFileSync(position, yamlfile, function (err) {
      if (err) {
        return console.error(err);
      }
    })

    const bkedst = new backendSettingsController()
    const rld = new Promise(function (resolve, reject) {
      request({
        url: prometheusAddr.slice(0, -1) + '3/-/reload',
        method: "POST",
        json: true,
        headers: {
          "content-type": "application/json",
        }
      }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          resolve(response.statusCode);
        }
        else {
          reject(-200)
        }
      })
    })
    await rld.then(async function (value) {
      console.log("AlertManager reloaded successfully!!")
      ctx.success({ msg: "AlertManager reloaded successfully!"})
      resolve()
    }, function (err) {
      console.log("AlertManager reloaded error!!")
      ctx.error({ msg: "重启AlertManager时出错"})
      resolve()
    })

  }


}

module.exports = new backendSettingsController();