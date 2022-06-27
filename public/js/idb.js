// create variable to hold db connection
let db;
// establish a connection to IndexedDB database
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `new_pizza`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon a successful connection
request.onsuccess = function (event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run function to send all local db data to api
    if (navigator.onLine) {
        uploadTransaction();
    }
};

// upon error
request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
};

//Runs if there is no internet connection when user tries to use tracker
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for `new_pizza`
    const transactionStore = transaction.objectStore('new_transaction');

    // add record to your store with add method
    transactionStore.add(record);
}


function uploadTransaction() {
    //Open transaction on db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access store object
    const transactionStore = transaction.objectStore('new_transaction');

    //get all records from store and set to getAll variable
    const getAll = transactionStore.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                // access the new_pizza object store
                const transactionStore = transaction.objectStore('new_transaction');
                // clear all items in your store
                transactionStore.clear();

                alert('All saved transactions have been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);