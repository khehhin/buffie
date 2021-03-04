// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const {Payload} = require('dialogflow-fulfillment');
const http = require('http');
const qs = require('qs');

process.env.DEBUG = 'dialogflow:*'; // enables lib debugging statements
var sessionStr = "";
var projectId = "";
var sessionId = "";
var menuTypes = [];
var occassionType = "";
var numPax = 0;
var diet = "";
var amount = 0.0;
var eventDate = "";
var eventTime = "";
var menuType = "";
var menus = [];
var buffetMenu = {};
var menuCategories = [];
var dishes = [];
var menuCategory = {};
var remainingDishCategories = [];
var remainingDishChoices = 0;
var menuCategoryName = "";
var categoryDishes = [];
var selectedDishesByCategories = {};
var selectedDishName = "";
var selectedDish = {};

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });

    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    sessionStr = JSON.stringify(request.body.session);
    console.log('Dialogflow Request Session: ' + sessionStr);
    var words = sessionStr.split("/");
    sessionId = words[4];
    projectId = words[1];
    console.log('Dialogflow sessionId: ' + sessionId);
    console.log('Dialogflow projectId: ' + projectId);


    function welcome(agent) {
        // Get List of Cuisines (MenuTypes)
        let options = {
            host: "40.119.212.144",
            path: "/beta_delihub/api/Menu/GetMenuTypes",
            method: 'GET',
            // authentication headers
            headers: {
                'Authorization': 'Basic ' + new Buffer.from('DH_Xruptive' + ':' + 'DH_XPT@2020').toString('base64'),
                'Content-Type': 'application/json'
            }
        };

        return new Promise(function(resolve, reject) {
            // Do async job
            var req = http.request(options, function (response) {
                var str = '';
                response.on('error', function (err) {
                    reject(err);
                });
                response.on('data', function (chunk) {
                    str += chunk;
                });
                response.on('end', function () {
                    console.log("Ended, result is : " + str);
                    resolve(JSON.parse(str));
                });
            });
            req.end();
        }).then(function (result) {
            let count = result.length;
            menuTypes = result;
            // agent.add(count + " menu types found.");
            // agent.add(menuTypes[0].MenuTypeID + " is " + menuTypes[0].MenuTypeName)

            agent.add("Hi! I'm Buffy, the Neo Garden Bot!!");
            agent.add("What can I do for you today?");
            agent.add(new Suggestion(`Recommend a buffet menu`));
            agent.add(new Suggestion(`Some other requests`));

        });
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    function occasion(agent) {
        agent.add(`Sure! What occasion are you planning the buffet for?`);
        agent.add(new Suggestion(`Corporate Function`));
        agent.add(new Suggestion(`Praying`));
        agent.add(new Suggestion(`Wedding`));
        agent.add(new Suggestion(`Baby Full Month`));
        agent.add(new Suggestion(`100th Day Celebration`));
        agent.add(new Suggestion(`Birthday`));
        agent.add(new Suggestion(`Charity`));
        agent.add(new Suggestion(`House Warming`));
        agent.add(new Suggestion(`Festival Celebration`));
        agent.add(new Suggestion(`BBQ`));
        agent.add(new Suggestion(`Church Function`));
        agent.add(new Suggestion(`Gathering`));
        agent.add(new Suggestion(`Funeral`));
        agent.add(new Suggestion(`School Function`));
        agent.add(new Suggestion(`Seminars`));
        agent.add(new Suggestion(`Events`));
        agent.add(new Suggestion(`Meetings`));
        agent.add(new Suggestion(`CNY`));
        agent.add(new Suggestion(`Xmas`));
        agent.add(new Suggestion(`Others`));
    }


    function pax(agent) {
        occassionType = agent.parameters.occassionType;
        agent.add(`Ok, how many pax will there be for your ${occassionType}`);

    }


    function dietary(agent) {
        numPax = agent.parameters.pax;

        // agent.add(menuTypes.length + " menu types found.");
        // agent.add(menuTypes[0].MenuTypeID + " is " + menuTypes[0].MenuTypeName);

        agent.add("Ok, you are expecting " + numPax + " pax for your "+ occassionType);
        agent.add(`Any dietary preference?`);
        agent.add(new Suggestion(`Vegetarian only`));
        agent.add(new Suggestion(`Halal`));
        agent.add(new Suggestion(`Vegetarian and Halal`));
        agent.add(new Suggestion(`No restriction`));
    }

    function budget(agent) {
        diet = agent.parameters.dietaryType;

        agent.add("Ok, you have specified " + diet + " dietary preference for your " + occassionType + " for " + numPax + " pax");
        agent.add(`Next, can you tell me how much you are willing to spend for this occasion?`);
        agent.add(`So that I can work out something within your budget?`);

    }

    function whenDate(agent) {
        amount = agent.parameters.amountBudgeted;

        // DatePicker and TimePicker
        var payload = {
            "message": "Alright, I'll work out something within $" + amount + "\nWhen do you plan to have your event?",
            "platform": "kommunicate",
            "metadata": {
                "contentType": "300",
                "templateId": "12",
                "payload": [
                    {
                        "type": "date",
                        "data": {
                            "label": "Event Date"
                        }
                    },
                    {
                        "type": "time",
                        "data": {
                            "label": "Event Time"
                        }
                    },
                    {
                        "type": "submit",
                        "data": {
                            "action": {
                                "message": "Submitted event date time",
                                "requestType": "postBackToBotPlatform",
                                "formAction": ""
                            },
                            "type": "submit",
                            "name": "Submit"
                        }
                    }
                ]
            }
        };

        agent.add(new Payload("PLATFORM_UNSPECIFIED", payload));

    }

    function cuisine(agent){
        let formData = request.body.originalDetectIntentRequest.payload.formData;
        eventDate = formData["Event Date"];
        eventTime = formData["Event Time"];
        // agent.add("Your event will be on " + eventDate + " at " + eventTime);
        // Get Menus here
        // "message": "Your event will be on " + eventDate + " at " + eventTime + "\nWhat type of cuisine would you fancy?",

        var payLoad = {
            "message": "Your event will be on " + eventDate + " at " + eventTime + "\nWhat type of cuisine would you fancy?",
            "platform": "kommunicate",
            "metadata": {
                "contentType": "300",
                "templateId": "10",
                "payload": []
            }
        };

        var carousel = [];

        menuTypes.forEach( menuType => {
            let card = {
                "title": "",
                "subtitle": menuType.MenuTypeName,
                "header": {
                    // "overlayText": "",
                    "imgSrc": "https://www.neogarden.com.sg/images/menus/regular-buffet.jpg"
                },
                "description": "Fr $" + menuType.Menu[0].Price.toString() + " per " + menuType.Menu[0].SetOrPax,
                // "titleExt": "4.2/5",
                "buttons": [
                    {
                        "name": "Find out more",
                        "action": {
                            "type": "link",
                            "payload": {
                                "url": "https://order.neogarden.com.sg/menu/"
                            }
                        }
                    },
                    {
                        "name": "Select this",
                        "action": {
                            "type": "quickReply",
                            "payload": {
                                "message": menuType.MenuTypeName,
                                "replyMetadata": {
                                    "key1": "value1"
                                }
                            }
                        }
                    }
                ]
            };
            carousel.push(card);

        });

        payLoad.metadata.payload = carousel;
        agent.add(new Payload("PLATFORM_UNSPECIFIED", payLoad));

    }

    function getMenus(agent){
        menuType = agent.parameters.menuType;
        var cuisineType = menuTypes.find( element => element.MenuTypeName === menuType);
        // agent.add("MenuTypeID is " + cuisineType.MenuTypeID);
        let bodyData = JSON.stringify({
            MenuTypeID: cuisineType.MenuTypeID,
            FunctionType: occassionType,
            Dietary: diet,
            EventDate: eventDate.toString(),
            NoOfPax: numPax.toString(),
            Budget: amount.toString()
        });

        console.log(bodyData);

        let options = {
            host: "40.119.212.144",
            path: "/beta_delihub/api/Menu/GetMenusListByFilters_V2",
            method: 'POST',
            // authentication headers
            headers: {
                'Authorization': 'Basic ' + new Buffer.from('DH_Xruptive' + ':' + 'DH_XPT@2020').toString('base64'),
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyData)
            }
        };

        return new Promise(function(resolve, reject) {
            // Do async job
            var req = http.request(options, function (response) {
                var str = '';
                response.on('error', function (err) {
                    reject(err);
                });
                response.on('data', function (chunk) {
                    str += chunk;
                });
                response.on('end', function () {
                    console.log("Ended, result is : " + str);
                    resolve(JSON.parse(str));
                });
            });
            req.write(bodyData);
            req.end();
        }).then(function (result) {

            if (result == "No Data Found.") {
                agent.add("Sorry, based on your selection: \n" +
                    "Event: " + occassionType + "\n" +
                    "Pax: " + numPax + "\n" +
                    "Budget: " + amount + "\n" +
                    "Dietary: " + diet + "\n" +
                    "Menu type: " + cuisineType.MenuTypeName + "\n" +
                    "Menu type Id: " + cuisineType.MenuTypeID + "\n" +
                    "Date: " + eventDate + "\n\n" +
                    "I cannot find any suitable menus.");
                agent.add("Please type 'Hi' to retry.");
            } else {
                var payLoad = {
                    "message": "Based on your selection: \n" +
                        "Event: " + occassionType + "\n" +
                        "Pax: " + numPax + "\n" +
                        "Budget: " + amount + "\n" +
                        "Dietary: " + diet + "\n" +
                        "Menu type: " + cuisineType.MenuTypeName + "\n" +
                        "Menu Id: " + cuisineType.MenuTypeID + "\n" +
                        "Date: " + eventDate + "\n" +
                        "I think you might like these recommendations",
                    "platform": "kommunicate",
                    "metadata": {
                        "contentType": "300",
                        "templateId": "10",
                        "payload": []
                    }
                };

                var carousel = [];
                for(var i=0; i < result.length; i++) {
                    var menu = result[i];
                    var card = {
                        "title": "",
                        "subtitle": menu.MenuNameE,
                        "header": {
                            "overlayText": "$" + menu.PriceWD,
                            "imgSrc": ""
                        },
                        "description": "Price(w GST) is $" + menu.PriceWD_WithGst + " per " + menu.MenuSetOrPax ,
                        "titleExt": "Min " + menu.MenuSetOrPax + " " + menu.MinPax ,
                        "buttons": [
                            {
                                "name": "Find out more",
                                "action": {
                                    "type": "link",
                                    "payload": {
                                        "url": menu.MenuPdfUrl
                                    }
                                }
                            },
                            {
                                "name": "View dishes",
                                "action": {
                                    "type": "quickReply",
                                    "payload": {
                                        "message": menu.MenuNameE,
                                        "replyMetadata": {
                                            "menuId": menu.MenuID
                                        }
                                    }
                                }
                            }
                        ]
                    };
                    carousel.push(card);
                    menus.push(menu);
                };
                var entities = [];

                menus.forEach( function(menu){
                    var entity = {
                        "value": menu["MenuNameE"],
                        "synonyms": [menu["MenuNameE"]]
                    }
                    entities.push(entity);
                });

                var sessionEntityTypes = [
                        {
                            "name": sessionStr + "/entityTypes/menus",
                            "entities": entities,
                            "entityOverrideMode":"ENTITY_OVERRIDE_MODE_OVERRIDE"
                        }
                    ];
                payLoad.metadata.payload = carousel;
                agent.add(new Payload("PLATFORM_UNSPECIFIED", payLoad),{"sessionEntityTypes": sessionEntityTypes});
                console.log("sessionEntityTypes: " + JSON.stringify(sessionEntityTypes));

            }
        });
    }


    function getMenuCategories(agent){
        var menuName = agent.parameters.menu;
        buffetMenu = menus.find( element => element.MenuNameE === menuName);
        agent.add("MenuID of " + menuName + " is " + buffetMenu.MenuID);

        let options = {
            host: "40.119.212.144",
            path: "/beta_delihub/api/Menu/GetMenuDetails?MenuId=" + buffetMenu.MenuID ,
            method: 'GET',
            // authentication headers
            headers: {
                'Authorization': 'Basic ' + new Buffer.from('DH_Xruptive' + ':' + 'DH_XPT@2020').toString('base64'),
                'Content-Type': 'application/json'
            }
        };

        return new Promise(function(resolve, reject) {
            // Do async job
            var req = http.request(options, function (response) {
                var str = '';
                response.on('error', function (err) {
                    reject(err);
                });
                response.on('data', function (chunk) {
                    str += chunk;
                });
                response.on('end', function () {
                    console.log("Ended, GetMenuDetails result is : " + str);
                    resolve(JSON.parse(str));
                });
            });
            req.end();
        }).then(function (result) {

            if (result["Message"]) {
                agent.add(result["Message"]);
            } else {
                menuCategories = result["MenuCategories"];
                // agent.add(JSON.stringify(menuCategories));

                // Get Menu Dishes here
                let options = {
                    host: "40.119.212.144",
                    path: "/beta_delihub/api/Menu/GetMenuDishes?MenuId=" + buffetMenu.MenuID ,
                    method: 'GET',
                    // authentication headers
                    headers: {
                        'Authorization': 'Basic ' + new Buffer.from('DH_Xruptive' + ':' + 'DH_XPT@2020').toString('base64'),
                        'Content-Type': 'application/json'
                    }
                };
                return new Promise(function(resolve, reject) {
                    // Do async job
                    var req = http.request(options, function (response) {
                        var str = '';
                        response.on('error', function (err) {
                            reject(err);
                        });
                        response.on('data', function (chunk) {
                            str += chunk;
                        });
                        response.on('end', function () {
                            console.log("Ended, GetMenuDishes result is : " + str);
                            resolve(JSON.parse(str));
                        });
                    });
                    req.end();
                }).then(function (result) {
                    if (result["Message"]) {
                        agent.add(result["Message"]);
                    } else {
                        for(var i=0; i < result.length; i++) {
                            var dish = result[i];
                            dishes.push(dish);
                        }
                        // agent.add(JSON.stringify(dishes));

                        agent.add(buffetMenu["MenuNameE"] + " has the following categories of dish choices.\nClick on one to see more. ");
                        menuCategories.forEach( function(category, index){
                            agent.add(new Suggestion(category["CategoryName"]));
                        });

                        // agent.add(new Payload("PLATFORM_UNSPECIFIED", templateList));

                    }
                });

            }
        });
    }

    function getDishesByCategory(agent) {
        var menuCategoryName = agent.parameters.dishesCategory;
        menuCategory = menuCategories.find( element => element["CategoryName"] === menuCategoryName);
        console.log("Menu category is " + menuCategoryName);
        console.log(JSON.stringify(menuCategory));

        var elements = [];
        var categoryDishes = dishes.filter(function(dish){
            return dish.MenuCategoryID === menuCategory.MenuCategoryID;
        });
        categoryDishes.forEach(function(dish, index){
            // Create elements
            var element = {
                "imgSrc": dish["DishImageUrl"],
                "title": dish["DishNameE"],
                "action": {
                    "url": dish["DishImageUrl"],
                    "type": "link"
                }
            }
            elements.push(element);
        });

        var templateList = {
            "message": "These are the " + menuCategoryName + " category dishes for " + buffetMenu["MenuNameE"] + "\nClick on one to see more.",
            "platform": "kommunicate",
            "metadata": {
                "contentType": "300",
                "templateId": "7",
                "payload": {
                    "headerText": menuCategoryName + " Dishes",
                    "elements": elements,
                    "buttons": [{
                        "name": "Ok, I'm ready to order",
                        "action": {
                            "text": "ready to order",
                            "type": "quick_reply"
                        }
                    }]
                }
            }
        };
        agent.add(new Payload("PLATFORM_UNSPECIFIED", templateList));

    }

    function showNumberOfDishChoices(agent){
        remainingDishCategories = menuCategories.slice(0);
        remainingDishChoices = buffetMenu["NoOfChoice"];
        agent.add( "For " + buffetMenu["MenuNameE"] + ", you can choose " + buffetMenu["NoOfChoice"] + " dishes.\nYou can select 1 dish per category.");
        agent.add(new Suggestion("Understood! I wish to start choosing the dishes"));
    }

    function showRemainingDishCategories(agent){
        if (remainingDishChoices > 0) {
            agent.add( "You have " + remainingDishChoices + " remaining dish choices left.\nPlease select a remaining dish category");
            remainingDishCategories.forEach( function(category, index){
                // agent.add( category["CategoryName"] + " dishes are:\n" + dishesStr);
                agent.add(new Suggestion(category["CategoryName"]));
            });
        } else {
            agent.add("These are the dishes you have selected: ");
            for( var category in selectedDishesByCategories ){
                agent.add(selectedDishesByCategories[category]["DishNameE"] + " for " + category );
            }
            agent.add(new Suggestion("Ok, confirm my selections"));
            agent.add(new Suggestion("No, I wish to re-select"));

        }
    }

    function showDishesByCategory(agent) {
        menuCategoryName = agent.parameters.dishesCategory;
        menuCategory = menuCategories.find( element => element["CategoryName"] === menuCategoryName);
        console.log("Menu category is " + menuCategoryName);
        console.log(JSON.stringify(menuCategory));

        var elements = [];
        categoryDishes = dishes.filter(function(dish){
            return dish["MenuCategoryID"] === menuCategory["MenuCategoryID"];
        });
        categoryDishes.forEach(function(dish, index){
            // Create elements
            var element = {
                "imgSrc": dish["DishImageUrl"],
                "title": dish["DishNameE"],
                "action": {
                    "url": dish["DishImageUrl"],
                    "type": "quick_reply"
                }
            }
            elements.push(element);
        });

        var templateList = {
            "message": "These are the " + menuCategoryName + " category dishes for " + buffetMenu["MenuNameE"] + "\nClick on one to see more.",
            "platform": "kommunicate",
            "metadata": {
                "contentType": "300",
                "templateId": "7",
                "payload": {
                    "headerText": menuCategoryName + " Dishes",
                    "elements": elements,
                    "buttons": [
                        // {
                        //     "name": "Ok, I'm ready to order",
                        //     "action": {
                        //         "text": "ready to order",
                        //         "type": "quick_reply"
                        //     }
                        // }
                    ]
                }
            }
        };
        agent.add(new Payload("PLATFORM_UNSPECIFIED", templateList));

    }

    function storePickedDishInDictionary(agent){
        selectedDishName = agent.parameters.dishName;
        selectedDish = categoryDishes.find( element => element["DishNameE"] === selectedDishName);
        selectedDishesByCategories[menuCategoryName] = selectedDish;
        agent.add("You have selected: " + selectedDishesByCategories[menuCategoryName]["DishNameE"] + " in " + menuCategoryName);
        // agent.add("You have selected: " + selectedDishName + " in " + menuCategoryName);

        remainingDishChoices--;

        var index = remainingDishCategories.findIndex(function(category){
            return category["CategoryName"] === menuCategoryName;
        });

        console.log("Index of " + menuCategoryName + " is " + index);
        remainingDishCategories.splice(index, 1);
        showRemainingDishCategories(agent);
    }


    function createOrder(agent){
        let orderJSON = JSON.stringify({
            "OrderID": "",
            "CompanyID": "7A4F7C36-A976-42B7-9700-9E519397E077 ",
            "CustomerID": "",
            "NoOfSection": 1,
            "FunctionType": "Baby Full Month",
            "PaymentTerm": "Cash",
            "DeliveryContactTitle": "Mr.",
            "DeliveryContactFullName": "Jack",
            "DeliveryContactSurname": "Lee",
            "DeliveryContactCompanyName": "",
            "DeliveryContactHandPhone1": "90909090",
            "DeliveryContactHandPhone2": "",
            "DeliveryContactHomePhone": "80808080",
            "DeliveryContactOfficePhone": "",
            "DeliveryContactFax": "",
            "DeliveryContactEmail": "tinlinhtun@gui-solutions.com",
            "DeliveryAddressUnit": "#00-0000",
            "DeliveryAddressHaveLift": false,
            "DeliveryAddressNoLift": false,
            "DeliveryAddressBlock": "BLK BLK 431",
            "DeliveryAddressBuilding": "",
            "DeliveryAddressBuildingType": "H",
            "DeliveryAddressStreetName": "CLEMENTI AVENUE 3",
            "DeliveryAddressPostCode": "120431",
            "FormattedDeliveryAddress": "",
            "IsDeliveryAddressChanged": false,
            "IsOnlineOrder": true,
            "SalePerson": "00000000-0000-0000-0000-000000000000",
            "IsNewCustomerOrder": true,
            "HowToKnowUs": "",
            "PaymentReferenceNumber": "ord00002",
            "Customers": {
                "CustomerID": "",
                "Title": "Mr.",
                "CustomerName": "Jack",
                "Surname": "Lee",
                "CompanyName": "",
                "MailingAddressUnit": "#00-0000",
                "MailingAddressBlock": "BLK BLK 431",
                "MailingAddressBuilding": "",
                "MailingAddressBuildingType": "H",
                "MailingAddressStreetName": "CLEMENTI AVENUE 3",
                "MailingAddressPostalCode": "120431",
                "ContactMobile": "90909090",
                "ContactHomePhone": "80808080",
                "ContactOfficePhone": "",
                "ContactFax": "",
                "ContactEmail": "tinlinhtun@gui-solutions.com",
                "HowToKnowUs": "Brochure",
                "HowToKnowUsOthers": "",
                "Memo": ""
            },
            "OrderSections": [
                {
                    "OrderSectionID": "",
                    "OrderID": "",
                    "LogisticNo": "",
                    "KitchenCode": "H1",
                    "OrginalKitchen": "",
                    "DeliveryDate": "2020-06-10T08:30:00",
                    "PreviousDeliveryDate": "2020-06-10T08:30:00",
                    "DeliveryDateChangedOn": "2020-06-10T08:30:00",
                    "KitchenTime": "2020-06-10T08:30:00",
                    "ConfirmStatus": "PENDING",
                    "InvoiceRemarks": "",
                    "DriverRemarks": "",
                    "KitchenRemarks": "",
                    "PackingRemark": "",
                    "AllMenuType": "",
                    "DaySerial": "",
                    "TotalPax": 30,
                    "MenuCount": 1,
                    "OrderInvoices": {
                        "OrderInvoiceID": "",
                        "OrderSectionID": "",
                        "OrderTotalAmount": 214,
                        "GstAmount": 14,
                        "InvoiceAmount": 200,
                        "IsBillingAddressDifferent": false,
                        "BillingContactTitle": "Mr.",
                        "BillingContactFullName": "TEST, PLS IGNORE",
                        "BillingContactCompanyName": "",
                        "BillingContactHandPhone": "90909090",
                        "BillingContactHomePhone": "80808080",
                        "BillingContactOfficePhone": "",
                        "BillingContactFax": "",
                        "BillingContactEmail": "tinlinhtun@gui-solutions.com"
                    },
                    "OrderSectionMenus": [
                        {
                            "OrderSectionMenuID": "",
                            "OrderSectionID": "",
                            "MenuID": "d1b1a912-dfe3-4374-abb6-b73eccf3d30b",
                            "MenuName": "(ONLINE) BASIL +",
                            "MenuDisplayOrder": 1,
                            "Pax": 30,
                            "MenuPrice": 16,
                            "Amount": 480,
                            "IsPacket": false,
                            "OrderSectionMenuDetails": [
                                {
                                    "OSMDID": "0f3b5554-c7e0-4b85-9b90-acd345cbfdd8",
                                    "OrderSectionMenuID": "097ad877-f106-496c-953b-2f022c4e17fb",
                                    "CategoryID": "70049c6c-09af-4a7f-85aa-bf1a9b8ffc21",
                                    "ItemDisplayOrder": 9,
                                    "ItemNo": 9,
                                    "ItemID": "451608f5-b473-4a13-a697-4980344e74f9",
                                    "ItemName": "Sea Coconut with Cocktail",
                                    "ItemRemark": "",
                                    "ItemType": "DD",
                                    "Qty": 30,
                                    "UnitPrice": 0,
                                    "Amount": 0,
                                    "Containers": ""
                                },
                                {
                                    "OSMDID": "1431feae-a4af-412c-a415-23086628d2c2",
                                    "OrderSectionMenuID": "097ad877-f106-496c-953b-2f022c4e17fb",
                                    "CategoryID": "282dc22e-bc63-46d8-9fd4-87f530ec6de2",
                                    "ItemDisplayOrder": 11,
                                    "ItemNo": 11,
                                    "ItemID": "443bfbb1-ef9b-46e1-bc68-f285d9adbaf7",
                                    "ItemName": "DELIVERY & COLLECTION CHARGE",
                                    "ItemRemark": "",
                                    "ItemType": "GIU",
                                    "Qty": 1,
                                    "UnitPrice": 60,
                                    "Amount": 60,
                                    "Containers": ""
                                },
                                {
                                    "OSMDID": "14688f11-a6bd-4c0b-b4c1-def57987725b",
                                    "OrderSectionMenuID": "097ad877-f106-496c-953b-2f022c4e17fb",
                                    "CategoryID": "8fe4ecea-e65b-4649-b879-05ce24cc2ff0",
                                    "ItemDisplayOrder": 2,
                                    "ItemNo": 2,
                                    "ItemID": "63eb5235-cf1b-437f-90d0-4e431bdc489f",
                                    "ItemName": "Fried Rice W Long Bean (vegetarian)",
                                    "ItemRemark": "",
                                    "ItemType": "DD",
                                    "Qty": 30,
                                    "UnitPrice": 0,
                                    "Amount": 0,
                                    "Containers": ""
                                },
                                {
                                    "OSMDID": "2d320629-b146-4da2-b816-760442c06e80",
                                    "OrderSectionMenuID": "097ad877-f106-496c-953b-2f022c4e17fb",
                                    "CategoryID": null,
                                    "ItemDisplayOrder": 0,
                                    "ItemNo": 0,
                                    "ItemID": "d1b1a912-dfe3-4374-abb6-b73eccf3d30b",
                                    "ItemName": "(ONLINE) BASIL +",
                                    "ItemRemark": "",
                                    "ItemType": "M",
                                    "Qty": 30,
                                    "UnitPrice": 16,
                                    "Amount": 480,
                                    "Containers": ""
                                }
                            ]
                        }
                    ]
                }
            ]
        });


        let options = {
            host: "40.119.212.144",
            path: "/beta_delihub/api/order/CreateOrder_V2",
            method: 'POST',
            // authentication headers
            headers: {
                'Authorization': 'Basic ' + new Buffer.from('DH_Xruptive' + ':' + 'DH_XPT@2020').toString('base64'),
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(orderJSON)
            }
        };

        return new Promise(function(resolve, reject) {
            // Do async job
            var req = http.request(options, function (response) {
                var str = '';
                response.on('error', function (err) {
                    reject(err);
                });
                response.on('data', function (chunk) {
                    str += chunk;
                });
                response.on('end', function () {
                    console.log("Ended, result is : " + str);
                    resolve(JSON.parse(str));
                });
            });
            // req.write(JSON.stringify(orderJSON));
            req.write(orderJSON);
            req.end();
        }).then(function (result) {

            if (result["Message"]) {
                agent.add(result["Message"]);
            } else {
                let statusMessage = result["StatusMessage"];
                agent.add(statusMessage);
                if (statusMessage == "Success") {
                    agent.add("Order ID is: " + result["OrderID"]);
                }
            }
        });

    }




