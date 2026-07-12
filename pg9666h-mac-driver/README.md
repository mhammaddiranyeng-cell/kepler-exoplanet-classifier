# iPega PG-9666H userspace driver for macOS (Monterey and later)

A small command-line tool that makes the iPega PG-9666H Bluetooth gamepad
usable on a Mac by translating its buttons, d-pad, and analog sticks into
keyboard presses. It works with any game or app that accepts keyboard input —
including games that have no controller support at all.

## Why this is not a kernel driver

On modern macOS, third-party kernel extensions (kexts) are deprecated and
DriverKit system extensions require special entitlements granted by Apple.
Neither is appropriate (or necessary) for a gamepad. Instead, this tool is a
**userspace HID driver**: it reads the controller through Apple's public
`IOHIDManager` API and posts synthetic keyboard events through
`CGEvent`. No kernel code, no disabling System Integrity Protection, nothing
to break on OS updates.

## Before you build anything: try native support first

macOS Monterey already supports many HID gamepads through the built-in Game
Controller framework. If the game you want to play has controller support,
try this first:

1. Turn the controller off, then power it on in its gamepad mode. iPega pads
   remember the last mode used and switch modes with HOME + face-button
   combinations at power-on (the exact combos vary by firmware revision —
   check the quick-start card that came with the pad).
2. Open **System Preferences > Bluetooth**, put the pad in pairing mode
   (usually holding HOME or HOME+X until the LEDs flash rapidly), and pair it.
3. Test in a game with native controller support.

If that works for your games, you don't need this tool. Use this driver when
games ignore the pad, or when you want to play keyboard-only games with it.

## Requirements

- macOS 12 Monterey or later
- Xcode Command Line Tools (`xcode-select --install`)
- The PG-9666H paired over Bluetooth (see above)

## Build and install

```sh
cd pg9666h-mac-driver
make build
sudo make install
```

`make build` compiles with `swiftc` directly, so the Command Line Tools are
enough — full Xcode is not required. (`swift build -c release` also works via
Package.swift, but only with full Xcode installed, because the standalone
Command Line Tools ship without SwiftPM's `PackageDescription` library.)

`sudo make install` puts the binary at `/usr/local/bin/pg9666h` and is
optional; you can also run it straight from `build/pg9666h`.

## Grant permissions (one-time)

macOS gates both halves of what this tool does, so the **terminal app you run
it from** (Terminal, iTerm2, ...) needs two permissions in
**System Preferences > Security & Privacy > Privacy**:

- **Input Monitoring** — required to read the gamepad's HID reports.
- **Accessibility** — required to post the synthetic key presses.

If the tool prints an error opening the HID manager, or keys never arrive in
apps, these permissions are the reason. Quit and reopen the terminal after
granting them.

## Usage

```sh
pg9666h list       # show every HID device macOS can see (find your pad)
pg9666h inspect    # print live button/axis events from the pad
pg9666h run        # start translating gamepad input into key presses
pg9666h run --config my-mapping.json
```

Typical first session:

1. `pg9666h list` — confirm the pad shows up and note its vendor/product IDs.
2. `pg9666h inspect` — press every button and move both sticks; write down
   which button numbers and axis names your pad reports (they differ between
   the pad's power-on modes).
3. Copy `mapping.default.json` to `~/.config/pg9666h/mapping.json` and edit
   it to match what you saw.
4. `pg9666h run` — leave it running while you play. Ctrl-C releases all keys
   and exits cleanly.

## Mapping file

`run` loads `~/.config/pg9666h/mapping.json` (or the file given with
`--config`), falling back to a built-in default. The format:

```json
{
  "vendorID": 1234,
  "productID": 5678,
  "buttons": { "1": "z", "2": "x", "10": "return" },
  "axes": {
    "x": { "negative": "left", "positive": "right", "deadzone": 0.4 }
  },
  "hat": { "up": "up", "down": "down", "left": "left", "right": "right" }
}
```

- `vendorID` / `productID` are optional but important: besides keeping the
  driver off other connected gamepads, they make it match the device **by ID
  even when the pad advertises a nonstandard HID usage** — which the
  PG-9666H does in its wireless "Xbox" mode. Use the decimal values that
  `pg9666h list` prints in parentheses.
- `buttons` maps button numbers from `inspect` to key names. Buttons the pad
  reports on the Consumer page (menu/home/share in Xbox mode) show up as
  `c<number>` — e.g. `"c548": "escape"`.
- `axes` maps stick axes (`x`, `y` = left stick; `z`, `rz` = right stick on
  most modes; some modes use `rx`/`ry`) to a key for each direction.
  `deadzone` is how far (0–1) the stick must travel before the key fires.
  Analog triggers in Xbox mode appear as the one-directional axes `brake`
  (left) and `accelerator` (right); only their `positive` key is used.
- `hat` maps the d-pad. Diagonals hold both keys, as a real keyboard would.

### Key names

Letters `a`–`z`, digits `0`–`9`, `return`, `tab`, `space`, `delete`,
`escape`, `command`, `shift`, `capslock`, `option`, `control`, `f1`–`f12`,
`left`, `right`, `up`, `down`. (These are US-layout virtual keycodes; on
other layouts the letter printed may differ from the key name.)

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `error: no such module 'PackageDescription'` | You ran `swift build` with only the Command Line Tools installed. Use `make build` instead (it calls `swiftc` directly). |
| `list` doesn't show the pad | Re-pair in Bluetooth preferences; try a different power-on mode combo; charge the pad. |
| `run` exits with an IOReturn error | Grant Input Monitoring to your terminal app, then relaunch it. (`list` ignores open errors entirely — enumerating devices always trips exclusive-access failures on system-owned devices, which is harmless.) |
| Events print in `inspect` but games see nothing | Grant Accessibility to your terminal app, then relaunch it. |
| Stick "presses" keys while centered | Raise that axis's `deadzone` (worn sticks drift). |
| Buttons are numbered differently than the default mapping | Normal — numbering depends on the pad's power-on mode. Use `inspect` and edit your mapping. |
| Pad appears in `list` (often named "Xbox Wireless Contrloler") but `run` ignores it | The pad's wireless mode advertises a nonstandard usage. Set `vendorID`/`productID` in your mapping so the driver matches it by ID. |
| `inspect` shows digitizer/touch events instead of `button N` lines | The pad booted in touch-screen emulation mode (meant for phones): buttons fake screen taps at preset spots and can't be mapped individually. Power it off, power it on holding its gamepad-mode combo (on iPega pads usually HOME plus one of X/A/B/Y — try HOME+X first), forget the old entry in Bluetooth preferences, and pair again. `list` should then show usage 1/4 or 1/5 with the `<-- gamepad` tag. The pad may present different vendor/product IDs per mode — update the mapping pin if they changed. |
| A key gets stuck down | Shouldn't happen (disconnects and Ctrl-C release everything), but tapping the physical key clears it. |

## Limitations

- Output is keyboard-only. It does not emulate a virtual Xbox/PlayStation
  controller (macOS has no public API for creating virtual game controllers),
  so games that *require* a recognized controller should use the pad's native
  mode instead.
- Analog sticks become digital key presses (with a configurable deadzone) —
  fine for platformers/emulators, not for analog steering.
- Rumble/turbo features of the PG-9666H are not exposed.
