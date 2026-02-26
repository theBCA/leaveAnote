import Foundation

enum Helpers {
    static func calculateCountdown(to unlockTime: Date) -> CountdownTime {
        let now = Date()
        let diff = unlockTime.timeIntervalSince(now)

        if diff <= 0 {
            return .zero
        }

        let totalSeconds = Int(diff)
        let days = totalSeconds / 86400
        let hours = (totalSeconds % 86400) / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60

        return CountdownTime(days: days, hours: hours, minutes: minutes, seconds: seconds, isExpired: false)
    }

    static func formatCountdown(_ c: CountdownTime) -> String {
        if c.isExpired { return "Time has arrived!" }

        var parts: [String] = []
        if c.days > 0 { parts.append("\(c.days)d") }
        if c.hours > 0 { parts.append("\(c.hours)h") }
        if c.minutes > 0 { parts.append("\(c.minutes)m") }
        if c.seconds > 0 || parts.isEmpty { parts.append("\(c.seconds)s") }
        return parts.joined(separator: " ")
    }

    static func formatDateTime(_ date: Date, timezone: String? = nil) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        if let tz = timezone { formatter.timeZone = TimeZone(identifier: tz) }
        return formatter.string(from: date)
    }

    static func makeShareLinks(noteId: String, senderToken: String) -> ShareLinks {
        let base = "https://leaveanote.web.app"
        return ShareLinks(
            recipientLink: "\(base)/note/\(noteId)",
            senderLink: "\(base)/manage/\(noteId)/\(senderToken)",
            noteId: noteId
        )
    }
}
