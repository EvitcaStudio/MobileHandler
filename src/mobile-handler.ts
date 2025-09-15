// @ts-ignore - vendor files don't have type declarations
import { Utils } from './vendor/utils.min.mjs';
// @ts-ignore - vendor files don't have type declarations
import { Logger } from './vendor/logger.min.mjs';
// @ts-ignore - vendor files don't have type declarations
import { Pulse } from './vendor/pulse.min.mjs';
import { Controller } from './controller';

/**
 * @file The MobileHandler module provides a user-friendly interface for game developers to integrate touch-based controls for their game characters on mobile devices. It offers features for creating a visual joystick on the screen and facilitates mobile device interaction, including accessing device information and triggering device vibrations.
 * 
 * @author https://github.com/doubleactii
 * @license MobileHandler is free software, available under the terms of a MIT style License.
 * When lowpower mode is on it makes game run slower, from 60fps to 30fps
 */

export interface SafeAreaValues {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface MapPositionObject {
    x: number;
    y: number;
}

export interface WindowSize {
    width: number;
    height: number;
}

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

export interface TrackerObject {
    trackedTouches: number[];
    slidOff: boolean;
}

export class MobileHandlerSingleton {
    /**
     * Whether or not an instance can be touched by multiple fingers. If their touchOpacity is set to MULTI_TOUCH it can be interacted with multiple times via different touches.
     */
    static MULTI_TOUCH = 2;
    /**
     * Whether or not an instance can be touched or not. If their touchOpacity is set to NO_TOUCH, it cannot be touched
     */
    static NO_TOUCH = 0;
    /**
     * The max number of controllers that can be recycled
     */
    static MAX_RECYCLED_CONTROLLERS = 10;
    /**
     * The maximum layer
     */
    static MAX_LAYER = 1999998;
    /**
     * An array of all controllers that have been recycled
     */
    recycledControllers: Controller[] = [];
    /**
     * An array of all controllers that are active
     */
    activeControllers: Controller[] = [];
    /**
     * An object holding the controllers in zones
     */
    zonedControllers: { [key: string]: Controller | null } = {};
    /**
     * An array that holds all the diobs that are currently being touched
     */
    touchedInstances: any[] = [];
    /**
     * An object that stores the mapPosition over the screen
     */
    mapPositionObject: MapPositionObject = { 'x': 0, 'y': 0 };
    /**
     * An array that holds the current screen zones taken, 'left' or 'right'.
     */
    reservedScreenZones: string[] = [];
    /**
     * An object holding the current window size
     */
    windowSize: WindowSize = VYLO.World.getGameSize();
    /**
     * The middle of the screen's x coordinate. This is used to figure out which side of the screen is being interacted with.
     */
    xCenterScreenPosition: number = this.windowSize.width / 2;
    /**
     * Weakmap to track data belonging to instances used in this module.
     */
    instanceWeakMap = new WeakMap<any, TrackerObject>();
    /**
     * The version of the module.
     */
    version = "VERSION_REPLACE_ME";
    /**
     * The logger module this module uses to log errors / logs
     */
    logger: any;
    /**
     * The mobile handler interface that our controllers will exist in
     */
    interfaceHandle: string;
    /**
     * An object containing the safe area offset values to account for the notch on notch enabled devices.
     */
    safeAreaValues: SafeAreaValues = { top: 0, right: 0, bottom: 0, left: 0 };
    /**
     * Check if the user agent string contains 'iPhone' or 'iPad'
     */
    isIOS: boolean = false;
    /**
     * Check if the user agent string contains 'Android'
     */
    isAndroid: boolean = false;
    /**
     * Check if the 'ontouchstart' event is supported
     */
    isTouchEnabled: boolean = false;
    /**
     * Whether this device is mobile or not. Can be simulated.
     */
    isMobile: boolean = false;

    constructor() {
        this.logger = new Logger();
        this.logger.registerType('MobileHandler-Module', '#ff6600');
        this.interfaceHandle = `mobile-handler-interface-${(Math.random() * Math.PI / 2)}`;
        VYLO.Client.createInterface(this.interfaceHandle);

        this.queryUserAgent();
        this.registerEventHandlers();
        this.querySafeAreaValues();
    }

