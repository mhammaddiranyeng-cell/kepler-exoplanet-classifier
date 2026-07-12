import Foundation

let usageText = """
pg9666h — userspace driver for the iPega PG-9666H gamepad on macOS

USAGE:
  pg9666h list                 List every HID device the system can see
  pg9666h inspect              Print live input events from any connected gamepad
  pg9666h run [--config FILE]  Translate gamepad input into keyboard presses
  pg9666h help                 Show this help

`run` looks for a mapping file at ~/.config/pg9666h/mapping.json when
--config is not given, and falls back to the built-in default mapping.
Use `inspect` to discover which button numbers and axis names your
controller reports, then edit the mapping file to taste.
"""

func fail(_ message: String) -> Never {
    FileHandle.standardError.write((message + "\n").data(using: .utf8)!)
    exit(1)
}

var args = Array(CommandLine.arguments.dropFirst())
let command = args.isEmpty ? "run" : args.removeFirst()

switch command {
case "list":
    HIDDriver(mode: .list, mapping: .default).start()
case "inspect", "run":
    var configPath: String?
    var index = 0
    while index < args.count {
        if args[index] == "--config" {
            guard index + 1 < args.count else { fail("--config requires a file path") }
            configPath = args[index + 1]
            index += 2
        } else {
            fail("Unknown option: \(args[index])\n\n\(usageText)")
        }
    }
    // inspect loads the mapping too: its vendorID/productID pin is how the
    // driver finds pads that advertise a nonstandard primary usage.
    let mapping = Mapping.load(explicitPath: configPath)
    HIDDriver(mode: command == "run" ? .run : .inspect, mapping: mapping).start()
case "help", "--help", "-h":
    print(usageText)
default:
    fail("Unknown command: \(command)\n\n\(usageText)")
}
