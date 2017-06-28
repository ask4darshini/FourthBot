// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create connector and listen for messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());

// Create your bot with a function to receive messages from the user
// Create bot and default message handler
var bot = new builder.UniversalBot(connector, function (session) {
	session.sendTyping();
    session.send("Hi , How are you , Which Line of Business i can help you with today ?");
	session.send("Type Dept to list the available Business areas");
});



// Add dialog to return list of shirts available
bot.dialog('Dept', function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.list)
    msg.attachments([
        new builder.HeroCard(session)
            .buttons([
                builder.CardAction.imBack(session, "Display available products in Consumer Dept", "Consumer")
            ]),
        new builder.HeroCard(session)
            .buttons([
                builder.CardAction.imBack(session, "Display available products in Commercial Dept", "Commercial")
            ]),
		new builder.HeroCard(session)
			.buttons([
				builder.CardAction.imBack(session, "Display available products in Free services Dept", "Free services")
		])
    ]);
    session.send(msg).endDialog();
}).triggerAction({ matches: /^(Dept|list)/i });

// Add dialog to handle 'options' button click
bot.dialog('DeptButtonClick', [
    function (session, args, next) {
		
		
					// Create connection to database
				var config = {
				  userName: 'ServerAdmin', // update me
				  password: 'AllLove$1', // update me
				  server: 'myserver20170626.database.windows.net', // update me
				  options: {
					  encrypt: true,
					  database: 'mySampleDatabase', //update me
					  rowCollectionOnDone:true, //for large number of data enabling this would result in huge memory usage
					  rowCollectionOnRequestCompletion : true
				  }
				}
				var connection1 = new Connection(config);

				// Attempt to connect and execute queries if connection goes through
				connection1.on('connect', function(err) {
					if (err) {
						console.log(err)
					}
					else{
						queryDatabase()
					}
				});
				session.send("depts are available for below products , What product would you like to see today ?");
				session.sendTyping();
				function queryDatabase(){
					console.log('Reading rows from the Table...');
					// Read all rows from table
					var result2 = [];
					request = new Request(
						"SELECT distinct dname from dept",
						function(err, rowCount, rows) {
							console.log(rowCount + ' row(s) returned');
							rows.forEach(function (row){
								
							var tempcard = new builder.HeroCard(session)
												.buttons([
													builder.CardAction.imBack(session, "Display available dept for product - Outlook", row[0].value)
												]);
												
								result2.push(tempcard);
							});
							console.log(result2)
							var msg = new builder.Message(session);
								msg.attachmentLayout(builder.AttachmentLayout.list)
								msg.attachments(result2);
								session.send(msg).endDialog();
									}
								);
								
							connection1.execSql(request);
				}
    },
    function (session, results) {
        // Save size if prompted
        var item = session.dialogData.item;
        if (results.response) {
			session.beginDialog('reporttypeselection');
			}
        // Add to cart
        if (!session.userData.cart) {
            session.userData.cart = [];
        }
        session.userData.cart.push(item);
    }
]).triggerAction({ matches: /(Display|Outcome)\s.*Dept/i });

// Add dialog to return list of shirts available
bot.dialog('options', function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.list)
    msg.attachments([
        new builder.HeroCard(session)
            .buttons([
                builder.CardAction.imBack(session, "Display Outlook dept information", "Outlook")
            ]),
        new builder.HeroCard(session)
            .buttons([
                builder.CardAction.imBack(session, "Display Skype dept information", "Skype")
            ]),
		new builder.HeroCard(session)
			.buttons([
				builder.CardAction.imBack(session, "Display Onedrive dept information", "Onedrive")
		])
    ]);
    session.send(msg).endDialog();
}).triggerAction({ matches: /^(product|list)/i });

// Add dialog to handle 'options' button click
bot.dialog('deptButtonClick', [
    function (session, args, next) {
        // Get color and optional size from users utterance
        var utterance = args.intent.matched[0];
        var color = /(Outlook|Skype|Onedrive)/i.exec(utterance);
        var size = /\b(Delivery health|outcome)\b/i.exec(utterance);
		var choices = null;
        if (color) {
            // Initialize cart item
            var item = session.dialogData.item = { 
                product: "classic " + color[0].toLowerCase() + " t-shirt",
                size: size ? size[0].toLowerCase() : null,
                price: 25.0,
                qty: 1
            };
            if (!item.size) {
				console.log("item size is" + item.size);
                // Prompt for size
                builder.Prompts.choice(session, "What report would you like?", "Delivery health|Outcome",{ listStyle: builder.ListStyle.button });
				 // Read all rows from table

            } else {
                //Skip to next waterfall step
                next();
            }
        } else {
            // Invalid product
            session.send("I'm sorry... That product wasn't found.").endDialog();
        }   
    },
    function (session, results) {
        // Save size if prompted
        var item = session.dialogData.item;
        if (results.response) {
            item.size = results.response.entity.toLowerCase();
			switch (results.response.index) {
			case 0 :
			session.beginDialog('flipCoinDialog');
            break;
			}
        }

        // Add to cart
        if (!session.userData.cart) {
            session.userData.cart = [];
        }
        session.userData.cart.push(item);

        // Send confirmation to users
        //session.send("A '%(size)s %(product)s' has been added to your cart.", item).endDialog();
    }
]).triggerAction({ matches: /(Display|Outcome)\s.*dept/i });

