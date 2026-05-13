import Foundation
import FirebaseFirestore
import FirebaseStorage

final class FirebaseService {
    static let shared = FirebaseService()

    private let db = Firestore.firestore()
    private let storage = Storage.storage()
    private let collection = "notes"

    private init() {}

    // MARK: - Create

    func createNote(_ input: CreateNoteInput) async throws -> (noteId: String, senderToken: String) {
        let noteId = UUID().uuidString.lowercased()
        let senderToken = generateToken()
        let encryptedMessage = EncryptionService.encrypt(input.message)

        var mediaUrls: [String] = []
        for (index, data) in input.imageData.enumerated() {
            let ref = storage.reference().child("notes/\(noteId)/attachment_\(index).jpg")
            _ = try await ref.putDataAsync(data)
            let url = try await ref.downloadURL()
            mediaUrls.append(url.absoluteString)
        }

        let noteData: [String: Any] = [
            "message": encryptedMessage,
            "unlockTime": Timestamp(date: input.unlockTime),
            "createdAt": Timestamp(date: Date()),
            "status": NoteStatus.pending.rawValue,
            "senderToken": senderToken,
            "mediaUrls": mediaUrls,
            "timezone": input.timezone,
        ]

        try await db.collection(collection).document(noteId).setData(noteData)
        return (noteId, senderToken)
    }

    // MARK: - Read

    func getNote(_ noteId: String) async throws -> NoteData? {
        let doc = try await db.collection(collection).document(noteId).getDocument()
        guard doc.exists, let data = doc.data() else { return nil }

        var note = NoteData(id: doc.documentID, data: data)
        note.message = EncryptionService.decrypt(note.message)
        return note
    }

    func subscribeToNote(_ noteId: String, completion: @escaping (NoteData?) -> Void) -> ListenerRegistration {
        return db.collection(collection).document(noteId)
            .addSnapshotListener { snapshot, error in
                guard let snapshot = snapshot, snapshot.exists,
                      let data = snapshot.data() else {
                    completion(nil)
                    return
                }

                var note = NoteData(id: snapshot.documentID, data: data)
                note.message = EncryptionService.decrypt(note.message)
                completion(note)
            }
    }

    // MARK: - Update

    func updateNoteStatus(_ noteId: String, status: NoteStatus) async throws {
        var updateData: [String: Any] = ["status": status.rawValue]

        if status == .revealed {
            updateData["revealedAt"] = Timestamp(date: Date())
        } else if status == .read {
            updateData["readAt"] = Timestamp(date: Date())
        }

        try await db.collection(collection).document(noteId).updateData(updateData)
    }

    func updateNoteContent(_ noteId: String, senderToken: String, message: String) async throws {
        guard let note = try await getNote(noteId) else {
            throw NSError(domain: "FirebaseService", code: 404, userInfo: [NSLocalizedDescriptionKey: "Note not found"])
        }
        guard note.senderToken == senderToken else {
            throw NSError(domain: "FirebaseService", code: 403, userInfo: [NSLocalizedDescriptionKey: "Unauthorized"])
        }
        guard note.status == .pending else {
            throw NSError(domain: "FirebaseService", code: 400, userInfo: [NSLocalizedDescriptionKey: "Cannot edit revealed note"])
        }

        let encrypted = EncryptionService.encrypt(message)
        try await db.collection(collection).document(noteId).updateData(["message": encrypted])
    }

    // MARK: - Delete

    func deleteNote(_ noteId: String, senderToken: String) async throws {
        guard let note = try await getNote(noteId) else {
            throw NSError(domain: "FirebaseService", code: 404, userInfo: [NSLocalizedDescriptionKey: "Note not found"])
        }
        guard note.senderToken == senderToken else {
            throw NSError(domain: "FirebaseService", code: 403, userInfo: [NSLocalizedDescriptionKey: "Unauthorized"])
        }

        for url in note.mediaUrls {
            try? await storage.reference(forURL: url).delete()
        }

        try await db.collection(collection).document(noteId).delete()
    }

    // MARK: - Verify

    func verifySenderToken(_ noteId: String, token: String) async -> Bool {
        guard let note = try? await getNote(noteId) else { return false }
        return note.senderToken == token
    }

    // MARK: - Helpers

    private func generateToken() -> String {
        var bytes = [UInt8](repeating: 0, count: 32)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        return bytes.map { String(format: "%02x", $0) }.joined()
    }
}
