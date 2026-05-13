import Foundation

enum Validation {
    static func validateMessage(_ message: String) -> String? {
        let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return "Message cannot be empty" }
        if message.count > 5000 { return "Message must be less than 5000 characters" }
        return nil
    }

    static func validateUnlockTime(_ unlockTime: Date) -> String? {
        let now = Date()
        if unlockTime <= now { return "Unlock time must be in the future" }

        let maxFuture = now.addingTimeInterval(10 * 365 * 24 * 3600)
        if unlockTime > maxFuture { return "Unlock time cannot be more than 10 years in the future" }

        let minFuture = now.addingTimeInterval(60)
        if unlockTime < minFuture { return "Unlock time must be at least 1 minute in the future" }

        return nil
    }

    static func validateFileSize(_ data: Data) -> String? {
        let maxSize = 10 * 1024 * 1024
        if data.count > maxSize { return "File is too large. Max size is 10MB" }
        return nil
    }
}
