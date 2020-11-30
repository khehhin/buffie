// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const {Payload} = require('dialogflow-fulfillment');
const http = require('http');
process.env.DEBUG = 'dialogflow:*'; // enables lib debugging statements
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


exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
    sessionId = JSON.stringify(request.body.session);
    // console.log('Dialogflow Request Session: ' + sessionId);

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
        let bodyData = {
            MenuTypeID: cuisineType.MenuTypeID,
            FunctionType: occassionType,
            Dietary: diet,
            EventDate: eventDate.toString(),
            NoOfPax: numPax.toString(),
            Budget: amount.toString()
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
                                "name": "Place an order",
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

                payLoad.metadata.payload = carousel;
                agent.add(new Payload("PLATFORM_UNSPECIFIED", payLoad));
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
                    console.log("Ended, result is : " + str);
                    resolve(JSON.parse(str));
                });
            });
            req.end();
        }).then(function (result) {

            if (result["Message"]) {
                agent.add(result["Message"]);
            } else {
                menuCategories = result["MenuCategories"];
                agent.add(JSON.stringify(menuCategories));
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

    intentMap.set('Test01', example);


    // intentMap.set('your intent name here', googleAssistantHandler);
    agent.handleRequest(intentMap);
});
