import Foundation
import IOKit.hid

/// Userspace HID driver: attaches to gamepad-class HID devices through
/// IOHIDManager and, in `run` mode, feeds their input to a KeyPresser.
final class HIDDriver {
    enum Mode {
        case list     // enumerate all HID devices, then exit
        case inspect  // print raw gamepad events so users can build a mapping
        case run      // translate gamepad input into keyboard presses
    }

    private let mode: Mode
    private let mapping: Mapping
    private let manager = IOHIDManagerCreate(kCFAllocatorDefault, IOOptionBits(kIOHIDOptionsTypeNone))
    private let keys = KeyPresser()

    /// Devices that passed the vendor/product filter in the mapping.
    private var acceptedDevices = Set<IOHIDDevice>()

    /// Key names currently held because of the d-pad (hat switch).
    private var hatKeysDown = Set<String>()

    /// Key name currently held per analog axis, keyed by HID usage.
    private var axisKeyDown = [UInt32: String]()

    /// Last value printed per axis in inspect mode, to keep output readable.
    private var lastPrintedAxisValue = [UInt32: Double]()

    /// Whether the touch-emulation-mode warning has been shown.
    private var warnedTouchMode = false

    private var signalSource: DispatchSourceSignal?

    init(mode: Mode, mapping: Mapping) {
        self.mode = mode
        self.mapping = mapping
    }

    func start() {
        let context = Unmanaged.passUnretained(self).toOpaque()

        if mode == .list {
            IOHIDManagerSetDeviceMatching(manager, nil) // nil = match everything
        } else {
            // The PG-9666H shows up as one of these depending on which mode
            // it was powered on in.
            var gamepadLike: [[String: Int]] = [
                [kIOHIDDeviceUsagePageKey: kHIDPage_GenericDesktop,
                 kIOHIDDeviceUsageKey: kHIDUsage_GD_GamePad],
                [kIOHIDDeviceUsagePageKey: kHIDPage_GenericDesktop,
                 kIOHIDDeviceUsageKey: kHIDUsage_GD_Joystick],
                [kIOHIDDeviceUsagePageKey: kHIDPage_GenericDesktop,
                 kIOHIDDeviceUsageKey: kHIDUsage_GD_MultiAxisController]
            ]
            // In its BLE "Xbox" mode the PG-9666H advertises a nonstandard
            // primary usage, so a mapping that pins vendor/product IDs also
            // matches the device by ID, whatever usage it claims.
            if let vendor = mapping.vendorID {
                var byID = [kIOHIDVendorIDKey: vendor]
                if let product = mapping.productID {
                    byID[kIOHIDProductIDKey] = product
                }
                gamepadLike.append(byID)
            }
            IOHIDManagerSetDeviceMatchingMultiple(manager, gamepadLike as CFArray)
        }

        IOHIDManagerRegisterDeviceMatchingCallback(manager, { context, _, _, device in
            let driver = Unmanaged<HIDDriver>.fromOpaque(context!).takeUnretainedValue()
            driver.deviceConnected(device)
        }, context)

        IOHIDManagerRegisterDeviceRemovalCallback(manager, { context, _, _, device in
            let driver = Unmanaged<HIDDriver>.fromOpaque(context!).takeUnretainedValue()
            driver.deviceRemoved(device)
        }, context)

        IOHIDManagerRegisterInputValueCallback(manager, { context, _, _, value in
            let driver = Unmanaged<HIDDriver>.fromOpaque(context!).takeUnretainedValue()
            driver.handle(value)
        }, context)

        IOHIDManagerScheduleWithRunLoop(manager, CFRunLoopGetCurrent(),
                                        CFRunLoopMode.defaultMode.rawValue)

        let status = IOHIDManagerOpen(manager, IOOptionBits(kIOHIDOptionsTypeNone))

        if mode == .list {
            // Enumerating devices and reading their properties works even
            // when the open fails: matching every HID device always trips
            // kIOReturnExclusiveAccess on devices macOS itself holds
            // exclusively (built-in keyboard, trackpad, ...).
            listDevices()
            return
        }

        if status == Self.exclusiveAccessError {
            print("warning: another process holds exclusive access to a matched device; "
                + "continuing, but input from that device may not arrive.")
        } else if status != kIOReturnSuccess {
            fail("""
            Could not open the HID manager (IOReturn \(ioReturnHex(status))).
            Grant your terminal app "Input Monitoring" access in
            System Preferences > Security & Privacy > Privacy, then quit and
            reopen the terminal and try again.
            """)
        }

        switch mode {
        case .list:
            return // handled above
        case .inspect:
            print("Waiting for gamepad input. Press buttons / move sticks; Ctrl-C to quit.")
        case .run:
            installSigintHandler()
            print("Driver running: gamepad input is now translated to key presses. Ctrl-C to quit.")
        }

        CFRunLoopRun()
    }

    // MARK: - Devices

