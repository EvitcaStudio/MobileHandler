// @ts-ignore - vendor files don't have type declarations
import { Tween } from './vendor/tween.min.mjs';
// @ts-ignore - vendor files don't have type declarations
import { Utils } from './vendor/utils.min.mjs';
import { MobileHandler, MobileHandlerSingleton } from './mobile-handler';

/**
 * When using a controller that is of the traversal type, or the static type
 * a zone is REQUIRED. Only two controllers of traversal or static or one of each can be used at a time. 
 * These controllers have to have opposing zones. Left | Right
 * Traversal: spawns at the touch position and when dragged, follows the finger across the screen
 * Static: spawns at the touch position, cannot move from that location, just updates the joystick and will clamp at its limit
 * Stationary: cannot move from it's position at all, will just update the joystick and clamp it at its limit, can be pressed from anywhere on screen.
 */

export interface ControllerOptions {
    type: 'stationary' | 'traversal' | 'static';
    size: number;
    position: { x: number; y: number };
    lockedDimension?: 'both' | 'vertical' | 'horizontal' | null;
    zone?: 'left' | 'right' | null;
    inactiveAlpha: number;
    transitionTime: number;
    scale: number;
    plane: number;
    layer: number;
    atlasName: string;
    joystickIconName: string;
    joyringIconName: string;
    callback: {
        onTouchBegin?: ((client: any, x: number, y: number, fingerID: number) => void) | null;
        onRelease?: ((client: any, angle: number) => void) | null;
        onMove?: ((client: any, normalizedX: number, normalizedY: number, angle: number, inCenter: boolean) => void) | null;
    };
}

export interface DiobElement {
    atlasName: string;
    iconName: string;
    touchOpacity: number;
    interfaceType: string;
    color: { tint: number };
    scale: number;
    anchor: { x: number; y: number };
    plane: number;
    layer: number;
    width: number;
    height: number;
    halfSize: number;
    child?: DiobElement;
    parent?: DiobElement;
    isMobileHandlerController: boolean;
    originalPos: { x: number; y: number };
    startPos: { x: number; y: number };
    anglePoint: number;
    controller: Controller;
    onTouchBegin?: ((client: any, x: number, y: number, fingerID: number) => void) | null;
    edgeLock?: boolean;
    x: number;
    y: number;
    xPos: number;
    yPos: number;
    alpha: number;
    id: string;
    setPos: (x: number, y: number) => void;
    show: () => void;
    hide: () => void;
}

export class Controller {
    /**
     * The maximum layer
     */
    static MAX_LAYER = 1999998;
    /**
     * A reference to the tween instance this controller uses to tween the alpha when it becomes inactive.
     * This reference is so that developers can pause this tween and resume it when needed.
     * Calling this.tween.pause() and this.tween.resume() for instance when pausing and unpausing the game.
     */
    tween = new Tween();
    /**
     * The joyring element of this controller.
     */
    joyring: DiobElement | null = null;
    /**
     * The joystick element of this controller.
     */
    joystick: DiobElement | null = null;
    /**
     * The version of the module.
     */
    version = "VERSION_REPLACE_ME";
    /**
     * The options of this controller.
     */
    options: ControllerOptions | null = null;
    /**
     * The locked dimension of the joystick. both | vertical | horizontal. This is used to lock the joystick from moving in certain dimensions. If this joystick's type is traversal it cannot be locked.
     */
    lockedDimension: 'both' | 'vertical' | 'horizontal' | null = null;
    /**
     * The zone the joystick will occupy. If there is already a controller of the traversal or static type, then you must use a zone. If there is only one controller no zone is needed. left | right This will give each controller equal space on the left | right sides of the screen.
     */
    zone: 'left' | 'right' | null = null;
    /**
     * Whether this controller is active in zone. e.g the controller is zoned to the left, and the user taps on the left side of the screen.
     */
    activeInZone: boolean = false;
    /**
     * The fingerID that is controlling the joystick.
     */
    controllingFinger: number | null = null;
    /**
     * Whether this controller is active
     */
    active: boolean = false;
    /**
     * Event function for when the joystick is released.
     */
    onRelease: ((client: any, angle: number) => void) | null = null;
    /**
     * Event function for when the joystick is moved.
     */
    onMove: ((client: any, normalizedX: number, normalizedY: number, angle: number, inCenter: boolean) => void) | null = null;

