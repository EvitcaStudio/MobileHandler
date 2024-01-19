import { Tween } from './vendor/tween.min.mjs';
import { Utils } from './vendor/utils.min.mjs';
import { MobileHandler } from './mobile-handler.mjs'

/**
 * When using a controller that is of the traversal type, or the static type
 * a zone is REQUIRED. Only two controllers of traversal or static or one of each can be used at a time. 
 * These controllers have to have opposing zones. Left | Right
 * Traversal: spawns at the touch position and when dragged, follows the finger across the screen
 * Static: spawns at the touch position, cannot move from that location, just updates the joystick and will clamp at its limit
 * Stationary: cannot move from it's position at all, will just update the joystick and clamp it at its limit, can be pressed from anywhere on screen.
 */
export class Controller {
    /**
     * A reference to the tween instance this controller uses to tween the alpha when it becomes inactive.
     * This reference is so that developers can pause this tween and resume it when needed.
     * Calling this.tween.pause() and this.tween.resume() for instance when pausing and unpausing the game.
     */
    tween = null;
    /**
     * Builds this controller with the options that were passed in.
     * @param {Object} pOptions - The options of this controller.
     * @param {string} pOptions.type - The way this controller will behave. stationary | traversal | static.
     * @param {number} pOptions.size - The width/height of the joystick. The width & height of the joystick should be the same.
     * @param {Object} pOptions.position - The initial position of the joystick.
     * @param {string} pOptions.position.x - The initial x position of the joystick.
     * @param {string} pOptions.position.x - The initial y position of the joystick.
     * @param {string} pOptions.lockedDimension - The locked dimension of the joystick. both | vertical | horizontal. This is used to lock the joystick from moving in certain dimensions. If this joystick's type is traversal it cannot be locked.
     * @param {string} pOptions.zone - The zone the joystick will occupy. If there is already a controller of the traversal or static type, then you must use a zone. If there is only one controller no zone is needed. left | right This will give each controller equal space on the left / right sides of the screen.
     * @param {number} pOptions.inactiveAlpha - The alpha value the joystick will be when it is considered to be inactive.
     * @param {number} pOptions.transitionTime - How long it takes in ms to transition to the inactiveAlpha value.
     * @param {number} pOptions.scale - The scale you want the joystick controller to be.
     * @param {number} pOptions.plane - The plane of the joystick controller.
     * @param {number} pOptions.layer - The layer of the joystick controller.
     * @param {string} pOptions.atlasName - The atlasName of the joystick.
     * @param {string} pOptions.joystickIconName - The iconName of the joystick.
     * @param {string} pOptions.joyringIconName - The iconName of the joyring.
     * @param {Object} pOptions.callback - An object holding options callbacks to attach to events the joystick emits. 
     * pOptions.callback.onTapStart - Callback to be called when the joystick is touched after being released.
     * pOptions.callback.onRelease - Callback to be called when the joystick is released and no longer held.
     * pOptions.callback.onMove - Callback to be called when the joystick is moved.
     * @param {Object} pOptions.callback.onMove - Callback to be called when the joystick is moved.
     * @param {Function} pOptions.callback.onTapStart - Callback to be called when the joystick is touched after being released.
     * @param {Function} pOptions.callback.onRelease - Callback to be called when the joystick is released and no longer held.
     * @param {Function} pOptions.callback.onMove - Callback to be called when the joystick is moved.
     */
	constructor(pOptions) {
		this.joyring = null;
		this.joystick = null;
		this.options = null;
		this.lockedDimension = null;
        this.tween = new Tween();
		this.build(pOptions);
	}
    /**
     * @private
     * Setup the controller with the options that this controller class instance has from being initiated
     */
	setup() {
        // Setup the joyring element
		this.joyring.atlasName = this.options.atlasName;
		this.joyring.iconName = this.options.joyringIconName;
		this.joyring.touchOpacity = MobileHandler.constructor.MULTI_TOUCH;
		this.joyring.interfaceType = 'default';
		this.joyring.color = { 'tint': 0xFFFFFF };
		this.joyring.scale = 1;
		this.joyring.anchor = { 'x': 0.5, 'y': 0.5 };
		this.joyring.plane = this.options.plane;
		this.joyring.layer = this.options.layer;
		this.joyring.width = this.options.size;
		this.joyring.height = this.options.size;
		this.joyring.halfSize = this.joyring.width / 2;
		this.joyring.child = this.joystick;
		this.joyring.isMobileHandlerController = true;
		this.joyring.originalPos = { 'x': this.options.position.x, 'y': this.options.position.y };
		this.joyring.onNew = () => {};
        // Setup the joystick element
		this.joystick.atlasName = this.options.atlasName;
		this.joystick.iconName = this.options.joystickIconName;
		this.joystick.touchOpacity = MobileHandler.constructor.NO_TOUCH;
		this.joystick.interfaceType = 'default';
		this.joystick.color = { 'tint': 0xFFFFFF };
		this.joystick.scale = 1;
		this.joystick.anchor = { 'x': 0.5, 'y': 0.5 };
		this.joystick.startPos = { 'x': 0, 'y': 0 };
		this.joystick.width = this.options.size / 2;
		this.joystick.height = this.options.size / 2;
		this.joystick.plane = this.options.plane;
        // The inner ring must be layered above the outer ring
		this.joystick.layer = this.options.layer + 1;
		this.joystick.anglePoint = 0;
		this.joystick.direction = 'none';
		this.joystick.halfSize = this.joystick.width / 2;
		this.joystick.parent = this.joyring;
		this.joystick.originalPos = { 'x': this.joyring.originalPos.x + this.joystick.halfSize, 'y': this.joyring.originalPos.y + this.joystick.halfSize };
		this.joystick.onNew = () => {};
        // Keep references to this joystick
		this.joyring.controller = this;
		this.joystick.controller = this;
        // Assign event funcs
		this.onTapStart = this.options.callback.onTapStart;
		this.onRelease = this.options.callback.onRelease;
		this.onMove = this.options.callback.onMove;
        // Assign locked status
		this.lockedDimension = this.options.lockedDimension;
		this.lock(this.lockedDimension);
        // Create the joystick and joyring elements
		VYLO.Client.addInterfaceElement(this.joyring, 'mobile-handler-interface', this.joyring.id);
		VYLO.Client.addInterfaceElement(this.joystick, 'mobile-handler-interface', this.joystick.id);
        // Track this controller
		MobileHandler.activeControllers.push(this);
		if (!MobileHandler.eventsAttached) {
			const interfaceCanvas = VYLO.Client.getInterfaceCanvas('mobile-handler-interface', this.joyring.id);
			// Set the pointer events to be allowed.
			interfaceCanvas.style.pointerEvents = 'auto';
			interfaceCanvas.style.touchAction = 'auto';
			// Put events on the canvas rather than the document
			interfaceCanvas.addEventListener('touchstart', MobileHandler.handleStart.bind(MobileHandler), { 'passive': false });
			interfaceCanvas.addEventListener('touchend', MobileHandler.handleEnd.bind(MobileHandler), { 'passive': false });
			interfaceCanvas.addEventListener('touchcancel', MobileHandler.handleCancel.bind(MobileHandler), { 'passive': false });
			interfaceCanvas.addEventListener('touchmove', MobileHandler.handleMove.bind(MobileHandler), { 'passive': false });
		
			// Prevent zooming and mobile gestures
			interfaceCanvas.addEventListener('gesturestart', function(pEvent) {pEvent.preventDefault()}, { 'passive': false });
			interfaceCanvas.addEventListener('gesturechange', function(pEvent) {pEvent.preventDefault()}, { 'passive': false });
			/**
			 * Whether events have been attached to the canvas. Only needs to be done once so this is a boolean checking if it has been done before.
			 * @type {boolean}
			 * @private
			 */
			MobileHandler.eventsAttached = true;
		}
		this.show();
	}
    /**
     * Tweens the controller to it's inactive alpha preset, or from it's inactive value preset to full alpha.
     * @private
     * @param {boolean} pFade - Whether to fade the joystick to it's inactive alpha preset
     */
	handleTransition(pFade) {
        let start = { 'alpha': this.joyring.alpha };
        let end;
        const duration = this.options.transitionTime;
        const easing = Tween.easeInOutQuad;
        
		if (this.options.inactiveAlpha || this.options.inactiveAlpha === 0) {
            // Stop any ongoing tween animation
            this.tween.stop();
			if (pFade) {
                end = { 'alpha': this.options.inactiveAlpha };
			} else {
                end = { 'alpha': 1 };				
			}
            // Makes no sense to tween a animation if the start and end value is the same
            if (start.alpha === end.alpha) return;
            // Animate the transition
            this.tween.build({
                start,
                end,
                duration,
                easing
            }).animate(({ alpha }) => {
                this.joyring.alpha = alpha;
                this.joystick.alpha = alpha;
            });
		}
	}
    /**
     * Resets the joystick to default.
     * @private
     * @param {*} pSoft - Softly resets the joystick in the event it is hidden
     */
	reset(pSoft) {
		const angle = this.joystick.anglePoint;
		const direction = this.joystick.direction;
		this.joystick.alpha = this.options.inactiveAlpha;
		this.joystick.startPos.x = this.joystick.startPos.y = 0;
		this.joystick.direction = 'none';
		this.joystick.anglePoint = 0;
		this.joyring.trackedTouches = [];
		this.joyring.layer = this.options.layer;
		this.joystick.layer = this.options.layer + 10;
		this.activeInZone = false;
		this.controllingFinger = null;

		if (this.active) {
			this.active = false;
			if (typeof(this.onRelease) === 'function') {
				this.onRelease(VYLO.Client, angle, direction);
			}
		}
		if (!pSoft) {
			this.onRelease = null;
			this.onMove = null;
			this.onTapStart = null;
			if (this.zone) {
				if (MobileHandler.reservedScreenZones.includes(this.zone)) {
					MobileHandler.reservedScreenZones.splice(MobileHandler.reservedScreenZones.indexOf(this.zone), 1);
				}
				if (this.zone === 'left' || this.zone === 'right') {
					MobileHandler.zonedControllers[this.zone] = null;
				}
			}
			this.zone = null;
			this.type = 'stationary';
			this.lockedDimension = null;
			this.options = {};
			if (MobileHandler.touchedDiobs.includes(this.joyring)) {
				MobileHandler.touchedDiobs.splice(MobileHandler.touchedDiobs.indexOf(this.joyring), 1);
			}
		}
	}
    /**
     * Builds this controller with the options that were passed in.
     * @param {Object} pOptions - The options of this controller.
     * @param {string} pOptions.type - The way this controller will behave. stationary | traversal | static.
     * @param {number} pOptions.size - The width/height of the joystick. The width & height of the joystick should be the same.
     * @param {Object} pOptions.position - The initial position of the joystick.
     * @param {string} pOptions.position.x - The initial x position of the joystick.
     * @param {string} pOptions.position.x - The initial y position of the joystick.
     * @param {string} pOptions.lockedDimension - The locked dimension of the joystick. both | vertical | horizontal. This is used to lock the joystick from moving in certain dimensions. If this joystick's type is traversal it cannot be locked.
     * @param {string} pOptions.zone - The zone the joystick will occupy. If there is already a controller of the traversal or static type, then you must use a zone. If there is only one controller no zone is needed. left | right This will give each controller equal space on the left / right sides of the screen.
     * @param {number} pOptions.inactiveAlpha - The alpha value the joystick will be when it is considered to be inactive.
     * @param {number} pOptions.transitionTime - How long it takes in ms to transition to the inactiveAlpha value.
     * @param {number} pOptions.scale - The scale you want the joystick controller to be.
     * @param {number} pOptions.plane - The plane of the joystick controller.
     * @param {number} pOptions.layer - The layer of the joystick controller.
     * @param {string} pOptions.atlasName - The atlasName of the joystick.
     * @param {string} pOptions.joystickIconName - The iconName of the joystick.
     * @param {string} pOptions.joyringIconName - The iconName of the joyring.
     * @param {Object} pOptions.callback - An object holding options callbacks to attach to events the joystick emits. 
     * pOptions.callback.onTapStart - Callback to be called when the joystick is touched after being released.
     * pOptions.callback.onRelease - Callback to be called when the joystick is released and no longer held.
     * pOptions.callback.onMove - Callback to be called when the joystick is moved.
     * @param {Object} pOptions.callback.onMove - Callback to be called when the joystick is moved.
     * @param {Function} pOptions.callback.onTapStart - Callback to be called when the joystick is touched after being released.
     * @param {Function} pOptions.callback.onRelease - Callback to be called when the joystick is released and no longer held.
     * @param {Function} pOptions.callback.onMove - Callback to be called when the joystick is moved.
     */
	build(pOptions = { 'type': 'stationary', 'size': 100, 'position': { 'x': 100, 'y': 100 }, 'lockedDimension': null, 'zone': null, 'inactiveAlpha': 0.5, 'transitionTime': 500, 'scale': 1, 'plane': 1, 'layer': 1, 'atlasName': '', 'joystickIconName': '', 'joyringIconName': '', 'callback': { 'onTapStart': null, 'onRelease': null, 'onMove': null } }) {
		if (!this.joyring && !this.joystick) {
			const joyring = VYLO.newDiob('Interface');
			const joystick = VYLO.newDiob('Interface');
			this.joyring = joyring;
			this.joystick = joystick;
		}
		// pOptions.size is the size of the joyring, the inner ring will be 50% of this size.
		// pOptions.position is the position for the joyring, the inner ring will be positioned inside.
		if (!Number.isInteger(pOptions.size)) {
			pOptions.size = 100;
			// warning
		}

		// the type of the controller
		if (typeof(pOptions.type) === 'string') {
			if (pOptions.type !== 'traversal' && pOptions.type !== 'static' && pOptions.type !== 'stationary') {
				pOptions.type = 'stationary';
			}
		} else {
			pOptions.type = 'stationary';
			// warning
		}
		
		if (pOptions.type === 'traversal' || pOptions.type === 'static') {
			// if there is already a controller taking up a space, then you must use a zone. If there is no controller, then the entire screen is the zone
			// do not define a zone if you know this controller will be the only controller on screen
			if (MobileHandler.reservedScreenZones.length) {
				if (!pOptions.zone || typeof(pOptions.zone) !== 'string' || MobileHandler.reservedScreenZones.includes(pOptions.zone)) {
					// Warning
					MobileHandler.logger.prefix('MobileHandler-Module').error('When using a controller that is of the traversal type, or the static type. A zone is REQUIRED. Only two controllers of traversal or static or one of each can be used at a time. These controllers have to have opposing zones. Left | Right')
					return;
				}
			}
			if (pOptions.zone === 'left' || pOptions.zone === 'right') {
				MobileHandler.reservedScreenZones.push(pOptions.zone);
				MobileHandler.zonedControllers[pOptions.zone] = this;
				this.zone = pOptions.zone;
			}
		}

		if (typeof(pOptions.atlasName) !== 'string') {
			pOptions.atlasName = '';
			// warning
		}

		// if the type is traversal it cannot be locked
		if (typeof(pOptions.lockedDimension) !== 'string' || pOptions.type === 'traversal' || (pOptions.lockedDimension !== 'both' && pOptions.lockedDimension !== 'vertical' && pOptions.lockedDimension !== 'horizontal')) {
			pOptions.lockedDimension = null;
			// warning
		}

		if (typeof(pOptions.joystickIconName) !== 'string') {
			pOptions.joystickIconName = '';
			// warning
		}

		if (typeof(pOptions.joyringIconName) !== 'string') {
			pOptions.joyringIconName = '';
			// warning
		}

		// the plane this controller will use
		if (typeof(pOptions.transitionTime) !== 'number') {
			pOptions.transitionTime = 500;
		}

		if (typeof(pOptions.inactiveAlpha) !== 'number') {
			pOptions.inactiveAlpha = 0.5;
		}

		// Feature coming soon
		if (!Number.isInteger(pOptions.scale)) {
			pOptions.scale = 1;
			// warning
		}

		if (typeof(pOptions.plane) !== 'number') {
			pOptions.plane = 1;
		}

		if (typeof(pOptions.layer) !== 'number') {
			pOptions.layer = 1;
		}

		if (pOptions.position.constructor === Object) {
			if (!Number.isInteger(pOptions.position.x)) {
				pOptions.position.x = 100;
				// warning
			}
			if (!Number.isInteger(pOptions.position.y)) {
				pOptions.position.y = 100;
				// warning
			}
		} else {
			pOptions.position = { 'x': 100, 'y': 100 };
			// warning
		}
		this.options = pOptions;
		this.setup();
	}

