import Foundation
import FirebaseFirestore

enum NoteStatus: String, Codable {
    case pending
    case revealed
    case read
}

struct NoteData: Identifiable {
    let id: String
    var message: String
    let unlockTime: Date
    let createdAt: Date
    var status: NoteStatus
    let senderToken: String
    var mediaUrls: [String]
    let timezone: String
    var revealedAt: Date?
    var readAt: Date?

    init(id: String, data: [String: Any]) {
        self.id = id
        self.message = data["message"] as? String ?? ""
        self.unlockTime = (data["unlockTime"] as? Timestamp)?.dateValue() ?? Date()
        self.createdAt = (data["createdAt"] as? Timestamp)?.dateValue() ?? Date()
        self.status = NoteStatus(rawValue: data["status"] as? String ?? "pending") ?? .pending
        self.senderToken = data["senderToken"] as? String ?? ""
        self.mediaUrls = data["mediaUrls"] as? [String] ?? []
        self.timezone = data["timezone"] as? String ?? TimeZone.current.identifier
        self.revealedAt = (data["revealedAt"] as? Timestamp)?.dateValue()
        self.readAt = (data["readAt"] as? Timestamp)?.dateValue()
    }
}

struct CreateNoteInput {
    let message: String
    let unlockTime: Date
    let imageData: [Data]
    let timezone: String
}

struct CountdownTime {
    let days: Int
    let hours: Int
    let minutes: Int
    let seconds: Int
    let isExpired: Bool

    static let zero = CountdownTime(days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true)
}

struct ShareLinks {
    let recipientLink: String
    let senderLink: String
    let noteId: String
}
