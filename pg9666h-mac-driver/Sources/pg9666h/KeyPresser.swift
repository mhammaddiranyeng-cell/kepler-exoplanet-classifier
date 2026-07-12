import CoreGraphics
import Foundation

/// Posts synthetic keyboard events to the system. Requires the host terminal
/// app to have Accessibility permission (System Preferences > Security &
/// Privacy > Privacy > Accessibility).
final class KeyPresser {
    private let source = CGEventSource(stateID: .hidSystemState)
    private var pressed = Set<CGKeyCode>()

    func set(key name: String, down: Bool) {
        guard let code = keycodes[name] else {
            FileHandle.standardError.write(
                "Unknown key name in mapping: \"\(name)\"\n".data(using: .utf8)!)
            return
        }
        set(code: code, down: down)
    }

    private func set(code: CGKeyCode, down: Bool) {
        if down {
            guard pressed.insert(code).inserted else { return }
        } else {
            guard pressed.remove(code) != nil else { return }
        }
        CGEvent(keyboardEventSource: source, virtualKey: code, keyDown: down)?
            .post(tap: .cghidEventTap)
    }

    /// Lets go of everything, so quitting the driver (or unplugging the pad)
    /// never leaves a key stuck down.
    func releaseAll() {
        for code in pressed {
            CGEvent(keyboardEventSource: source, virtualKey: code, keyDown: false)?
                .post(tap: .cghidEventTap)
        }
        pressed.removeAll()
    }
}
