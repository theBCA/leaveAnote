import SwiftUI
import PhotosUI

struct CreateNoteView: View {
    @StateObject private var vm = CreateNoteViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                header
                messageCard
                attachmentsCard
                unlockTimeCard

                if let error = vm.errorMessage {
                    errorBanner(error)
                }

                submitButton
                footer
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .sheet(isPresented: $vm.showShareSheet) {
            if let links = vm.shareLinks {
                ShareResultView(links: links) {
                    vm.reset()
                }
            }
        }
        .onChange(of: vm.selectedPhotos) {
            Task { await vm.loadImages() }
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 4) {
            Text("LeaveANote")
                .font(.system(size: 36, weight: .heavy))
                .foregroundStyle(
                    LinearGradient(
                        colors: [.indigo, .purple],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
            Text("Create a time-locked message for someone special")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding(.top)
    }

    // MARK: - Message

    private var messageCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Your Message")
                .font(.subheadline.weight(.semibold))

            TextEditor(text: $vm.message)
                .frame(minHeight: 160)
                .padding(8)
                .background(Color(.systemBackground))
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color(.separator), lineWidth: 1)
                )
                .disabled(vm.isLoading)

            HStack {
                Spacer()
                Text("\(vm.charCount) / \(vm.maxChars) characters")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }

    // MARK: - Attachments

    private var attachmentsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Attachments (Optional)")
                .font(.subheadline.weight(.semibold))

            PhotosPicker(selection: $vm.selectedPhotos, maxSelectionCount: 5, matching: .any(of: [.images, .videos])) {
                VStack(spacing: 6) {
                    Image(systemName: "paperclip")
                        .font(.title2)
                    Text("Add Photos or Videos")
                        .font(.subheadline.weight(.semibold))
                    Text("Max 10MB per file")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .strokeBorder(style: StrokeStyle(lineWidth: 2, dash: [8]))
                        .foregroundColor(Color(.separator))
                )
            }
            .buttonStyle(.plain)

            if !vm.selectedImages.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Array(vm.selectedImages.enumerated()), id: \.offset) { index, image in
                            ZStack(alignment: .topTrailing) {
                                Image(uiImage: image)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 80, height: 80)
                                    .cornerRadius(8)
                                    .clipped()

                                Button { vm.removeImage(at: index) } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.red)
                                        .background(Circle().fill(.white))
                                }
                                .offset(x: 4, y: -4)
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }

    // MARK: - Unlock Time

    private var unlockTimeCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("When should this note unlock?")
                .font(.subheadline.weight(.semibold))

            Picker("Mode", selection: $vm.unlockMode) {
                ForEach(CreateNoteViewModel.UnlockMode.allCases, id: \.self) {
                    Text($0.rawValue)
                }
            }
            .pickerStyle(.segmented)

            if vm.unlockMode == .countdown {
                HStack(spacing: 16) {
                    VStack(alignment: .leading) {
                        Text("Days").font(.caption).foregroundColor(.secondary)
                        Stepper("\(vm.countdownDays)", value: $vm.countdownDays, in: 0...365)
                    }
                    VStack(alignment: .leading) {
                        Text("Hours").font(.caption).foregroundColor(.secondary)
                        Stepper("\(vm.countdownHours)", value: $vm.countdownHours, in: 0...23)
                    }
                }
            } else {
                DatePicker("Unlock at", selection: $vm.unlockDate, in: Date()..., displayedComponents: [.date, .hourAndMinute])
                    .datePickerStyle(.graphical)

                Text("Your timezone: \(TimeZone.current.identifier)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }

    // MARK: - Error & Submit

    private func errorBanner(_ message: String) -> some View {
        Text(message)
            .font(.subheadline.weight(.medium))
            .foregroundColor(.red)
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.red.opacity(0.1))
            .cornerRadius(10)
    }

    private var submitButton: some View {
        Button(action: { Task { await vm.createNote() } }) {
            Group {
                if vm.isLoading {
                    ProgressView().tint(.white)
                } else {
                    Text("Create Note")
                        .font(.headline)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
        }
        .foregroundColor(.white)
        .background(vm.canSubmit ? Color.indigo : Color.indigo.opacity(0.4))
        .cornerRadius(14)
        .disabled(!vm.canSubmit)
    }

    private var footer: some View {
        VStack(spacing: 2) {
            Text("Your message will be encrypted and stored securely.")
            Text("Only the recipient can view it after the unlock time.")
        }
        .font(.caption)
        .foregroundColor(.secondary)
        .multilineTextAlignment(.center)
        .padding(.bottom)
    }
}
