import { Utils } from './vendor/utils.min.mjs';
import { Logger } from './vendor/logger.min.mjs';
import { Pulse } from './vendor/pulse.min.mjs';
import { Controller } from './controller.mjs'
/** 
 * @file The MobileHandler module provides a user-friendly interface for game developers to integrate touch-based controls for their game characters on mobile devices. It offers features for creating a visual joystick on the screen and facilitates mobile device interaction, including accessing device information and triggering device vibrations.
 * 
 * @version __VERSION__
 * @author https://github.com/doubleactii
 * @copyright Copyright (c) 2023 Evitca Studio
 * @license MobileHandler is free software, available under the terms of a MIT style License.
 * When lowpower mode is on it makes game run slower, from 60fps to 30fps
 */
class MobileHandlerSingleton {
	/**
	 * Whether or not an instance can be touched by multiple fingers. If their touchOpacity is set to MULTI_TOUCH it can be interacted with multiple times via different touches.
	 * @private
	 * @type {number}
	 */
	static MULTI_TOUCH = 2;
	/**
	 * Whether or not an instance can be touched or not. If their touchOpacity is set to NO_TOUCH, it cannot be touched
	 * @private
	 * @type {number}
	 */
	static NO_TOUCH = 0;
	/**
	 * The max number of controllers that can be recycled
	 * @private
	 * @type {number}
	 */
	static MAX_RECYCLED_CONTROLLERS = 10;
	/**
	 * The maximum layer
	 * @private
	 * @type {number}
	 */
	static MAX_LAYER = 1999998;
	/**
	 * An array of all controllers that have been recycled
	 * @private
	 * @type {Array}
	 */
	recycledControllers = [];
	/**
	 * An array of all controllers that are active
	 * @private
	 * @type {Array}
	 */
	activeControllers = [];
	/**
	 * An object holding the controllers in zones
	 * @private
	 * @type {Object}
	 */
	zonedControllers = {};
	/**
	 * An array that holds all the diobs that are currently being touched
	 * @private
	 * @type {Array}
	 */
	touchedDiobs = [];
	/**
	 * An object that stores the mapPosition over the screen
	 * @private
	 * @type {Object}
	 */
	mapPositionObject = { 'x': 0, 'y': 0 };
	/**
	 * An array that holds the current screen zones taken, 'left' or 'right'.
	 * @private
	 * @type {Array}
	 */
	reservedScreenZones = [];
	/**
	 * An object holding the current window size
	 * @private
	 * @type {Object}
	 */
	windowSize = VYLO.World.getGameSize();
	/**
	 * The middle of the screen's x coordinate. This is used to figure out which side of the screen is being interacted with.
	 * @private
	 * @type {number}
	 */
	xCenterScreenPosition = this.windowSize.width / 2;
	/**
	 * Whether a mobile device was detected
	 * @private
	 * @type {boolean}
	 */
	isMobile = false;
	constructor() {
        /** The logger module this module uses to log errors / logs
         * @private
         * @type {Object}
         */
        this.logger = new Logger();
        this.logger.registerType('MobileHandler-Module', '#ff6600');
        this.logger.prefix('MobileHandler-Module').log(`✅@v__VERSION__`);
		// Regex to check if it matches a mobile device
		if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) {
			this.isMobile = true;
		}
		// Create and show the mobile handler interface that our controllers will exist in
		VYLO.Client.createInterface('mobile-handler-interface');
		VYLO.Client.showInterface('mobile-handler-interface');
		// Attach our window resize handler event to the onWindowResize event
		Pulse.on(VYLO.Client, 'onWindowResize', this.windowResizeHandler.bind(this));
		
		document.addEventListener('touchstart', this.handleStart.bind(this), { 'passive': false });
		document.addEventListener('touchend', this.handleEnd.bind(this), { 'passive': false });
		document.addEventListener('touchcancel', this.handleCancel.bind(this), { 'passive': false });
		document.addEventListener('touchmove', this.handleMove.bind(this), { 'passive': false });
	
