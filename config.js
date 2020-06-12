module.exports = {
  "key": "mysql_Monitor",
  "smtpForSending": "smtp.qq.com",
  "smtpPort": "465",
  "email_username": "462574808@qq.com",
  "email_lisence": "jtvoaeqgckbfbjhj",
  "ifAlertToEmail": "true",
  "serverport": "3001",
  "wherePrometheus": "/home/Prometheus/prometheus/prometheus",
  "frequency": 10,
  "prometheus": "http://47.102.197.233:9090",
  "query": "/api/v1/query",
  "query_range": "/api/v1/query_range",
  "host": "localhost",
  "port": "3306",
  "database": "mysql",
  "username": "root",
  "password": "",
  "table_name_user": "user",
  "table_name_database": "databaseInfo",
  "table_name_alert": "alert",
  "table_name_benchPage": "bench",
  "table_name_ChartOption": "chartOption",
  "alertInhibition": "None",
  "dataToname_map": {
    "1": "CPU",
    "2": "Memory",
    "3": "TPS",
    "4": "QPS",
    "5": "SlowQuery",
    "6": "Threads_created",
    "7": "Threads_connected",
    "8": "Threads_running",
    "9": "Connect_aborted",
    "10": "keyBufferReadHitRate",
    "11": "InnodbHitRate",
    "12": "ThreadCacheHitRate",
    "13": "BytesReceived",
    "14": "BytesSent",
    "15": "slaveRunning",
    "16": "queryTime"
  }
}