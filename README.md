# MobileHandler Module

The MobileHandler module provides a user-friendly interface for game developers to integrate touch-based controls for their game characters on mobile devices. It offers features for creating a visual joystick on the screen and facilitates mobile device interaction, including accessing device information and triggering device vibrations.

## Installation

### ES Module

```js
import { MobileHandler } from './mobile-handler.mjs';
```

### IIFE (Immediately Invoked Function Expression)

```js
<script src="mobile-handler.js"></script>;
// ...
window.MobileHandlerBundle.MobileHandler;
```

### CommonJS (CJS) Module

```js
const { MobileHandler } = require('./mobile-handler.cjs.js');
```

### Global Dependency

MobileHandler relies on the `VYLO` variable being globally accessible.