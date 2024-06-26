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
	touchedInstances = [];
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
	 * Weakmap to track data belonging to instances used in this module.
	 * @private
	 * @type {WeakMap}
	 */
	instanceWeakMap = new WeakMap();
	/**
	 * The version of the module.
	 */
	version = "VERSION_REPLACE_ME";
	/**
	 * @private
	 */
	constructor() {
        /** The logger module this module uses to log errors / logs
         * @private
         * @type {Object}
         */
        this.logger = new Logger();
        this.logger.registerType('MobileHandler-Module', '#ff6600');
		/**
		 * The mobile handler interface that our controllers will exist in
		 * @private
		 */
		this.interfaceHandle = `mobile-handler-interface-${(Math.random() * Math.PI / 2)}`;
		VYLO.Client.createInterface(this.interfaceHandle);

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
	 * Gets the device's current RAM. Only works in a cordova environment.
	 * @returns {number} The device's current RAM
	 */
	getDeviceRAM() {
		if (typeof(navigator) !== 'undefined') {
			return navigator.deviceMemory;
		}
	}
	/**
	 * Creates a controller component with the passed options.
     * @param {Object} pOptions - The options of this controller.
     * @param {string} pOptions.type - The way this controller will behave. stationary | traversal | static.
     * @param {number} pOptions.size - The width/height of the joystick. The width & height of the joystick should be the same. The inner ring will be 50% of this size.
     * @param {Object} pOptions.position - The initial position of the joystick.
     * @param {string} pOptions.position.x - The initial x position of the joystick.
     * @param {string} pOptions.position.y - The initial y position of the joystick.
     * @param {string} pOptions.lockedDimension - The locked dimension of the joystick. both | vertical | horizontal. This is used to lock the joystick from moving in certain dimensions. If this joystick's type is traversal it cannot be locked.
     * @param {string} pOptions.zone - The zone the joystick will occupy. If there is already a controller of the traversal or static type, then you must use a zone. If there is only one controller no zone is needed. left | right This will give each controller equal space on the left | right sides of the screen.
     * @param {number} pOptions.inactiveAlpha - The alpha value the joystick will be when it is considered to be inactive.
     * @param {number} pOptions.transitionTime - How long it takes in ms to transition to the inactiveAlpha value.
     * @param {number} pOptions.scale - The scale you want the joystick controller to be.
     * @param {number} pOptions.plane - The plane of the joystick controller.
     * @param {number} pOptions.layer - The layer of the joystick controller.
     * @param {string} pOptions.atlasName - The atlasName of the joystick.
     * @param {string} pOptions.joystickIconName - The iconName of the joystick.
     * @param {string} pOptions.joyringIconName - The iconName of the joyring.
     * @param {Object} pOptions.callback - An object holding options callbacks to attach to events the joystick emits. 
     * @param {Function} pOptions.callback.onTouchBegin - Callback to be called when the joystick is touched after being released.
     * @param {Function} pOptions.callback.onRelease - Callback to be called when the joystick is released and no longer held.
     * @param {Function} pOptions.callback.onMove - Callback to be called when the joystick is moved.
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
				components.joyring.originalPos = { 'x': components.joyring.x, 'y': components.joyring.y };
			}
			if (components.joystick.edgeLock) {
				components.joystick.originalPos = { 'x': components.joystick.x, 'y': components.joystick.y };
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
		const gameBody = document.getElementById('game_body');
		// Set the pointer events to be allowed.
		// gameBody.style.pointerEvents = 'auto';
		// gameBody.style.touchAction = 'auto';
		// Put events on the canvas rather than the document
		window.addEventListener('touchstart', this.handleStart.bind(this), { 'passive': false });
		window.addEventListener('touchend', this.handleEnd.bind(this), { 'passive': false });
		window.addEventListener('touchcancel', this.handleCancel.bind(this), { 'passive': false });
		window.addEventListener('touchmove', this.handleMove.bind(this), { 'passive': false });
	
		// Prevent zooming and mobile gestures
		window.addEventListener('gesturestart', function(pEvent) {pEvent.preventDefault()}, { 'passive': false });
		window.addEventListener('gesturechange', function(pEvent) {pEvent.preventDefault()}, { 'passive': false });
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
		this.isTouchEnabled = 'ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch) || navigator.maxTouchPoints > 0 || window.navigator.msMaxTouchPoints > 0;
		/**
		 * Whether this device is mobile or not. Can be simulated.
		 * @private
		 * @type {boolean}
		 */
		this.isMobile = this.detectDeviceType() === 'mobile' ? true : false;
	}
	/**
	 * Starts internally tracking this instance.
	 * @private
	 * @param {Object} pTouchedInstance - The instance that needs to be tracked.
	 */
	track(pTouchedInstance) {
		if (!pTouchedInstance) {
			return;
		}
		/**
		 * Object storing information that is occuring on pTouchedInstance
		 * @property {Array} trackedTouches - An array of finger IDs that are currently touching the instance
		 * @property {boolean} slidOff - A boolean on whether 
		 */
		this.instanceWeakMap.set(pTouchedInstance, {
			trackedTouches: [],
			slidOff: false
		});

		this.touchedInstances.push(pTouchedInstance);
	}
	/**
	 * Checks if the instance that was touched is being tracked internally.
	 * @private
	 * @param {Object} pTouchedInstance - The instance that needs to be tracked.
	 * @return {boolean} Whether pTouchedInstance is being tracked.
	 */
	isTracking(pTouchedInstance) {
		if (!pTouchedInstance) {
			return;
		}
		const isTracked = (this.instanceWeakMap.get(pTouchedInstance) && this.touchedInstances.includes(pTouchedInstance));
		return isTracked;
	}
	/**
	 * Returns the tracker object associated with pTouchedInstance if it exists.
	 * @private
	 * @param {Object} pTouchedInstance - The instance that needs to be tracked.
	 * @returns {Object|void} The tracker object associated with pTouchedInstance if it exists. void if not.
	 */
	getTrackerObject(pTouchedInstance) {
		return this.instanceWeakMap.get(pTouchedInstance);
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
				if (!rightZoneController.activeInZone || rightZoneController.getType() === 'traversal') {
					rightZoneController.controllingFinger = pFingerID;
					rightZoneController.activeInZone = true;
					rightZoneController.update(pX, pY, true);
				}
			} else if (pX < this.xCenterScreenPosition && leftZoneController) {
				if (!leftZoneController.activeInZone || leftZoneController.getType() === 'traversal') {
					leftZoneController.controllingFinger = pFingerID;
					leftZoneController.activeInZone = true;
					leftZoneController.update(pX, pY, true);
				}
			}
		} else {
			// If there are no established zones, and there is a static controller or a traversal controller created then those types of controllers can 
			// use the entire screen as their zone. Only one of these controllers can control the entire screen. If more than one of these controllers are created then zones will be needed.
			for (const controller of this.activeControllers) {
				const controllerType = controller.getType();
				if ((!controller.activeInZone || controllerType === 'traversal') && (controllerType === 'traversal' || controllerType === 'static')) {
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
				rightZoneController.release();
			} else if (leftZoneController && leftZoneController.controllingFinger === pFingerID && leftZoneController.activeInZone) {
				leftZoneController.release();
			}

		} else {
			for (const controller of this.activeControllers) {
				const controllerType = controller.getType();
				if ((controllerType === 'traversal' || controllerType === 'static') && controller.activeInZone) {
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
				const controllerType = controller.getType();
				if ((controllerType === 'traversal' || controllerType === 'static') && controller.activeInZone) {
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
		const touches = pEvent.changedTouches;
		const bodyRect = document.getElementById('game_body').getBoundingClientRect();
		const xBodyPos = bodyRect.x;
		const yBodyPos = bodyRect.y;

		for (let i = 0; i < touches.length; i++) {
			const touchX = touches[i].clientX;
			const touchY = touches[i].clientY;
			const x = Math.floor((touchX - xBodyPos)) / mainM.scaleWidth; // find a better way to calcuate this value instead of relying on the engine's variable
			const y = Math.floor((touchY - yBodyPos)) / mainM.scaleHeight; // find a better way to calcuate this value instead of relying on the engine's variable
			const touchedInstance = this.getDiobUnderFinger(touchX, touchY);
			const fingerID = touches[i].identifier;
			
			// 	If you haven't touched an instance, but instead just a space on a screen check if there are any zoned controllers
			if (!touchedInstance) {
				this.handleZoneTouch(x, y, fingerID);
			}
			/**
			 * VYLO.Client event for onTouchBegin.
			 * 
			 * VYLO.Client.onTouchBegin is an event function that handles a touch being registered on the screen at the global level.
			 * @param {Object} pInstance - The instance touched.
			 * @param {number} pX - The x position on the screen that was touched.
			 * @param {number} pY - The y position on the screen that was touched.
			 * @param {number} pFingerID - The ID of the finger that registered this touch.
			 */
			if (typeof(VYLO.Client.onTouchBegin) === 'function') {
				VYLO.Client.onTouchBegin(touchedInstance, Utils.clamp(touchX, 0, this.windowSize.width), Utils.clamp(touchY, 0, this.windowSize.height), fingerID);
			}

			// If a instance was touched we need to handle separate logic
			if (touchedInstance) {
				// If we are not tracking this instance then we track it
				if (!this.isTracking(touchedInstance)) {
					this.track(touchedInstance);
				}
				// Get a reference to the tracker object associated with this instance that was touched
				const touchedInstanceTracker = this.getTrackerObject(touchedInstance);
				/**
				 * touchedInstance event for onTouchBegin.
				 * 
				 * touchedInstance.onTouchBegin is an event function that handles a touch being registered on the screen on this specific instance.
				 * @param {Client} pClient - The client of the game.
				 * @param {number} pX - The x position on the screen that was touched.
				 * @param {number} pY - The y position on the screen that was touched.
				 * @param {number} pFingerID - The ID of the finger that registered this touch.
				 */
				if (typeof(touchedInstance.onTouchBegin) === 'function') {
					/**
					 * The relative x position on the sprite
					 * @type {number}
					 */
					let spriteRelativeX;
					/**
					 * The relative y position on the sprite
					 * @type {number}
					 */
					let spriteRelativeY;
					// If you are already touching something, you need `touchOpacity` set to 2 to use `multitouch`
					// If the element is an interface we need to use screen coords
					if (touchedInstance.baseType === 'Interface') {
						spriteRelativeX = Utils.clamp(touchX - touchedInstance.x, 0, touchedInstance.width);
						spriteRelativeY = Utils.clamp(touchY - touchedInstance.y, 0, touchedInstance.height);
					// Otherwise it is a map element and we need to use map coordinates
					} else {
						VYLO.Client.getPosFromScreen(touchX, touchY, this.mapPositionObject);
						spriteRelativeX = Utils.clamp(this.mapPositionObject.x - touchedInstance.x, 0, touchedInstance.width);
						spriteRelativeY = Utils.clamp(this.mapPositionObject.y - touchedInstance.y, 0, touchedInstance.height);
					}
					touchedInstance.onTouchBegin(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
				}
				if (touchedInstance.touchOpacity === MobileHandlerSingleton.MULTI_TOUCH) {
					touchedInstanceTracker.trackedTouches.push(fingerID);
				// If you do not have `multitouch` enabled, then you can only touch one thing at a time					
				} else if (!touchedInstanceTracker.trackedTouches.length) {
					touchedInstanceTracker.trackedTouches.push(fingerID);
				}
				// Check if the instance that was touched was a mobile controller that is controlled by this module
				if (touchedInstance.isMobileHandlerController) {
					const joyring = touchedInstance;
					joyring.controller.update(x, y, true);
				}
			}
		}
		if (pEvent.target.closest('.web_box') || pEvent.target.matches('.web_box')) {
			return;
		}
		// Prevent browser default (dragging body around and zooming and etc)
		pEvent.preventDefault();
	}
	/**
	 * The event function called when a touch ends.
	 * @private
	 * @param {Object} pEvent - Represents an event which takes place in the DOM.
	 */
	handleEnd(pEvent) {
		const touches = pEvent.changedTouches;

		for (let i = 0; i < touches.length; i++) {
			const touchX = touches[i].clientX;
			const touchY = touches[i].clientY;
			const touchedInstance = this.getDiobUnderFinger(touchX, touchY);
			const fingerID = touches[i].identifier;
			/**
			 * The relative x position on the sprite
			 * @type {number}
			 */
			let spriteRelativeX;
			/**
			 * The relative y position on the sprite
			 * @type {number}
			 */
			let spriteRelativeY;
			
			// You are removing the finger matching fingerID from the screen, so we need to handle the zone being released by that finger if applicable
			this.handleZoneRelease(fingerID);
			/**
			 * VYLO.Client event for onTouchFinish.
			 * 
			 * VYLO.Client.onTouchFinish is an event function that handles a touch being deregistered on the screen at the global level.
			 * @param {Object} pInstance - The instance that was touched when the finger left the screen.
			 * @param {number} pX - The x position on the screen that was touched.
			 * @param {number} pY - The y position on the screen that was touched.
			 * @param {number} pFingerID - The ID of the finger that registered this touch.
			 */
			if (typeof(VYLO.Client.onTouchFinish) === 'function') {
				VYLO.Client.onTouchFinish(touchedInstance, Utils.clamp(touchX, 0, this.windowSize.width), Utils.clamp(touchY, 0, this.windowSize.height), fingerID);
			}
		
			if (touchedInstance) {
				// If we are not tracking this instance then we track it
				if (!this.isTracking(touchedInstance)) {
					this.track(touchedInstance);
				}
				// Get a reference to the tracker object associated with this instance that was touched
				const touchedInstanceTracker = this.getTrackerObject(touchedInstance);
				/**
				 * touchedInstance event for onTouchFinish.
				 * 
				 * touchedInstance.onTouchFinish is an event function that fires when a finger is removed from the screen but originated on this instance and ended on this instance.
				 * @param {Object} pClient - The client of the game.
				 * @param {number} pX - The x position on the screen that was touched.
				 * @param {number} pY - The y position on the screen that was touched.
				 * @param {number} pFingerID - The ID of the finger that registered this touch.
				 */
				if (typeof(touchedInstance.onTouchFinish) === 'function') {
					// If the element is an interface we need to use screen coords
					if (touchedInstance.baseType === 'Interface') {
						spriteRelativeX = Utils.clamp(touchX - touchedInstance.x, 0, touchedInstance.width);
						spriteRelativeY = Utils.clamp(touchY - touchedInstance.y, 0, touchedInstance.height);
					// Otherwise it is a map element and we need to use map coordinates
					} else {
						VYLO.Client.getPosFromScreen(touchX, touchY, this.mapPositionObject);
						spriteRelativeX = Utils.clamp(this.mapPositionObject.x - touchedInstance.x, 0, touchedInstance.width);
						spriteRelativeY = Utils.clamp(this.mapPositionObject.y - touchedInstance.y, 0, touchedInstance.height);
					}
					/**
					 * If multi touch is enabled then on tap end is called per finger that ends a touch and not just the initial finger that triggered the touch
					 * If multi touch is not enabled then it only calls the onTouchFinish event for the initial finger that triggered the touch
					 */
					if (touchedInstance.touchOpacity === MobileHandlerSingleton.MULTI_TOUCH) {
						touchedInstance.onTouchFinish(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
					} else if (touchedInstanceTracker.trackedTouches.includes(fingerID)) {
						touchedInstance.onTouchFinish(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
					}
				}
			}

			// Find all diobs that you were touching, and call `onTouchTerminate` on them, since the finger that touched them has been removed
			for (let j = this.touchedInstances.length - 1; j >= 0; j--) {
				// Get the touched instance
				const touchedInstance = this.touchedInstances[j];
				// If we are not tracking this instance then we track it
				if (!this.isTracking(touchedInstance)) {
					this.track(touchedInstance);
				}
				// Get the touched instances tracker
				const touchedInstanceTracker = this.getTrackerObject(touchedInstance);
				// Logic to check if this finger exists in this tracker
				if (touchedInstanceTracker.trackedTouches.includes(fingerID)) {
					// Remove this finger from being tracked
					touchedInstanceTracker.trackedTouches.splice(touchedInstanceTracker.trackedTouches.indexOf(fingerID), 1);
					/**
					 * touchedInstance event for onTouchTerminate.
					 * 
					 * touchedInstance.onTouchTerminate is an event function that fires when a finger is removed from the screen but originated on this instance but doesn't matter where the finger ended (whether it was over this instance or not).
					 * @param {Object} pClient - The client of the game.
					 * @param {number} pX - The x position on the screen that was touched.
					 * @param {number} pY - The y position on the screen that was touched.
					 * @param {number} pFingerID - The ID of the finger that registered this touch.
					 */
					if (typeof(touchedInstance.onTouchTerminate) === 'function') {
						// If the element is an interface we need to use screen coords
						if (touchedInstance.baseType === 'Interface') {
							spriteRelativeX = Utils.clamp(touchX - touchedInstance.x, 0, touchedInstance.width);
							spriteRelativeY = Utils.clamp(touchY - touchedInstance.y, 0, touchedInstance.height);
						// Otherwise it is a map element and we need to use map coordinates
						} else {
							VYLO.Client.getPosFromScreen(touchX, touchY, this.mapPositionObject);
							spriteRelativeX = Utils.clamp(this.mapPositionObject.x - touchedInstance.x, 0, touchedInstance.width);
							spriteRelativeY = Utils.clamp(this.mapPositionObject.y - touchedInstance.y, 0, touchedInstance.height);
						}
						touchedInstance.onTouchTerminate(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID); // you tapped this instance, and finally released it (no matter if it was over the instance or not)
					}
					// Reset the slidOff variable as the finger has been released from the screen
					if (touchedInstanceTracker.slidOff) {
						touchedInstanceTracker.slidOff = false;
					}

					// Check if this instance is a mobile controller handled by this module so that the release API can be called
					if (touchedInstance.isMobileHandlerController) {
						const joyring = touchedInstance;
						// We removed this finger from the tracker earlier, so if this was the last finger on the joyring then release it
						if (!touchedInstanceTracker.trackedTouches.length) {
							joyring.controller.release();
						}
					}
					/**
					 * @todo Test this
					 */
					// If there are no more fingers touching this instance then we remove this instance from being considered to be touched.
					if (!touchedInstanceTracker.trackedTouches.length) {
						// Remove this instance from being tracked as touched
						this.touchedInstances.splice(j, 1);
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
		if (typeof(VYLO.Client.onTouchAbort) === 'function') {
			VYLO.Client.onTouchAbort();
		}
		// Remove all touchedInstances since this was a touchCancel event, you must of hit some UI, meaning all fingers should be considered null and void
		for (let j = this.touchedInstances.length - 1; j >= 0; j--) {
			const instance = this.touchedInstances[j];
			// Get a reference to the tracker object associated with this instance that was touched
			const touchedInstanceTracker = this.getTrackerObject(instance);
			touchedInstanceTracker.trackedTouches = [];
			this.touchedInstances.splice(j, 1);
		}
	}
	/**
	 * The event function called when a touch is moved.
	 * @private
	 * @param {Object} pEvent - Represents an event which takes place in the DOM.
	 */
	handleMove(pEvent) {
		const touches = pEvent.changedTouches;
		const bodyRect = document.getElementById('game_body').getBoundingClientRect();
		const xBodyPos = bodyRect.x;
		const yBodyPos = bodyRect.y;

		for (let i = 0; i < touches.length; i++) {
			const touchX = touches[i].clientX;
			const touchY = touches[i].clientY;
			const x = Math.floor((touchX - xBodyPos)) / mainM.scaleWidth; // find a better way to calcuate this value instead of relying on the engine's variable
			const y = Math.floor((touchY - yBodyPos)) / mainM.scaleHeight; // find a better way to calcuate this value instead of relying on the engine's variable
			const touchedInstance = this.getDiobUnderFinger(touchX, touchY);
			const fingerID = touches[i].identifier;
			/**
			 * The relative x position on the sprite
			 * @type {number}
			 */
			let spriteRelativeX;
			/**
			 * The relative y position on the sprite
			 * @type {number}
			 */
			let spriteRelativeY;
			
			// When a finger moves on the screen we need to update the zones for the mobile controllers
			this.handleZoneMove(x, y, fingerID);

			/**
			 * VYLO.Client event for onTouchMoveUpdate.
			 * 
			 * VYLO.Client.onTouchMoveUpdate is an event function that fires when a finger is moved on the screen on the global level.
			 * @param {Object} pInstance - The instance that was touched when the finger moved on the screen.
			 * @param {number} pX - The x position on the screen that was touched.
			 * @param {number} pY - The y position on the screen that was touched.
			 * @param {number} pFingerID - The ID of the finger that registered this touch.
			 */
			if (typeof(VYLO.Client.onTouchMoveUpdate) === 'function') {
				VYLO.Client.onTouchMoveUpdate(touchedInstance, Utils.clamp(touchX, 0, this.windowSize.width), Utils.clamp(touchY, 0, this.windowSize.height), fingerID);
			}

			if (touchedInstance) {
				// If we are not tracking this instance then we track it
				if (!this.isTracking(touchedInstance)) {
					this.track(touchedInstance);
				}
				// Get a reference to the tracker object associated with this instance that was touched
				const touchedInstanceTracker = this.getTrackerObject(touchedInstance);
				/**
				 * touchedInstance event for onTouchMoveUpdate.
				 * 
				 * touchedInstance.onTouchMoveUpdate is an event function that fires when a finger is moved on the screen.
				 * @param {Object} pClient - The client of the game.
				 * @param {number} pX - The x position on the screen that was touched.
				 * @param {number} pY - The y position on the screen that was touched.
				 * @param {number} pFingerID - The ID of the finger that registered this touch.
				 */
				if (typeof(touchedInstance.onTouchMoveUpdate) === 'function') {
					// If the element is an interface we need to use screen coords
					if (touchedInstance.baseType === 'Interface') {
						spriteRelativeX = Utils.clamp(touchX - touchedInstance.x, 0, touchedInstance.width);
						spriteRelativeY = Utils.clamp(touchY - touchedInstance.y, 0, touchedInstance.height);
					// Otherwise it is a map element and we need to use map coordinates
					} else {
						VYLO.Client.getPosFromScreen(touchX, touchY, this.mapPositionObject);
						spriteRelativeX = Utils.clamp(this.mapPositionObject.x - touchedInstance.x, 0, touchedInstance.width);
						spriteRelativeY = Utils.clamp(this.mapPositionObject.y - touchedInstance.y, 0, touchedInstance.height);
					}
					if (touchedInstance.touchOpacity === MobileHandlerSingleton.MULTI_TOUCH) {
						touchedInstance.onTouchMoveUpdate(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
					} else if (touchedInstanceTracker.trackedTouches.includes(fingerID)) {
						touchedInstance.onTouchMoveUpdate(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
					}
				}
			}
			
			for (const instance of this.touchedInstances) {
				// If we are not tracking this instance then we track it
				if (!this.isTracking(instance)) {
					this.track(instance);
				}
				// Get a reference to the tracker object associated with this instance that was touched
				const touchedInstanceTracker = this.getTrackerObject(instance);
				if (touchedInstanceTracker.trackedTouches.includes(fingerID)) {
					if (instance !== touchedInstance) {
						if (!touchedInstanceTracker.slidOff) {
							/**
							 * touchedInstance event for onTouchSlideEnd.
							 * 
							 * touchedInstance.onTouchSlideEnd is an event function that fires when a finger slides off of this instance but not the screen. Useful for things like holding down a button and capturing the event when the finger leaves the button but not the screen
							 * @param {Object} pClient - The client of the game.
							 * @param {number} pX - The x position on the screen that was touched.
							 * @param {number} pY - The y position on the screen that was touched.
							 * @param {number} pFingerID - The ID of the finger that registered this touch.
							 */
							if (typeof(instance.onTouchSlideEnd) === 'function') {
								touchedInstanceTracker.slidOff = true;
								if (instance.baseType === 'Interface') {
									spriteRelativeX = Utils.clamp(touchX - instance.x, 0, instance.width);
									spriteRelativeY = Utils.clamp(touchY - instance.y, 0, instance.height);
								} else {
									VYLO.Client.getPosFromScreen(touchX, touchY, this.mapPositionObject);
									spriteRelativeX = Utils.clamp(this.mapPositionObject.x - instance.x, 0, instance.width);
									spriteRelativeY = Utils.clamp(this.mapPositionObject.y - instance.y, 0, instance.height);
								}
								instance.onTouchSlideEnd(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
							}
						}
					}
					if (instance.isMobileHandlerController) {
						const joyring = instance;
						joyring.controller.update(x, y);
					}
				}
			}
		}
	}
}

export const MobileHandler = new MobileHandlerSingleton();