import Foundation
import FirebaseFirestore

@MainActor
final class ViewNoteViewModel: ObservableObject {
    @Published var note: NoteData?
    @Published var isLoading = true
    @Published var error: String?
    @Published var countdown: CountdownTime = .zero
    @Published var isRevealed = false

    private var listener: ListenerRegistration?
    private var timer: Timer?
    private var hasTriggeredReveal = false
    let noteId: String

    init(noteId: String) {
        self.noteId = noteId
    }

    func startListening() {
        listener = FirebaseService.shared.subscribeToNote(noteId) { [weak self] note in
            Task { @MainActor in
                self?.isLoading = false
                self?.note = note
                if note == nil { self?.error = "Note not found" }
                self?.checkReveal()
            }
        }
        startTimer()
    }

    func stopListening() {
        listener?.remove()
        timer?.invalidate()
    }

    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.updateCountdown()
            }
        }
    }

    private func updateCountdown() {
        guard let note = note else { return }
        countdown = Helpers.calculateCountdown(to: note.unlockTime)
        checkReveal()
    }

    private func checkReveal() {
        guard let note = note else { return }

        if countdown.isExpired && !hasTriggeredReveal {
            hasTriggeredReveal = true

            if note.status == .pending {
                Task {
                    try? await FirebaseService.shared.updateNoteStatus(noteId, status: .revealed)
                }
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                withAnimation(.spring(response: 0.8)) {
                    self.isRevealed = true
                }
            }
        } else if note.status == .revealed || note.status == .read {
            isRevealed = true
            hasTriggeredReveal = true
        }
    }

    func markAsRead() {
        guard let note = note, note.status == .revealed else { return }
        Task {
            try? await FirebaseService.shared.updateNoteStatus(noteId, status: .read)
        }
    }
}
