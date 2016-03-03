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
const prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * helper to get the correct event name if we use a prefix or not
 */
const getEventName = (ev) => {
    if (prefix) {
        if (ev.substr(0, prefix.length) === prefix) {
            return ev;
        }
        return prefix + ev;
    }
    
    return ev;
}

/**
 * A container for an event listened to
 */
class Listener {
    /**
     * @param {Function} fn
     * @param {Object} [ctx]
     * @param {Boolean} [once]
     */
    constructor(fn, ctx, once=false) {
        this.fn = fn;
        this.ctx = ctx;
        this.once = once;
    }
}

class EventEmitter {
    constructor() {
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
    on(ev, fn, ctx) {
        return this._on(ev, fn, ctx);
    }
    // proxy method for API compatability
    addListener(ev, fn, ctx) {
        return this._on(ev, fn, ctx);
    }
    
    /**
     * listen to an event ONLY ONCE and call the callback function when it is emitted
     *
     * @param {String} ev
     * @param {Function} fn
     * @param {Object} [ctx]
     */
    once(ev, fn, ctx) {
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
    _on(ev, fn, ctx, once=false) {
        ev = getEventName(ev);
        
        const listener = new Listener(fn, ctx || this, once);
        
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
    off(ev, fn, ctx, once=false) {
        ev = getEventName(ev);
        
        if (!this._events[ev]) {
            return;
        }
        
        const listeners = this._events[ev];
        const len = listeners.length;
        const events = [];
        
        if (fn) {
            for (let i = 0; i < len; i++) {
                if (listeners[i].fn !== fn 
                    || (once && !listeners[i].once)
                    || (ctx && listeners[i].ctx !== ctx)
                ) {
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
    removeListener(ev, fn, ctx, once) {
        return this.off(ev, fn, ctx, once);
    }
    
    /**
     * nuke either just an event or all events
     *
     * @param {String} [ev]
     */
    removeAllListeners(ev=false) {
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
    emit(ev, a1, a2, a3, a4, a5) {
        ev = getEventName(ev);
        
        if (!this._events[ev]) {
            return false;
        }
        
        // need to keep a local copy around as we'll be modifying it 
        // with the call to .off inside the loop
        const listeners = this._events[ev];
        const len = listeners.length;
        const argsLen = arguments.length;
        
        for (let i = 0; i < len; i++) {
            const listener = listeners[i];
            
            // need to remove before calling for case of emit called inside callback
            if (listener.once) {
                this.off(ev, listener.fn, listener.ctx, true);
            }
            
            if (argsLen <= 6) {
                // try to optimize speed a bit for "normal" argument counts
                switch (argsLen) {
                    case 1: listener.fn.call(listener.ctx); break;
                    case 2: listener.fn.call(listener.ctx, a1); break;
                    case 3: listener.fn.call(listener.ctx, a1, a2); break;
                    case 4: listener.fn.call(listener.ctx, a1, a2, a3); break;
                    case 5: listener.fn.call(listener.ctx, a1, a2, a3, a4); break;
                    case 6: listener.fn.call(listener.ctx, a1, a2, a3, a4, a5); break;
                }    
            } else {
                // sigh, we'll go slow for you
                const args = new Array(argsLen - 1);
                for (let i = 1; i < argsLen; i++) {
                    args[i - 1] = arguments[i];
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
     listeners(ev, exists) {
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
             const len = this._events[ev].length;
             const listeners = new Array(len);
             
             for (let i = 0; i < len; i++) {
                 listeners[i] = this._events[ev][i].fn;
             }
             
             return listeners;
         }
         
         return [];
     }
     
     /**
      * unused but included for API compatability
      */
     setMaxListeners() {
         return this;
     }
}

// the non-EE3 compatable thing is that we don't export a function
// we instead export a class, so there is no EventEmitter.EventEmitter, etc 
module.exports = EventEmitter;