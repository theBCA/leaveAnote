import SwiftUI

struct ViewNoteView: View {
    let noteId: String
    @StateObject private var vm: ViewNoteViewModel
    @Environment(\.dismiss) private var dismiss

    init(noteId: String) {
        self.noteId = noteId
        _vm = StateObject(wrappedValue: ViewNoteViewModel(noteId: noteId))
    }

    var body: some View {
        Group {
            if vm.isLoading {
                loadingView
            } else if vm.error != nil || vm.note == nil {
                notFoundView
            } else if !vm.isRevealed {
                countdownView
            } else {
                revealedView
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("View Note")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { vm.startListening() }
        .onDisappear { vm.stopListening() }
    }

    // MARK: - Loading

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading note...")
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Not Found

    private var notFoundView: some View {
        VStack(spacing: 16) {
            Image(systemName: "xmark.circle")
                .font(.system(size: 48))
                .foregroundColor(.red)
            Text("Note Not Found")
                .font(.title2.weight(.bold))
            Text("This note doesn't exist or has been deleted.")
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            NavigationLink("Create Your Own Note") {
                CreateNoteView()
            }
            .buttonStyle(.borderedProminent)
            .tint(.indigo)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Countdown

    private var countdownView: some View {
        ScrollView {
            VStack(spacing: 24) {
                Image(systemName: "envelope.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.white)
                    .frame(width: 80, height: 80)
                    .background(
                        LinearGradient(colors: [.indigo, .purple], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .cornerRadius(40)

                Text("Someone Left You a Special Note")
                    .font(.title2.weight(.bold))
                    .multilineTextAlignment(.center)

                Text("Your message will be revealed soon...")
                    .foregroundColor(.secondary)

                CountdownTimerView(countdown: vm.countdown, timezone: vm.note?.timezone ?? "")

                if let note = vm.note {
                    Text("Unlocks on: \(Helpers.formatDateTime(note.unlockTime, timezone: note.timezone))")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            .padding()
        }
    }

    // MARK: - Revealed

    private var revealedView: some View {
        ScrollView {
            VStack(spacing: 20) {
                Text("✨")
                    .font(.system(size: 48))
                    .frame(width: 72, height: 72)
                    .background(Color.yellow.opacity(0.2))
                    .cornerRadius(36)

                Text("Your Message Has Arrived!")
                    .font(.title2.weight(.bold))

                if let note = vm.note {
                    Text("Created \(Helpers.formatDateTime(note.createdAt))")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(note.message)
                        .font(.body)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.indigo.opacity(0.08))
                        .cornerRadius(12)

                    if !note.mediaUrls.isEmpty {
                        MediaGalleryView(urls: note.mediaUrls)
                    }
                }

                HStack(spacing: 12) {
                    NavigationLink {
                        CreateNoteView()
                    } label: {
                        Text("Leave a Reply")
                            .font(.subheadline.weight(.semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.indigo)

                    NavigationLink {
                        CreateNoteView()
                    } label: {
                        Text("Create Your Own")
                            .font(.subheadline.weight(.semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding()
        }
        .onAppear { vm.markAsRead() }
    }
}
