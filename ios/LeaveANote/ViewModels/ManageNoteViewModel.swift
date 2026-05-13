import Foundation
import FirebaseFirestore

@MainActor
final class ManageNoteViewModel: ObservableObject {
    @Published var note: NoteData?
    @Published var isLoading = true
    @Published var isAuthorized = false
    @Published var countdown: CountdownTime = .zero
    @Published var isEditing = false
    @Published var editMessage = ""
    @Published var linkCopied = false

    let noteId: String
    let token: String

    private var listener: ListenerRegistration?
    private var timer: Timer?

    init(noteId: String, token: String) {
        self.noteId = noteId
        self.token = token
    }

    var recipientLink: String {
        "https://leaveanote.web.app/note/\(noteId)"
    }

    var canEdit: Bool { note?.status == .pending }

    func verify() async {
        let valid = await FirebaseService.shared.verifySenderToken(noteId, token: token)
        isAuthorized = valid

        if valid {
            listener = FirebaseService.shared.subscribeToNote(noteId) { [weak self] note in
                Task { @MainActor in
                    self?.isLoading = false
                    self?.note = note
                    if let msg = note?.message {
                        self?.editMessage = msg
                    }
                    self?.updateCountdown()
                }
            }
            startTimer()
        } else {
            isLoading = false
        }
    }

    func stopListening() {
        listener?.remove()
        timer?.invalidate()
    }

    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.updateCountdown() }
        }
    }

    private func updateCountdown() {
        guard let note = note else { return }
        countdown = Helpers.calculateCountdown(to: note.unlockTime)
    }

    func saveEdit() async -> Bool {
        if let error = Validation.validateMessage(editMessage) {
            return false
        }

        do {
            try await FirebaseService.shared.updateNoteContent(noteId, senderToken: token, message: editMessage)
            isEditing = false
            return true
        } catch {
            return false
        }
    }

    func deleteNote() async -> Bool {
        do {
            try await FirebaseService.shared.deleteNote(noteId, senderToken: token)
            return true
        } catch {
            return false
        }
    }

    func copyLink() {
        UIPasteboard.general.string = recipientLink
        linkCopied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            self.linkCopied = false
        }
    }
}
