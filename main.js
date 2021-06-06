"use strict";

/*
 * Created with @iobroker/create-adapter v1.34.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const request = require("request");
var adapter;

// Load your modules here, e.g.:
// const fs = require("fs");

class Hydrawise extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "hydrawise",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		var apikey = this.config.apikey;
		this.log.info("config apikey: " + this.config.apikey);
		adapter = this;
		request(
			{
				url: "https://api.hydrawise.com/api/v1/statusschedule.php?api_key=" + apikey,
				json: true
			},
			function (error, response, content) {
				adapter.log.debug('Request done!');
				if (!error && response.statusCode == 200) {

					adapter.createObjectsJSON(content,'relayinfos');



					// await this.setObjectNotExistsAsync("testVariable", {
					// 	type: "state",
					// 	common: {
					// 		name: "testVariable",
					// 		type: "boolean",
					// 		role: "indicator",
					// 		read: true,
					// 		write: true,
					// 	},
					// 	native: {},
					// });


				} else {
					adapter.log.info(error);
				}

			}
		);

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		await this.setObjectNotExistsAsync("testVariable", {
			type: "state",
			common: {
				name: "testVariable",
				type: "boolean",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		this.subscribeStates("testVariable");
		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates("lights.*");
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates("*");

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync("admin", "iobroker");
		this.log.info("check user admin pw iobroker: " + result);

		result = await this.checkGroupAsync("admin", "admin");
		this.log.info("check group user admin group admin: " + result);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack}) ` + state.from.search('hydrawise'));
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}

		if (state.from.search ('hydrawise') != -1) {return;} // do not process self generated state changes (by hydrawise instance)

	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

	createObjectsJSON(jsonObj, folder = "") {
		adapter.log.info('Start function createObjectsJSON');
		for (var key in jsonObj) {
			var stateName = "";
			if (folder != '') {
				stateName = folder + "." + key;
			} else {
				stateName = key;
			}


			// Check wether content is object
			// if (jsonObj === Object(jsonObj)) {
			if (typeof jsonObj[key] === 'object') {

				adapter.createObjectsJSON(jsonObj[key], stateName);

				//adapter.log.info('OBJECT: ' + folder + '.' +key + ' - ' + jsonObj[key]);
			} else {
				//var stateName = folder + "." + key;

				adapter.log.info(stateName + ': ' + jsonObj[key]);


				//await this.setObjectNotExistsAsync(stateName, {
				this.setObjectNotExistsAsync(stateName, {
					type: "state",
					common: {
						name: key,
						type: "string",
						role: "value",
						read: true,
						write: true,
					},
					native: {},
				});
				//await this.setStateAsync(stateName, { val: jsonObj[key], ack: true });
				this.setStateAsync(stateName, { val: jsonObj[key], ack: true });
			}
		}
	}

}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Hydrawise(options);
} else {
	// otherwise start the instance directly
	new Hydrawise();
}