	get type() {
		return this.options.type;
	}

	set type(pNewType) {
		if (pNewType === 'stationary') {
			this.options.type = pNewType;
		}
	}
    /**
     * Updates the controllers position with the latest information from touch events
     * @private
	 * @param {number} pX - The x position on the screen where the user tapped.
	 * @param {number} pY - The y position on the screen where the user tapped.
     * @param {boolean} pTouchStart - If this was the first time the joystick was touched.
     * @returns 
     */
	update(pX, pY, pTouchStart) {
		if (this.lockedDimension === 'both') return;
		if (pTouchStart) {
			this.handleTransition();
			if (this.active) {
				this.joyring.trackedTouches = [];
			}
			this.joyring.layer = MobileHandler.constructor.MAX_LAYER;
			this.joystick.layer = MobileHandler.constructor.MAX_LAYER + 10;
			this.active = true;
		}
		if (this.active) {
			// traversal: spawns at the touch position and when dragged, follows the finger across the screen
			// static: spawns at the touch position, cannot move from that location, just updates the joystick and will clamp at its limit
			// stationary: cannot move from it's position at all, will just update the joystick and clamp it at its limit, can be pressed from anywhere on screen.

			const touchPos = { 'x': pX - this.joystick.halfSize, 'y': pY - this.joystick.halfSize };
			// start position is always the center of the joyring
			let startPos;
			// distance is how far away the joystick is from the start position
			let distance;
			// angle is the angle in degrees from the start position to the touched position
			let angle;
			// clampedDistance is the max distance allowed for the joystick to move
			let clampedDistance;
			// clampedPos is the position that was clamped when the joystick tried to go past it's clampedDistance
			let clampedPos;

			if (this.options.type === 'stationary') {
				// this joystick is stationary therefore the start position is it's default position
				startPos = this.joystick.originalPos;
				// if a certain axis is locked, clamp that position to it's start position
				if (this.lockedDimension === 'horizontal') {
					touchPos.y = startPos.y;
				} else if (this.lockedDimension === 'vertical') {
					touchPos.x = startPos.x;
				}
				distance = Utils.getDistance(startPos, touchPos);
				angle = Utils.getAngle(startPos, touchPos);
				clampedDistance = Math.min(distance, this.joyring.halfSize);
				clampedPos = Utils.calculateNewPositionFromDistanceAndAngle(startPos, clampedDistance, angle);
				// set the position to the clamped position so that it is locked to it's clampedPos
				this.joystick.setPos(clampedPos.x, clampedPos.y);
			} else if (this.options.type === 'traversal' || this.options.type === 'static') {
				// Position the joystick centered to the position of where the screen was touched if this is the first time touching the joystick
				if (pTouchStart) {
					this.joystick.startPos = touchPos;
					this.joyring.setPos(touchPos.x - this.joystick.halfSize, touchPos.y - this.joystick.halfSize);
					this.joystick.setPos(touchPos.x, touchPos.y);
					return;
				}

				if (this.options.type === 'traversal') {
					// the start position for traversal is wherever you pressed on the screen originally
					// the start position was set in the `pTouchStart` portion
					distance = Utils.getDistance(this.joystick.startPos, touchPos);
					angle = Utils.getAngle(this.joystick.startPos, touchPos);
					clampedDistance = Math.min(distance, this.joyring.halfSize);
					clampedPos = Utils.calculateNewPositionFromDistanceAndAngle(this.joystick.startPos, clampedDistance, angle);
					// set the position to the position touched
					this.joystick.setPos(touchPos.x, touchPos.y);
					// update the parent to follow the child after it is placed
					const parentAngle = Utils.getAngle(touchPos, this.joystick.startPos);
					const parentClampedPos = Utils.calculateNewPositionFromDistanceAndAngle(touchPos, clampedDistance, parentAngle);
					this.joyring.setPos(parentClampedPos.x - this.joystick.halfSize, parentClampedPos.y - this.joystick.halfSize);

					// if the distance is greater that the clamped position then we need to update the start position of the joystick
					if (distance > clampedDistance) {
						this.joystick.startPos.x = this.joyring.xPos + this.joystick.halfSize;
						this.joystick.startPos.y = this.joyring.yPos + this.joystick.halfSize;
					}
				} else if (this.options.type === 'static') {
					// the start position for static is wherever you pressed on the screen originally
					// the start position set in the `pTouchStart` portion
				// if a certain axis is locked, clamp that position to it's start position
					if (this.lockedDimension === 'horizontal') {
						touchPos.y = this.joystick.startPos.y;
					} else if (this.lockedDimension === 'vertical') {
						touchPos.x = this.joystick.startPos.x;
					}
					distance = Utils.getDistance(this.joystick.startPos, touchPos);
					angle = Utils.getAngle(this.joystick.startPos, touchPos);
					clampedDistance = Math.min(distance, this.joyring.halfSize);
					clampedPos = Utils.calculateNewPositionFromDistanceAndAngle(this.joystick.startPos, clampedDistance, angle);
					// set the position to the clamped position so that it is locked
					this.joystick.setPos(clampedPos.x, clampedPos.y);
				}
			}

			// set the angle point for reading (-1 is to convert it for use in an environment where up is down, and down is up)
			this.joystick.anglePoint = Utils.convertRaWAngleToVyloCoords(angle);
			// set the direction for reading
			this.joystick.direction = Math.round(Math.abs(clampedDistance)) < (this.joyring.halfSize / 8) ? 'none' : Utils.getDirection(this.joystick.anglePoint);

			if (this.onMove && typeof(this.onMove) === 'function') {
				this.onMove(VYLO.Client, this.joystick.anglePoint, this.joystick.direction);
			}
		}
	}
    /**
     * API called when this joystick is released
     * @private
     */
	release() {
		if (this.lockedDimension === 'both') return;
		this.reset(true);
        // Reset the position to the default position
		this.joyring.setPos(this.joyring.originalPos.x, this.joyring.originalPos.y);
		this.joystick.setPos(this.joystick.originalPos.x, this.joystick.originalPos.y);
		this.handleTransition(true);
	}
    /**
     * Locks a joystick from moving in a certain dimension or both
     * @param {string} pDimension - The dimension to lock. both | vertical | horizontal
     */
	lock(pDimension) {
        if (pDimension) {
            pDimension = pDimension.toLowerCase();
        }
		if (typeof(pDimension) === 'string') {
			if (pDimension === 'horizontal') {
				this.lockedDimension = 'horizontal';
			} else if (pDimension === 'vertical') {
				this.lockedDimension = 'vertical';
			} else {
				this.lockedDimension = 'both';
			}
		}
	}
    /**
     * Unlocks the joystick from being locked in the passed dimension.
     * @param {string} pDimension - The dimension to unlock. both | vertical | horizontal
     */
	unlock(pDimension) {
        if (pDimension) {
            pDimension = pDimension.toLowerCase();
        }
		if (typeof(pDimension) === 'string') {
			if (pDimension === 'horizontal') {
				if (this.lockedDimension === 'both') {
					this.lockedDimension = 'vertical';
				} else {
					this.lockedDimension = null;
				}
			} else if (pDimension === 'vertical') {
				if (this.lockedDimension === 'both') {
					this.lockedDimension = 'horizontal';
				} else {
					this.lockedDimension = null;
				}
			} else {
				this.lockedDimension = null;
			}
		}
	}
    /**
     * Returns the components that make up this controller. Which are the joystick element, and the joyring element.
     * @returns {Object} - An object containing references to the joytick and the joyring that makeup this controller.
     */
	getComponents() {
		return { 'joystick': this.joystick, 'joyring': this.joyring };
	}
    /**
     * Hides this controller
     */
	hide() {
		this.joyring.hide();
		this.joystick.hide();
		this.reset(true);
	}
    /**
     * Shows this controllers
     */
	show() {
		this.joyring.setPos(this.joyring.originalPos.x, this.joyring.originalPos.y);
		this.joystick.setPos(this.joystick.originalPos.x, this.joystick.originalPos.y);
		this.joyring.show();
		this.joystick.show();
		this.handleTransition(true);
	}
}