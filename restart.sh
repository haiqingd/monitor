cat /dev/null > Prometheus.log 
curl -XPOST "http://47.102.197.233:9090/-/quit"
sleep 2
nohup /home/Prometheus/prometheus/prometheus --config.file=/home/Prometheus/prometheus/prometheus.yml --storage.tsdb.retention.size=20GB --storage.tsdb.retention.time=720d --web.enable-admin-api --web.enable-lifecycle >Prometheus.log 2>&1 &