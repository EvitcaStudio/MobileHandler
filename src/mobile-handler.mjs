import { Utils } from './vendor/utils.min.mjs';
import { Logger } from './vendor/logger.min.mjs';
import { Pulse } from './vendor/pulse.min.mjs';
import { Controller } from './controller.mjs'
/** 
 * @file The MobileHandler module provides a user-friendly interface for game developers to integrate touch-based controls for their game characters on mobile devices. It offers features for creating a visual joystick on the screen and facilitates mobile device interaction, including accessing device information and triggering device vibrations.
 * 
 * @author https://github.com/doubleactii
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
	constructor() {
        /** The logger module this module uses to log errors / logs
         * @private
         * @type {Object}
         */
        this.logger = new Logger();
        this.logger.registerType('MobileHandler-Module', '#ff6600');
		// Create and show the mobile handler interface that our controllers will exist in
		VYLO.Client.createInterface('mobile-handler-interface');
		VYLO.Client.showInterface('mobile-handler-interface');

		this.queryUserAgent();
		this.registerEventHandlers();
		this.querySafeAreaValues();
	}
	/**
	 * An object containing the safe area offset values to account for the notch on notch enabled devices. This will keep the UI in a safe area
	 * The safe-area-inset-* variables are four environment variables that define a rectangle by its top, right, bottom, and left insets from the edge of the viewport, 
	 * which is safe to put content into without risking it being cut off by the shape of a non‑rectangular display. 
	 * For rectangular viewports, like your average laptop monitor, their value is equal to zero. 
	 * For non-rectangular displays — like a round watch face — the four values set by the user agent form a rectangle such that all content inside the rectangle is visible.
	 * https://developer.mozilla.org/en-US/docs/Web/CSS/env
	 * @private
	 * @property {boolean} top - safeAreaInsetTop.
	 * @property {boolean} right - safeAreaInsetRight.
	 * @property {boolean} bottom - safeAreaInsetBottom.
	 * @property {boolean} left - safeAreaInsetLeft.
	 * @returns {Object} The safe area inset values
	 */
	getSafeAreaInsets() {
		return { ...this.safeAreaValues };
	}
	/**
	 * Short hand for getting the safe area inset for the top of the screen.
	 * @returns {number}
	 */
	getSafeAreaTop() {
		return this.safeAreaValues.top;
	}
	/**
	 * Short hand for getting the safe area inset for the bottom of the screen.
	 * @returns {number}
	 */
	getSafeAreaBottom() {
		return this.safeAreaValues.bottom;
	}
	/**
	 * Short hand for getting the safe area inset for the left of the screen.
	 * @returns {number}
	 */
	getSafeAreaLeft() {
		return this.safeAreaValues.left;
	}
	/**
	 * Short hand for getting the safe area inset for the right of the screen.
	 * @returns {number}
	 */
	getSafeAreaRight() {
		return this.safeAreaValues.right;
	}
	/**
	 * Detects the type of device based on user agent.
	 *
	 * @returns {string} The detected device type ('desktop' or 'mobile').
	 */
	detectDeviceType() {
		const isMobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase());
		return isMobile ? 'mobile' : 'desktop';
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
	 * If this device can register touch events.
	 * @returns {boolean} - Whether this device is a touch enabled device.
	 */
	isTouchDevice() {
		return this.isTouchEnabled;
	}
	/**
	 * If this device is a mobile device.
	 * @returns {boolean} - Whether this device is a mobile device.
	 */
	isMobileDevice() {
		return this.isMobile;
	}
	/**
	 * If this device is an ios device.
	 * @returns {boolean} - Whether this device is an ios device.
	 */
	isIOSDevice() {
		return this.isIOS;
	}
	/**
	 * If this device is an android device.
	 * @returns {boolean} - Whether this device is an android device.
	 */
	isAndroidDevice() {
		return this.isAndroid;
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
			if (screenDiobs[i].touchOpacity || (screenDiobs[i].touchOpacity === undefined)) {
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
	 * Sets the needed event handlers for this module.
	 * @private
	 */
	registerEventHandlers() {
		// Attach our window resize handler event to the onWindowResize event
		Pulse.on(VYLO.Client, 'onWindowResize', this.windowResizeHandler.bind(this));
		
		// Get reference to game canvas
		const gameCanvas = document.getElementById('game_canvas');
		// Set the pointer events to be allowed.
		gameCanvas.style.pointerEvents = 'auto';
		gameCanvas.style.touchAction = 'auto';
		// Put events on the canvas rather than the document
		gameCanvas.addEventListener('touchstart', this.handleStart.bind(this), { 'passive': false });
		gameCanvas.addEventListener('touchend', this.handleEnd.bind(this), { 'passive': false });
		gameCanvas.addEventListener('touchcancel', this.handleCancel.bind(this), { 'passive': false });
		gameCanvas.addEventListener('touchmove', this.handleMove.bind(this), { 'passive': false });
	
		// Prevent zooming and mobile gestures
		gameCanvas.addEventListener('gesturestart', function(pEvent) {pEvent.preventDefault()}, { 'passive': false });
		gameCanvas.addEventListener('gesturechange', function(pEvent) {pEvent.preventDefault()}, { 'passive': false });
	}
	/**
	 * Queries the safe area inset values set by the device and stores them.
	 * @private
	 */
	querySafeAreaValues() {
		// Make a style element
		const styleElement = document.createElement('style');

		// Set the inset variables so we can reference them in JS
		styleElement.textContent = `
			:root {
			--safe-area-inset-top: env(safe-area-inset-top);
			--safe-area-inset-right: env(safe-area-inset-right);
			--safe-area-inset-bottom: env(safe-area-inset-bottom);
			--safe-area-inset-left: env(safe-area-inset-left);
			}
		`;

		// Append the style element to the document head
		document.head.appendChild(styleElement);

        // Get the styles attached to the root element (we stored the env variables for the safe area);
        const rootStyles = getComputedStyle(document.documentElement);

        // Get the safe areas that were computed so we can store them for calculations for our UI
        const safeAreaInsetTop = parseInt(rootStyles.getPropertyValue('--safe-area-inset-top').replace('px', ''));
        const safeAreaInsetRight = parseInt(rootStyles.getPropertyValue('--safe-area-inset-right').replace('px', ''));
        const safeAreaInsetBottom = parseInt(rootStyles.getPropertyValue('--safe-area-inset-bottom').replace('px', ''));
        const safeAreaInsetLeft = parseInt(rootStyles.getPropertyValue('--safe-area-inset-left').replace('px', ''));

		/**
		 * An object containing the safe area offset values to account for the notch on notch enabled devices. This will keep the UI in a safe area
		 * The safe-area-inset-* variables are four environment variables that define a rectangle by its top, right, bottom, and left insets from the edge of the viewport, 
		 * which is safe to put content into without risking it being cut off by the shape of a non‑rectangular display. 
		 * For rectangular viewports, like your average laptop monitor, their value is equal to zero. 
		 * For non-rectangular displays — like a round watch face — the four values set by the user agent form a rectangle such that all content inside the rectangle is visible.
		 * https://developer.mozilla.org/en-US/docs/Web/CSS/env
		 * @private
		 * @property {boolean} top - safeAreaInsetTop.
		 * @property {boolean} right - safeAreaInsetRight.
		 * @property {boolean} bottom - safeAreaInsetBottom.
		 * @property {boolean} left - safeAreaInsetLeft.
		 * @type {Object}
		 */
		this.safeAreaValues = {
			top: safeAreaInsetTop,
			right: safeAreaInsetRight,
			bottom: safeAreaInsetBottom,
			left: safeAreaInsetLeft
		}
	}
	queryUserAgent() {
		/**
		 * Check if the user agent string contains 'iPhone' or 'iPad'
		 * @private
		 * @type {boolean}
		 */
		this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
		/**
		 * Check if the user agent string contains 'Android'
		 * @private
		 * @type {boolean}
		 */
		this.isAndroid = /Android/.test(navigator.userAgent);
		/**
		 * Check if the 'ontouchstart' event is supported
		 * @private
		 * @type {boolean}
		 */
		this.isTouchEnabled = 'ontouchstart' in document.documentElement;
		/**
		 * Whether this device is mobile or not. Can be simulated.
		 * @private
		 * @type {boolean}
		 */
		this.isMobile = this.detectDeviceType() === 'mobile' ? true : false;
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
			// If the screen is pressed on the right|left side and if the right|left zone controller is not active
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
			// If there are no established zones, and there is a static controller or a traversal controller created then those types of controllers can 
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
			const bodyRect = document.getElementById('game_body').getBoundingClientRect();
			const xBodyPos = bodyRect.x;
			const yBodyPos = bodyRect.y;
			const x = Math.floor((touches[i].clientX - xBodyPos)) / mainM.scaleWidth; // find a better way to calcuate this value instead of relying on the engine's variable
			const y = Math.floor((touches[i].clientY - yBodyPos)) / mainM.scaleHeight; // find a better way to calcuate this value instead of relying on the engine's variable
			const touchX = touches[i].clientX;
			const touchY = touches[i].clientY;
			const touchedDiob = this.getDiobUnderFinger(touchX, touchY);
			const fingerID = touches[i].identifier;
			let spriteRelativeX;
			let spriteRelativeY;
			
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
					// If you are already touching something, you need `touchOpacity` set to 2 to use `multitouch`
					// If the element is an interface we need to use screen coords
					if (touchedDiob.baseType === 'Interface') {
						spriteRelativeX = Utils.clamp(touchX - touchedDiob.xPos, 0, touchedDiob.width);
						spriteRelativeY = Utils.clamp(touchY - touchedDiob.yPos, 0, touchedDiob.height);
					// Otherwise it is a map element and we need to use map coordinates
					} else {
						VYLO.Client.getPosFromScreen(touchX, touchY, this.mapPositionObject);
						spriteRelativeX = Utils.clamp(this.mapPositionObject.x - touchedDiob.xPos, 0, touchedDiob.width);
						spriteRelativeY = Utils.clamp(this.mapPositionObject.y - touchedDiob.yPos, 0, touchedDiob.height);
					}
					touchedDiob.onTapStart(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
				}
				if (touchedDiob.trackedTouches.length && touchedDiob.touchOpacity === MobileHandlerSingleton.MULTI_TOUCH) {
					touchedDiob.trackedTouches.push(fingerID);
				// If you do not have `multitouch` enabled, then you can only touch one thing at a time					
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
			const bodyRect = document.getElementById('game_body').getBoundingClientRect();
			const xBodyPos = bodyRect.x;
			const yBodyPos = bodyRect.y;
			const x = Math.floor((touches[i].clientX - xBodyPos)) / mainM.scaleWidth; // find a better way to calcuate this value instead of relying on the engine's variable
			const y = Math.floor((touches[i].clientY - yBodyPos)) / mainM.scaleHeight; // find a better way to calcuate this value instead of relying on the engine's variable
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
					// If the element is an interface we need to use screen coords
					if (touchedDiob.baseType === 'Interface') {
						spriteRelativeX = Utils.clamp(touchX - touchedDiob.xPos, 0, touchedDiob.width);
						spriteRelativeY = Utils.clamp(touchY - touchedDiob.yPos, 0, touchedDiob.height);
					// Otherwise it is a map element and we need to use map coordinates
					} else {
						VYLO.Client.getPosFromScreen(touchX, touchY, this.mapPositionObject);
						spriteRelativeX = Utils.clamp(this.mapPositionObject.x - touchedDiob.xPos, 0, touchedDiob.width);
						spriteRelativeY = Utils.clamp(this.mapPositionObject.y - touchedDiob.yPos, 0, touchedDiob.height);
					}
					/**
					 * If multi touch is enabled then on tap end is called per finger that ends a touch and not just the initial finger that triggered the touch
					 * If multi touch is not enabled then it only calls the onTapEnd event for the initial finger that triggered the touch
					 */
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
								// If the element is an interface we need to use screen coords
								if (this.touchedDiobs[j].baseType === 'Interface') {
									spriteRelativeX = Utils.clamp(touchX - this.touchedDiobs[j].xPos, 0, this.touchedDiobs[j].width);
									spriteRelativeY = Utils.clamp(touchY - this.touchedDiobs[j].yPos, 0, this.touchedDiobs[j].height);
								// Otherwise it is a map element and we need to use map coordinates
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
			const bodyRect = document.getElementById('game_body').getBoundingClientRect();
			const xBodyPos = bodyRect.x;
			const yBodyPos = bodyRect.y;
			const x = Math.floor((touches[i].clientX - xBodyPos)) / mainM.scaleWidth; // find a better way to calcuate this value instead of relying on the engine's variable
			const y = Math.floor((touches[i].clientY - yBodyPos)) / mainM.scaleHeight; // find a better way to calcuate this value instead of relying on the engine's variable
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
					// If the element is an interface we need to use screen coords
					if (touchedDiob.baseType === 'Interface') {
						spriteRelativeX = Utils.clamp(touchX - touchedDiob.xPos, 0, touchedDiob.width);
						spriteRelativeY = Utils.clamp(touchY - touchedDiob.yPos, 0, touchedDiob.height);
					// Otherwise it is a map element and we need to use map coordinates
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