		// Prevent zooming and mobile gestures
		document.addEventListener('gesturestart', function(pEvent) {pEvent.preventDefault()}, { 'passive': false });
		document.addEventListener('gesturechange', function(pEvent) {pEvent.preventDefault()}, { 'passive': false });
	}
	/**
	 * Return the type of device.
	 * @returns The type of device. Android / Ipad / Iphone
	 */
	getDevice() {
		if ((navigator.userAgent.indexOf('iPhone') > 0 && navigator.userAgent.indexOf('iPad') == -1) || navigator.userAgent.indexOf('iPod') > 0 ) {
			return 'iPhone'; 
		} else if(navigator.userAgent.indexOf('iPad') > 0) {
			return 'iPad';
		} else if(navigator.userAgent.indexOf('Android') > 0) {
			return 'Android';
		} else {
			return null;
		}
	}
	/**
	 * Vibrates the mobile device.
	 * https://github.com/apache/cordova-plugin-vibration#readme
	 * https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
	 * @param {number} pDuration - The duration of the vibration.
	 */
	vibrate(pDuration = 500) {
		if (typeof(navigator) !== 'undefined') {
			if (navigator.vibrate) {
				navigator.vibrate(pDuration);
			}
		}
	}
	/**
	 * Gets the device's current RAM
	 * @returns The device's current RAM
	 */
	getDeviceRAM() {
		if (typeof(navigator) !== 'undefined') {
			return navigator.deviceMemory;
		}
	}
	/**
	 * Creates a controller component with the passed options.
	 * @param {Object} pOptions - Options to control how the controller component works.
	 * @returns {Controller} A new controller component
	 */
	createController(pOptions) {
		if (this.recycledControllers.length) {
			const controller = this.recycledControllers.pop();
			controller.build(pOptions);
			return controller;
		}
		return new Controller(pOptions);
	}

	/**
	 * Handler event for when the window resizes.
	 * @private
	 * @param {number} pWidth - The window's new width.
	 * @param {number} pHeight - The window's new height.
	 */
	windowResizeHandler(pWidth, pHeight) {
		this.xCenterScreenPosition = pWidth / 2;
		this.windowSize.width = pWidth;
		this.windowSize.height = pHeight;
		for (const controller of this.activeControllers) {
			const components = controller.getComponents();
			if (components.joyring.edgeLock) {
				components.joyring.originalPos = { 'x': components.joyring.xPos, 'y': components.joyring.yPos };
			}
			if (components.joystick.edgeLock) {
				components.joystick.originalPos = { 'x': components.joystick.xPos, 'y': components.joystick.yPos };
			}
		}		
	}
	/**
	 * Gets the instance that the user tapped if there was one.
	 * @private
	 * @param {number} pX - The x position on the screen where the user tapped.
	 * @param {number} pY - The y position on the screen where the user tapped.
	 * @returns {Object} The instance that was tapped or null if nothing was touched.
	 */
	getDiobUnderFinger(pX, pY) {
		const screenScale = VYLO.Client.getScreenScale();
		const mapVector = VYLO.Client.getPosFromScreen(pX / screenScale.x, pY / screenScale.y);
		let mapDiobs;
		if (!VYLO.Client.mob) return;
		if (!VYLO.Client.mob.mapName) {
			mapDiobs = [];
		} else {
			mapDiobs = VYLO.Map.getDiobsByPos(VYLO.Client.mob.mapName, mapVector.x, mapVector.y);
		}
		const screenDiobs = VYLO.Client.getInterfaceElementsFromScreen(pX, pY, null, null, null, null, true);
		let highestLayeredScreenDiob;
		let highestLayedMapDiob;

		for (let i = 0; i < screenDiobs.length; i++) {
			if (screenDiobs[i].touchOpacity || (screenDiobs[i].touchOpacity === undefined && screenDiobs[i].type !== 'Interface/EMobile/Joyring')) {
				if (!highestLayeredScreenDiob) {
					highestLayeredScreenDiob = screenDiobs[i];
				}

				if (screenDiobs[i].layer >= highestLayeredScreenDiob.layer) {
					highestLayeredScreenDiob = screenDiobs[i];
				}
			}
		}
		
		// Interface elements
		if (highestLayeredScreenDiob) {
			// If the interface is not currently shown, or the element that was "tapped" is not shown then we return that nothing was found.
			if (!VYLO.Client.checkInterfaceShown(highestLayeredScreenDiob.getInterfaceName()) || highestLayeredScreenDiob.isHidden) {
				return null;
			} else {
				return highestLayeredScreenDiob;
			}
		}

		if (!VYLO.Client.mob.mapName) {
			return null;
		}
		/**
		 * @todo Make highest layer take the tap
		 */
		for (let j = 0; j < mapDiobs.length; j++) {
			if (mapDiobs[j].touchOpacity) {
				return mapDiobs[j];
			}
		}
		
		return null;
	}
	/**
	 * Handles when a finger is placed onto the screen in a zone
	 * @private
	 * @param {number} pX - The x position on the screen where the user tapped.
	 * @param {number} pY - The y position on the screen where the user tapped.
	 * @param {string} pFingerID - The ID of the finger
	 * @returns 
	 */
	handleZoneTouch(pX, pY, pFingerID) {
		// When a finger is placed onto the screen, if it is a zoned controller track it and update it
		if (this.reservedScreenZones.length) {
			const rightZoneController = this.zonedControllers['right'];
			const leftZoneController = this.zonedControllers['left'];
			// if the screen is pressed on the right|left side and if the right|left zone controller is not active
			// or if the right|left zone controller is a traversal controller, then assign the finger ID to the controller
			// and update it
			// traversal controllers can update their tracked finger and position when another finger takes over
			if (pX > this.xCenterScreenPosition && rightZoneController) {
				if (!rightZoneController.activeInZone || rightZoneController.type === 'traversal') {
					rightZoneController.controllingFinger = pFingerID;
					rightZoneController.activeInZone = true;
					rightZoneController.update(pX, pY, true);
				}
			} else if (pX < this.xCenterScreenPosition && leftZoneController) {
				if (!leftZoneController.activeInZone || leftZoneController.type === 'traversal') {
					leftZoneController.controllingFinger = pFingerID;
					leftZoneController.activeInZone = true;
					leftZoneController.update(pX, pY, true);
				}
			}
		} else {
			// if there are no established zones, and there is a static controller or a traversal controller created then those types of controllers can 
			// use the entire screen as their zone. Only one of these controllers can control the entire screen. If more than one of these controllers are created then zones will be needed.
			for (const controller of this.activeControllers) {
				if ((!controller.activeInZone || controller.type === 'traversal') && (controller.type === 'traversal' || controller.type === 'static')) {
					controller.controllingFinger = pFingerID;
					controller.activeInZone = true;
					controller.update(pX, pY, true);
					return;
				}
			}
		}
	}
	/**
	 * When a finger on the screen is removed it checks to see if it belongs to a zoned controller. If so it releases that controller.
	 * @private
	 * @param {string} pFingerID - The ID of the finger.
	 * @returns 
	 */
	handleZoneRelease(pFingerID) {
		if (this.reservedScreenZones.length) {
			const rightZoneController = this.zonedControllers['right'];
			const leftZoneController = this.zonedControllers['left'];

			if (rightZoneController && rightZoneController.controllingFinger === pFingerID && rightZoneController.activeInZone) {
				// console.log('right zone controller released');
				rightZoneController.release();
			} else if (leftZoneController && leftZoneController.controllingFinger === pFingerID && leftZoneController.activeInZone) {
				// console.log('left zone controller released');
				leftZoneController.release();
			}

		} else {
			for (const controller of this.activeControllers) {
				if ((controller.type === 'traversal' || controller.type === 'static') && controller.activeInZone) {
					if (controller.controllingFinger === pFingerID) {
						controller.release();
						return;
					}
				}
			}
		}
	}
	/**
	 * When a finger on the screen moves, check if the fingerID belongs to a zoned controller, if it does update that zoned controller
	 * @private
	 * @param {number} pX - The x position on the screen where the user tapped.
	 * @param {number} pY - The y position on the screen where the user tapped.
	 * @param {string} pFingerID - The ID of the finger
	 */
	handleZoneMove(pX, pY, pFingerID) {
		if (this.reservedScreenZones.length) {
			const rightZoneController = this.zonedControllers['right'];
			const leftZoneController = this.zonedControllers['left'];

			if (rightZoneController && rightZoneController.controllingFinger === pFingerID && rightZoneController.activeInZone) {
				rightZoneController.update(pX, pY);
			} else if (leftZoneController && leftZoneController.controllingFinger === pFingerID && leftZoneController.activeInZone) {
				leftZoneController.update(pX, pY);
			}
		} else {
			for (const controller of this.activeControllers) {
				if ((controller.type === 'traversal' || controller.type === 'static') && controller.activeInZone) {
					if (controller.controllingFinger === pFingerID) {
						controller.update(pX, pY);
					}
				}
			}
		}
	}
	/**
	 * The event function called when a touch starts.
	 * @private
	 * @param {Object} pEvent - Represents an event which takes place in the DOM.
	 */
	handleStart(pEvent) {
		// Prevent browser default (dragging body around and zooming and etc)
		pEvent.preventDefault();

		const touches = pEvent.changedTouches;

		for (let i = 0; i < touches.length; i++) {
			const x = Math.floor((touches[i].clientX - mainM.xBodyPos)) / mainM.scaleWidth; // find a better way to calcuate this value instead of relying on the engine's variable
			const y = Math.floor((touches[i].clientY - mainM.yBodyPos)) / mainM.scaleHeight; // find a better way to calcuate this value instead of relying on the engine's variable
			const touchX = touches[i].clientX;
			const touchY = touches[i].clientY;
			const touchedDiob = this.getDiobUnderFinger(touchX, touchY);
			const fingerID = touches[i].identifier;
			let spriteRelativeX;
			let spriteRelativeY;
			
			// console.log(fingerID, 'start');
			// 	If you haven't touched a diob, but instead just a space on a screen check if there are any zoned controllers
			if (!touchedDiob) {
				this.handleZoneTouch(x, y, fingerID);
			}

			if (typeof(VYLO.Client.onTapStart) === 'function') {
				VYLO.Client.onTapStart(touchedDiob, Utils.clamp(touchX, 0, this.windowSize.width), Utils.clamp(touchY, 0, this.windowSize.height), fingerID);
			}
			if (touchedDiob) {
				if (touchedDiob.trackedTouches === undefined) {
					touchedDiob.trackedTouches = [];
				}
				if (touchedDiob._slidOff === undefined) {
					touchedDiob._slidOff = false;
				}
				if (typeof(touchedDiob.onTapStart) === 'function') {
					// if you are already touching something, you need `touchOpacity` set to 2 to use `multitouch`
					if (touchedDiob.baseType === 'Interface') {
						spriteRelativeX = Utils.clamp(touchX - touchedDiob.xPos, 0, touchedDiob.width);
						spriteRelativeY = Utils.clamp(touchY - touchedDiob.yPos, 0, touchedDiob.height);
					} else {
						VYLO.Client.getPosFromScreen(touchX, touchY, this.mapPositionObject);
						spriteRelativeX = Utils.clamp(this.mapPositionObject.x - touchedDiob.xPos, 0, touchedDiob.width);
						spriteRelativeY = Utils.clamp(this.mapPositionObject.y - touchedDiob.yPos, 0, touchedDiob.height);
					}
					touchedDiob.onTapStart(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
				}
				if (touchedDiob.trackedTouches.length && touchedDiob.touchOpacity === MobileHandlerSingleton.MULTI_TOUCH) {
					touchedDiob.trackedTouches.push(fingerID);
				// if you do not have `multitouch` enabled, then you can only touch one thing at a time					
				} else {
					if (!touchedDiob.trackedTouches.length) {
						touchedDiob.trackedTouches.push(fingerID);
					}
				}
				if (touchedDiob.isMobileHandlerController) {
					const joyring = touchedDiob;
					joyring.controller.update(x, y, true);
				}

				if (!this.touchedDiobs.includes(touchedDiob)) {
					this.touchedDiobs.push(touchedDiob);
				}
			}
		}
	}
	/**
	 * The event function called when a touch ends.
	 * @private
	 * @param {Object} pEvent - Represents an event which takes place in the DOM.
	 */
	handleEnd(pEvent) {
		// Prevent browser default (dragging body around and zooming and etc)
		pEvent.preventDefault();

		const touches = pEvent.changedTouches;

		for (let i = 0; i < touches.length; i++) {
			const x = Math.floor((touches[i].clientX - mainM.xBodyPos)) / mainM.scaleWidth; // find a better way to calcuate this value instead of relying on the engine's variable
			const y = Math.floor((touches[i].clientY - mainM.yBodyPos)) / mainM.scaleHeight; // find a better way to calcuate this value instead of relying on the engine's variable
			const touchX = touches[i].clientX;
			const touchY = touches[i].clientY;
			const touchedDiob = this.getDiobUnderFinger(touchX, touchY);
			const fingerID = touches[i].identifier;
			let spriteRelativeX;
			let spriteRelativeY;

			// console.log(fingerID, 'end');
			this.handleZoneRelease(fingerID);
			
			if (VYLO.Client.onTapEnd && typeof(VYLO.Client.onTapEnd) === 'function') {
				VYLO.Client.onTapEnd(touchedDiob, Utils.clamp(touchX, 0, this.windowSize.width), Utils.clamp(touchY, 0, this.windowSize.height), touches[i].identifier);
			}
		
			if (touchedDiob) {
				if (touchedDiob.onTapEnd && typeof(touchedDiob.onTapEnd) === 'function') {
					if (touchedDiob.baseType === 'Interface') {
						spriteRelativeX = Utils.clamp(touchX - touchedDiob.xPos, 0, touchedDiob.width);
						spriteRelativeY = Utils.clamp(touchY - touchedDiob.yPos, 0, touchedDiob.height);
					} else {
						VYLO.Client.getPosFromScreen(touchX, touchY, this.mapPositionObject);
						spriteRelativeX = Utils.clamp(this.mapPositionObject.x - touchedDiob.xPos, 0, touchedDiob.width);
						spriteRelativeY = Utils.clamp(this.mapPositionObject.y - touchedDiob.yPos, 0, touchedDiob.height);
					}
					if (touchedDiob.touchOpacity === MobileHandlerSingleton.MULTI_TOUCH) {
						touchedDiob.onTapEnd(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
					} else {
						if (touchedDiob.trackedTouches) {
							if (touchedDiob.trackedTouches.length) {
								if (touchedDiob.trackedTouches.includes(fingerID)) {
									touchedDiob.onTapEnd(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
								}
							}
						}
					}
				}
			}

			// find all diobs that you were touching, and call `onTapStop` on them, since the finger that touched them has been removed
			for (let j = this.touchedDiobs.length - 1; j >= 0; j--) {
				if (this.touchedDiobs[j].trackedTouches) {
					if (this.touchedDiobs[j].trackedTouches.length) {
						if (this.touchedDiobs[j].trackedTouches.includes(fingerID)) {
							this.touchedDiobs[j].trackedTouches.splice(this.touchedDiobs[j].trackedTouches.indexOf(fingerID), 1);
							if (this.touchedDiobs[j].onTapStop && typeof(this.touchedDiobs[j].onTapStop) === 'function') {
								if (this.touchedDiobs[j].baseType === 'Interface') {
									spriteRelativeX = Utils.clamp(touchX - this.touchedDiobs[j].xPos, 0, this.touchedDiobs[j].width);
									spriteRelativeY = Utils.clamp(touchY - this.touchedDiobs[j].yPos, 0, this.touchedDiobs[j].height);
								} else {
									VYLO.Client.getPosFromScreen(touchX, touchY, this.mapPositionObject);
									spriteRelativeX = Utils.clamp(this.mapPositionObject.x - this.touchedDiobs[j].xPos, 0, this.touchedDiobs[j].width);
									spriteRelativeY = Utils.clamp(this.mapPositionObject.y - this.touchedDiobs[j].yPos, 0, this.touchedDiobs[j].height);
								}
								this.touchedDiobs[j].onTapStop(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID); // you tapped this diob, and finally released it (no matter if it was over the diob or not)
							}
							if (this.touchedDiobs[j]._slidOff) {
								this.touchedDiobs[j]._slidOff = false;
							}
							if (this.touchedDiobs[j].isMobileHandlerController) {
								const joyring = this.touchedDiobs[j];
								if (!joyring.trackedTouches.length) {
									joyring.controller.release();
								}
							}
							this.touchedDiobs.splice(j, 1);
						}
					}
				}
			}
		}
	}
	/**
	 * The event function called when a touch is canceled.
	 * @private
	 * @param {Object} pEvent - Represents an event which takes place in the DOM.
	 */
	handleCancel(pEvent) {
		this.handleEnd(pEvent);
		// remove all touchedDiobs since this was a touchCancel event, you must of hit some UI, meaning all fingers should be considered null and void
		for (let j = this.touchedDiobs.length - 1; j >= 0; j--) {
			this.touchedDiobs[j].trackedTouches = [];
			this.touchedDiobs.splice(j, 1);
		}
	}
	/**
	 * The event function called when a touch is moved.
	 * @private
	 * @param {Object} pEvent - Represents an event which takes place in the DOM.
	 */
	handleMove(pEvent) {
		// Prevent browser default (dragging body around and zooming and etc)
		pEvent.preventDefault();

		const touches = pEvent.changedTouches;

		for (let i = 0; i < touches.length; i++) {
			const x = Math.floor((touches[i].clientX - mainM.xBodyPos)) / mainM.scaleWidth; // find a better way to calcuate this value instead of relying on the engine's variable
			const y = Math.floor((touches[i].clientY - mainM.yBodyPos)) / mainM.scaleHeight; // find a better way to calcuate this value instead of relying on the engine's variable
			const touchX = touches[i].clientX;
			const touchY = touches[i].clientY;
			const touchedDiob = this.getDiobUnderFinger(touchX, touchY);
			const fingerID = touches[i].identifier;
			let spriteRelativeX;
			let spriteRelativeY;
			
			this.handleZoneMove(x, y, fingerID);

			if (typeof(VYLO.Client.onTapMove) === 'function') {
				VYLO.Client.onTapMove(touchedDiob, Utils.clamp(touchX, 0, this.windowSize.width), Utils.clamp(touchY, 0, this.windowSize.height), fingerID);
			}

			if (touchedDiob) {
				if (typeof(touchedDiob.onTapMove) === 'function') {
					if (touchedDiob.baseType === 'Interface') {
						spriteRelativeX = Utils.clamp(touchX - touchedDiob.xPos, 0, touchedDiob.width);
						spriteRelativeY = Utils.clamp(touchY - touchedDiob.yPos, 0, touchedDiob.height);
					} else {
						VYLO.Client.getPosFromScreen(touchX, touchY, this.mapPositionObject);
						spriteRelativeX = Utils.clamp(this.mapPositionObject.x - touchedDiob.xPos, 0, touchedDiob.width);
						spriteRelativeY = Utils.clamp(this.mapPositionObject.y - touchedDiob.yPos, 0, touchedDiob.height);
					}
					if (touchedDiob.touchOpacity === MobileHandlerSingleton.MULTI_TOUCH) {
						touchedDiob.onTapMove(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
					} else {
						if (touchedDiob.trackedTouches) {
							if (touchedDiob.trackedTouches.length) {
								if (touchedDiob.trackedTouches.includes(fingerID)) {
									touchedDiob.onTapMove(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
								}
							}
						}
					}
				}
			}
			
			for (const diob of this.touchedDiobs) {
				if (diob.trackedTouches.includes(fingerID)) {
					if (diob !== touchedDiob) {
						if (!diob._slidOff) {
							if (diob.onTapSlideOff && typeof(diob.onTapSlideOff) === 'function') {
								diob._slidOff = true;
								if (diob.baseType === 'Interface') {
									spriteRelativeX = Utils.clamp(touchX - diob.xPos, 0, diob.width);
									spriteRelativeY = Utils.clamp(touchY - diob.yPos, 0, diob.height);
								} else {
									VYLO.Client.getPosFromScreen(touchX, touchY, this.mapPositionObject);
									spriteRelativeX = Utils.clamp(this.mapPositionObject.x - diob.xPos, 0, diob.width);
									spriteRelativeY = Utils.clamp(this.mapPositionObject.y - diob.yPos, 0, diob.height);
								}
								diob.onTapSlideOff(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
							}
						}
					}
					if (diob.isMobileHandlerController) {
						const joyring = diob;
						joyring.controller.update(x, y);
					}
				}
			}
		}
	}
}

export const MobileHandler = new MobileHandlerSingleton();