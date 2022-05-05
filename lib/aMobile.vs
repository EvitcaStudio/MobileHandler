#BEGIN CLIENTCODE
#BEGIN JAVASCRIPT

(() => {
	const engineWaitId = setInterval(() => {
		if (VS.Client) {
			clearInterval(engineWaitId);
			buildMobile();
		}
	});

	const buildMobile = () => {
		const aMobile = {};
		// an array of all controllers that have been recycled
		aMobile.recycledControllers = [];
		// an array of all controllers that are active
		aMobile.activeControllers = [];
		// an object holding the controllers in zones
		aMobile.zonedControllers = {};
		// an array that holds all the diobs that are currently being touched
		aMobile.touchedDiobs = [];
		// an object that stores the mapPosition over the screen
		aMobile.mapPositionObject = { 'x': 0, 'y': 0 };
		// an array that holds the current zones taken, 'left' or 'right'.
		aMobile.zonesTaken = [];
		// an object containing the screen size of the game.
		aMobile.middlePosition = VS.World.getGameSize().width / 2;
		// an object holding the current game size
		aMobile.windowSize = VS.World.getGameSize();

		VS.World.global.aMobile = aMobile;
		VS.Client.aMobile = aMobile;

		VS.Client.createInterface('aMobile_joystick_interface');
		VS.Client.showInterface('aMobile_joystick_interface');

		aMobile.isMobile = false;
		if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) {
			aMobile.isMobile = true;
		}

		VS.Client.isMobile = aMobile.isMobile;
		VS.Client.___EVITCA_aMobile = true;

		aMobile.getDevice = function() {
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

		// https://github.com/apache/cordova-plugin-vibration#readme
		// https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
		aMobile.vibrate = function(pDuration) {
			if (typeof(pDuration) === 'undefined') {
				pDuration = 500;
			}
			if (typeof(navigator) !== 'undefined') {
				if (navigator.vibrate) {
					navigator.vibrate(pDuration);
				}
			}
		}

		if (!VS.Client._aMobileOnWindowResizeSet) {
			VS.Client._aMobileOnWindowResize = VS.Client.onWindowResize;
			VS.Client._aMobileOnWindowResizeSet = true;
			VS.Client.onWindowResize = function(pWidth, pHeight) {
				aMobile.middlePosition = pWidth / 2;
				aMobile.windowSize.width = pWidth;
				aMobile.windowSize.height = pHeight;
				for (const controller of aMobile.activeControllers) {
					const components = controller.getComponents();
					if (components.joyring.edgeLock) {
						components.joyring.originalPos = { 'x': components.joyring.xPos, 'y': components.joyring.yPos };
					}
					if (components.joystick.edgeLock) {
						components.joystick.originalPos = { 'x': components.joystick.xPos, 'y': components.joystick.yPos };
					}
				}
				if (this._aMobileOnWindowResize) {
					this._aMobileOnWindowResize.apply(this, arguments);
				}
			}
		}

		const MULTI_TOUCH = 2;
		const NO_TOUCH = 0;
		const MAX_RECYCLED_CONTROLLERS = 10;
		const MAX_LAYER = 1999998;

		const clamp = (pVal, pMin, pMax) => {
			return Math.max(pMin, Math.min(pVal, pMax));
		}
		
		const toDegrees = (pAngle) => {
			return pAngle * (180 / Math.PI);
		}

		const toRadians = (pAngle) => {
			return pAngle * (Math.PI / 180);
		}

		const getDirection = (pAngle) => {
			const degree = Math.floor((pAngle / 45) + 0.5);
			const compassDirections = ['east', 'northeast', 'north', 'northwest', 'west', 'southwest', 'south', 'southeast']; //['west', 'northwest', 'north', 'northeast', 'east', 'southeast', 'south', 'southwest']
			return compassDirections[(degree % 8)];
		}

		const getAngle = (pStartPoint, pEndPoint) => {
			const y = (pEndPoint.y - pStartPoint.y) * -1;
			const x = (pEndPoint.x - pStartPoint.x) * -1;
			return toDegrees(Math.atan2(y, x));
		}

		const getDistance = (pStartPoint, pEndPoint) => {
			const y = (pEndPoint.y - pStartPoint.y) * -1;
			const x = (pEndPoint.x - pStartPoint.x) * -1;
			return Math.sqrt((x * x) + (y * y));
		}

		const findPos = (pPoint, pDistance, pAngle) => {
			const clampedPos = { 'x': 0, 'y': 0 };
			pAngle = toRadians(pAngle);
			clampedPos.x = pPoint.x - pDistance * Math.cos(pAngle);
			clampedPos.y = pPoint.y - pDistance * Math.sin(pAngle);
			return clampedPos;
		};

		class Controller {
			#joyring;
			#joystick;
			#options;
			#lockedStatus;

			#setup() {
				this.#joyring.atlasName = this.#options.atlasName;
				this.#joyring.iconName = this.#options.joyringIconName;
				this.#joyring.touchOpacity = MULTI_TOUCH;
				this.#joyring.interfaceType = 'default';
				this.#joyring.color = { 'tint': 0xFFFFFF };
				this.#joyring.scale = 1;
				this.#joyring.anchor = { 'x': 0.5, 'y': 0.5 };
				this.#joyring.plane = this.#options.plane;
				this.#joyring.layer = this.#options.layer;
				this.#joyring.width = this.#options.size;
				this.#joyring.height = this.#options.size;
				this.#joyring.halfSize = this.#joyring.width / 2;
				this.#joyring.child = this.#joystick;
				this.#joyring.aMobileController = true;
				this.#joyring.originalPos = { 'x': this.#options.position.x, 'y': this.#options.position.y };
				this.#joyring.onNew = () => {};

				this.#joystick.atlasName = this.#options.atlasName;
				this.#joystick.iconName = this.#options.joystickIconName;
				this.#joystick.touchOpacity = NO_TOUCH;
				this.#joystick.interfaceType = 'default';
				this.#joystick.color = { 'tint': 0xFFFFFF };
				this.#joystick.scale = 1;
				this.#joystick.anchor = { 'x': 0.5, 'y': 0.5 };
				this.#joystick.startPos = { 'x': 0, 'y': 0 };
				this.#joystick.width = this.#options.size / 2;
				this.#joystick.height = this.#options.size / 2;
				this.#joystick.plane = this.#options.plane;
				this.#joystick.layer = this.#options.layer + 1; // the inner ring must be layered above the outer ring
				this.#joystick.anglePoint = 0;
				this.#joystick.direction = 'none';
				this.#joystick.halfSize = this.#joystick.width / 2;
				this.#joystick.parent = this.#joyring;
				this.#joystick.originalPos = { 'x': this.#joyring.originalPos.x + this.#joystick.halfSize, 'y': this.#joyring.originalPos.y + this.#joystick.halfSize };
				this.#joystick.onNew = () => {};

				this.#joyring.controller = this;
				this.#joystick.controller = this;

				this.onTapStart = this.#options.callback.onTapStart;
				this.onRelease = this.#options.callback.onRelease;
				this.onMove = this.#options.callback.onMove;
				this.#lockedStatus = this.#options.lockedStatus;
				this.lock(this.#lockedStatus);
				VS.Client.addInterfaceElement(this.#joyring, 'aMobile_joystick_interface', this.#joyring.id);
				VS.Client.addInterfaceElement(this.#joystick, 'aMobile_joystick_interface', this.#joystick.id);
				aMobile.activeControllers.push(this);
				this.show();
			}

			#handleTransition(pFade) {
				if (this.#options.inactiveAlpha || this.#options.inactiveAlpha === 0) {
					this.#joyring.setTransition();
					this.#joystick.setTransition();
					if (pFade) {
						this.#joyring.setTransition({ 'alpha': this.#options.inactiveAlpha }, -1, this.#options.transitionTime);
						this.#joystick.setTransition({ 'alpha': this.#options.inactiveAlpha }, -1, this.#options.transitionTime);
					} else {
						this.#joyring.setTransition({ 'alpha': 1 }, -1, this.#options.transitionTime);
						this.#joystick.setTransition({ 'alpha': 1 }, -1, this.#options.transitionTime);					
					}
				}
			}

			#reset(pSoft) {
				const angle = this.#joystick.anglePoint;
				const direction = this.#joystick.direction;
				this.#joystick.alpha = this.#options.inactiveAlpha;
				this.#joystick.startPos.x = this.#joystick.startPos.y = 0;
				this.#joystick.direction = 'none';
				this.#joystick.anglePoint = 0;
				this.#joyring.trackedTouches = [];
				this.#joyring.layer = this.#options.layer;
				this.#joystick.layer = this.#options.layer + 10;
				this.activeInZone = false;
				this.controllingFinger = null;

				if (this.active) {
					this.active = false;
					if (this.onRelease && typeof(this.onRelease) === 'function') {
						this.onRelease(VS.Client, angle, direction);
					}
				}
				if (!pSoft) {
					this.onRelease = null;
					this.onMove = null;
					this.onTapStart = null;
					if (this.zone) {
						if (aMobile.zonesTaken.includes(this.zone)) {
							aMobile.zonesTaken.splice(aMobile.zonesTaken.indexOf(this.zone), 1);
						}
						if (this.zone === 'left' || this.zone === 'right') {
							aMobile.zonedControllers[this.zone] = null;
						}
					}
					this.zone = null;
					this.type = 'stationary';
					this.#lockedStatus = null;
					this.options = {};
					if (aMobile.touchedDiobs.includes(this.#joyring)) {
						aMobile.touchedDiobs.splice(aMobile.touchedDiobs.indexOf(this.#joyring), 1);
					}
				}
			}

			build(pOptions = { 'type': 'stationary', 'size': 100, 'position': { 'x': 100, 'y': 100 }, 'lockedStatus': null, 'zone': null, 'inactiveAlpha': 0.5, 'transitionTime': 500, 'scale': 1, 'plane': 1, 'layer': 1, 'atlasName': '', 'joystickIconName': '', 'joyringIconName': '', 'callback': { 'onTapStart': null, 'onRelease': null, 'onMove': null } }) {
				if (!this.#joyring && !this.#joystick) {
					const joyring = VS.newDiob('Interface');
					const joystick = VS.newDiob('Interface');
					this.#joyring = joyring;
					this.#joystick = joystick;
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
					if (aMobile.zonesTaken.length) {
						if (!pOptions.zone || typeof(pOptions.zone) !== 'string' || aMobile.zonesTaken.includes(pOptions.zone)) {
							// warning
							console.error('aMobile: When using a controller that is of the traversal type, or the static type. A zone is REQUIRED. Only two controllers of traversal or static or one of each can be used at a time. These controllers have to have opposing zones. Left | Right')
							return;
						}
					}
					if (pOptions.zone === 'left' || pOptions.zone === 'right') {
						aMobile.zonesTaken.push(pOptions.zone);
						aMobile.zonedControllers[pOptions.zone] = this;
						this.zone = pOptions.zone;
					}
				}

				if (typeof(pOptions.atlasName) !== 'string') {
					pOptions.atlasName = '';
					// warning
				}

				// if the type is traversal it cannot be locked
				if (typeof(pOptions.lockedStatus) !== 'string' || pOptions.type === 'traversal' || (pOptions.lockedStatus !== 'both' && pOptions.lockedStatus !== 'vertical' && pOptions.lockedStatus !== 'horizontal')) {
					pOptions.lockedStatus = null;
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
					if (!Number.isInteger(pOptions.position?.x)) {
						pOptions.position.x = 100;
						// warning
					}
					if (!Number.isInteger(pOptions.position?.y)) {
						pOptions.position.y = 100;
						// warning
					}
				} else {
					pOptions.position = { 'x': 100, 'y': 100 };
					// warning
				}
				this.#options = pOptions;
				this.#setup();
			}

			get type() {
				return this.#options.type;
			}

			set type(pNewType) {
				if (pNewType === 'stationary') {
					this.#options.type = pNewType;
				}
			}

			constructor(pOptions) {
				this.build(pOptions);
			}

			update(pX, pY, pTouchStart) {
				if (this.#lockedStatus === 'both') return;
				if (pTouchStart) {
					this.#handleTransition();
					if (this.active) {
						this.#joyring.trackedTouches = [];
					}
					this.#joyring.layer = MAX_LAYER;
					this.#joystick.layer = MAX_LAYER + 10;
					this.active = true;
				}
				if (this.active) {
					// traversal: spawns at the touch position and when dragged, follows the finger across the screen
					// static: spawns at the touch position, cannot move from that location, just updates the joystick and will clamp at its limit
					// stationary: cannot move from it's position at all, will just update the joystick and clamp it at its limit, can be pressed from anywhere on screen.

					const touchPos = { 'x': pX - this.#joystick.halfSize, 'y': pY - this.#joystick.halfSize };
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

					if (this.#options.type === 'stationary') {
						// this joystick is stationary therefore the start position is it's default position
						startPos = this.#joystick.originalPos;
						// if a certain axis is locked, clamp that position to it's start position
						if (this.#lockedStatus === 'horizontal') {
							touchPos.y = startPos.y;
						} else if (this.#lockedStatus === 'vertical') {
							touchPos.x = startPos.x;
						}
						distance = getDistance(startPos, touchPos);
						angle = getAngle(startPos, touchPos);
						clampedDistance = Math.min(distance, this.#joyring.halfSize);
						clampedPos = findPos(startPos, clampedDistance, angle);
						// set the position to the clamped position so that it is locked to it's clampedPos
						this.#joystick.setPos(clampedPos.x, clampedPos.y);
					} else if (this.#options.type === 'traversal' || this.#options.type === 'static') {
						// Position the joystick centered to the position of where the screen was touched if this is the first time touching the joystick
						if (pTouchStart) {
							this.#joystick.startPos = touchPos;
							this.#joyring.setPos(touchPos.x - this.#joystick.halfSize, touchPos.y - this.#joystick.halfSize);
							this.#joystick.setPos(touchPos.x, touchPos.y);
							return;
						}

						if (this.#options.type === 'traversal') {
							// the start position for traversal is wherever you pressed on the screen originally
							// the start position was set in the `pTouchStart` portion
							distance = getDistance(this.#joystick.startPos, touchPos);
							angle = getAngle(this.#joystick.startPos, touchPos);
							clampedDistance = Math.min(distance, this.#joyring.halfSize);
							clampedPos = findPos(this.#joystick.startPos, clampedDistance, angle);
							// set the position to the position touched
							this.#joystick.setPos(touchPos.x, touchPos.y);
							// update the parent to follow the child after it is placed
							const parentAngle = getAngle(touchPos, this.#joystick.startPos);
							const parentClampedPos = findPos(touchPos, clampedDistance, parentAngle);
							this.#joyring.setPos(parentClampedPos.x - this.#joystick.halfSize, parentClampedPos.y - this.#joystick.halfSize);

							// if the distance is greater that the clamped position then we need to update the start position of the joystick
							if (distance > clampedDistance) {
								this.#joystick.startPos.x = this.#joyring.xPos + this.#joystick.halfSize;
								this.#joystick.startPos.y = this.#joyring.yPos + this.#joystick.halfSize;
							}
						} else if (this.#options.type === 'static') {
							// the start position for static is wherever you pressed on the screen originally
							// the start position set in the `pTouchStart` portion
						// if a certain axis is locked, clamp that position to it's start position
							if (this.#lockedStatus === 'horizontal') {
								touchPos.y = this.#joystick.startPos.y;
							} else if (this.#lockedStatus === 'vertical') {
								touchPos.x = this.#joystick.startPos.x;
							}
							distance = getDistance(this.#joystick.startPos, touchPos);
							angle = getAngle(this.#joystick.startPos, touchPos);
							clampedDistance = Math.min(distance, this.#joyring.halfSize);
							clampedPos = findPos(this.#joystick.startPos, clampedDistance, angle);
							// set the position to the clamped position so that it is locked
							this.#joystick.setPos(clampedPos.x, clampedPos.y);
						}
					}

					// set the angle point for reading (-1 is to convert it for use in an environment where up is down, and down is up)
					this.#joystick.anglePoint = (toRadians(angle) - Math.PI) * -1;
					// set the direction for reading
					this.#joystick.direction = Math.round(Math.abs(clampedDistance)) < (this.#joyring.halfSize / 8) ? 'none' : getDirection(Math.abs(angle - 180));

					if (this.onMove && typeof(this.onMove) === 'function') {
						this.onMove(VS.Client, this.#joystick.anglePoint, this.#joystick.direction);
					}
				}
			}

			release() {
				if (this.#lockedStatus === 'both') return;
				this.#reset(true);
				this.#joyring.setPos(this.#joyring.originalPos.x, this.#joyring.originalPos.y);
				this.#joystick.setPos(this.#joystick.originalPos.x, this.#joystick.originalPos.y);
				this.#handleTransition(true);
			}

			lock(pDimension) {
				if (typeof(pDimension) === 'string') {
					if (pDimension.toLowerCase() === 'horizontal') {
						this.#lockedStatus = 'horizontal';
					} else if (pDimension.toLowerCase() === 'vertical') {
						this.#lockedStatus = 'vertical';
					} else {
						this.#lockedStatus = 'both';
					}
				}
			}

			unlock(pDimension) {
				if (typeof(pDimension) === 'string') {
					if (pDimension.toLowerCase() === 'horizontal') {
						if (this.#lockedStatus === 'both') {
							this.#lockedStatus = 'vertical';
						} else {
							this.#lockedStatus = null;
						}
					} else if (pDimension.toLowerCase() === 'vertical') {
						if (this.#lockedStatus === 'both') {
							this.#lockedStatus = 'horizontal';
						} else {
							this.#lockedStatus = null;
						}
					} else {
						this.#lockedStatus = null;
					}
				}
			}

			destroy() {
				this.#reset();
				if (aMobile.activeControllers.includes(this)) {
					aMobile.activeControllers.splice(aMobile.activeControllers.indexOf(this), 1);
				}
				if (aMobile.recycledControllers.length < MAX_RECYCLED_CONTROLLERS) {
					aMobile.recycledControllers.push(this);
				}
			}

			getComponents() {
				return { 'joystick': this.#joystick, 'joyring': this.#joyring };
			}

			hide() {
				this.#joyring.hide();
				this.#joystick.hide();
				this.#reset(true);
			}

			show() {
				this.#joyring.setPos(this.#joyring.originalPos.x, this.#joyring.originalPos.y);
				this.#joystick.setPos(this.#joystick.originalPos.x, this.#joystick.originalPos.y);
				this.#joyring.show();
				this.#joystick.show();
				this.#handleTransition(true);
			}
		}

		aMobile.createController = (pOptions) => {
			if (aMobile.recycledControllers.length) {
				const controller = aMobile.recycledControllers.pop();
				controller.build(pOptions);
				return controller;
			}
			return new Controller(pOptions);
		}
/*
		aMobile.createDPad = () => {
			return new Dpad(pOptions);
		}
*/
/*
		VS.Client.showDPad = function() {
			if (!dPadRingElement && !dPadUpElement && !dPadDownElement && !dPadLeftElement && !dPadRightElement) {
				dPadRingElement = this.getInterfaceElement('joypad_interface', 'ring');
				dPadUpElement = this.getInterfaceElement('joypad_interface', 'up');
				dPadDownElement = this.getInterfaceElement('joypad_interface', 'down');
				dPadLeftElement = this.getInterfaceElement('joypad_interface', 'left');
				dPadRightElement = this.getInterfaceElement('joypad_interface', 'right');
				dPadRingElement.touchOpacity = 0;

				dPadUpElement.anchor = { 'x': 0.5, 'y': 0.5 };
				dPadDownElement.anchor = { 'x': 0.5, 'y': 0.5 };
				dPadLeftElement.anchor = { 'x': 0.5, 'y': 0.5 };
				dPadRightElement.anchor = { 'x': 0.5, 'y': 0.5 };
				dPadRingElement.anchor = { 'x': 0.5, 'y': 0.5 };
				
				dPadUpElement.onTapStart = function(pClient, pX, pY, pFingerID) {
					this.iconState = 'highlighted';
					if (VS.World.global.onDPadUp) {
						const realX = pX + this.xPos;
						const realY = pY + this.yPos;
						VS.Client.dPadUpPressed = true;
						VS.World.global.onDPadUp(VS.Client, realX, realY);
					}
				}
				dPadDownElement.onTapStart = function(pClient, pX, pY, pFingerID) {
					this.iconState = 'highlighted';
					if (VS.World.global.onDPadDown) {
						const realX = pX + this.xPos;
						const realY = pY + this.yPos;
						VS.Client.dPadDownPressed = true;
						VS.World.global.onDPadDown(VS.Client, realX, realY);
					}		
				}
				dPadLeftElement.onTapStart = function(pClient, pX, pY, pFingerID) {
					this.iconState = 'highlighted';
					if (VS.World.global.onDPadLeft) {
						const realX = pX + this.xPos;
						const realY = pY + this.yPos;
						VS.Client.dPadLeftPressed = true;
						VS.World.global.onDPadLeft(VS.Client, realX, realY);
					}
				}
				dPadRightElement.onTapStart = function(pClient, pX, pY, pFingerID) {
					this.iconState = 'highlighted';
					if (VS.World.global.onDPadRight) {
						const realX = pX + this.xPos;
						const realY = pY + this.yPos;
						VS.Client.dPadRightPressed = true;
						VS.World.global.onDPadRight(VS.Client, realX, realY);
					}	
				}

				dPadUpElement.onTapStop = function(pClient, pX, pY, pFingerID) {
					this.iconState = '';
					if (VS.World.global.onDPadUpReleased) {
						const realX = pX + this.xPos;
						const realY = pY + this.yPos;
						VS.Client.dPadUpPressed = false;
						VS.World.global.onDPadUpReleased(VS.Client, realX, realY);
					}
				}

				dPadDownElement.onTapStop = function(pClient, pX, pY, pFingerID) {
					this.iconState = '';
					if (VS.World.global.onDPadDownReleased) {
						const realX = pX + this.xPos;
						const realY = pY + this.yPos;
						VS.Client.dPadDownPressed = false;
						VS.World.global.onDPadDownReleased(VS.Client, realX, realY);
					}
				}

				dPadLeftElement.onTapStop = function(pClient, pX, pY, pFingerID) {
					this.iconState = '';
					if (VS.World.global.onDPadLeftReleased) {
						const realX = pX + this.xPos;
						const realY = pY + this.yPos;
						VS.Client.dPadLeftPressed = false;
						VS.World.global.onDPadLeftReleased(VS.Client, realX, realY);
					}
				}

				dPadRightElement.onTapStop = function(pClient, pX, pY, pFingerID) {
					this.iconState = '';
					if (VS.World.global.onDPadRightReleased) {
						const realX = pX + this.xPos;
						const realY = pY + this.yPos;
						VS.Client.dPadRightPressed = false;
						VS.World.global.onDPadRightReleased(VS.Client, realX, realY);
					}
				}

				dPadUpElement.onTapSlideOff = function(pClient, pX, pY, pFingerID) {
					this.iconState = '';
					if (VS.World.global.onDPadUpReleased) {
						const realX = pX + this.xPos;
						const realY = pY + this.yPos;
						VS.Client.dPadUpPressed = false;
						VS.World.global.onDPadUpReleased(VS.Client, realX, realY);
					}
				}

				dPadDownElement.onTapSlideOff = function(pClient, pX, pY, pFingerID) {
					this.iconState = '';
					if (VS.World.global.onDPadDownReleased) {
						const realX = pX + this.xPos;
						const realY = pY + this.yPos;
						VS.Client.dPadDownPressed = false;
						VS.World.global.onDPadDownReleased(VS.Client, realX, realY);
					}
				}

				dPadLeftElement.onTapSlideOff = function(pClient, pX, pY, pFingerID) {
					this.iconState = '';
					if (VS.World.global.onDPadLeftReleased) {
						const realX = pX + this.xPos;
						const realY = pY + this.yPos;
						VS.Client.dPadLeftPressed = false;
						VS.World.global.onDPadLeftReleased(VS.Client, realX, realY);
					}
				}

				dPadRightElement.onTapSlideOff = function(pClient, pX, pY, pFingerID) {
					this.iconState = '';
					if (VS.World.global.onDPadRightReleased) {
						const realX = pX + this.xPos;
						const realY = pY + this.yPos;
						VS.Client.dPadRightPressed = false;
						VS.World.global.onDPadRightReleased(VS.Client, realX, realY);
					}
				}
			}
			this.showInterface('joypad_interface');
			this.dPadShown = true;
		}

		VS.Client.hideDPad = function() {
			if (this.dPadUpPressed) {
				dPadUpElement.trackedTouches = [];
				if (aMobile.touchedDiobs.includes(dPadUpElement)) {
					aMobile.touchedDiobs.splice(aMobile.touchedDiobs.indexOf(dPadUpElement), 1);
				}
				this.dPadUpPressed = false;
				dPadUpElement.onTapStop(this, 0, 0, null);
			}

			if (this.dPadDownPressed) {
				dPadDownElement.trackedTouches = [];
				if (aMobile.touchedDiobs.includes(dPadDownElement)) {
					aMobile.touchedDiobs.splice(aMobile.touchedDiobs.indexOf(dPadDownElement), 1);
				}
				this.dPadDownPressed = false;
				dPadDownElement.onTapStop(this, 0, 0, null);
			}

			if (this.dPadLeftPressed) {
				dPadLeftElement.trackedTouches = [];
				if (aMobile.touchedDiobs.includes(dPadLeftElement)) {
					aMobile.touchedDiobs.splice(aMobile.touchedDiobs.indexOf(dPadLeftElement), 1);
				}
				this.dPadLeftPressed = false;
				dPadLeftElement.onTapStop(this, 0, 0, null);
			}

			if (this.dPadRightPressed) {
				dPadRightElement.trackedTouches = [];
				if (aMobile.touchedDiobs.includes(dPadRightElement)) {
					aMobile.touchedDiobs.splice(aMobile.touchedDiobs.indexOf(dPadRightElement), 1);
				}
				this.dPadRightPressed = false;
				dPadRightElement.onTapStop(this, 0, 0, null);
			}

			this.hideInterface('joypad_interface');
			this.dPadShown = false;
		}
*/
		const getDiobUnderFinger = function(pX, pY) {
			const screenScale = VS.Client.getScreenScale();
			const mapVector = VS.Client.getPosFromScreen(pX / screenScale.x, pY / screenScale.y);
			let mapDiobs;
			if (!VS.Client.mob) return;
			if (!VS.Client.mob.mapName) {
				mapDiobs = [];
			} else {
				mapDiobs = VS.Map.getDiobsByPos(VS.Client.mob.mapName, mapVector.x, mapVector.y);
			}
			const screenDiobs = VS.Client.getInterfaceElementsFromScreen(pX, pY, null, null, null, null, true);
			let highestLayeredScreenDiob;
			let highestLayedMapDiob; // TO DO

			for (let i = 0; i < screenDiobs.length; i++) {
				if (screenDiobs[i].touchOpacity || (screenDiobs[i].touchOpacity === undefined && screenDiobs[i].type !== 'Interface/aMobile/Joyring')) {
					if (!highestLayeredScreenDiob) {
						highestLayeredScreenDiob = screenDiobs[i];
					}

					if (screenDiobs[i].layer >= highestLayeredScreenDiob.layer) {
						highestLayeredScreenDiob = screenDiobs[i];
					}
				}
			}
			
			// interface elements
			if (highestLayeredScreenDiob) {
				if (!VS.Client.checkInterfaceShown(highestLayeredScreenDiob.getInterfaceName()) || highestLayeredScreenDiob.isHidden) {
					// interface here but not currently shown
					return null;
				} else {
					return highestLayeredScreenDiob;
				}
			}

			if (!VS.Client.mob.mapName) {
				return null;
			}
			// PINGABLE
			// map diobs, TODO: (make highest layer take the tap)
			for (let j = 0; j < mapDiobs.length; j++) {
				if (mapDiobs[j].touchOpacity) {
					return mapDiobs[j];
				}
			}
			
			return null;
		}

		const handleZoneTouch = (pX, pY, pFingerID) => {
			// When a finger is placed onto the screen, if it is a zoned controller track it and update it
			if (aMobile.zonesTaken.length) {
				const rightZoneController = aMobile.zonedControllers['right'];
				const leftZoneController = aMobile.zonedControllers['left'];
				// if the screen is pressed on the right|left side and if the right|left zone controller is not active
				// or if the right|left zone controller is a traversal controller, then assign the finger ID to the controller
				// and update it
				// traversal controllers can update their tracked finger and position when another finger takes over
				if (pX > aMobile.middlePosition && rightZoneController) {
					if (!rightZoneController.activeInZone || rightZoneController.type === 'traversal') {
						rightZoneController.controllingFinger = pFingerID;
						rightZoneController.activeInZone = true;
						rightZoneController.update(pX, pY, true);
					}
				} else if (pX < aMobile.middlePosition && leftZoneController) {
					if (!leftZoneController.activeInZone || leftZoneController.type === 'traversal') {
						leftZoneController.controllingFinger = pFingerID;
						leftZoneController.activeInZone = true;
						leftZoneController.update(pX, pY, true);
					}
				}
			} else {
				// if there are no established zones, and there is a static controller or a traversal controller created then those types of controllers can 
				// use the entire screen as their zone. Only one of these controllers can control the entire screen. If more than one of these controllers are created then zones will be needed.
				for (const controller of aMobile.activeControllers) {
					if ((!controller.activeInZone || controller.type === 'traversal') && (controller.type === 'traversal' || controller.type === 'static')) {
						controller.controllingFinger = pFingerID;
						controller.activeInZone = true;
						controller.update(pX, pY, true);
						return;
					}
				}
			}
		}

		const handleZoneRelease = (pFingerID) => {
			// When a finger on the screen is removed, check if the fingerID belongs to a zoned controller, if it does release that controller
			if (aMobile.zonesTaken.length) {
				const rightZoneController = aMobile.zonedControllers['right'];
				const leftZoneController = aMobile.zonedControllers['left'];

				if (rightZoneController?.controllingFinger === pFingerID && rightZoneController?.activeInZone) {
					// console.log('right zone controller released');
					rightZoneController.release();
				} else if (leftZoneController?.controllingFinger === pFingerID && leftZoneController?.activeInZone) {
					// console.log('left zone controller released');
					leftZoneController.release();
				}

			} else {
				for (const controller of aMobile.activeControllers) {
					if ((controller.type === 'traversal' || controller.type === 'static') && controller.activeInZone) {
						if (controller.controllingFinger === pFingerID) {
							controller.release();
							return;
						}
					}
				}
			}
		}

		const handleZoneMove = (pX, pY, pFingerID) => {
			// When a finger on the screen moves, check if the fingerID belongs to a zoned controller, if it does update that zoned controller
			if (aMobile.zonesTaken.length) {
				const rightZoneController = aMobile.zonedControllers['right'];
				const leftZoneController = aMobile.zonedControllers['left'];

				if (rightZoneController?.controllingFinger === pFingerID && rightZoneController?.activeInZone) {
					rightZoneController.update(pX, pY);
				} else if (leftZoneController?.controllingFinger === pFingerID && leftZoneController?.activeInZone) {
					leftZoneController.update(pX, pY);
				}
			} else {
				for (const controller of aMobile.activeControllers) {
					if ((controller.type === 'traversal' || controller.type === 'static') && controller.activeInZone) {
						if (controller.controllingFinger === pFingerID) {
							controller.update(pX, pY);
						}
					}
				}
			}
		}

		const handleStart = (pEvent) => {
/*
			pEvent.preventDefault();
*/
			const touches = pEvent.changedTouches;

			for (let i = 0; i < touches.length; i++) {
				const x = Math.floor((touches[i].clientX - mainM.xBodyPos)) / mainM.scaleWidth; // find a better way to calcuate this value instead of relying on the engine's variable
				const y = Math.floor((touches[i].clientY - mainM.yBodyPos)) / mainM.scaleHeight; // find a better way to calcuate this value instead of relying on the engine's variable
				const touchX = touches[i].clientX;
				const touchY = touches[i].clientY;
				const touchedDiob = getDiobUnderFinger(touchX, touchY);
				const fingerID = touches[i].identifier;
				let spriteRelativeX;
				let spriteRelativeY;
				
				// console.log(fingerID, 'start');
				// 	If you haven't touched a diob, but instead just a space on a screen check if there are any zoned controllers
				if (!touchedDiob) {
					handleZoneTouch(x, y, fingerID);
				}

				if (VS.Client.onTapStart && typeof(VS.Client.onTapStart) === 'function') {
					VS.Client.onTapStart(touchedDiob, clamp(touchX, 0, aMobile.windowSize.width), clamp(touchY, 0, aMobile.windowSize.height), fingerID);
				}
				if (touchedDiob) {
					if (touchedDiob.trackedTouches === undefined) {
						touchedDiob.trackedTouches = [];
					}
					if (touchedDiob._slidOff === undefined) {
						touchedDiob._slidOff = false;
					}
					if (touchedDiob.onTapStart && typeof(touchedDiob.onTapStart) === 'function') {
						// if you are already touching something, you need `touchOpacity` set to 2 to use `multitouch`
						if (touchedDiob.baseType === 'Interface') {
							spriteRelativeX = clamp(touchX - touchedDiob.xPos, 0, touchedDiob.width);
							spriteRelativeY = clamp(touchY - touchedDiob.yPos, 0, touchedDiob.height);
						} else {
							VS.Client.getPosFromScreen(touchX, touchY, aMobile.mapPositionObject);
							spriteRelativeX = clamp(aMobile.mapPositionObject.x - touchedDiob.xPos, 0, touchedDiob.width);
							spriteRelativeY = clamp(aMobile.mapPositionObject.y - touchedDiob.yPos, 0, touchedDiob.height);
						}
						touchedDiob.onTapStart(VS.Client, spriteRelativeX, spriteRelativeY, fingerID);
					}
					if (touchedDiob.trackedTouches.length && touchedDiob.touchOpacity === MULTI_TOUCH) {
						touchedDiob.trackedTouches.push(fingerID);
					// if you do not have `multitouch` enabled, then you can only touch one thing at a time					
					} else {
						if (!touchedDiob.trackedTouches.length) {
							touchedDiob.trackedTouches.push(fingerID);
						}
					}
					if (touchedDiob.aMobileController) {
						const joyring = touchedDiob;
						joyring.controller.update(x, y, true);
					}

					if (!aMobile.touchedDiobs.includes(touchedDiob)) {
						aMobile.touchedDiobs.push(touchedDiob);
					}
				}
			}
		}

		const handleEnd = (pEvent) => {
			if (pEvent.cancelable) { 
				pEvent.preventDefault();
			}

			const touches = pEvent.changedTouches;

			for (let i = 0; i < touches.length; i++) {
				const x = Math.floor((touches[i].clientX - mainM.xBodyPos)) / mainM.scaleWidth; // find a better way to calcuate this value instead of relying on the engine's variable
				const y = Math.floor((touches[i].clientY - mainM.yBodyPos)) / mainM.scaleHeight; // find a better way to calcuate this value instead of relying on the engine's variable
				const touchX = touches[i].clientX;
				const touchY = touches[i].clientY;
				const touchedDiob = getDiobUnderFinger(touchX, touchY);
				const fingerID = touches[i].identifier;
				let spriteRelativeX;
				let spriteRelativeY;

				// console.log(fingerID, 'end');
				handleZoneRelease(fingerID);
				
				if (VS.Client.onTapEnd && typeof(VS.Client.onTapEnd) === 'function') {
					VS.Client.onTapEnd(touchedDiob, clamp(touchX, 0, aMobile.windowSize.width), clamp(touchY, 0, aMobile.windowSize.height), touches[i].identifier);
				}
			
				if (touchedDiob) {
					if (touchedDiob.onTapEnd && typeof(touchedDiob.onTapEnd) === 'function') {
						if (touchedDiob.baseType === 'Interface') {
							spriteRelativeX = clamp(touchX - touchedDiob.xPos, 0, touchedDiob.width);
							spriteRelativeY = clamp(touchY - touchedDiob.yPos, 0, touchedDiob.height);
						} else {
							VS.Client.getPosFromScreen(touchX, touchY, aMobile.mapPositionObject);
							spriteRelativeX = clamp(aMobile.mapPositionObject.x - touchedDiob.xPos, 0, touchedDiob.width);
							spriteRelativeY = clamp(aMobile.mapPositionObject.y - touchedDiob.yPos, 0, touchedDiob.height);
						}
						if (touchedDiob.touchOpacity === MULTI_TOUCH) {
							touchedDiob.onTapEnd(VS.Client, spriteRelativeX, spriteRelativeY, fingerID);
						} else {
							if (touchedDiob.trackedTouches) {
								if (touchedDiob.trackedTouches.length) {
									if (touchedDiob.trackedTouches.includes(fingerID)) {
										touchedDiob.onTapEnd(VS.Client, spriteRelativeX, spriteRelativeY, fingerID);
									}
								}
							}
						}
					}
				}

				// find all diobs that you were touching, and call `onTapStop` on them, since the finger that touched them has been removed
				for (let j = aMobile.touchedDiobs.length - 1; j >= 0; j--) {
					if (aMobile.touchedDiobs[j].trackedTouches) {
						if (aMobile.touchedDiobs[j].trackedTouches.length) {
							if (aMobile.touchedDiobs[j].trackedTouches.includes(fingerID)) {
								aMobile.touchedDiobs[j].trackedTouches.splice(aMobile.touchedDiobs[j].trackedTouches.indexOf(fingerID), 1);
								if (aMobile.touchedDiobs[j].onTapStop && typeof(aMobile.touchedDiobs[j].onTapStop) === 'function') {
									if (aMobile.touchedDiobs[j].baseType === 'Interface') {
										spriteRelativeX = clamp(touchX - aMobile.touchedDiobs[j].xPos, 0, aMobile.touchedDiobs[j].width);
										spriteRelativeY = clamp(touchY - aMobile.touchedDiobs[j].yPos, 0, aMobile.touchedDiobs[j].height);
									} else {
										VS.Client.getPosFromScreen(touchX, touchY, aMobile.mapPositionObject);
										spriteRelativeX = clamp(aMobile.mapPositionObject.x - aMobile.touchedDiobs[j].xPos, 0, aMobile.touchedDiobs[j].width);
										spriteRelativeY = clamp(aMobile.mapPositionObject.y - aMobile.touchedDiobs[j].yPos, 0, aMobile.touchedDiobs[j].height);
									}
									aMobile.touchedDiobs[j].onTapStop(VS.Client, spriteRelativeX, spriteRelativeY, fingerID); // you tapped this diob, and finally released it (no matter if it was over the diob or not)
								}
								if (aMobile.touchedDiobs[j]._slidOff) {
									aMobile.touchedDiobs[j]._slidOff = false;
								}
								if (aMobile.touchedDiobs[j].aMobileController) {
									const joyring = aMobile.touchedDiobs[j];
									if (!joyring.trackedTouches.length) {
										joyring.controller.release();
									}
								}
								aMobile.touchedDiobs.splice(j, 1);
							}
						}
					}
				}
			}
		}

		const handleCancel = (pEvent) => {
			handleEnd(pEvent);
			// remove all touchedDiobs since this was a touchCancel event, you must of hit some UI, meaning all fingers should be considered null and void
			for (let j = aMobile.touchedDiobs.length - 1; j >= 0; j--) {
				aMobile.touchedDiobs[j].trackedTouches = [];
				aMobile.touchedDiobs.splice(j, 1);
			}
		}

		const handleMove = (pEvent) => {
/* 			
			if (pEvent.cancelable) { 
				pEvent.preventDefault();
			} 
*/
			const touches = pEvent.changedTouches;

			for (let i = 0; i < touches.length; i++) {
				const x = Math.floor((touches[i].clientX - mainM.xBodyPos)) / mainM.scaleWidth; // find a better way to calcuate this value instead of relying on the engine's variable
				const y = Math.floor((touches[i].clientY - mainM.yBodyPos)) / mainM.scaleHeight; // find a better way to calcuate this value instead of relying on the engine's variable
				const touchX = touches[i].clientX;
				const touchY = touches[i].clientY;
				const touchedDiob = getDiobUnderFinger(touchX, touchY);
				const fingerID = touches[i].identifier;
				let spriteRelativeX;
				let spriteRelativeY;
				
				handleZoneMove(x, y, fingerID);

				if (VS.Client.onTapMove && typeof(VS.Client.onTapMove) === 'function') {
					VS.Client.onTapMove(touchedDiob, clamp(touchX, 0, aMobile.windowSize.width), clamp(touchY, 0, aMobile.windowSize.height), fingerID);
				}

				if (touchedDiob) {
					if (touchedDiob.onTapMove && typeof(touchedDiob.onTapMove) === 'function') {
						if (touchedDiob.baseType === 'Interface') {
							spriteRelativeX = clamp(touchX - touchedDiob.xPos, 0, touchedDiob.width);
							spriteRelativeY = clamp(touchY - touchedDiob.yPos, 0, touchedDiob.height);
						} else {
							VS.Client.getPosFromScreen(touchX, touchY, aMobile.mapPositionObject);
							spriteRelativeX = clamp(aMobile.mapPositionObject.x - touchedDiob.xPos, 0, touchedDiob.width);
							spriteRelativeY = clamp(aMobile.mapPositionObject.y - touchedDiob.yPos, 0, touchedDiob.height);
						}
						if (touchedDiob.touchOpacity === MULTI_TOUCH) {
							touchedDiob.onTapMove(VS.Client, spriteRelativeX, spriteRelativeY, fingerID);
						} else {
							if (touchedDiob.trackedTouches) {
								if (touchedDiob.trackedTouches.length) {
									if (touchedDiob.trackedTouches.includes(fingerID)) {
										touchedDiob.onTapMove(VS.Client, spriteRelativeX, spriteRelativeY, fingerID);
									}
								}
							}
						}
					}
				}
				
				for (const diob of aMobile.touchedDiobs) {
					if (diob.trackedTouches.includes(fingerID)) {
						if (diob !== touchedDiob) {
							if (!diob._slidOff) {
								if (diob.onTapSlideOff && typeof(diob.onTapSlideOff) === 'function') {
									diob._slidOff = true;
									if (diob.baseType === 'Interface') {
										spriteRelativeX = clamp(touchX - diob.xPos, 0, diob.width);
										spriteRelativeY = clamp(touchY - diob.yPos, 0, diob.height);
									} else {
										VS.Client.getPosFromScreen(touchX, touchY, aMobile.mapPositionObject);
										spriteRelativeX = clamp(aMobile.mapPositionObject.x - diob.xPos, 0, diob.width);
										spriteRelativeY = clamp(aMobile.mapPositionObject.y - diob.yPos, 0, diob.height);
									}
									diob.onTapSlideOff(VS.Client, spriteRelativeX, spriteRelativeY, fingerID);
								}
							}
						}
						if (diob.aMobileController) {
							const joyring = diob;
							joyring.controller.update(x, y);
						}
					}
				}
			}
		}
		
		document.addEventListener('touchstart', handleStart, { 'passive': true });
		document.addEventListener('touchend', handleEnd, { 'passive': false });
		document.addEventListener('touchcancel', handleCancel, { 'passive': false });
		document.addEventListener('touchmove', handleMove, { 'passive': true });

		// prevent zooming and mobile gestures
		document.addEventListener('gesturestart', function(pEvent) {pEvent.preventDefault()}, { 'passive': false });
		document.addEventListener('gesturechange', function(pEvent) {pEvent.preventDefault()}, { 'passive': false });
	}
})();

#END JAVASCRIPT
#END CLIENTCODE
