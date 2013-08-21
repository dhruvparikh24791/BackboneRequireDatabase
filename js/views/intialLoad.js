/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
define([],function () {
    console.log("In initialLoad()");
    var contacts=[];
    try {
        if (!window.openDatabase) {
            alert('Local Databases are not supported by your browser. Please use a Webkit browser for this demo');
        } else {
            var shortName = 'CONTACTS';
            var version = '1.0';
            var displayName = 'CONTACT_TEST';
            var maxSize = 5 * 1024 * 1024; // in bytes
            CONTACTSDB = openDatabase(shortName, version, displayName, maxSize);
            console.log("Loaded Database CONTACTS");
            CONTACTSDB.transaction(
                    function(transaction) {
                        transaction.executeSql('CREATE TABLE IF NOT EXISTS contacts_table(id INTEGER NOT NULL PRIMARY KEY, name TEXT NOT NULL,address TEXT NOT NULL);', [], nullDataHandler, errorHandler);
                        console.log("Table Created!");
                    }

            );
            CONTACTSDB.transaction(
                    function(transaction) {
                        transaction.executeSql("SELECT * FROM contacts_table;", [], dataSelectHandler, errorHandler);
                    });

        }
    } catch (e) {
        if (e === 2) {
            // Version mismatch.
            console.log("Invalid database version.");
        } else {
            console.log("Unknown error " + e + ".");
        }
    }



    function errorHandler(transaction, error) {
        if (error.code === 1) {
            // DB Table already exists
        } else {
            // Error is a human-readable string.
            console.log('Oops.  Error was ' + error.message + ' (Code ' + error.code + ')');
        }
        return false;
    }


    function nullDataHandler() {
        console.log("SQL Query Succeeded");
    }


//                    var collectionref = this.collection;
    function dataSelectHandler(transaction, results) {
        console.log("Adding from DB");
        for (var i = 0; i < results.rows.length; i++) {

            var row = results.rows.item(i);
            var newContact = new Object();
            newContact.id = row['id'];
            newContact.name = row['name'];
            newContact.address = row['address'];
            contacts.push(newContact);

        }
        console.log("Contacts loaded from db");
        //console.log(contacts);

    }
   
    return contacts;
});

