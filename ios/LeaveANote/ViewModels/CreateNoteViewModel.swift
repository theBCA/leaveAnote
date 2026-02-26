import SwiftUI
import PhotosUI

@MainActor
final class CreateNoteViewModel: ObservableObject {
    @Published var message = ""
    @Published var selectedPhotos: [PhotosPickerItem] = []
    @Published var selectedImages: [UIImage] = []
    @Published var unlockMode: UnlockMode = .countdown
    @Published var countdownDays = 0
    @Published var countdownHours = 1
    @Published var unlockDate = Date().addingTimeInterval(3600)
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var shareLinks: ShareLinks?
    @Published var showShareSheet = false

    let maxChars = 5000

    enum UnlockMode: String, CaseIterable {
        case countdown = "Countdown"
        case datetime = "Date/Time"
    }

    var charCount: Int { message.count }
    var canSubmit: Bool { !message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isLoading }

    func loadImages() async {
        var images: [UIImage] = []
        for item in selectedPhotos {
            if let data = try? await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                images.append(image)
            }
        }
        selectedImages = images
    }

    func removeImage(at index: Int) {
        guard index < selectedImages.count else { return }
        selectedImages.remove(at: index)
        if index < selectedPhotos.count {
            selectedPhotos.remove(at: index)
        }
    }

    func createNote() async {
        errorMessage = nil

        if let error = Validation.validateMessage(message) {
            errorMessage = error
            return
        }

        let unlockTime: Date
        switch unlockMode {
        case .countdown:
            let totalHours = Double(countdownDays * 24 + countdownHours)
            unlockTime = Date().addingTimeInterval(totalHours * 3600)
        case .datetime:
            unlockTime = unlockDate
        }

        if let error = Validation.validateUnlockTime(unlockTime) {
            errorMessage = error
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            let imageData = selectedImages.compactMap { $0.jpegData(compressionQuality: 0.8) }

            let input = CreateNoteInput(
                message: message,
                unlockTime: unlockTime,
                imageData: imageData,
                timezone: TimeZone.current.identifier
            )

            let (noteId, senderToken) = try await FirebaseService.shared.createNote(input)
            shareLinks = Helpers.makeShareLinks(noteId: noteId, senderToken: senderToken)
            showShareSheet = true
        } catch {
            errorMessage = "Failed to create note: \(error.localizedDescription)"
        }
    }

    func reset() {
        message = ""
        selectedPhotos = []
        selectedImages = []
        countdownDays = 0
        countdownHours = 1
        unlockDate = Date().addingTimeInterval(3600)
        errorMessage = nil
        shareLinks = nil
        showShareSheet = false
    }
}