    constructor(pOptions: ControllerOptions) {
        this.build(pOptions);
    }

    /**
     * Setup the controller with the options that this controller class instance has from being initiated
     */
    setup(): void {
        if (!this.joyring || !this.joystick || !this.options) return;

        // Setup the joyring element
        this.joyring.atlasName = this.options.atlasName;
        this.joyring.iconName = this.options.joyringIconName;
        this.joyring.touchOpacity = MobileHandlerSingleton.MULTI_TOUCH;
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
        
        // Setup the joystick element
        this.joystick.atlasName = this.options.atlasName;
        this.joystick.iconName = this.options.joystickIconName;
        this.joystick.touchOpacity = MobileHandlerSingleton.NO_TOUCH;
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
        this.joystick.halfSize = this.joystick.width / 2;
        this.joystick.parent = this.joyring;
        this.joystick.originalPos = { 'x': this.joyring.originalPos.x + this.joystick.halfSize, 'y': this.joyring.originalPos.y + this.joystick.halfSize };
        
        // Keep references to this joystick
        this.joyring.controller = this;
        this.joystick.controller = this;
        
        // Assign event funcs
        this.joyring.onTouchBegin = this.options.callback.onTouchBegin || null;
        this.onRelease = this.options.callback.onRelease || null;
        this.onMove = this.options.callback.onMove || null;
        
        // Assign locked status
        this.lockedDimension = this.options.lockedDimension || null;
        this.lock(this.lockedDimension || undefined);
        
        // Create the joystick and joyring elements
        VYLO.Client.addInterfaceElement(this.joyring, MobileHandler.interfaceHandle, this.joyring.id);
        VYLO.Client.addInterfaceElement(this.joystick, MobileHandler.interfaceHandle, this.joystick.id);
        
        // Show interface
        if (!VYLO.Client.checkInterfaceShown(MobileHandler.interfaceHandle)) {
            VYLO.Client.showInterface(MobileHandler.interfaceHandle);
        }
        
        // Track this controller
        MobileHandler.activeControllers.push(this);
        this.show();
    }

    /**
     * Tweens the controller to it's inactive alpha preset, or from it's inactive value preset to full alpha.
     * @param pFade - Whether to fade the joystick to it's inactive alpha preset
     */
    handleTransition(pFade: boolean): void {
        if (!this.joyring || !this.options) return;

        let start = { 'alpha': this.joyring.alpha };
        let end: { alpha: number };
        const duration = this.options.transitionTime;
        const easing = Tween.easeInOutQuad;
        
        if (this.options.inactiveAlpha || this.options.inactiveAlpha === 0) {
            // Stop any ongoing tween animation
            this.tween.stop();
            // Determine which direction the fade should go in
            end = pFade ? { 'alpha': this.options.inactiveAlpha } : { 'alpha': 1 };
            // Makes no sense to tween a animation if the start and end value is the same
            if (start.alpha === end.alpha) return;
            // Animate the transition
            this.tween.build({
                start,
                end,
                duration,
                easing
            }).animate(({ alpha }: { alpha: number }) => {
                this.joyring!.alpha = alpha;
                this.joystick!.alpha = alpha;
            });
        }
    }

    /**
     * Resets the joystick to default.
     * @param pSoft - Softly resets the joystick in the event it is hidden
     */
    reset(pSoft: boolean): void {
        if (!this.joyring || !this.joystick || !this.options) return;

        const angle = this.joystick.anglePoint;
        this.joystick.alpha = this.options.inactiveAlpha;
        this.joystick.startPos.x = this.joystick.startPos.y = 0;
        this.joystick.anglePoint = 0;
        this.joyring.layer = this.options.layer;
        this.joystick.layer = this.options.layer + 10;
        this.activeInZone = false;
        this.controllingFinger = null;

        if (this.active) {
            this.active = false;
            if (typeof(this.onRelease) === 'function') {
                this.onRelease(VYLO.Client, angle);
            }
        }
        if (!pSoft) {
            this.onRelease = null;
            this.onMove = null;
            this.joyring.onTouchBegin = null;
            if (this.zone) {
                if (MobileHandler.reservedScreenZones.includes(this.zone)) {
                    MobileHandler.reservedScreenZones.splice(MobileHandler.reservedScreenZones.indexOf(this.zone), 1);
                }
                if (this.zone === 'left' || this.zone === 'right') {
                    MobileHandler.zonedControllers[this.zone] = null;
                }
            }
            this.zone = null;
            this.lockedDimension = null;
            this.options = null;
            if (MobileHandler.touchedInstances.includes(this.joyring)) {
                MobileHandler.touchedInstances.splice(MobileHandler.touchedInstances.indexOf(this.joyring), 1);
            }
        }
    }

