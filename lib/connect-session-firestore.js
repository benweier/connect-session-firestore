/**
 * @file Exports the FirestoreStore class
 * @copyright 2018 Ben Weier <ben.weier@gmail.com>
 * @license MIT
 */

/**
 * Six hours in milliseconds
 * @private
 */
const reapInterval = 21600000;

/**
 * Noop default reap callback function.
 * @return {this} The function scope.
 * @private
 */
const reapCallback = function reapCallback () {
  return this;
};

/**
 * Return Firestore session store extending Connect/Express session store.
 *
 * @module
 * @param  {Object} session Connect/Express Session Store
 * @return {Function}       FirestoreStore class
 */
const connectSessionFirestore = function connectSessionFirestore (session) {

  /**
   * Connect Store
   * @private
   */
  const Store = session.Store;

  /**
   * Create a new FirestoreStore.
   *
   * @constructor
   * @param {Object} args The configuration options for FirestoreStore
   */
  const FirestoreStore = function FirestoreStore (args = {}) {
    const db = args.database || {};
    const sessions = typeof args.sessions === 'string' ? args.sessions : 'sessions';

    Store.call(args);

    /**
     * Replace disallowed characters in a Firestore reference key.
     *
     * @inner
     * @param  {String} str A doc reference key
     * @return {String}     A valid doc reference key
     */
    this.cleanRef = function cleanRef (str) {
      return str.replace(/\.|\$|#|\[|\]|\//g, '_');
    };

    // Initialized `firestore` instance.
    if (db.collection) {
      this.db = db;
    } else if (db.firestore) {
      this.db = db.firestore();
    } else {
      throw new Error('Invalid Firestore reference');
    }

    // Set a doc reference to the sessions path.
    this.sessions = this.cleanRef(sessions);

    this.reapInterval = args.reapInterval || reapInterval;
    this.reapCallback = args.reapCallback || reapCallback;
    if (typeof this.reapInterval === 'number' && typeof this.reapCallback === 'function') {
      setInterval(this.reap.bind(this, this.reapCallback), this.reapInterval);
    }
  };

  /**
   * Inherit from `Store`
   * @private
   */
  // FirestoreStore.prototype.__proto__ = Store.prototype;
  FirestoreStore.prototype = Object.create(Store.prototype);

  /**
   * Fetch a keyed session reference.
   *
   * @param {String} sid  The session key
   * @param {Function} fn OnComplete callback function
   * @return {Promise}    A thenable Firestore reference
   */
  FirestoreStore.prototype.get = function get (sid, fn) {
    const key = this.cleanRef(sid);
    const now = Date.now();

    return this.db.collection(this.sessions)
      .doc(key)
      .get()
      .then(snapshot => {
        if (!snapshot.exists) {
          return fn();
        }

        if (snapshot.data().expires < now) {
          return this.destroy(sid, fn);
        }

        return fn(null, snapshot.data().session);
      })
      .catch(fn);
  };

  /**
   * Save a keyed session reference.
   *
   * @param  {String} sid  The session key
   * @param  {Object} sess The session data
   * @param  {Function} fn OnComplete callback function
   */
  FirestoreStore.prototype.set = function set (sid, session, fn) {
    const key = this.cleanRef(sid);
    const now = Date.now();
    const expires = session.cookie && typeof session.cookie.maxAge === 'number' ? now + session.cookie.maxAge : now + reapInterval;

    const data = {
      expires: expires,
      session: session,
      type: 'connect-session'
    };

    return this.db.collection(this.sessions)
      .doc(key)
      .set(data)
      .then(fn)
      .catch(fn);
  };

  /**
   * Remove a keyed session reference.
   *
   * @param  {String} sid  The session key
   * @param  {Function} fn OnComplete callback function
   */
  FirestoreStore.prototype.destroy = function destroy (sid, fn) {
    const key = this.cleanRef(sid);

    return this.db.collection(this.sessions)
      .doc(key)
      .delete()
      .then(fn)
      .catch(fn);
  };

  /**
   * Remove all session references.
   *
   * @param  {Function} fn OnComplete callback function
   * @return {Promise}     A thenable Firestore reference
   */
  FirestoreStore.prototype.clear = function clear (fn) {
    return this.db.collection(this.sessions)
      .get()
      .then(snapshots => {
        const remove = [];

        snapshots.forEach(snapshot => {
          remove.push(snapshot.ref.delete());
        });

        Promise.all(remove)
          .then(fn)
          .catch(fn);
      })
      .catch(fn);
  };

  /**
   * Remove all expired session references.
   *
   * @param  {Function} fn OnComplete callback function
   * @return {Promise}     A thenable Firestore reference
   */
  FirestoreStore.prototype.reap = function reap (fn) {
    const now = Date.now();

    return this.db.collection(this.sessions)
      .where('expires', '<', now)
      .get()
      .then(snapshots => {
        const remove = [];

        snapshots.forEach(snapshot => {
          remove.push(snapshot.ref.delete());
        });

        Promise.all(remove)
          .then(fn)
          .catch(fn);
      })
      .catch(fn);
  };

  /**
   * Update a keyed session reference.
   *
   * @param  {String} sid  The session key
   * @param  {Object} sess The session data
   * @param  {Function} fn OnComplete callback function
   * @return {Promise}     A thenable Firestore reference
   */
  FirestoreStore.prototype.touch = function touch (sid, session, fn) {
    const key = this.cleanRef(sid);

    return this.db.collection(this.sessions)
      .doc(key)
      .get()
      .then(snapshot => {
        if (!snapshot.exists) {
          return fn();
        }

        const touched = Object.assign(
          {},
          snapshot.data().session,
          { cookie: session.cookie }
        );

        return this.set(sid, touched, fn);
      })
      .catch(fn);
  };

  return FirestoreStore;
};

module.exports = connectSessionFirestore;