    private func deviceConnected(_ device: IOHIDDevice) {
        let name = stringProperty(device, kIOHIDProductKey) ?? "unknown device"
        let vendor = intProperty(device, kIOHIDVendorIDKey) ?? 0
        let product = intProperty(device, kIOHIDProductIDKey) ?? 0

        if let wanted = mapping.vendorID, wanted != vendor { return }
        if let wanted = mapping.productID, wanted != product { return }

        acceptedDevices.insert(device)
        print("Gamepad connected: \(name) (vendor \(hex(vendor)) (\(vendor)), product \(hex(product)) (\(product)))")
    }

    private func deviceRemoved(_ device: IOHIDDevice) {
        guard acceptedDevices.remove(device) != nil else { return }
        // Never leave keys wedged down when the pad sleeps or disconnects.
        keys.releaseAll()
        hatKeysDown.removeAll()
        axisKeyDown.removeAll()
        print("Gamepad disconnected.")
    }

    private func listDevices() {
        guard let devices = IOHIDManagerCopyDevices(manager) as? Set<IOHIDDevice>,
              !devices.isEmpty else {
            print("No HID devices found. Is the controller paired and awake?")
            return
        }
        print("HID devices currently visible to macOS:\n")
        for device in devices {
            let name = stringProperty(device, kIOHIDProductKey) ?? "unknown device"
            let vendor = intProperty(device, kIOHIDVendorIDKey) ?? 0
            let product = intProperty(device, kIOHIDProductIDKey) ?? 0
            let usagePage = intProperty(device, kIOHIDPrimaryUsagePageKey) ?? 0
            let usage = intProperty(device, kIOHIDPrimaryUsageKey) ?? 0
            let transport = stringProperty(device, kIOHIDTransportKey) ?? "?"
            let isGamepad = usagePage == kHIDPage_GenericDesktop
                && (usage == kHIDUsage_GD_GamePad
                    || usage == kHIDUsage_GD_Joystick
                    || usage == kHIDUsage_GD_MultiAxisController)
            let tag = isGamepad ? "  <-- gamepad" : ""
            print("  \(name): vendor \(hex(vendor)) (\(vendor)), product \(hex(product)) (\(product)), "
                + "usage \(usagePage)/\(usage), transport \(transport)\(tag)")
        }
        print("""

        Use the decimal vendor/product values (in parentheses) as vendorID /
        productID in your mapping file to pin the driver to one device. Pads
        that don't get the <-- gamepad tag need that pin to be picked up.
        """)
    }

    // MARK: - Input

    private func handle(_ value: IOHIDValue) {
        let element = IOHIDValueGetElement(value)
        let device = IOHIDElementGetDevice(element)
        guard acceptedDevices.contains(device) else { return }

        let usagePage = Int(IOHIDElementGetUsagePage(element))
        let usage = IOHIDElementGetUsage(element)
        let rawValue = IOHIDValueGetIntegerValue(value)

        if usagePage == kHIDPage_Button {
            handleButton(id: String(usage), pressed: rawValue != 0)
        } else if usagePage == kHIDPage_Consumer {
            // Xbox-mode pads put menu/home/share buttons on the Consumer
            // page; they appear as "c<usage>" in inspect and mappings.
            handleButton(id: "c\(usage)", pressed: rawValue != 0)
        } else if usagePage == kHIDPage_GenericDesktop {
            if Int(usage) == kHIDUsage_GD_Hatswitch {
                handleHat(element: element, rawValue: rawValue)
            } else {
                handleAxis(element: element, usage: usage, rawValue: rawValue)
            }
        } else if usagePage == kHIDPage_Simulation {
            handleTrigger(element: element, usage: usage, rawValue: rawValue)
        } else if usagePage == kHIDPage_Digitizer {
            if !warnedTouchMode {
                warnedTouchMode = true
                print("""

                note: this pad is sending touch-screen (digitizer) events, so it \
                booted in touch/mouse emulation mode, not a gamepad mode. Buttons \
                fake screen taps in this mode and cannot be mapped individually. \
                Power the pad off, then on with its gamepad-mode combo, and \
                re-pair (see README).

                """)
            }
            if mode == .inspect { print("touch usage \(usage) = \(rawValue)") }
        } else if mode == .inspect {
            print("other usage \(usagePage)/\(usage) = \(rawValue)")
        }
    }

    private func handleButton(id: String, pressed: Bool) {
        if mode == .inspect {
            print("button \(id) \(pressed ? "down" : "up")")
            return
        }
        guard let key = mapping.buttons[id] else { return }
        keys.set(key: key, down: pressed)
    }

    /// Hat switch values enumerate compass points clockwise from north;
    /// anything outside the logical range means "released".
    private static let hatDirections: [Set<String>] = [
        ["up"], ["up", "right"], ["right"], ["down", "right"],
        ["down"], ["down", "left"], ["left"], ["up", "left"]
    ]

