# InputBridge

InputBridge is an independent Chrome extension that maps keyboard and mouse input to a virtual standard gamepad for Xbox Cloud Gaming. It includes adjustable bindings, smart profiles, optional mouse look, page theming, and local diagnostics.

This repository is publicly visible for reference. The project is proprietary; its code and assets may not be used, copied, modified, or redistributed without written permission.

> InputBridge is not affiliated with, endorsed by, or sponsored by Microsoft or Xbox. Xbox and Xbox Cloud Gaming are trademarks of the Microsoft group of companies.

## Highlights

- Fully adjustable keyboard and mouse bindings
- Default, Shooter, Racing, Adventure, Platformer, Sports, and Custom profiles
- Optional automatic profile guesses based on the visible game title
- In-page connection notice showing the selected profile
- Mouse-to-right-stick input; press the backtick key (`) in-game to capture or release the pointer
- Smooth stick ramping for less abrupt keyboard steering
- Custom page palettes, colors, radius, glow, and subtle/full theme reach
- Import and export of settings
- Optional debug overlay and console logging
- No analytics, accounts, advertising, or external network service

## Install from source

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome or another Chromium browser.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the InputBridge folder.
5. Reload any open Xbox Cloud Gaming tab.

Click the InputBridge toolbar icon to access every control. The complete menu lives inside the extension popup; InputBridge does not open a separate settings tab.

## Profiles and automatic detection

Auto-detection uses a small, transparent keyword list in `shared.js`. It reads the game title already visible in the page and selects a broad control category. It does not identify users, inspect account data, or send anything over the network. Unknown titles use the Default profile.

Automatic choices are guesses. Games within the same genre can use different controller layouts, so users can select a fixed profile or copy any built-in profile into Custom and edit it.

## Page themes

InputBridge page themes adjust common interface surfaces, focus rings, selection colors, scrollbars, and corner radius. They do not alter the game video stream. Since the Xbox website can change independently, a future site update may require selector maintenance.

## Development

There is no build step and no runtime dependency. The repository is the unpacked extension.

```text
manifest.json          Chrome Manifest V3 configuration
shared.js              defaults, profiles, and title-category rules
bridge.js              input capture, game detection, notices, and page theme
background.js          reliable page-theme insertion through Chrome
virtual-gamepad.js     page-world virtual Gamepad API implementation
popup.*                complete tabbed settings menu
```

Before submitting a change, validate every JavaScript file with `node --check` and confirm that `manifest.json` parses as JSON. Test Default and Custom profiles in a live cloud session.

## Responsible use

InputBridge changes input method only. It should not automate play, manipulate game statistics, evade access controls, or provide unfair multiplayer behavior. Users remain responsible for following Microsoft’s terms and each game’s rules.

## License

Proprietary. All rights reserved. See [LICENSE](LICENSE).