    /**
     * An object containing the safe area inset values to account for the notch on notch enabled devices. This will keep the UI in a safe area
     * The safe-area-inset-* variables are four environment variables that define a rectangle by its top, right, bottom, and left insets from the edge of the viewport, 
     * which is safe to put content into without risking it being cut off by the shape of a non‑rectangular display. 
     * For rectangular viewports, like your average laptop monitor, their value is equal to zero. 
     * For non-rectangular displays — like a round watch face — the four values set by the user agent form a rectangle such that all content inside the rectangle is visible.
     * https://developer.mozilla.org/en-US/docs/Web/CSS/env
     * @returns The safe area inset values
     */
    getSafeAreaInsets(): SafeAreaValues {
        return { ...this.safeAreaValues };
    }

    /**
     * Short hand for getting the safe area inset for the top of the screen.
     * @returns The safe area top inset
     */
    getSafeAreaTop(): number {
        return this.safeAreaValues.top;
    }

    /**
     * Short hand for getting the safe area inset for the bottom of the screen.
     * @returns The safe area bottom inset
     */
    getSafeAreaBottom(): number {
        return this.safeAreaValues.bottom;
    }

    /**
     * Short hand for getting the safe area inset for the left of the screen.
     * @returns The safe area left inset
     */
    getSafeAreaLeft(): number {
        return this.safeAreaValues.left;
    }

    /**
     * Short hand for getting the safe area inset for the right of the screen.
     * @returns The safe area right inset
     */
    getSafeAreaRight(): number {
        return this.safeAreaValues.right;
    }

    /**
     * Detects the type of device based on user agent.
     * @returns The detected device type ('desktop' or 'mobile').
     */
    detectDeviceType(): 'desktop' | 'mobile' {
        const isMobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase());
        return isMobile ? 'mobile' : 'desktop';
    }

    /**
     * Vibrates the mobile device.
     * https://github.com/apache/cordova-plugin-vibration#readme
     * https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
     * @param pDuration - The duration of the vibration.
     */
    vibrate(pDuration: number = 500): void {
        if (typeof(navigator) !== 'undefined') {
            if (navigator.vibrate) {
                navigator.vibrate(pDuration);
            }
        }
    }

    /**
     * If this device can register touch events.
     * @returns Whether this device is a touch enabled device.
     */
    isTouchDevice(): boolean {
        return this.isTouchEnabled;
    }

    /**
     * If this device is a mobile device.
     * @returns Whether this device is a mobile device.
     */
    isMobileDevice(): boolean {
        return this.isMobile;
    }

    /**
     * If this device is an ios device.
     * @returns Whether this device is an ios device.
     */
    isIOSDevice(): boolean {
        return this.isIOS;
    }

    /**
     * If this device is an android device.
     * @returns Whether this device is an android device.
     */
    isAndroidDevice(): boolean {
        return this.isAndroid;
    }

    /**
     * Gets the device's current RAM. Only works in a cordova environment.
     * @returns The device's current RAM
     */
    getDeviceRAM(): number | undefined {
        if (typeof(navigator) !== 'undefined') {
            return (navigator as any).deviceMemory;
        }
    }

    /**
     * Creates a controller component with the passed options.
     * @param pOptions - The options of this controller.
     * @returns A new controller component
     */
    createController(pOptions: ControllerOptions): Controller {
        if (this.recycledControllers.length) {
            const controller = this.recycledControllers.pop()!;
            controller.build(pOptions);
            return controller;
        }
        return new Controller(pOptions);
    }

    /**
     * Handler event for when the window resizes.
     * @param pWidth - The window's new width.
     * @param pHeight - The window's new height.
     */
    windowResizeHandler(pWidth: number, pHeight: number): void {
        this.xCenterScreenPosition = pWidth / 2;
        this.windowSize.width = pWidth;
        this.windowSize.height = pHeight;
        for (const controller of this.activeControllers) {
            const components = controller.getComponents();
            if (components?.joyring.edgeLock) {
                components.joyring.originalPos = { 'x': components.joyring.x, 'y': components.joyring.y };
            }
            if (components?.joystick.edgeLock) {
                components.joystick.originalPos = { 'x': components.joystick.x, 'y': components.joystick.y };
            }
        }
    }

    /**
     * Gets the instance that the user tapped if there was one.
     * @param pX - The x position on the screen where the user tapped.
     * @param pY - The y position on the screen where the user tapped.
     * @returns The instance that was tapped or null if nothing was touched.
     */
    getDiobUnderFinger(pX: number, pY: number): any {
        const screenScale = VYLO.Client.getScreenScale();
        const mapVector = VYLO.Client.getPosFromScreen(pX / screenScale.x, pY / screenScale.y);
        let mapDiobs: any[];
        if (!VYLO.Client.mob) return;
        if (!VYLO.Client.mob.mapName) {
            mapDiobs = [];
        } else {
            mapDiobs = VYLO.Map.getDiobsByPos(VYLO.Client.mob.mapName, mapVector.x, mapVector.y);
        }
        const screenDiobs = VYLO.Client.getInterfaceElementsFromScreen(pX, pY, null, null, null, null, true);
        let highestLayeredScreenDiob: any;
        let highestLayedMapDiob: any;

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
        
        for (let j = 0; j < mapDiobs.length; j++) {
            if (mapDiobs[j].touchOpacity) {
                return mapDiobs[j];
            }
        }
        
        return null;
    }

