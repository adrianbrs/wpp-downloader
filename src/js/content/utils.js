/**
 * Returns a promise that resolve when target is available
 */
$.fn.onAvailable = function(target, options = {}) {
    let settings = $.extend(
        {},
        {
            wait_time: 10,
            max_tries: 100
        },
        options
    );
    return new Promise((solve, reject) => {
        let selector = this;
        let timer;
        if (this.find(target).length) solve(this.find(target));
        else {
            let tries = 0;
            timer = setInterval(() => {
                let $target = selector.find(target);
                if ($target.length) {
                    solve($target);
                    clearInterval(timer);
                } else if (tries == settings.max_tries) {
                    reject();
                }
                tries++;
            }, settings.wait_time);
        }
    });
};
