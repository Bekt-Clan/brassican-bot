import * as environment from './services/environment';
import * as database from './stores';
import * as discord from './discord';
import * as wiseoldman from './config/wom';
import * as scheduler from './services/scheduler';
import * as docs from './docs/docs';

(async () => {
    environment.initialize();
    await database.initialize();
    wiseoldman.initialize();
    await discord.initialize();
    await docs.initialize();
    await scheduler.initialize();
})();