    /**
     * Sets the needed event handlers for this module.
     */
    registerEventHandlers(): void {
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
        window.addEventListener('gesturestart', function(pEvent: Event) {pEvent.preventDefault()}, { 'passive': false });
        window.addEventListener('gesturechange', function(pEvent: Event) {pEvent.preventDefault()}, { 'passive': false });
    }

    /**
     * Queries the safe area inset values set by the device and stores them.
     */
    querySafeAreaValues(): void {
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

        this.safeAreaValues = {
            top: safeAreaInsetTop,
            right: safeAreaInsetRight,
            bottom: safeAreaInsetBottom,
            left: safeAreaInsetLeft
        }
    }

    queryUserAgent(): void {
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isAndroid = /Android/.test(navigator.userAgent);
        this.isTouchEnabled = 'ontouchstart' in window || ((window as any).DocumentTouch && document instanceof (window as any).DocumentTouch) || navigator.maxTouchPoints > 0 || (window.navigator as any).msMaxTouchPoints > 0;
        this.isMobile = this.detectDeviceType() === 'mobile';
    }

    /**
     * Starts internally tracking this instance.
     * @param pTouchedInstance - The instance that needs to be tracked.
     */
    track(pTouchedInstance: any): void {
        if (!pTouchedInstance) {
            return;
        }
        this.instanceWeakMap.set(pTouchedInstance, {
            trackedTouches: [],
            slidOff: false
        });

        this.touchedInstances.push(pTouchedInstance);
    }

    /**
     * Checks if the instance that was touched is being tracked internally.
     * @param pTouchedInstance - The instance that needs to be tracked.
     * @return Whether pTouchedInstance is being tracked.
     */
    isTracking(pTouchedInstance: any): boolean {
        if (!pTouchedInstance) {
            return false;
        }
        const isTracked = !!(this.instanceWeakMap.get(pTouchedInstance) && this.touchedInstances.includes(pTouchedInstance));
        return isTracked;
    }

    /**
     * Returns the tracker object associated with pTouchedInstance if it exists.
     * @param pTouchedInstance - The instance that needs to be tracked.
     * @returns The tracker object associated with pTouchedInstance if it exists. undefined if not.
     */
    getTrackerObject(pTouchedInstance: any): TrackerObject | undefined {
        return this.instanceWeakMap.get(pTouchedInstance);
    }

