// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "PG9666HDriver",
    platforms: [
        .macOS(.v12) // Monterey
    ],
    targets: [
        .executableTarget(
            name: "pg9666h",
            path: "Sources/pg9666h"
        )
    ]
)