// Flip a coin
bot.dialog('flipCoinDialog', [
    function (session, args) {

			// Create connection to database
				var config = {
				  userName: 'ServerAdmin', // update me
				  password: 'AllLove$1', // update me
				  server: 'myserver20170626.database.windows.net', // update me
				  options: {
					  encrypt: true,
					  database: 'mySampleDatabase', //update me
					  rowCollectionOnDone:true, //for large number of data enabling this would result in huge memory usage
					  rowCollectionOnRequestCompletion : true
				  }
				}
				var connection1 = new Connection(config);

				// Attempt to connect and execute queries if connection goes through
				connection1.on('connect', function(err) {
					if (err) {
						console.log(err)
					}
					else{
						queryDatabase()
					}
				});
				session.sendTyping();
				function queryDatabase(){
					console.log('Reading rows from the Table...');
					// Read all rows from table
					var result2 = [];
					request = new Request(
						"SELECT distinct dname from dept",
						function(err, rowCount, rows) {
							console.log(rowCount + ' row(s) returned');
							rows.forEach(function (row){
								result2.push(row[0].value);
							});
							console.log(result2)
							builder.Prompts.choice(session, "Choose a dept.", result2,{ listStyle: builder.ListStyle.button })
						}
					);
				connection1.execSql(request);
				}
    },
    function (session, results) {
		
		//console.log('selection...' + results.response.entity.toLowerCase());
		
		var titls = results.response.entity;
		// Create connection to database
				var config = {
				  userName: 'ServerAdmin', // update me
				  password: 'AllLove$1', // update me
				  server: 'myserver20170626.database.windows.net', // update me
				  options: {
					  encrypt: true,
					  database: 'mySampleDatabase', //update me
					  rowCollectionOnDone:true, //for large number of data enabling this would result in huge memory usage
					  rowCollectionOnRequestCompletion : true
				  }
				}
				var connection1 = new Connection(config);

				// Attempt to connect and execute queries if connection goes through
				connection1.on('connect', function(err) {
					if (err) {
						console.log(err)
					}
					else{
						queryDatabase()
					}
				});
				session.sendTyping();
				function queryDatabase(){
					console.log('Reading rows from the Table...');
					// Read all rows from table
					var result2 = [];
					request = new Request(
						"select top 1 deptno, dname, loc from dept",
						function(err, rowCount, rows) {
							console.log(rowCount + ' row(s) returned');
							
							    rows.forEach(function (columns) {
								var rowObject = {};
								columns.forEach(function (column) {
											var tempcard = new builder.ReceiptItem.create(session,column.value,column.metadata.colName)
												//.image(builder.CardImage.create(session, 'https://maxcdn.icons8.com/Share/icon/nolan/Messaging//sent1600.png'))
											result2.push(tempcard);
								});
								});
							    var msg = new builder.Message(session);
								msg.attachmentLayout(builder.AttachmentLayout.list)
								msg.attachments([									
									new builder.ReceiptCard(session)
									.title(titls)
									.items(result2)
									.buttons([
										builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/pricing/', 'More Information')
											.image('https://raw.githubusercontent.com/amido/azure-vector-icons/master/renders/microsoft-azure.png')
									])
									
									
								]);
								session.send(msg).endDialog();
							
						}
					);
				connection1.execSql(request);
				}
		
		//session.beginDialog('flipCoinDialog');
    }
]);

// select a report type - Delivery Health|Outcome
bot.dialog('reporttypeselection', [
    function (session, args) {
		builder.Prompts.choice(session, "Following reports are available , What type of report would you like to see today ?", "Delivery Health Report|Outcome Report",{ listStyle: builder.ListStyle.button });
				
    },
    function (session, results) {
		session.beginDialog('flipCoinDialog');
    }
]).triggerAction({ matches: /(Display|Outcome)\s.*product/i });;