    /**
     * Handles when a finger is placed onto the screen in a zone
     * @param pX - The x position on the screen where the user tapped.
     * @param pY - The y position on the screen where the user tapped.
     * @param pFingerID - The ID of the finger
     */
    handleZoneTouch(pX: number, pY: number, pFingerID: number): void {
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
     * @param pFingerID - The ID of the finger.
     */
    handleZoneRelease(pFingerID: number): void {
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
     * @param pX - The x position on the screen where the user tapped.
     * @param pY - The y position on the screen where the user tapped.
     * @param pFingerID - The ID of the finger
     */
    handleZoneMove(pX: number, pY: number, pFingerID: number): void {
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
     * @param pEvent - Represents an event which takes place in the DOM.
     */
    handleStart(pEvent: TouchEvent): void {
        const touches = pEvent.changedTouches;
        const bodyRect = document.getElementById('game_body')!.getBoundingClientRect();
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
                
                if (typeof(touchedInstance.onTouchBegin) === 'function') {
                    let spriteRelativeX: number;
                    let spriteRelativeY: number;
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
                    touchedInstanceTracker!.trackedTouches.push(fingerID);
                // If you do not have `multitouch` enabled, then you can only touch one thing at a time					
                } else if (touchedInstanceTracker!.trackedTouches.length === 0) {
                    touchedInstanceTracker!.trackedTouches.push(fingerID);
                }
                // Check if the instance that was touched was a mobile controller that is controlled by this module
                if (touchedInstance.isMobileHandlerController) {
                    const joyring = touchedInstance;
                    joyring.controller.update(x, y, true);
                }
            }
        }
        if (pEvent.target && ((pEvent.target as Element).closest('.web_box') || (pEvent.target as Element).matches('.web_box'))) {
            return;
        }
        // Prevent browser default (dragging body around and zooming and etc)
        pEvent.preventDefault();
    }

    /**
     * The event function called when a touch ends.
     * @param pEvent - Represents an event which takes place in the DOM.
     */
    handleEnd(pEvent: TouchEvent): void {
        const touches = pEvent.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            const touchX = touches[i].clientX;
            const touchY = touches[i].clientY;
            const touchedInstance = this.getDiobUnderFinger(touchX, touchY);
            const fingerID = touches[i].identifier;
            let spriteRelativeX: number;
            let spriteRelativeY: number;
            
            // You are removing the finger matching fingerID from the screen, so we need to handle the zone being released by that finger if applicable
            this.handleZoneRelease(fingerID);
            
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
                    
                    if (touchedInstance.touchOpacity === MobileHandlerSingleton.MULTI_TOUCH) {
                        touchedInstance.onTouchFinish(VYLO.Client, spriteRelativeX, spriteRelativeY, fingerID);
                    } else if (touchedInstanceTracker!.trackedTouches.includes(fingerID)) {
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
                if (touchedInstanceTracker!.trackedTouches.includes(fingerID)) {
                    // Remove this finger from being tracked
                    touchedInstanceTracker!.trackedTouches.splice(touchedInstanceTracker!.trackedTouches.indexOf(fingerID), 1);
                    
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
                    if (touchedInstanceTracker!.slidOff) {
                        touchedInstanceTracker!.slidOff = false;
                    }

                    // Check if this instance is a mobile controller handled by this module so that the release API can be called
                    if (touchedInstance.isMobileHandlerController) {
                        const joyring = touchedInstance;
                        // We removed this finger from the tracker earlier, so if this was the last finger on the joyring then release it
                        if (!touchedInstanceTracker!.trackedTouches.length) {
                            joyring.controller.release();
                        }
                    }
                    
                    // If there are no more fingers touching this instance then we remove this instance from being considered to be touched.
                    if (!touchedInstanceTracker!.trackedTouches.length) {
                        // Remove this instance from being tracked as touched
                        this.touchedInstances.splice(j, 1);
                    }
                }
            }
        }
    }

    /**
     * The event function called when a touch is canceled.
     * @param pEvent - Represents an event which takes place in the DOM.
     */
    handleCancel(pEvent: TouchEvent): void {
        this.handleEnd(pEvent);
        if (typeof(VYLO.Client.onTouchAbort) === 'function') {
            VYLO.Client.onTouchAbort();
        }
        // Remove all touchedInstances since this was a touchCancel event, you must of hit some UI, meaning all fingers should be considered null and void
        for (let j = this.touchedInstances.length - 1; j >= 0; j--) {
            const instance = this.touchedInstances[j];
            // Get a reference to the tracker object associated with this instance that was touched
            const touchedInstanceTracker = this.getTrackerObject(instance);
            touchedInstanceTracker!.trackedTouches = [];
            this.touchedInstances.splice(j, 1);
        }
    }

    /**
     * The event function called when a touch is moved.
     * @param pEvent - Represents an event which takes place in the DOM.
     */
    handleMove(pEvent: TouchEvent): void {
        const touches = pEvent.changedTouches;
        const bodyRect = document.getElementById('game_body')!.getBoundingClientRect();
        const xBodyPos = bodyRect.x;
        const yBodyPos = bodyRect.y;

        for (let i = 0; i < touches.length; i++) {
            const touchX = touches[i].clientX;
            const touchY = touches[i].clientY;
            const x = Math.floor((touchX - xBodyPos)) / mainM.scaleWidth; // find a better way to calcuate this value instead of relying on the engine's variable
            const y = Math.floor((touchY - yBodyPos)) / mainM.scaleHeight; // find a better way to calcuate this value instead of relying on the engine's variable
            const touchedInstance = this.getDiobUnderFinger(touchX, touchY);
            const fingerID = touches[i].identifier;
            let spriteRelativeX: number;
            let spriteRelativeY: number;
            
            // When a finger moves on the screen we need to update the zones for the mobile controllers
            this.handleZoneMove(x, y, fingerID);

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
                    } else if (touchedInstanceTracker!.trackedTouches.includes(fingerID)) {
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
                if (touchedInstanceTracker!.trackedTouches.includes(fingerID)) {
                    if (instance !== touchedInstance) {
                        if (!touchedInstanceTracker!.slidOff) {
                            if (typeof(instance.onTouchSlideEnd) === 'function') {
                                touchedInstanceTracker!.slidOff = true;
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
