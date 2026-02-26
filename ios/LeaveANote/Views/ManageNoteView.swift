import SwiftUI
import CoreImage.CIFilterBuiltins

struct ManageNoteView: View {
    let noteId: String
    let token: String
    @StateObject private var vm: ManageNoteViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteAlert = false

    init(noteId: String, token: String) {
        self.noteId = noteId
        self.token = token
        _vm = StateObject(wrappedValue: ManageNoteViewModel(noteId: noteId, token: token))
    }

    var body: some View {
        Group {
            if vm.isLoading {
                ProgressView("Loading...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if !vm.isAuthorized {
                accessDeniedView
            } else if let note = vm.note {
                noteContent(note)
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Control Panel")
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.verify() }
        .onDisappear { vm.stopListening() }
    }

    // MARK: - Access Denied

    private var accessDeniedView: some View {
        VStack(spacing: 16) {
            Image(systemName: "lock.fill")
                .font(.system(size: 48))
                .foregroundColor(.orange)
            Text("Access Denied")
                .font(.title2.weight(.bold))
            Text("Invalid control link or note not found.")
                .foregroundColor(.secondary)
            Button("Go Home") { dismiss() }
                .buttonStyle(.borderedProminent)
                .tint(.indigo)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Note Content

    private func noteContent(_ note: NoteData) -> some View {
        ScrollView {
            VStack(spacing: 16) {
                statusCard(note)
                shareCard
                messageCard(note)
                if vm.canEdit { dangerZone }
            }
            .padding()
        }
        .alert("Delete Note?", isPresented: $showDeleteAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                Task {
                    if await vm.deleteNote() { dismiss() }
                }
            }
        } message: {
            Text("This will permanently delete your note and all attachments. This cannot be undone.")
        }
    }

    // MARK: - Status Card

    private func statusCard(_ note: NoteData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Status").font(.title3.weight(.bold))
                Spacer()
                Text(note.status.rawValue.capitalized)
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 4)
                    .background(statusColor(note.status).opacity(0.15))
                    .foregroundColor(statusColor(note.status))
                    .cornerRadius(20)
            }

            LabeledContent("Created") { Text(Helpers.formatDateTime(note.createdAt)) }
            LabeledContent("Unlock Time") { Text(Helpers.formatDateTime(note.unlockTime, timezone: note.timezone)) }

            if note.status == .pending && !vm.countdown.isExpired {
                LabeledContent("Time Remaining") {
                    Text(Helpers.formatCountdown(vm.countdown))
                        .foregroundColor(.indigo)
                        .fontWeight(.bold)
                }
            }

            if let revealedAt = note.revealedAt {
                LabeledContent("Revealed At") { Text(Helpers.formatDateTime(revealedAt)) }
            }
            if let readAt = note.readAt {
                LabeledContent("Read At") { Text(Helpers.formatDateTime(readAt)) }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }

    private func statusColor(_ status: NoteStatus) -> Color {
        switch status {
        case .pending: return .orange
        case .revealed: return .blue
        case .read: return .green
        }
    }

    // MARK: - Share Card

    private var shareCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Share").font(.title3.weight(.bold))

            if let qrImage = generateQRCode(from: vm.recipientLink) {
                Image(uiImage: qrImage)
                    .interpolation(.none)
                    .resizable()
                    .scaledToFit()
                    .frame(height: 160)
                    .frame(maxWidth: .infinity)
            }

            HStack {
                Text(vm.recipientLink)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
                Spacer()
                Button(vm.linkCopied ? "Copied!" : "Copy") { vm.copyLink() }
                    .buttonStyle(.borderedProminent)
                    .tint(vm.linkCopied ? .green : .indigo)
                    .controlSize(.small)
            }

            ShareLink(item: URL(string: vm.recipientLink)!) {
                Label("Share Link", systemImage: "square.and.arrow.up")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }

    // MARK: - Message Card

    private func messageCard(_ note: NoteData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Message").font(.title3.weight(.bold))
                Spacer()
                if vm.canEdit && !vm.isEditing {
                    Button("Edit") { vm.isEditing = true }
                        .foregroundColor(.indigo)
                }
            }

            if vm.isEditing {
                TextEditor(text: $vm.editMessage)
                    .frame(minHeight: 160)
                    .padding(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color(.separator))
                    )

                HStack(spacing: 12) {
                    Button("Save") {
                        Task { await vm.saveEdit() }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.indigo)

                    Button("Cancel") {
                        vm.editMessage = note.message
                        vm.isEditing = false
                    }
                    .buttonStyle(.bordered)
                }
            } else {
                Text(note.message)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }

    // MARK: - Danger Zone

    private var dangerZone: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Danger Zone").font(.title3.weight(.bold)).foregroundColor(.red)
            Text("Delete this note permanently. This action cannot be undone.")
                .font(.subheadline)
                .foregroundColor(.red.opacity(0.8))
            Button("Delete Note", role: .destructive) {
                showDeleteAlert = true
            }
            .buttonStyle(.borderedProminent)
            .tint(.red)
        }
        .padding()
        .background(Color.red.opacity(0.05))
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.red.opacity(0.2)))
    }

    // MARK: - QR Code

    private func generateQRCode(from string: String) -> UIImage? {
        let context = CIContext()
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(string.utf8)
        filter.correctionLevel = "H"

        guard let output = filter.outputImage else { return nil }
        let scaled = output.transformed(by: CGAffineTransform(scaleX: 10, y: 10))
        guard let cgImage = context.createCGImage(scaled, from: scaled.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }
}
