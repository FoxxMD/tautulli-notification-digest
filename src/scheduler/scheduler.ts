import {CronJob, ToadScheduler} from "toad-scheduler";
import {createHeartbeatTask} from "./tasks/heartbeatTask.js";

const initScheduler = () => {
    const scheduler = new ToadScheduler()

    scheduler.addCronJob(new CronJob({
        cronExpression: '*/2 * * * * *'
    }, createHeartbeatTask('das')))
}
