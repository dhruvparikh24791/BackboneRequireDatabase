/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


//get all the dependencies
define(['jquery', 'underscore', 'backbone', 'views/intialLoad', 'collections/ContactCollection', 'views/ContactView', 'models/ContactModel'],
        function($, _, Backbone, contacts, Directory, ContactView, ContactModel) {
            var id;
            CONTACTSDB.transaction(
                    function(transaction) {
                        transaction.executeSql("SELECT MAX(id) FROM contacts_table;", [], maxId, errorHandler);
                    });
            function maxId(transaction, results) {
                //id=(results.rows.items(0).row["id"])++;
                var ans = results.rows.item(0);
                id = ans['MAX(id)'];


            }

            //var id = 8;

            //  var contacts = [];

            //Make Collections View
            var DirectoryView = Backbone.View.extend({
                el: "#main", //main is the div element in which  page and controls is there
                initialize: function() {
                    console.log("master view initialized");

                    console.log(contacts);
                    this.collection = new Directory();
                    this.collection.add(contacts);
                    console.log(this.collection);
                    _.bindAll(this, "render"); //'this' will refer to the element that invoked the event  object.on(event, callback, [context])
                    this.collection.on("reset", this.render, this); //render on collection changes and update - it gets the latest copy of the contacts array and then renders it
                    this.collection.on("add", this.renderContact, this); //add - adds single contact in collection and renders and also adds to array
                    this.collection.on("remove", this.onModelRemoved, this); //remove - removes the model from collection and changes the array
                    collectionref = this.collection;
                    this.render();// on initialize array

                },
                events: {
                    "click .searchByName": "searchName", //for search
                    "click #add": "addContact", //adding contact
                    "click button.delete": "deleteContact", // delete button
                    "click button.edit": "editContact", // edit button in model
                    "click #edit": "updateContact", // on save button after editing
                    "click #resetBtn": "resetList",
                    "click #clearBtn": "clearDatabase"
                },
                render: function() {
                    this.collection.sort(); //sort by name - comparator is defined in collection 
                    this.$el.find(".element").remove(); // clear all elements in page and add all again
                    //console.log(this.collection);
                    var that = this; // getting refernce to our object in the loop
                    //  if(this.collection.models[1])console.log("this.collection = " + this.collection.models[1].get("name"));
                    _.each(this.collection.models, function(item) {
                        that.renderContact(item); //render each contact individually

                    }, this);
                },
                renderContact: function(item) {
                    //console.log("item =" + item.get("address"));
                    var conviw = new ContactView({model: item}); // get a new view for each new model


                },
                searchName: function() { //search name or address

                    console.log("Searched for: " + $("#search").val());
                    var textSearch = $("#search").val().toLowerCase(); //get the content from user
                    if (textSearch === "") { // check 
                        this.collection.reset(contacts); // show all contacts
                    } else {
                        this.collection.reset(contacts, {silent: true}); // without firing event

                        var filterType = textSearch.toLowerCase().replace(/\s/g, ''), //change to lowercase and remove space
                                filtered = _.filter(this.collection.models, function(item) {    //get underscore array which filers the collection
                            var itemfrom = item.get("name").toLowerCase().replace(/\s/g, ''), //get name of model
                                    itemfromAddr = item.get("address").toLowerCase().replace(/\s/g, ''); //get address of model


                            if (itemfrom.indexOf(filterType) !== -1) {//Find in Name
                                return item.get("name").toLowerCase();
                            } else { // Find in Address
                                if (itemfromAddr.indexOf(filterType) !== -1) {//Find in Name
                                    return item.get("address").toLowerCase();
                                }
                            }
                        });
                        this.collection.reset(filtered); // reset the collection with new filtered contacts

                        console.log("Done Searching");
                    }
                },
                addContact: function() {    //Adding new contact to collection and array

                    var flag = false; //validation
                    if ($("#name").val() === "" || $("#address").val() === "") {
                        flag = false;
                        alert("Enter Details");
                    }
                    else {
                        flag = true;
                    }
                    if (flag) {
                        var name = $("#name").val();
                        var address = $("#address").val();
                        //console.log(this.collection);
                        //ERROR NOT GETTING ID AFTER 10
                        id++;
                        console.log(id);
                        //console.log(parseInt(parseInt(this.collection.models[this.collection.length - 1].get("id"))+1));// get id of last model of collection and incrementing it
                        console.log("Adding " + name + " " + address);
                        contacts.push({name: name, address: address, id: id}); //Add to contacts array
                        console.log(contacts);
                        $("#name").val(""); //clear fields
                        $("#address").val("");
                        this.collection.add(new ContactModel({name: name, address: address, id: id})); //add model to collection


                        //toggle editpanel
                        $("#addContact").slideUp('fast');
                        CONTACTSDB.transaction(
                                function(transaction) {

                                    transaction.executeSql("INSERT INTO contacts_table(id, name, address) VALUES (?, ?, ?)", [id, name, address]);
                                }
                        );
                        // refreshContacts();
                        this.collection.reset(contacts);
                        console.log(this.collection);
                        console.log("Reset Add");
                    }
                }
                ,
                deleteContact: function(event) {    //delete button pressed

                    var id = $(event.target).parent().data("id"); //get the id of the div
                    console.log("to be deleted : " + id);
                    var modelDelete = this.collection.get(id);
                    CONTACTSDB.transaction(
                            function(transaction) {
                                transaction.executeSql("DELETE FROM contacts_table WHERE id=?;", [id]);
                            }
                    );//get the model to be deleted by its ID
                    this.collection.remove(modelDelete); //remove from collection and trigger event
                },
                onModelRemoved: function(removedModel) {    //after remove is triggered
                    console.log("On model removed event function");
                    var removed = removedModel.attributes; //get attributes of the removed model

                    _.each(contacts, function(contact) {    // on each contact of the contacts check if the removed item matches, if matches delete it from the array using splice
                        if (_.isEqual(contact, removed)) {
                            contacts.splice(_.indexOf(contacts, contact), 1); //splice from contacts at index of contact and 1 elemnt to be deleted
                        }
                    });

                    //console.log(contacts);
                    this.collection.reset(contacts); // Reset Collection with new contacts
                },
                editContact: function() {   //Edit Contact button
                    //toggle editpanel
                    if ($("#editContact").css("display") === "none") {
                        $("#editContact").slideDown('fast');
                    }
                    //console.log(event.target);
                    var idd = $(event.target).parent().data("id"); // get id and model
                    console.log("to be edited : " + idd);
                    var modelEdit = this.collection.get(idd);
                    console.log(modelEdit);
                    $("#nameEdit").val(modelEdit.get("name")); //load textfields with model values
                    $("#addressEdit").val(modelEdit.get("address"));
                    $("#idEdit").val(modelEdit.get("id"));
                },
                updateContact: function() { //On Save Button after editing
                    var flag = false; // validation
                    if ($("#nameEdit").val() === "" || $("#addressEdit").val() === "") {
                        flag = false;
                        alert("Enter Details Properly for Editing");
                    }
                    else {
                        if ($("#idEdit").val() === "")
                        {
                            alert("None Selected");
                        }
                        else
                            flag = true;
                    }
                    if (flag) {
                        var name = $("#nameEdit").val(); //get new values
                        var address = $("#addressEdit").val();
                        //console.log(this.collection);
                        var idd = +$("#idEdit").val();
                        console.log("Editing model[" + idd + "]");
                        var modelEdit = this.collection.get(idd); //get model
                        modelEdit.set({name: name, address: address, id: idd}); //set new model 
                        console.log(modelEdit);
                        console.log(contacts);
                        //change in the array

//                        contacts[idd].name = name;
//                        contacts[idd].address = address;
//                        console.log(contacts[idd]);
                        _.each(contacts, function(contact) {    // on each contact of the contacts check if the removed item matches, if matches delete it from the array using splice
                            
                            if (_.isEqual(contact["id"],idd)) {
                                console.log("Changing ...");
                                contact["name"]=name;
                                contact["address"]=address;
                            }
                        });
                        var data = [name, address, idd];
                        CONTACTSDB.transaction(
                                function(transaction) {
                                    transaction.executeSql("UPDATE contacts_table SET name=?,address=? WHERE id=?;", [data[0], data[1], data[2]]);
                                }
                        );
                        //console.log(contacts);
                        $("#nameEdit").val(""); // clear
                        $("#addressEdit").val("");
                        $("#idEdit").val("");
                        //toggle editpanel
                        $("#editContact").slideUp('fast');

                        this.collection.reset(contacts); //reset collection
                    }
                },
                resetList: function() {
                    $("#editContact").slideUp('fast');
                    $("#addContact").slideUp('fast');
                    $("#searchContact").slideUp('fast');

                    this.collection.reset(contacts);
                },
                clearDatabase: function() {
                    CONTACTSDB.transaction(
                            function(transaction) {
                                transaction.executeSql("DROP TABLE contacts_table;", [], nullDataHandler, errorHandler);
                            }
                    );
                    location.reload();
                }
            });
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


            return DirectoryView;
        });