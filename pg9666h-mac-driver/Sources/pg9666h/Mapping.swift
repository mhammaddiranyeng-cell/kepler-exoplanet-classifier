import Foundation

/// A user-editable description of how gamepad controls translate into
/// keyboard presses. Loaded from JSON; see mapping.default.json.
struct Mapping: Codable {
    struct Axis: Codable {
        /// Key held while the axis is pushed toward its minimum (left / up).
        var negative: String?
        /// Key held while the axis is pushed toward its maximum (right / down).
        var positive: String?
        /// Fraction of travel (0...1) the stick must move before a key fires.
        var deadzone: Double?
    }

    /// Optional filter so only the iPega pad is captured. Find the values
    /// with `pg9666h list` and set them if another gamepad is also connected.
    var vendorID: Int?
    var productID: Int?

    /// Button number (as reported by `pg9666h inspect`) -> key name.
    var buttons: [String: String]
    /// Axis name ("x", "y", "z", "rx", "ry", "rz", "slider") -> mapping.
    var axes: [String: Axis]
    /// D-pad direction ("up", "down", "left", "right") -> key name.
    var hat: [String: String]

    static let defaultConfigPath =
        NSString(string: "~/.config/pg9666h/mapping.json").expandingTildeInPath

    /// Built-in mapping used when no config file exists. Arrow keys on the
    /// d-pad and left stick, letters on the face/shoulder buttons.
    static let `default` = Mapping(
        vendorID: nil,
        productID: nil,
        buttons: [
            "1": "z",       // A
            "2": "x",       // B
            "3": "a",       // X
            "4": "s",       // Y
            "5": "q",       // L1
            "6": "w",       // R1
            "7": "e",       // L2
            "8": "r",       // R2
            "9": "tab",     // select
            "10": "return", // start
            "11": "shift",  // L3 (stick click)
            "12": "space"   // R3 (stick click)
        ],
        axes: [
            "x": Axis(negative: "left", positive: "right", deadzone: 0.4),
            "y": Axis(negative: "up", positive: "down", deadzone: 0.4),
            "z": Axis(negative: "left", positive: "right", deadzone: 0.4),
            "rz": Axis(negative: "up", positive: "down", deadzone: 0.4)
        ],
        hat: [
            "up": "up",
            "down": "down",
            "left": "left",
            "right": "right"
        ]
    )

    static func load(explicitPath: String?) -> Mapping {
        let path = explicitPath ?? defaultConfigPath
        guard FileManager.default.fileExists(atPath: path) else {
            if let explicitPath = explicitPath {
                fail("Mapping file not found: \(explicitPath)")
            }
            print("No mapping file at \(path); using the built-in default mapping.")
            return .default
        }
        do {
            let data = try Data(contentsOf: URL(fileURLWithPath: path))
            let mapping = try JSONDecoder().decode(Mapping.self, from: data)
            print("Loaded mapping from \(path)")
            return mapping
        } catch {
            fail("Could not parse \(path): \(error)")
        }
    }
}
