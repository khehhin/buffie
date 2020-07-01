// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const http = require('http');
// process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {


      // return http(options).then(res  => {
      //     console.log("Menus JSON: " + res);
          agent.add("Hi! I'm Buffie the Neo Garden Bot!!");
      //     agent.add(JSON.stringify(res));
      //     return Promise.resolve("Call to Neo Complete");
      // });

      // let callback = function(response) {
      //     var str = '';
      //     response.on('error', function (err) {
      //         console.log("HTTP error: " + err);
      //
      //     });
      //     response.on('data', function (chunk) {
      //         str += chunk;
      //     });
      //
      //     response.on('end', function () {
      //         console.log("Menus JSON: " + JSON.stringify(str));
      //         let menus = JSON.parse(str);
      //         agent.add("Hi! I'm Buffie the Neo Garden Bot!");
      //     });
      // };
      //
      // let req = http.request(options,callback);
      // req.end();

      // agent.add(new Card({
      //     title: "Card Title",
      //     imageUrl: "https://www.gstatic.com/webp/gallery/4.jpg",
      //     text: "This is some example text...",
      //     buttonText: "Button",
      //     buttonUrl: "https://www.rp.edu.sg"
      // }));
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  function occasion(agent) {
      var occassionType = agent.parameters.occassionType;

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

          // http.get(options, function(err, resp, body) {
          //     if (err) {
          //         reject(err);
          //     } else {
          //         resolve(JSON.parse(body));
          //     }
          // })
      }).then(function (result) {
          let count = result.length;
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
  intentMap.set('Occasion', occasion);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
