const Thread = require('../engine/thread');
const Timer = require('../util/timer');

// All the functions defined here will be available to compiled scripts.
// The JSDoc annotations define the function's contract.
// Most of these functions are only used at runtime by generated scripts. Despite what your editor may say, they are not unused.

/**
 * End a procedure call.
 */
const endCall = () => {
    if (thread.warp) {
        thread.warp--;
    }
};

/**
 * Start hats by opcode.
 * @param {string} requestedHat The opcode of the hat to start.
 * @param {*} optMatchFields Fields to match.
 * @returns {Array} A list of threads that were started.
 */
const startHats = (requestedHat, optMatchFields) => {
    const threads = thread.target.runtime.startHats(requestedHat, optMatchFields, undefined);
    return threads;
};

/**
 * Implements "thread waiting", where scripts are halted until all the scripts have finished executing.
 * Threads are considered "active" if they are still in the thread list, even if they have STATUS_DONE.
 * The current thread's status may be changed to STATUS_YIELD_TICK if all active threads are waiting.
 * @param {Array} threads The list of threads.
 * @returns {boolean} true if the script should keep waiting on threads to complete
 */
const waitThreads = (threads) => {
    const runtime = thread.target.runtime;

    // determine whether any threads are running
    var anyRunning = false;
    for (var i = 0; i < threads.length; i++) {
        if (runtime.threads.indexOf(threads[i]) !== -1) {
            anyRunning = true;
            break;
        }
    }
    if (!anyRunning) {
        return false;
    }

    var allWaiting = true;
    for (var i = 0; i < threads.length; i++) {
        if (!runtime.isWaitingThread(threads[i])) {
            allWaiting = false;
            break;
        }
    }
    if (allWaiting) {
        thread.status = 3; // STATUS_YIELD_TICK
    }

    return true;
};

/**
 * End the current script.
 */
const retire = () => {
    thread.target.runtime.sequencer.retireThread(thread);
};

/**
 * Scratch cast to number.
 * Similar to Cast.toNumber()
 * @param {*} value The value to cast
 * @returns {number}
 */
const toNumber = (value) => {
    return +value || 0;
};

/**
 * Converts a number to ensure that NaN becomes 0.
 * @param {number} number The value to convert.
 * @returns {number}
 */
const toNotNaN = (number) => {
    return number || 0;
};

/**
 * Scratch cast to boolean.
 * Similar to Cast.toBoolean()
 * @param {*} value The value to cast
 * @returns {boolean}
 */
const toBoolean = (value) => {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        if (value === '' || value === '0' || value.toLowerCase() === 'false') {
            return false;
        }
        return true;
    }
    return !!value;
};

/**
 * Scratch cast to string.
 * Similar to Cast.toString()
 * @param {*} value The value to cast
 * @returns {string}
 */
const toString = (value) => {
    return '' + value;
};

/**
 * Check if a value is considered whitespace.
 * Similar to Cast.isWhiteSpace()
 * @param {*} val Value to check
 * @returns {boolean}
 */
const isWhiteSpace = (val) => {
    return val === null || (typeof val === 'string' && val.trim().length === 0);
}

/**
 * Compare two values using Scratch casting.
 * Similar to Cast.compare()
 * @param {*} v1 First value to compare.
 * @param {*} v2 Second value to compare.
 * @returns {number} Negative if v1 < v2, 0 if equal, positive if v1 > v2
 */
const compare = (v1, v2) => {
    let n1 = +v1;
    let n2 = +v2;
    if (n1 === 0 && isWhiteSpace(v1)) {
        n1 = NaN;
    } else if (n2 === 0 && isWhiteSpace(v2)) {
        n2 = NaN;
    }
    if (isNaN(n1) || isNaN(n2)) {
        const s1 = ('' + v1).toLowerCase();
        const s2 = ('' + v2).toLowerCase();
        if (s1 < s2) {
            return -1;
        } else if (s1 > s2) {
            return 1;
        }
        return 0;
    }
    if (
        (n1 === Infinity && n2 === Infinity) ||
        (n1 === -Infinity && n2 === -Infinity)
    ) {
        return 0;
    }
    return n1 - n2;
};

