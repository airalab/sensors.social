/* Functions for working with IndexedDB */

/*  
    function IDBworkflow
    Basic for InxedDB:
    - opens and checks for uppropriate version;
    - creates objectStore for dbtable

    Usage example:
    idbworkflow('db', 1, 'dbtable', 'readonly', store => {
        let somearray = []
        store.openCursor().addEventListener('success', e => {
            const cursor = e.target.result
            if(cursor){
                somearray.push(cursor.value)
                cursor.continue()
            }
        })
    })
 */
export function IDBworkflow(dbname, dbver, dbtable, mode, onsuccess) {
    const IDB = window.indexedDB || window.webkitIndexedDB
    if(!IDB) { return }

    let db = null
    const DBOpenReq = IDB.open(dbname, dbver)
    
    DBOpenReq.addEventListener('error', err => {
        console.warn(err)
    })

    DBOpenReq.addEventListener('success', e => {
        db = e.target.result;

        if(db.objectStoreNames.contains(dbtable)) {
            let tx = db.transaction(dbtable, mode);
            tx.addEventListener('error', err => {
                console.warn(err)
            })
            const store = tx.objectStore(dbtable)
            onsuccess(store)
        }
    })


    DBOpenReq.addEventListener('upgradeneeded', (e) => {
        db = e.target.result
            
        const oldVersion = e.oldVersion
        const newVersion = e.newVersion || db.version

        if(oldVersion === 0) {
            console.log('DB updated from version', oldVersion, 'to', newVersion);
        } else {
            IDBcleartable(dbname, dbver, dbtable);
            console.log('DB version is outdated, all data will be cleared for further compatible work');
        }

        if (!db.objectStoreNames.contains(dbtable)) {
            db.createObjectStore(dbtable, {keyPath: 'id', autoIncrement: true})
        }
    })
}

/* gets all data from the table */
export function IDBgettable(dbname, dbver, dbtable) {
    return new Promise((resolve) => {
        let datafromtable = []
        IDBworkflow(dbname, dbver, dbtable, 'readonly', store => {
            store.openCursor().addEventListener('success', e => {
                const cursor = e.target.result
                if(cursor){
                    datafromtable.push(cursor.value)
                    cursor.continue()
                } else {
                    resolve(datafromtable)
                }
            })
        })
    })
}

/* delete all data from the table */
export function IDBcleartable(dbname, dbver, dbtable) {

    IDBworkflow(dbname, dbver, dbtable, 'readwrite', store => {
        const request = store.clear();

        request.onsuccess = ()=> {
            console.log(`DB ${dbtable} cleared`);
            const bc = new BroadcastChannel('idb_changed');
            bc.postMessage(dbtable);
            bc.close();
            return true;
        }
    
        request.onerror = (err)=> {
            console.log(`Error to empty Object Store: ${err}`);
            return false;
        }
    });
    
}