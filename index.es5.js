'use strict';

/**
 * [ES2015 EventEmitter3](https://github.com/helloandre/es2015-eventemitter3)
 * a port of [EventEmitter3](https://github.com/primus/eventemitter3)
 * 
 * @author Andre Bluehs <hello@andrebluehs.net>
 */

// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * helper to get the correct event name if we use a prefix or not
 */
var getEventName = function getEventName(ev) {
    if (prefix) {
        if (ev.substr(0, prefix.length) === prefix) {
            return ev;
        }
        return prefix + ev;
    }

    return ev;
};

/**
 * A container for an event listened to
 */

var Listener =
/**
 * @param {Function} fn
 * @param {Object} [ctx]
 * @param {Boolean} [once]
 */
function Listener(fn, ctx) {
    var once = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

    _classCallCheck(this, Listener);

    this.fn = fn;
    this.ctx = ctx;
    this.once = once;
};

var EventEmitter = function () {
    function EventEmitter() {
        _classCallCheck(this, EventEmitter);

        // all the events that this instance is listening to
        this._events = prefix ? {} : Object.create(null);

        // expose the prefix-ness
        this.prefixed = prefix;
    }

    /**
     * listen to an event and call the callback function when it is emitted
     *
     * @param {String} ev
     * @param {Function} fn
     * @param {Object} [ctx]
     */


    _createClass(EventEmitter, [{
        key: 'on',
        value: function on(ev, fn, ctx) {
            return this._on(ev, fn, ctx);
        }
        // proxy method for API compatability

    }, {
        key: 'addListener',
        value: function addListener(ev, fn, ctx) {
            return this._on(ev, fn, ctx);
        }

        /**
         * listen to an event ONLY ONCE and call the callback function when it is emitted
         *
         * @param {String} ev
         * @param {Function} fn
         * @param {Object} [ctx]
         */

    }, {
        key: 'once',
        value: function once(ev, fn, ctx) {
            return this._on(ev, fn, ctx, true);
        }

        /**
        * Attach an event to our intenernal events object 
        *
        * @param {String} ev
        * @param {Function} fn
        * @param {Object} [ctx]
        * @param {Boolean} [once]
        *
        * @private
        */

    }, {
        key: '_on',
        value: function _on(ev, fn, ctx) {
            var once = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

            ev = getEventName(ev);

            var listener = new Listener(fn, ctx || this, once);

            if (!this._events[ev]) {
                this._events[ev] = [];
            }

            this._events[ev].push(listener);

            return this;
        }

        /**
         * stop listening to an event 
         *
         * @param {String} ev
         * @param {Function} [fn]
         * @param {Object} [ctx]
         * @param {Boolean} [once] only remove Once functions
         */

    }, {
        key: 'off',
        value: function off(ev, fn, ctx) {
            var once = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

            ev = getEventName(ev);

            if (!this._events[ev]) {
                return;
            }

            var listeners = this._events[ev];
            var len = listeners.length;
            var events = [];

            if (fn) {
                for (var i = 0; i < len; i++) {
                    if (listeners[i].fn !== fn || once && !listeners[i].once || ctx && listeners[i].ctx !== ctx) {
                        events.push(listeners[i]);
                    }
                }
            }

            // reset or delete the array
            if (events.length) {
                this._events[ev] = events;
            } else {
                delete this._events[ev];
            }

            return this;
        }
        // proxy method for API compatability

    }, {
        key: 'removeListener',
        value: function removeListener(ev, fn, ctx, once) {
            return this.off(ev, fn, ctx, once);
        }

        /**
         * nuke either just an event or all events
         *
         * @param {String} [ev]
         */

    }, {
        key: 'removeAllListeners',
        value: function removeAllListeners() {
            var ev = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

            if (ev) {
                ev = getEventName(ev);
                if (this._events[ev]) {
                    delete this._events[ev];
                }
            } else {
                this._events = {};
            }

            return this;
        }

        /**
         * Emit an event to all event listeners
         * limited to 5 params sent to the calling methods for performance reasons
         *
         * @param {String} event
         * @params {mixed}
         *
         * @return {Boolean} if the event was emitted
         */

    }, {
        key: 'emit',
        value: function emit(ev, a1, a2, a3, a4, a5) {
            ev = getEventName(ev);

            if (!this._events[ev]) {
                return false;
            }

            // need to keep a local copy around as we'll be modifying it
            // with the call to .off inside the loop
            var listeners = this._events[ev];
            var len = listeners.length;
            var argsLen = arguments.length;

            for (var i = 0; i < len; i++) {
                var listener = listeners[i];

                // need to remove before calling for case of emit called inside callback
                if (listener.once) {
                    this.off(ev, listener.fn, listener.ctx, true);
                }

                if (argsLen <= 6) {
                    // try to optimize speed a bit for "normal" argument counts
                    switch (argsLen) {
                        case 1:
                            listener.fn.call(listener.ctx);break;
                        case 2:
                            listener.fn.call(listener.ctx, a1);break;
                        case 3:
                            listener.fn.call(listener.ctx, a1, a2);break;
                        case 4:
                            listener.fn.call(listener.ctx, a1, a2, a3);break;
                        case 5:
                            listener.fn.call(listener.ctx, a1, a2, a3, a4);break;
                        case 6:
                            listener.fn.call(listener.ctx, a1, a2, a3, a4, a5);break;
                    }
                } else {
                    // sigh, we'll go slow for you
                    var args = new Array(argsLen - 1);
                    for (var _i = 1; _i < argsLen; _i++) {
                        args[_i - 1] = arguments[_i];
                    }

                    listener.fn.apply(listener.ctx, args);
                }
            }

            return true;
        }

        /**
         * Return all the listeners for a particular event
         *
         * @param {String} events
         * @param {Boolean} exists - if we only want to know if the event exists
         *
         * @return {Array|Boolean}
         */

    }, {
        key: 'listeners',
        value: function listeners(ev, exists) {
            ev = getEventName(ev);

            //  console.log('listners', ev);
            //  console.log(this._events[ev]);

            if (exists) {
                if (ev) {
                    return !!this._events[ev];
                }
                return false;
            }

            if (ev && this._events[ev]) {
                var len = this._events[ev].length;
                var listeners = new Array(len);

                for (var i = 0; i < len; i++) {
                    listeners[i] = this._events[ev][i].fn;
                }

                return listeners;
            }

            return [];
        }

        /**
         * unused but included for API compatability
         */

    }, {
        key: 'setMaxListeners',
        value: function setMaxListeners() {
            return this;
        }
    }]);

    return EventEmitter;
}();

// the non-EE3 compatable thing is that we don't export a function
// we instead export a class, so there is no EventEmitter.EventEmitter, etc


module.exports = EventEmitter;