/**
 * Perform an IO query
 * @param {string} device
 * @param {string} func
 * @param {*} args
 * @returns {*}
 */
const ioQuery = (device, func, args) => {
    // We will assume that the device always exists.
    const devObject = thread.target.runtime.ioDevices[device];
    return devObject[func].apply(devObject, args);
};

/**
 * Create and start a timer.
 * @returns {Timer}
 */
const timer = () => {
    const timer = new Timer();
    timer.start();
    return timer;
};

/**
 * Convert a Scratch list index to a JavaScript list index.
 * "all" is not considered as a list index.
 * Similar to Cast.toListIndex()
 * @param {number} index Scratch list index.
 * @param {number} length Length of the list.
 * @returns {number} 0 based list index, or -1 if invalid.
 */
var listIndex = (index, length) => {
    if (typeof index !== 'number') {
        if (index === 'last') {
            if (length > 0) {
                return length;
            }
            return -1;
        } else if (index === 'random' || index === '*') {
            if (length > 0) {
                return Math.floor(Math.random() * length);
            }
            return -1;
        }
        index = toNumber(index);
    }
    index = Math.floor(index);
    if (index < 1 || index > length) {
        return -1;
    }
    return index - 1;
};

/**
 * Get a value from a list.
 * @param {import('../engine/variable')} list The list
 * @param {*} idx The 1-indexed index in the list.
 */
const listGet = (list, idx) => {
    const index = listIndex(idx, list.value.length);
    if (index === -1) {
        return '';
    }
    return list.value[index];
};

/**
 * Replace a value in a list.
 * @param {import('../engine/variable')} list The list
 * @param {*} idx List index, Scratch style.
 * @param {*} value The new value.
 */
const listReplace = (list, idx, value) => {
    const index = listIndex(idx, list.value.length);
    if (index === -1) {
        return;
    }
    list.value[index] = value;
    list._monitorUpToDate = false;
};

/**
 * Insert a value in a list.
 * @param {import('../engine/variable')} list The list.
 * @param {any} idx The Scratch index in the list.
 * @param {any} value The value to insert.
 */
const listInsert = (list, idx, value) => {
    const index = listIndex(idx, list.value.length + 1);
    if (index === -1) {
        return;
    }
    list.value.splice(index, 0, value);
    list._monitorUpToDate = false;
};

/**
 * Delete a value from a list.
 * @param {import('../engine/variable')} list The list.
 * @param {any} idx The Scratch index in the list.
 */
const listDelete = (list, idx) => {
    if (idx === 'all') {
        list.value = [];
        return;
    }
    const index = listIndex(idx, list.value.length);
    if (index === -1) {
        return;
    }
    list.value.splice(index, 1);
    list._monitorUpToDate = false;
};

/**
 * Return whether a list contains a value.
 * @param {import('../engine/variable')} list The list.
 * @param {any} item The value to search for.
 * @returns {boolean}
 */
const listContains = (list, item) => {
    // TODO: evaluate whether indexOf is worthwhile here
    if (list.value.indexOf(item) !== -1) {
        return true;
    }
    for (let i = 0; i < list.value.length; i++) {
        if (compare(list.value[i], item) === 0) {
            return true;
        }
    }
    return false;
};

/**
 * Implements Scratch modulo (floored division instead of truncated division)
 * @param {number} n
 * @param {number} modulus
 * @returns {number}
 */
const mod = (n, modulus) => {
    let result = n % modulus;
    if (result / modulus < 0) result += modulus;
    return result;
};

/**
 * The currently running thread.
 * @type {Thread}
 */
var thread;

/**
 * Step a compiled thread.
 * @param {Thread} _thread
 */
const execute = (_thread) => {
    thread = _thread;
    _thread.generator.next();
};

/**
 * Evaluate a continuation from its source code.
 * Prepares the necessary environment.
 * @param {string} source
 */
const createScriptFactory = (source) => {
    // we cache some very frequently accessed variables up here, it does a lot to help performance.
    source = `(function f(target) {
var runtime = target.runtime;
var stage = runtime.getTargetForStage();
var stageVariables = stage.variables;
var targetVariables = target.variables;
return ${source};
});`;

    return eval(source);
};

execute.createScriptFactory = createScriptFactory;

module.exports = execute;
