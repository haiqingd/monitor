const router = require('koa-router')();

const user = require('../controller/user/user.js');
const database = require('../controller/target/database');
const getdata = require('../controller/monitor/getdata');
const backendSettings = require('../controller/settings/backendSettings')
const benchSettings = require('../controller/settings/benchSettings')
// const schedule = require('../controllers/schedule.js');

// 用户注册
router.post('/api/user/register', user.register);
// 用户登录
router.post('/api/user/login', user.login);
// router.post('/api/user/login', ()=>  {
//   console.log(1)
// });


// 添加成员
router.post('/api/user/addUser', user.addUser);
router.get('/api/user',user.getUserInfo)


//添加数据库
router.post('/api/db/addDatabase', database.addDatabase);
//查询ID
router.get('/api/db/allDBID', database.getAllID);
//查询Info
router.get('/api/db/DBInfo', database.getInfo);
//更改分组
router.post('/api/db/changeGroup',database.changeGroup)


//数据查询
router.get('/api/monit/overviewMySQL/CPU',getdata.getCPU);
router.get('/api/monit/overviewMySQL/Memory',getdata.getMeMory);
router.get('/api/monit/overviewMySQL/TPS',getdata.getTPS);
router.get('/api/monit/overviewMySQL/QPS',getdata.getQPS);
router.get('/api/monit/overviewMySQL/SlowQuery',getdata.getSlowQuery);
router.get('/api/monit/overviewMySQL/Threads_created',getdata.getThreads_created);
router.get('/api/monit/overviewMySQL/Threads_connected',getdata.getThreads_connected);
router.get('/api/monit/overviewMySQL/Threads_running',getdata.getThreads_running);
router.get('/api/monit/overviewMySQL/Connect_aborted',getdata.Connect_aborted);
router.get('/api/monit/overviewMySQL/KeyBufferReadHItRate',getdata.KeyBufferReadHItRate);
router.get('/api/monit/overviewMySQL/KeyBufferWriteHItRate',getdata.KeyBufferWriteHItRate);
router.get('/api/monit/overviewMySQL/InnodbHitRate',getdata.InnodbHitRate);
router.get('/api/monit/overviewMySQL/ThreadCacheHitRate',getdata.ThreadCacheHitRate);
router.get('/api/monit/overviewMySQL/BytesReceived',getdata.BytesReceived);
router.get('/api/monit/overviewMySQL/BytesSent',getdata.BytesSent);
router.get('/api/monit/overviewMySQL/slaveRunning',getdata.slaveRunning);

router.get('/api/monit/allName',getdata.allName);

//current
router.get('/api/monit/toTimeMonit/status',getdata.getCurrentInfo);
router.get('/api/monit/toTimeMonit/alert',getdata.getAlert);



//Settings
router.get('/api/settings/prometheusStatus',backendSettings.getPrometheusStatus)
router.get('/api/settings/prometheusTargets',backendSettings.getTargets)
router.get('/api/settings/prometheusCommandLineFlags',backendSettings.getCommandLineFlags)
router.post('/api/settings/prometheusCommandLineFlags',backendSettings.setCommandLineFlags)
router.get('/api/settings/prometheusConfig',backendSettings.getPrometheusConfig)

router.get('/api/settings/backend',backendSettings.getBackend)
router.post('/api/settings/backend',backendSettings.setBackend)
router.get('/api/settings/rules',backendSettings.getRules)
router.get('/api/settings/alertmanager',backendSettings.getAlertManagerYML)
router.post('/api/settings/alertmanager',backendSettings.setAlertManagerYML)




//Debug
router.post('/api/reload',backendSettings.reload)
router.post('/api/restart',backendSettings.restart)

//Bench
router.post('/api/benchcfg/init',benchSettings.init)
router.get('/api/benchcfg',benchSettings.getdata)
router.post('/api/benchcfg',benchSettings.change)
router.post('/api/benchcfg/group',benchSettings.changeGroup)
router.post('/api/benchcfg/del',benchSettings.delete)



module.exports = router;