    private func handleHat(element: IOHIDElement, rawValue: Int) {
        let index = rawValue - IOHIDElementGetLogicalMin(element)
        let directions: Set<String> =
            (0..<Self.hatDirections.count).contains(index) ? Self.hatDirections[index] : []

        if mode == .inspect {
            print("d-pad \(directions.isEmpty ? "released" : directions.sorted().joined(separator: "+"))")
            return
        }

        let wantedKeys = Set(directions.compactMap { mapping.hat[$0] })
        for key in hatKeysDown.subtracting(wantedKeys) { keys.set(key: key, down: false) }
        for key in wantedKeys.subtracting(hatKeysDown) { keys.set(key: key, down: true) }
        hatKeysDown = wantedKeys
    }

    private static let axisNames: [Int: String] = [
        kHIDUsage_GD_X: "x", kHIDUsage_GD_Y: "y", kHIDUsage_GD_Z: "z",
        kHIDUsage_GD_Rx: "rx", kHIDUsage_GD_Ry: "ry", kHIDUsage_GD_Rz: "rz",
        kHIDUsage_GD_Slider: "slider"
    ]

    private func handleAxis(element: IOHIDElement, usage: UInt32, rawValue: Int) {
        guard let name = Self.axisNames[Int(usage)] else { return }

        let min = IOHIDElementGetLogicalMin(element)
        let max = IOHIDElementGetLogicalMax(element)
        guard max > min else { return }
        // Normalize to -1.0 ... +1.0 regardless of the report's raw range.
        let normalized = (Double(rawValue - min) / Double(max - min)) * 2.0 - 1.0

        if mode == .inspect {
            let last = lastPrintedAxisValue[usage]
            if last == nil || abs(last! - normalized) >= 0.1 {
                lastPrintedAxisValue[usage] = normalized
                print(String(format: "axis %@ = %+.2f", name, normalized))
            }
            return
        }

        guard let axis = mapping.axes[name] else { return }
        let deadzone = axis.deadzone ?? 0.4

        var wantedKey: String?
        if normalized <= -deadzone {
            wantedKey = axis.negative
        } else if normalized >= deadzone {
            wantedKey = axis.positive
        }
        setAxisKey(slot: usage, wantedKey: wantedKey)
    }

    /// Analog triggers on Xbox-mode pads report on the Simulation page and
    /// rest at their minimum, so they map as one-directional axes: only
    /// `positive` fires, once travel (0...1) passes the deadzone.
    private static let triggerNames: [Int: String] = [
        kHIDUsage_Sim_Accelerator: "accelerator", // right trigger
        kHIDUsage_Sim_Brake: "brake"              // left trigger
    ]

    private func handleTrigger(element: IOHIDElement, usage: UInt32, rawValue: Int) {
        guard let name = Self.triggerNames[Int(usage)] else {
            if mode == .inspect { print("other usage \(kHIDPage_Simulation)/\(usage) = \(rawValue)") }
            return
        }

        let min = IOHIDElementGetLogicalMin(element)
        let max = IOHIDElementGetLogicalMax(element)
        guard max > min else { return }
        let travel = Double(rawValue - min) / Double(max - min) // 0...1

        if mode == .inspect {
            let last = lastPrintedAxisValue[usage]
            if last == nil || abs(last! - travel) >= 0.1 {
                lastPrintedAxisValue[usage] = travel
                print(String(format: "trigger %@ = %.2f", name, travel))
            }
            return
        }

        guard let axis = mapping.axes[name] else { return }
        let deadzone = axis.deadzone ?? 0.4
        setAxisKey(slot: usage, wantedKey: travel >= deadzone ? axis.positive : nil)
    }

    private func setAxisKey(slot: UInt32, wantedKey: String?) {
        let currentKey = axisKeyDown[slot]
        guard wantedKey != currentKey else { return }
        if let currentKey = currentKey { keys.set(key: currentKey, down: false) }
        if let wantedKey = wantedKey { keys.set(key: wantedKey, down: true) }
        axisKeyDown[slot] = wantedKey
    }

    // MARK: - Helpers

    /// kIOReturnExclusiveAccess; the C macro doesn't import into Swift.
    private static let exclusiveAccessError = IOReturn(bitPattern: 0xE00002C5)

    private func ioReturnHex(_ status: IOReturn) -> String {
        String(format: "0x%08X", UInt32(bitPattern: status))
    }

    private func installSigintHandler() {
        signal(SIGINT, SIG_IGN)
        let source = DispatchSource.makeSignalSource(signal: SIGINT, queue: .main)
        source.setEventHandler {
            self.keys.releaseAll()
            print("\nReleased all keys; exiting.")
            exit(0)
        }
        source.resume()
        signalSource = source
    }

    private func stringProperty(_ device: IOHIDDevice, _ key: String) -> String? {
        IOHIDDeviceGetProperty(device, key as CFString) as? String
    }

    private func intProperty(_ device: IOHIDDevice, _ key: String) -> Int? {
        (IOHIDDeviceGetProperty(device, key as CFString) as? NSNumber)?.intValue
    }

    private func hex(_ value: Int) -> String {
        "0x" + String(format: "%04X", UInt32(truncatingIfNeeded: value))
    }
}