// ***** Boiler plate for Kommunicate's  Carousel ************
    function example(agent) {
        // var occassionType = agent.parameters.occassionType;
        // var numPax = agent.parameters.pax;

        let bodyData = {
            MenuTypeID: "",
            FunctionType:"",
            Dietary:"",
            EventDate:"",
            NoOfPax: "",
            Budget:""
        };
        console.log(JSON.stringify(bodyData));
        let options = {
            host: "40.119.212.144",
            path: "/beta_delihub/api/Menu/GetMenusListByFilters_V2",
            method: 'POST',
            // authentication headers
            headers: {
                'Authorization': 'Basic ' + new Buffer.from('DH_Xruptive' + ':' + 'DH_XPT@2020').toString('base64'),
                'Content-Type': 'application/json'
            }
        };

        let payLoad = {
            "message": "Carousel",
            "platform": "kommunicate",
            "metadata": {
                "contentType": "300",
                "templateId": "10",
                "payload": [
                    {
                        "title": "OYO Rooms 1",
                        "subtitle": "Kundanahalli road turn.",
                        "header": {
                            "overlayText": "$400",
                            "imgSrc": "http://www.tollesonhotels.com/wp-content/uploads/2017/03/hotel-room.jpg"
                        },
                        "description": "Bharathi Road \n Near Head Post Office",
                        "titleExt": "4.2/5",
                        "buttons": [
                            {
                                "name": "Link Button",
                                "action": {
                                    "type": "link",
                                    "payload": {
                                        "url": "https://www.facebook.com"
                                    }
                                }
                            },
                            {
                                "name": "Suggested Reply",
                                "action": {
                                    "type": "quickReply",
                                    "payload": {
                                        "message": "text will be sent as message",
                                        "replyMetadata": {
                                            "key1": "value1"
                                        }
                                    }
                                }
                            },
                            {
                                "name": "Submit button",
                                "action": {
                                    "type": "submit",
                                    "payload": {
                                        "text": "acknowledgement text",
                                        "formData": {
                                            "amount": "$55",
                                            "description": "movie ticket"
                                        },
                                        "formAction": "https://example.com/book",
                                        "requestType": "json"
                                    }
                                }
                            }
                        ]
                    },
                    {
                        "title": "OYO Rooms 2",
                        "subtitle": "Kundanahalli ",
                        "header": {
                            "overlayText": "$360",
                            "imgSrc": "http://www.tollesonhotels.com/wp-content/uploads/2017/03/hotel-room.jpg"
                        },
                        "description": "Bharathi Road | Near Head Post Office, Cuddalore 607001",
                        "titleExt": "4.2/5",
                        "buttons": [
                            {
                                "name": "Link Button",
                                "action": {
                                    "type": "link",
                                    "payload": {
                                        "url": "https://www.facebook.com"
                                    }
                                }
                            },
                            {
                                "name": "Submit button",
                                "action": {
                                    "type": "submit",
                                    "payload": {
                                        "text": "acknowledgement text",
                                        "formData": {
                                            "amount": "$22",
                                            "description": "movie ticket"
                                        },
                                        "formAction": "https://example.com/book",
                                        "requestType": "json"
                                    }
                                }
                            },
                            {
                                "name": "Suggested Reply",
                                "action": {
                                    "type": "quickReply",
                                    "payload": {
                                        "message": "text will be sent as message",
                                        "replyMetadata": {
                                            "key1": "value1"
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    {
                        "title": "OYO Rooms 3",
                        "subtitle": "Kundanahalli ",
                        "header": {
                            "overlayText": "$750",
                            "imgSrc": "http://www.tollesonhotels.com/wp-content/uploads/2017/03/hotel-room.jpg"
                        },
                        "description": "Bharathi Road | Near Head Post Office, Cuddalore 607001",
                        "titleExt": "4.2/5",
                        "buttons": [
                            {
                                "name": "Link Button",
                                "action": {
                                    "type": "link",
                                    "payload": {
                                        "url": "https://www.facebook.com"
                                    }
                                }
                            },
                            {
                                "name": "Submit button",
                                "action": {
                                    "type": "submit",
                                    "payload": {
                                        "text": "acknowledgement text",
                                        "formData": {
                                            "amount": "$45",
                                            "description": "movie ticket"
                                        },
                                        "formAction": "https://example.com/book",
                                        "requestType": "json"
                                    }
                                }
                            },
                            {
                                "name": "Suggested Reply",
                                "action": {
                                    "type": "quickReply",
                                    "payload": {
                                        "message": "text will be sent as message",
                                        "replyMetadata": {
                                            "key1": "value1"
                                        }
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        };

        return new Promise(function(resolve, reject) {
            // Do async job
            var req = http.request(options, function (response) {
                var str = '';
                response.on('error', function (err) {
                    reject(err);
                });
                response.on('data', function (chunk) {
                    str += chunk;
                });
                response.on('end', function () {
                    console.log("Ended, result is : " + str);
                    resolve(JSON.parse(str));
                });
            });
            req.write(JSON.stringify(bodyData));
            req.end();
        }).then(function (result) {
            let count = result.length;
            // agent.add(`Ok, you are expecting ${numPax} pax for your ${occassionType}`);

            agent.add(count + " objects found in menu array.");
            agent.add(`Here's a recommendation for your ${occassionType} `);

            agent.add(new Card({
                    title: result[1].MenuNameE_Online,
                    imageUrl: "https://www.gstatic.com/webp/gallery/4.jpg",
                    text: "This is some example text...",
                    buttonText: "Button",
                    buttonUrl: "https://www.rp.edu.sg"
                })
            );
            agent.add(new Suggestion(`Quick Reply`));
            agent.add(new Suggestion(`Suggestion`));

            // agent.add(new Payload("PLATFORM_UNSPECIFIED", payLoad));
            // agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
        });

    }


    // // Uncomment and edit to make your own Google Assistant intent handler
    // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
    // // below to get this function to be run when a Dialogflow intent is matched
    // function googleAssistantHandler(agent) {
    //   let conv = agent.conv(); // Get Actions on Google library conv instance
    //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
    //   agent.add(conv); // Add Actions on Google library responses to your agent's response
    // }
    // // See https://github.com/dialogflow/fulfillment-actions-library-nodejs
    // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('Recommendation', occasion);
    intentMap.set('Occasion', pax);
    intentMap.set('Number of Pax', dietary);
    intentMap.set('Dietary Restrictions', budget);
    intentMap.set('Budget', whenDate);
    intentMap.set('EventDateTime', cuisine);
    intentMap.set('Cuisine', getMenus);
    intentMap.set('BuffetMenu', getMenuCategories);
    intentMap.set('DishesCategory', getDishesByCategory);
    intentMap.set('OrderBuffet', showNumberOfDishChoices);
    intentMap.set('StartDishSelectionProcess', showRemainingDishCategories);
    intentMap.set('PickDishCategory', showDishesByCategory);
    intentMap.set('PickDish', storePickedDishInDictionary);
    intentMap.set('PickRemainingDishCategory', showDishesByCategory);
    intentMap.set('ConfirmDishesSelections', createOrder);

    intentMap.set('Test01', example);


    // intentMap.set('your intent name here', googleAssistantHandler);
    agent.handleRequest(intentMap);
});
