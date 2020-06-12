module.exports = {
    currentCPU:`avg((100-irate(node_cpu_seconds_total{job="NodeName",mode="idle"}[accuracys])*100))`,
    currentMysqlUP:`up{job='DBName'}`,
    currentNodeUP:`up{job='NodeName'}`,
    currentDiskRead:`rate(node_disk_read_bytes_total{job="NodeName"}[30s])`,//这里的30s不建议作为参数更改
    currentDiskWrite:`rate(node_disk_written_bytes_total{job="NodeName"}[30s])`,//这里的30s不建议作为参数更改
    currentWait:'irate(node_cpu_seconds_total{job="NodeName",mode="iowait"}[accuracys])*1000',
    CPU:`avg((100-irate(node_cpu_seconds_total{job="NodeName",mode="idle"}[accuracys])*100))[total_scales:intervals] offset offsetTimes`,
    Memory:`(100- 100*(node_memory_MemFree_bytes{job="NodeName"}+node_memory_Cached_bytes{job="NodeName"} + node_memory_Buffers_bytes{job="NodeName"} + node_memory_Slab_bytes{job="NodeName"} ) /node_memory_MemTotal_bytes{job="NodeName"})[total_scales:intervals] offset offsetTimes`,
    TPS:`sum(rate(mysql_global_status_commands_total{job = 'DBName',command=~"commit|rollback"}[accuracys])) `,
    QPS:`rate(mysql_global_status_questions{job ="DBName"}[accuracys])[total_scales:intervals] offset offsetTimes`,
    SlowQuery:`mysql_global_status_slow_queries{job = "DBName"}[total_scales]offset offsetTimes`,
    Threads_created:`mysql_global_status_threads_created{job = "DBName"}[total_scales]offset offsetTimes`,
    Threads_connected:`mysql_global_status_threads_connected{job = "DBName"}[total_scales]offset offsetTimes`,
    Threads_running:`mysql_global_status_threads_running{job = "DBName"}[total_scales]offset offsetTimes`,
    Connect_aborted:`mysql_global_status_aborted_connects{job = "DBName"}[total_scales]offset offsetTimes`,
    KeyBufferReadHItRate:`(100-100*(rate(mysql_global_status_key_reads{job = "DBName"}[accuracys]))/(rate(mysql_global_status_key_read_requests{job = "DBName"}[accuracys])))[total_scales:intervals]offset offsetTimes`,
    KeyBufferWriteHItRate:`(100-100*(rate(mysql_global_status_key_writes{job = "DBName"}[accuracys]))/(rate(mysql_global_status_key_write_requests{job = "DBName"}[accuracys])))[total_scales:intervals]offset offsetTimes`,
    InnodbHitRate:`(100-100*(rate(mysql_global_status_innodb_buffer_pool_reads{job = "DBName"}[accuracys]))/(rate(mysql_global_status_innodb_buffer_pool_read_requests{job = "DBName"}[accuracys])))[total_scales:intervals]offset offsetTimes`,
    ThreadCacheHitRate:`(100-100*(rate(mysql_global_status_threads_created{job = "DBName"}[accuracys]))/(rate(mysql_global_status_connections{job = "DBName"}[accuracys])))[total_scales:intervals]offset offsetTimes`,
    BytesReceived:`rate(mysql_global_status_bytes_received{job = "DBName"}[accuracys])[total_scales:intervals]`,
    BytesSent:`rate(mysql_global_status_bytes_sent{job = "DBName"}[accuracys])[total_scales:intervals]`,
    slaveRunning:`mysql_global_status_slave_running{job = "DBName"}[total_scales:intervals]`,
}