    /**
     * Builds this controller with the options that were passed in.
     * @param pOptions - The options of this controller.
     */
    build(pOptions: Partial<ControllerOptions> = {
        'type': 'stationary',
        'size': 100,
        'position': { 'x': 100, 'y': 100 },
        'lockedDimension': null,
        'zone': null,
        'inactiveAlpha': 0.5,
        'transitionTime': 500,
        'scale': 1,
        'plane': 1,
        'layer': 1,
        'atlasName': '',
        'joystickIconName': '',
        'joyringIconName': '',
        'callback': { 'onTouchBegin': null, 'onRelease': null, 'onMove': null }
    }): void {
        if (!this.joyring && !this.joystick) {
            const joyring = (VYLO as any).newDiob('Interface');
            const joystick = (VYLO as any).newDiob('Interface');
            this.joyring = joyring;
            this.joystick = joystick;
        }

        if (!Number.isInteger(pOptions.size)) {
            pOptions.size = 100;
            MobileHandler.logger.prefix('MobileHandler-Module').warn('pOptions.size was not an integer. Default value of 100 has been used.');
        }

        // the type of the controller
        if (typeof(pOptions.type) === 'string') {
            if (pOptions.type !== 'traversal' && pOptions.type !== 'static' && pOptions.type !== 'stationary') {
                pOptions.type = 'stationary';
            }
        } else {
            pOptions.type = 'stationary';
            MobileHandler.logger.prefix('MobileHandler-Module').warn('pOptions.type was not a string. Default value of stationary has been used.');
        }
        
        if (pOptions.type === 'traversal' || pOptions.type === 'static') {
            // if there is already a controller taking up a space, then you must use a zone. If there is no controller, then the entire screen is the zone
            // do not define a zone if you know this controller will be the only controller on screen
            if (MobileHandler.reservedScreenZones.length) {
                if (!pOptions.zone || typeof(pOptions.zone) !== 'string' || MobileHandler.reservedScreenZones.includes(pOptions.zone)) {
                    MobileHandler.logger.prefix('MobileHandler-Module').error('When using a controller that is of the traversal type, or the static type. A zone is REQUIRED. Only two controllers of traversal or static or one of each can be used at a time. These controllers have to have opposing zones. Left | Right');
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
            MobileHandler.logger.prefix('MobileHandler-Module').warn('pOptions.atlasName was not a string. No value has been used.');
        }

        // If the type is traversal it cannot be locked
        if (pOptions.lockedDimension) {
            if (pOptions.type === 'traversal') {
                MobileHandler.logger.prefix('MobileHandler-Module').warn('pOptions.type is traversal. A traversal controller cannot be locked.');
            } else if (typeof(pOptions.lockedDimension) !== 'string' || (pOptions.lockedDimension !== 'both' && pOptions.lockedDimension !== 'vertical' && pOptions.lockedDimension !== 'horizontal')) {
                pOptions.lockedDimension = null;
                MobileHandler.logger.prefix('MobileHandler-Module').warn('Invalid value for pOptions.lockedDimension has been passed. No value has been set.');
            }
        }

        if (typeof(pOptions.joystickIconName) !== 'string') {
            pOptions.joystickIconName = '';
            MobileHandler.logger.prefix('MobileHandler-Module').warn('pOptions.joystickIconName was not a string. No value has been used.');
        }

        if (typeof(pOptions.joyringIconName) !== 'string') {
            pOptions.joyringIconName = '';
            MobileHandler.logger.prefix('MobileHandler-Module').warn('pOptions.joyringIconName was not a string. No value has been used.');
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
            MobileHandler.logger.prefix('MobileHandler-Module').warn('A non integer value was found in option for scale. Default scale of 1 has been used.');
        }

        if (typeof(pOptions.plane) !== 'number') {
            pOptions.plane = 1;
        }

        if (typeof(pOptions.layer) !== 'number') {
            pOptions.layer = 1;
        }

        if (pOptions.position && pOptions.position.constructor === Object) {
            if (!Number.isInteger(pOptions.position.x)) {
                pOptions.position.x = 100;
                MobileHandler.logger.prefix('MobileHandler-Module').warn('position.x variable found in options was not a number. Default position.x value has been used.');
            }
            if (!Number.isInteger(pOptions.position.y)) {
                pOptions.position.y = 100;
                MobileHandler.logger.prefix('MobileHandler-Module').warn('position.y variable found in options was not a number. Default position.y value has been used.');
            }
        } else {
            pOptions.position = { 'x': 100, 'y': 100 };
            MobileHandler.logger.prefix('MobileHandler-Module').warn('position variable found in options was not an object. Default position has been used.');
        }
        this.options = pOptions as ControllerOptions;
        this.setup();
    }

    /**
     * Returns the type of this controller.
     * @returns Returns the type of this controller.
     */
    getType(): 'stationary' | 'traversal' | 'static' {
        return this.options?.type || 'stationary';
    }

    /**
     * Updates the controllers position with the latest information from touch events
     * @param pX - The x position on the screen where the user tapped.
     * @param pY - The y position on the screen where the user tapped.
     * @param pTouchStart - If this was the first time the joystick was touched.
     */
    update(pX: number, pY: number, pTouchStart?: boolean): void {
        if (!this.joyring || !this.joystick || !this.options) return;

        if (this.lockedDimension === 'both') return;
        if (pTouchStart) {
            this.handleTransition(false);
            this.joyring.layer = Controller.MAX_LAYER;
            this.joystick.layer = Controller.MAX_LAYER + 10;
            this.active = true;
        }
        if (this.active) {
            // traversal: spawns at the touch position and when dragged, follows the finger across the screen
            // static: spawns at the touch position, cannot move from that location, just updates the joystick and will clamp at its limit
            // stationary: cannot move from it's position at all, will just update the joystick and clamp it at its limit, can be pressed from anywhere on screen.

            const touchPos = { 'x': pX - this.joystick.halfSize, 'y': pY - this.joystick.halfSize };
            // Start position is always the center of the joyring
            let startPos: { x: number; y: number } = { x: 0, y: 0 };
            // Distance is how far away the joystick is from the start position
            let distance: number = 0;
            // Angle is the angle in degrees from the start position to the touched position
            let angle: number = 0;
            // ClampedDistance is the max distance allowed for the joystick to move
            let clampedDistance: number = 0;
            // ClampedPos is the position that was clamped when the joystick tried to go past it's clampedDistance
            let clampedPos: { x: number; y: number } = { x: 0, y: 0 };

            if (this.options.type === 'stationary') {
                // This joystick is stationary therefore the start position is it's default position
                startPos = this.joystick.originalPos;
                // If a certain axis is locked, clamp that position to it's start position
                if (this.lockedDimension === 'horizontal') {
                    touchPos.y = startPos.y;
                } else if (this.lockedDimension === 'vertical') {
                    touchPos.x = startPos.x;
                }
                distance = Utils.getDistance(startPos, touchPos);
                angle = Utils.getAngle(startPos, touchPos);
                clampedDistance = Math.min(distance, this.joyring.halfSize);
                clampedPos = Utils.calculateNewPositionFromDistanceAndAngle(startPos, clampedDistance, angle);
                // Set the position to the clamped position so that it is locked to it's clampedPos
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
                    // The start position for traversal is wherever you pressed on the screen originally
                    // The start position was set in the `pTouchStart` portion
                    distance = Utils.getDistance(this.joystick.startPos, touchPos);
                    angle = Utils.getAngle(this.joystick.startPos, touchPos);
                    clampedDistance = Math.min(distance, this.joyring.halfSize);
                    clampedPos = Utils.calculateNewPositionFromDistanceAndAngle(this.joystick.startPos, clampedDistance, angle);
                    // Set the position to the position touched
                    this.joystick.setPos(touchPos.x, touchPos.y);
                    // Update the parent to follow the child after it is placed
                    const parentAngle = Utils.getAngle(touchPos, this.joystick.startPos);
                    const parentClampedPos = Utils.calculateNewPositionFromDistanceAndAngle(touchPos, clampedDistance, parentAngle);
                    this.joyring.setPos(parentClampedPos.x - this.joystick.halfSize, parentClampedPos.y - this.joystick.halfSize);

                    // If the distance is greater that the clamped position then we need to update the start position of the joystick
                    if (distance > clampedDistance) {
                        this.joystick.startPos.x = this.joyring.xPos + this.joystick.halfSize;
                        this.joystick.startPos.y = this.joyring.yPos + this.joystick.halfSize;
                    }
                } else if (this.options.type === 'static') {
                    // The start position for static is wherever you pressed on the screen originally
                    // The start position set in the `pTouchStart` portion
                    // If a certain axis is locked, clamp that position to it's start position
                    if (this.lockedDimension === 'horizontal') {
                        touchPos.y = this.joystick.startPos.y;
                    } else if (this.lockedDimension === 'vertical') {
                        touchPos.x = this.joystick.startPos.x;
                    }
                    distance = Utils.getDistance(this.joystick.startPos, touchPos);
                    angle = Utils.getAngle(this.joystick.startPos, touchPos);
                    clampedDistance = Math.min(distance, this.joyring.halfSize);
                    clampedPos = Utils.calculateNewPositionFromDistanceAndAngle(this.joystick.startPos, clampedDistance, angle);
                    // Set the position to the clamped position so that it is locked
                    this.joystick.setPos(clampedPos.x, clampedPos.y);
                }
            }

            // Set the angle point for reading (-1 is to convert it for use in an environment where up is down, and down is up)
            this.joystick.anglePoint = Utils.convertRaWAngleToVyloCoords(angle);
            // Calculate a threshold based on a percentage of the joystick's size
            const thresholdPercentage = 0.1; // Adjust this value based on your preference
            const centerThreshold = this.joyring.width * thresholdPercentage;
            // Check if the joystick is in the center
            const inCenter = (Math.abs(clampedDistance) < centerThreshold);
            // We need to get the starting position of the joystick, but in different types this can be different so we get the proper one based on the type.
            const startingPos = (this.options.type === 'stationary' ? startPos : this.joystick.startPos);
            // Get a normalized range of the position of the joystick to pass as analog values
            const normalizedX = Utils.normalizeRanged(startingPos.x, touchPos.x - this.joyring.halfSize, touchPos.x + this.joyring.halfSize);
            const normalizedY = Utils.normalizeRanged(startingPos.y, touchPos.y - this.joyring.halfSize, touchPos.y + this.joyring.halfSize);

            // Check if the joystick is in the center
            if (typeof(this.onMove) === 'function') {
                this.onMove(VYLO.Client, normalizedX, normalizedY, this.joystick.anglePoint, inCenter);
            }
        }
    }

    /**
     * API called when this joystick is released
     * @param pForce - If this was a forced release. Called progamatically.
     */
    release(pForce?: boolean): void {
        if (!this.joyring || !this.joystick) return;

        if (this.lockedDimension === 'both') return;
        if (!pForce) {
            this.reset(true);
        }
        // Reset the position to the default position
        this.joyring.setPos(this.joyring.originalPos.x, this.joyring.originalPos.y);
        this.joystick.setPos(this.joystick.originalPos.x, this.joystick.originalPos.y);
        this.handleTransition(true);
    }

    /**
     * Locks a joystick from moving in a certain dimension or both
     * @param pDimension - The dimension to lock. both | vertical | horizontal
     */
    lock(pDimension?: string): void {
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
     * @param pDimension - The dimension to unlock. both | vertical | horizontal
     */
    unlock(pDimension?: string): void {
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
     * @returns An object containing references to the joytick and the joyring that makeup this controller.
     */
    getComponents(): { joystick: DiobElement; joyring: DiobElement } | null {
        if (!this.joyring || !this.joystick) return null;
        return { 'joystick': this.joystick, 'joyring': this.joyring };
    }

    /**
     * Hides this controller
     */
    hide(): void {
        if (!this.joyring || !this.joystick) return;
        this.joyring.hide();
        this.joystick.hide();
        this.reset(true);
    }

    /**
     * Shows this controller
     */
    show(): void {
        if (!this.joyring || !this.joystick) return;
        this.joyring.setPos(this.joyring.originalPos.x, this.joyring.originalPos.y);
        this.joystick.setPos(this.joystick.originalPos.x, this.joystick.originalPos.y);
        this.joyring.show();
        this.joystick.show();
        this.handleTransition(true);
    }
}
